import { describe, it, expect } from 'vitest';
import { listItems } from './items';

describe('listItems', () => {
	it('defaults to page 1, pageSize 20, sorted by updatedAt desc, total 220', () => {
		const result = listItems();
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(20);
		expect(result.items).toHaveLength(20);
		expect(result.total).toBe(220);
		for (let i = 1; i < result.items.length; i++) {
			expect(result.items[i - 1].updatedAt >= result.items[i].updatedAt).toBe(true);
		}
	});

	it('paginates correctly on page 2', () => {
		const page1 = listItems({ page: 1, pageSize: 10 });
		const page2 = listItems({ page: 2, pageSize: 10 });
		expect(page2.items).toHaveLength(10);
		expect(page1.items[0].id).not.toBe(page2.items[0].id);
	});

	it('returns an empty items array past the last page, but keeps the real total', () => {
		const result = listItems({ page: 999, pageSize: 20 });
		expect(result.items).toHaveLength(0);
		expect(result.total).toBe(220);
	});

	it('filters by status', () => {
		const result = listItems({ status: 'active', pageSize: 220 });
		expect(result.items.length).toBeGreaterThan(0);
		expect(result.items.every((item) => item.status === 'active')).toBe(true);
	});

	it('filters by channel', () => {
		const result = listItems({ channel: 'email', pageSize: 220 });
		expect(result.items.length).toBeGreaterThan(0);
		expect(result.items.every((item) => item.channel === 'email')).toBe(true);
	});

	it('filters by case-insensitive name search', () => {
		const result = listItems({ search: 'upgrade', pageSize: 220 });
		expect(result.items.length).toBeGreaterThan(0);
		expect(result.items.every((item) => item.name.toLowerCase().includes('upgrade'))).toBe(true);
	});

	it('combines status and channel filters', () => {
		const result = listItems({ status: 'completed', channel: 'social', pageSize: 220 });
		expect(result.items.length).toBeGreaterThan(0);
		expect(
			result.items.every((item) => item.status === 'completed' && item.channel === 'social')
		).toBe(true);
	});

	it('sorts numerically by budget ascending', () => {
		const result = listItems({ sortBy: 'budget', sortDirection: 'asc', pageSize: 220 });
		for (let i = 1; i < result.items.length; i++) {
			expect(result.items[i - 1].budget).toBeLessThanOrEqual(result.items[i].budget);
		}
	});

	it('sorts alphabetically by name descending', () => {
		const result = listItems({ sortBy: 'name', sortDirection: 'desc', pageSize: 220 });
		for (let i = 1; i < result.items.length; i++) {
			expect(result.items[i - 1].name.localeCompare(result.items[i].name)).toBeGreaterThanOrEqual(
				0
			);
		}
	});
});
