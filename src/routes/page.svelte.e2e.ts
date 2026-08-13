import { expect, test } from '@playwright/test';

test('home page renders the hero heading and a link to sign in', async ({ page }) => {
	await page.goto('/');
	await expect(
		page.getByRole('heading', { name: 'Build a faster web, without the fight.' })
	).toBeVisible();
	await expect(page.getByRole('link', { name: 'Sign in to the dashboard' })).toHaveAttribute(
		'href',
		'/login'
	);
});
