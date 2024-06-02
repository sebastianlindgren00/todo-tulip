<script>
	/**
	 * @type {string}
	 */
	export let message;
	export let margin = 'mb-4';
</script>

{#if message}
	<div
		class="bg-red-500 text-textLight px-4 py-2 rounded-md cursor-pointer w-full {margin} transition-all duration-300 ease-in-out"
	>
		<p>{message}</p>
	</div>
{/if}
