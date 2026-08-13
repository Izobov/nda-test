import { describe, it, expect } from 'vitest';
import { ItemSchema } from './item';

const validItem = {
	id: 'cmp_0001',
	name: 'Upgrade — GA release #001',
	status: 'completed',
	channel: 'social',
	owner: { id: 'u_priya', name: 'Priya Iyer' },
	budget: 2500,
	spent: 2332.02,
	impressions: 325282,
	clicks: 17467,
	ctr: 0.0537,
	startDate: '2026-04-03',
	endDate: '2026-05-16',
	updatedAt: '2026-04-09T22:00:00Z',
	tags: []
};

describe('ItemSchema', () => {
	it('parses a valid item', () => {
		expect(() => ItemSchema.parse(validItem)).not.toThrow();
	});

	it('rejects an unknown status', () => {
		expect(() => ItemSchema.parse({ ...validItem, status: 'unknown' })).toThrow();
	});

	it('rejects an unknown channel', () => {
		expect(() => ItemSchema.parse({ ...validItem, channel: 'carrier-pigeon' })).toThrow();
	});

	it('rejects a ctr outside 0-1', () => {
		expect(() => ItemSchema.parse({ ...validItem, ctr: 1.5 })).toThrow();
	});

	it('rejects a non-YYYY-MM-DD startDate', () => {
		expect(() => ItemSchema.parse({ ...validItem, startDate: '04/03/2026' })).toThrow();
	});

	it('rejects a negative budget', () => {
		expect(() => ItemSchema.parse({ ...validItem, budget: -1 })).toThrow();
	});
});
