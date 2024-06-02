<script lang="ts">
	import { quintOut } from 'svelte/easing';
	import { fly, slide } from 'svelte/transition';

	export function open() {
		isOpen = true;
	}
	export function close() {
		// isOpen = false;
		isOpen = !isOpen;
	}

	const handleClick = (event: any) => {
		// Makes sure the onclick function (this) is only called when clicking the parent element (above the details panel). (works on X button)
		if (event.target !== event.currentTarget) {
			return;
		}

		close();
	};

	let isOpen = false; // was true, don't want it to open all the time when i work with it >:(
</script>

{#if isOpen}
	<button
		class="fixed inset-0 flex items-center justify-center z-40 bg-[rgba(0,0,0,0.6)] cursor-default"
		on:click={handleClick}
	>
	</button>
{/if}
<div
	class={`fixed top-0 transition-all duration-500 h-full w-3/12 bg-slate-100 z-50 rounded-r-3xl ${isOpen ? 'left-0' : '-left-full'}`}
>
	<slot />
</div>
