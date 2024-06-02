<script>
	import { createItem } from '@lib/pocketbase';
	import FilledButton from '@components/interface/filledButton.svelte';
	import InputField from '@components/interface/input-field.svelte';
	import SubmitButton from '@components/interface/submit-button.svelte';
	import Popup from '@components/layout/popup.svelte';
	import IconButton from '@components/interface/icon-button.svelte';

	export let listId;
	export let loader = false;

	let openPopup, closePopup;
	let title,
		text = '';

	const handleSubmit = async () => {
		// Add item to list
		createItem(listId, title, text);

		// Close popup
		closePopup();
	};
</script>
<div class="flex justify-center">
	<!-- Maybe have a better icon here instead?? -->
<!-- <IconButton icon="CirclePlusSolid" color="bg-green-500" size="medium" onClick={openPopup} /> -->
<FilledButton onClick={openPopup} text="Lägg till" customStyles="w-1/2" {loader} />
</div>
<Popup bind:open={openPopup} bind:close={closePopup}>
	<form class="relative w-full h-full" on:submit|preventDefault>
		<InputField label="Title" placeholder="Title" type="text" bind:value={title} />
		<InputField label="Text" placeholder="Text" type="text" bind:value={text} />
		<SubmitButton text="Skapa" onClick={handleSubmit} />
	</form>
</Popup>
