<script>
	export let text = 'Submit';
	export let disabled = false;
	export let onClick = () => {
		console.log('Empty submit');
	};
</script>

<button
	class="px-4 py-2 bg-violet-500 text-white rounded-md cursor-pointer w-full
  transition duration-300 ease-in-out hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
	{disabled}
	on:click={onClick}
	type="submit"
>
	{text}
</button>
