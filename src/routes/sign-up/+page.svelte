<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser, signUp } from '@lib/pocketbase';
	import Form from '@components/interface/form.svelte';
	import InputField from '@components/interface/input-field.svelte';
	import SubmitButton from '@components/interface/submit-button.svelte';
	import validateSignup from './validateSignup';
	import ErrorMessage from '@components/interface/error-message.svelte';

	// Make sure the user is not already logged in
	if ($currentUser) goto('/');

	let name: string;
	let username: string;
	let email: string;
	let password: string;
	let confirmPassword: string;
	let errorMessage: string;
	let isLoading = false;

	const clickHandler = async () => {
		isLoading = true;
		const response = await validateSignup({ name, username, email, password, confirmPassword });

		if (response?.error != null) {
			errorMessage = response?.error ?? 'Unknown error. Please try again.';
			isLoading = false;
			return;
		}

		const signupIsSuccess = await signUp({ name, username, email, password });

		if (signupIsSuccess) {
			goto('/');
		} else {
			errorMessage = 'Username or email already exists. Please try again.';
			isLoading = false;
		}
	};
</script>

<main id="animated-background" class="flex items-center justify-center">
	<Form {isLoading}>
		<InputField label="Full name" placeholder="Name" type="text" bind:value={name} />
		<InputField label="Email" placeholder="Email" type="text" bind:value={email} />
		<InputField label="Username" placeholder="Username" type="text" bind:value={username} />
		<InputField label="Password" placeholder="Password" type="password" bind:value={password} />
		<InputField
			label="Confirm password"
			placeholder="Confirm password"
			type="password"
			bind:value={confirmPassword}
		/>
		<div class="mt-10">
			<ErrorMessage message={errorMessage} />
			<SubmitButton text="Create account" onClick={() => clickHandler()} />
		</div>
		<div class="mt-4 text-center">
			<p>Already have an account? <a href="/login">Login</a></p>
		</div>
	</Form>
</main>
