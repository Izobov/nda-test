<script lang="ts">
	import { Badge, Button } from '$lib';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(data.result.total / data.result.pageSize)));
</script>

<div class="mx-auto flex max-w-5xl flex-col gap-6 p-8">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-fg">Campaigns</h1>
		<form method="POST" action="/logout">
			<Button type="submit" variant="outline" size="sm">Sign out</Button>
		</form>
	</div>

	<div class="overflow-x-auto rounded-md border border-border">
		<table class="w-full text-left text-sm">
			<thead class="border-b border-border bg-surface">
				<tr>
					<th scope="col" class="px-4 py-2 font-medium text-fg">Name</th>
					<th scope="col" class="px-4 py-2 font-medium text-fg">Status</th>
					<th scope="col" class="px-4 py-2 font-medium text-fg">Channel</th>
					<th scope="col" class="px-4 py-2 font-medium text-fg">Budget</th>
					<th scope="col" class="px-4 py-2 font-medium text-fg">Spent</th>
				</tr>
			</thead>
			<tbody>
				{#each data.result.items as item (item.id)}
					<tr class="border-b border-border last:border-0">
						<td class="px-4 py-2 text-fg">{item.name}</td>
						<td class="px-4 py-2">
							<Badge variant={item.status === 'active' ? 'success' : 'neutral'}>{item.status}</Badge
							>
						</td>
						<td class="px-4 py-2 text-muted-fg">{item.channel}</td>
						<td class="px-4 py-2 text-fg">${item.budget.toLocaleString()}</td>
						<td class="px-4 py-2 text-fg">${item.spent.toLocaleString()}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="flex items-center justify-between text-sm text-muted-fg">
		<span>Page {data.result.page} of {totalPages} ({data.result.total} total)</span>
		<div class="flex gap-2">
			{#if data.result.page > 1}
				<a
					href="{resolve('/dashboard/items')}?page={data.result.page - 1}"
					class="text-primary hover:underline">Previous</a
				>
			{/if}
			{#if data.result.page < totalPages}
				<a
					href="{resolve('/dashboard/items')}?page={data.result.page + 1}"
					class="text-primary hover:underline">Next</a
				>
			{/if}
		</div>
	</div>
</div>
