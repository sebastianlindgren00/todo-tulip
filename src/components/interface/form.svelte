<script>
	import Loader from '../misc/loader.svelte';

	export let isLoading = false;
</script>

<div class="w-[28rem] bg-gray-100 p-10 rounded-lg shadow-lg">
	<h1 class="mb-8">TodoTulip&#127799;</h1>
	<form class="relative w-full h-full" on:submit|preventDefault>
		{#if isLoading}
			<!-- Loader that covers the entire form -->
			<div
				class="w-full h-full flex items-center justify-center bg-gray-100 bg-opacity-50 z-10"
				style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;"
			>
				<Loader />
			</div>
			<slot />
		{:else}
			<slot />
		{/if}
	</form>
</div>
