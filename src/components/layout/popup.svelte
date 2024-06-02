<script lang="ts">
	export function open() {
		isOpen = true;
	}
	export function close() {
		isOpen = false;
	}

	const handleClick = (event: any) => {
		// Makes sure the onclick function (this) is only called when clicking the parent element (above the details panel). (works on X button)
		if (event.target !== event.currentTarget) {
			return;
		}

		close();
	};

	let isOpen = false;
</script>

{#if isOpen}
	<button
		class="fixed inset-0 flex items-center justify-center z-10 bg-[rgba(0,0,0,0.6)] cursor-default"
		on:click={handleClick}
	>
		<div class="bg-white p-6 rounded-2xl w-96 z-50">
			<slot />
		</div>
	</button>
{/if}
