<script lang="ts">
	import { goto } from '$app/navigation';
	import Card from '@components/lists/card.svelte';
	import Tasks from '../components/Tasks.svelte';
	import Tasklog from '../components/tasklog.svelte';
	import { currentUser } from '../lib/pocketbase';
	import { onMount } from 'svelte';
	import ProfileCard from '@components/layout/profile-card.svelte';
	import Lists from '@components/lists/lists.svelte';

	let message: string = ''; // Variable to store the message

	// Wait for currentUser to be loaded
	onMount(() => {
		// Redirect to login if not signed in
		if (!$currentUser) goto('/login');
	});

	// Event listener for messageSent event emitted by Tasklog component
	const handleMessageSent = (event) => {
		message = event.detail.text; // Update the message variable with the new message
	};
</script>

<div class="px-5 pt-10 flex">
	<ProfileCard />
	<div>
		<Lists />
	</div>
</div>
