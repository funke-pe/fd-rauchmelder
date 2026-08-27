import { test as setup, expect } from '@playwright/test';

const USER = process.env.SMOKE_ADMIN_USER || 'admin';
const PASS = process.env.SMOKE_ADMIN_PASS || 'password';

// Logs into wp-admin via wp-login.php and saves the session for the smoke tests.
setup('authenticate', async ({ page }) => {
	await page.goto('/wp-login.php', { waitUntil: 'networkidle' });
	await page.fill('#user_login', USER);
	await page.fill('#user_pass', PASS);
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle' }),
		page.click('#wp-submit'),
	]);

	// A failed login stays on wp-login.php and shows #login_error.
	await expect(page, 'admin login should reach the dashboard').toHaveURL(/\/wp-admin\/?/);
	await expect(page.locator('#login_error')).toHaveCount(0);

	await page.context().storageState({ path: '.auth/admin.json' });
});
