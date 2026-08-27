import { test, expect, Page } from '@playwright/test';

// Text that means WordPress hit a PHP fatal / uncaught error while rendering.
const FATAL_SIGNATURES = [
	'There has been a critical error on this website',
	'There has been a critical error on your website',
	'Fatal error:',
	'Parse error:',
	'Uncaught Error',
	'Uncaught TypeError',
	'Uncaught Exception',
	'Uncaught ArgumentCountError',
];

// Optional: assert this plugin's display name appears active on plugins.php.
const PLUGIN_NAME = process.env.SMOKE_PLUGIN_NAME || '';

function findFatal(body: string): string | null {
	for (const sig of FATAL_SIGNATURES) {
		if (body.includes(sig)) return sig;
	}
	return null;
}

async function bodyText(page: Page): Promise<string> {
	// Full HTML catches fatals printed outside the rendered <body> too.
	return page.content();
}

test.describe.configure({ mode: 'serial' });

test('plugins page loads without activation errors or fatals', async ({ page }) => {
	const res = await page.goto('/wp-admin/plugins.php', { waitUntil: 'networkidle' });
	expect(res?.status(), 'plugins.php HTTP status').toBeLessThan(500);

	const html = await bodyText(page);
	const fatal = findFatal(html);
	expect(fatal, `plugins.php shows a fatal: ${fatal}`).toBeNull();

	// WordPress prints "Plugin could not be activated because it triggered a fatal error."
	expect(html.includes('could not be activated'), 'a plugin failed to activate').toBe(false);

	if (PLUGIN_NAME) {
		await expect(
			page.locator('#the-list tr.active', { hasText: PLUGIN_NAME }),
			`plugin "${PLUGIN_NAME}" should be active`
		).toHaveCount(1);
	}
});

test('every admin menu page renders without a fatal error', async ({ page, baseURL }) => {
	await page.goto('/wp-admin/', { waitUntil: 'networkidle' });

	// Collect the admin menu links the active plugin(s) contributed, plus core pages.
	const hrefs: string[] = await page.$$eval('#adminmenu a[href]', (as) =>
		as
			.map((a) => (a as HTMLAnchorElement).href)
			.filter((h) => h.includes('/wp-admin/'))
			// Skip logout and external/self-referential anchors.
			.filter((h) => !h.includes('action=logout') && !h.includes('#'))
	);

	const unique = [...new Set(hrefs)];
	expect(unique.length, 'should discover admin menu pages to crawl').toBeGreaterThan(0);

	const failures: string[] = [];
	for (const href of unique) {
		const res = await page.goto(href, { waitUntil: 'domcontentloaded' });
		const status = res?.status() ?? 0;
		const html = await bodyText(page);
		const fatal = findFatal(html);
		if (status >= 500 || fatal) {
			const path = href.replace(baseURL || '', '');
			failures.push(`${path} → status ${status}${fatal ? `, fatal: "${fatal}"` : ''}`);
		}
	}

	expect(failures, `admin pages with errors:\n${failures.join('\n')}`).toHaveLength(0);
});
