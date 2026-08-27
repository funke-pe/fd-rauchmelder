import { defineConfig } from '@playwright/test';

const baseURL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:9400';

export default defineConfig({
	testDir: './tests',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	reporter: [['list'], ['html', { open: 'never' }]],
	timeout: 60_000,
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
	},
	projects: [
		{ name: 'setup', testMatch: /auth\.setup\.ts/ },
		{
			name: 'smoke',
			testMatch: /.*\.spec\.ts/,
			dependencies: ['setup'],
			use: { storageState: '.auth/admin.json' },
		},
	],
});
