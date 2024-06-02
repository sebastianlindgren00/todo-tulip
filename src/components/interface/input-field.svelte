<script>
	export let label = '';
	export let placeholder = '';
	export let value = '';
	export let type = 'text';
	export let required = false;
	export let disabled = false;
	export let readonly = false;

	function handleChange(event) {
		value = event.target.value;
	}
	// prevent spacebar from closing the popup
	function handleKeydown(event) {
        // prevent that a space is typed
        if(event.code === 'Space'){ 
			event.preventDefault()
			value += ' ';
		}
    }
</script>

<div class="mb-4">
	<label class="block text-gray-700 text-sm font-bold mb-2" for="input-field-{label.toLowerCase()}">
		{label}
	</label>
	<input
		class="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
		id="input-field-{label.toLowerCase()}"
		{type}
		{placeholder}
		{value}
		{required}
		{disabled}
		{readonly}
		on:keydown={handleKeydown}
		on:input={handleChange}
	/>
</div>
