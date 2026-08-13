import { z } from 'zod';
import itemsData from '../../../../task/mocks/items.json';
import { ItemSchema, type Item, type ItemStatus, type ItemChannel } from '$lib/schemas';

const items: Item[] = z.array(ItemSchema).parse(itemsData);

type SortableItemKey =
	| 'name'
	| 'status'
	| 'channel'
	| 'budget'
	| 'spent'
	| 'impressions'
	| 'clicks'
	| 'ctr'
	| 'startDate'
	| 'endDate'
	| 'updatedAt';

export interface ListItemsQuery {
	page?: number;
	pageSize?: number;
	status?: ItemStatus;
	channel?: ItemChannel;
	search?: string;
	sortBy?: SortableItemKey;
	sortDirection?: 'asc' | 'desc';
}

export interface ListItemsResult {
	items: Item[];
	total: number;
	page: number;
	pageSize: number;
}

export function listItems(query: ListItemsQuery = {}): ListItemsResult {
	const {
		page = 1,
		pageSize = 20,
		status,
		channel,
		search,
		sortBy = 'updatedAt',
		sortDirection = 'desc'
	} = query;

	let filtered = items;

	if (status) {
		filtered = filtered.filter((item) => item.status === status);
	}
	if (channel) {
		filtered = filtered.filter((item) => item.channel === channel);
	}
	if (search) {
		const needle = search.toLowerCase();
		filtered = filtered.filter((item) => item.name.toLowerCase().includes(needle));
	}

	const sorted = [...filtered].sort((a, b) => {
		const left = a[sortBy];
		const right = b[sortBy];
		const comparison =
			typeof left === 'number' && typeof right === 'number'
				? left - right
				: String(left).localeCompare(String(right));
		return sortDirection === 'asc' ? comparison : -comparison;
	});

	const total = sorted.length;
	const start = (page - 1) * pageSize;
	const pageItems = sorted.slice(start, start + pageSize);

	return { items: pageItems, total, page, pageSize };
}
