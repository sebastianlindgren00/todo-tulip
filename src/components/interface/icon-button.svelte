<script>
	// Icons found at https://flowbite-svelte-icons.codewithshin.com/
	import { TrashBinSolid, PenSolid, CirclePlusSolid } from 'flowbite-svelte-icons';

	export let icon = 'TrashBinSolid';
	export let color = 'primary';
	export let size = 'large';
	export let customStyles = '';
	export let onClick = () => {};

	// Set size of button
	let iconSize = 'w-full h-full';
	if (size === 'small') {
		iconSize = 'w-3 h-3';
	}
	if (size === 'medium') {
		iconSize = 'w-6 h-6';
	}

	const iconClass = (() => {
		switch (icon) {
			case 'TrashBinSolid':
				return TrashBinSolid;
			case 'PenSolid':
				return PenSolid;
			case 'CirclePlusSolid':
				return CirclePlusSolid;
			default:
				return TrashBinSolid;
		}
	})();
</script>

<button
	class={`${color} icon-btn transition-all rounded-xl p-1 shadow-lg ${customStyles}
		hover:scale-110`}
	on:click={onClick}
>
	<svelte:component this={iconClass} class={iconSize} />
</button>
