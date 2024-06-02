<script lang="ts">
	import IconButton from '@components/interface/icon-button.svelte';
	import { deleteItem, updateItem, currentUser } from '@lib/pocketbase';
	import Popup from '@components/layout/popup.svelte';
	import InputField from '@components/interface/input-field.svelte';
	import SubmitButton from '@components/interface/submit-button.svelte';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	export let itemId = '';
	export let creatorId = '';
	export let title = '';
	export let text;
	export let priority: number = 0;
	export let loader = false;

	let isHovering = false;
	let isFading = false;
	let isHidden = false;
	let openPopup, closePopup;

	// Set priority level as color
	let priorityColor = '';
	switch (priority) {
		case 1:
			priorityColor = 'bg-red-500';
			break;
		case 2:
			priorityColor = 'bg-yellow-500';
			break;
		case 3:
			priorityColor = 'bg-green-500';
			break;
		default:
			priorityColor = '';
	}

	// Call function if the item is being hoverd over
	const handleHover = (mouseEnter) => {
		isHovering = mouseEnter;
	};

	const handleDelete = async () => {
		deleteItem(itemId);
		isHidden = true;
	};

	const handleSubmit = async () => {
		// Add item to list
		await updateItem(itemId, title, text);

		// Close popup
		closePopup();
	};
</script>

<!-- If statement used to trigger the svelte transition -->
{#if !isHidden}
	<div
		transition:slide={{ delay: 250, duration: 300, easing: quintOut, axis: 'x' }}
		on:mouseenter={() => handleHover(true)}
		on:mouseleave={() => handleHover(false)}
		role="listitem"
		class="listItem bg-white rounded-lg shadow-lg mb-4 flex hover:shadow-xl transition-all relative {isFading
			? 'animate-fadeOut'
			: ''}"
	>
		{#if loader}
			<div class="h-16 bg-slate-200 rounded-lg loadingField"></div>
		{:else}
			{#if isHovering}
				<div class="absolute top-0 right-0 flex gap-1 p-2">
					<IconButton onClick={openPopup} icon="PenSolid" color="bg-yellow-300" size="small" customStyles="" />
					{#if $currentUser.id != creatorId}
					<IconButton icon="TrashBinSolid" color="bg-red-500" size="small" onClick={handleDelete} />
					{/if}
				</div>
			{/if}
			<Popup bind:open={openPopup} bind:close={closePopup}>
				<form class="relative w-full h-full" on:submit|preventDefault>
					<InputField label="Title" placeholder="Title" type="text" bind:value={title} />
					<InputField label="Text" placeholder="Text" type="text" bind:value={text} />
					<SubmitButton text="Ändra" onClick={handleSubmit} />
				</form>
			</Popup>
			<div class="w-2 m-2 rounded-3xl {priorityColor}"></div>
			<div class="p-4">
				{#if title}
					<h3 class="text-xl font-semibold mb-2">{title}</h3>
				{/if}
				<p class="text-gray-600">{text}</p>
			</div>
		{/if}
	</div>
{/if}
