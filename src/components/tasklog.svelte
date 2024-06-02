<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentUser, pb, getAvatar, login } from '@lib/pocketbase';
	import Avatar from './interface/avatar.svelte';

	let newMessage: string;
	let messages = [];
	let avatarDict = [];
	let unsubscribe: () => void;

	// Get avatars and merge with users in a dictionary
	async function getAvatarDict() {
		let users = messages.map((m) => m.expand?.user);

		console.log('1');

		for (const u of users) {
			// Check if user already has an avatar
			if (avatarDict.find((a) => a.user === u.id)) continue;
			console.log('1.5');

			// If not, fetch avatar and add to dictionary
			avatarDict.push({
				user: u.id,
				avatar: await getAvatar(u.id, u.avatar)
			});
		}
		console.log('2');

		return avatarDict;
	}

	async function getMessages() {
		const resultList = await pb.collection('messages').getList(1, 50, {
			sort: 'created',
			expand: 'user'
		});
		messages = resultList.items;
		return await getAvatarDict();
	}

	onMount(async () => {
		// Subscribe to realtime messages
		unsubscribe = await pb.collection('messages').subscribe('*', async ({ action, record }) => {
			if (action === 'create') {
				// Fetch associated user
				let user = await pb.collection('users').getOne(record.user);

				record.expand = { user };
				messages = [...messages, record];
			}
			if (action === 'delete') {
				messages = messages.filter((m) => m.id !== record.id);
			}
		});
	});

	// Unsubscribe from realtime messages
	onDestroy(() => {
		unsubscribe?.();
	});

	async function sendMessage() {
		const data = {
			text: newMessage,
			user: $currentUser.id
		};
		const createdMessage = await pb.collection('messages').create(data);
		newMessage = '';
	}
</script>

<div class="messages">
	{#await getMessages() then data}
		{#each messages as message (message.id)}
			<div class="msg">
				<Avatar
					url={data.find((a) => a.user === message.expand?.user?.id)?.avatar}
					className="w-12"
				/>
				<div>
					<small>
						Sent by @{message.expand?.user?.username}
					</small>
					<p class="msg-text">{message.text}</p>
				</div>
			</div>
		{/each}
	{/await}
</div>

<form on:submit|preventDefault={sendMessage}>
	<input placeholder="Message" type="text" bind:value={newMessage} />
	<button type="submit">Send</button>
</form>
