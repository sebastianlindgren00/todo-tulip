<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser, login } from '@lib/pocketbase';
	import Form from '@components/interface/form.svelte';
	import InputField from '@components/interface/input-field.svelte';
	import SubmitButton from '@components/interface/submit-button.svelte';
	import ErrorMessage from '@components/interface/error-message.svelte';

	// Make sure the user is not already logged in
	if ($currentUser) goto('/');

	let username: string;
	let password: string;
	let errorMessage: string;
	let isLoading = false;

	// Login function
	const loginHandler = async () => {
		isLoading = true;
		// Try to login the user with the provided credentials
		const response = await login({ username, password });

		// If the response is true, redirect the user to the home page
		// Otherwise, show an error message
		if (response) {
			goto('/');
		} else {
			errorMessage = 'Invalid username or password';
			isLoading = false;
		}
	};
</script>

<main id="animated-background" class="flex items-center justify-center">
	<Form {isLoading}>
		<InputField label="Username" placeholder="Username" type="text" bind:value={username} />
		<InputField label="Password" placeholder="Password" type="password" bind:value={password} />
		<div class="mt-10">
			<ErrorMessage message={errorMessage} />
			<SubmitButton text="Login" onClick={() => loginHandler()} />
		</div>
		<div class="mt-4 text-center">
			<p>Don't have an account? <a href="/sign-up">Sign up</a></p>
		</div>
	</Form>
</main>
