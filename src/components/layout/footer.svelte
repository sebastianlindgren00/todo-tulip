<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser, signOut } from '../../lib/pocketbase';
	export let className = '';

	let profile: any = null;

	// Wait for currentUser to be loaded
	onMount(() => {
		profile = $currentUser;
	});
</script>

<footer
	class="bg-gray-800 text-white py-2 soft-shadow {className} overflow-x-auto w-screen fixed bottom-0 left-0"
>
	<div class="flex flex-col content-start px-20">
		<div class="flex">
			{#if !profile}
				<p>&nbsp;</p>
			{:else}
				<p>
					Du är inloggad som <strong>{$currentUser?.username}</strong>.
				</p>
				<button
					class="bg-white px-3 ml-2 rounded-lg text-black text-xs hover:bg-slate-500 hover:text-white transition-all duration-100 ease-in-out"
					on:click={signOut}
				>
					Sign Out
				</button>
			{/if}
		</div>
		<div>
			<p class="text-xs">&copy;2024 Albin Kjellberg & Sebastian Lindgren.</p>
		</div>
	</div>
</footer>

<style>
</style>
