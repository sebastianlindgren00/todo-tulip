<script>
	import {
		pb,
		currentUser,
		sendFriendRequest,
		getUsersByIds,
		getUserByUsername,
        deleteFriend,
		getFriends,
		getFriendRequests
	} from '@lib/pocketbase';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import Popup from './popup.svelte';
	import FilledButton from '@components/interface/filledButton.svelte';
	import Avatar from '@components/interface/avatar.svelte';
	import SubmitButton from '@components/interface/submit-button.svelte';
	import InputField from '@components/interface/input-field.svelte';
    import IconButton from '@components/interface/icon-button.svelte';

	let openPopup, closePopup;
	let friends = [];
	let friendRequests = [];
	let friendId = '';
	let friendUserName = '';

	// TODO : ADD REMOVE FRIEND AND TRANSFER FUNCTIONS INTO LIB

	onMount(async () => {
		friends = await getFriends();
		friendRequests = await getFriendRequests();

		pb.collection('users').subscribe(
			'*',
			async function (e) {
				switch (e.action) {
					case 'update':
						if (e.record.id === $currentUser.id) {
							friends = await getUsersByIds(e.record.friends);
							friendRequests = await getUsersByIds(e.record.friend_requests);
						}
						break;
				}
			},
			{}
		);
	});

	// fetch the id of a user by using their username as parameter
	const getFriendId = async (username) => {
		try {
			// needed getList for the filtering function to work
			const resultList = await pb.collection('users').getList(1, 1, {
				filter: `username="${username}"`
			});

			// match username
			const user = resultList.items.find((user) => user.username === username);

			console.log('User found:', user);

			// return id if found, otherwise null and message
			if (user) {
				return user.id;
			} else {
				console.error(`Username "${username}" does not exist.`);
				return null;
			}
		} catch (error) {
			console.error('Error fetching user id:', error);
			return null;
		}
	};

	const addFriend = async (friendId) => {
		try {
			const user = await pb.collection('users').getOne(friendId);
			const currentUserId = get(currentUser)?.id;

			// using expand because its a relation
			const currentUserData = await pb.collection('users').getOne(currentUserId, {
				expand: 'friends'
			});

			console.log('User to be added:', user);
			console.log('Current user data:', currentUserData);

			// safety check
			if (user && currentUserData) {
				// Check if user is already a friend
				if (
					currentUserData.expand &&
					currentUserData.expand.friends.some((friend) => friend.id === user.id)
				) {
					console.log('User is already a friend.');
					return;
				}

				const currentUserFriends =
					currentUserData.expand && currentUserData.expand.friends
						? currentUserData.expand.friends.map((friend) => friend.id)
						: [];
				const userFriends =
					user.expand && user.expand.friends ? user.expand.friends.map((friend) => friend.id) : [];

				// Add friend to current user
				await pb.collection('users').update(currentUserId, {
					friends: [...currentUserFriends, user.id]
				});

				// add friend
				await pb.collection('users').update(user.id, {
					friends: [...userFriends, currentUserId]
				});

				// update local friends list
				friends = [...friends, user];
			}
		} catch (error) {
			console.error('Error adding friend:', error);
		}
	};

	const handleFriends = async () => {
		// console.log('Friend username:', friendUserName);
		const friend = await getUserByUsername(friendUserName);
		// console.log('Friend:', friend);
		if (friend) {
			// await addFriend(friendId);
			await sendFriendRequest(friend.id);
			closePopup();
		}
	};

    const handleDelete = async (id) => {
        // remove a friend, with the icon button next to it
        console.log('Friend id:', id);
        deleteFriend(id);
    }
</script>
		
<div class="px-4">
	<h1>Friend List</h1>
	{#each friends as friend}
		<div class="friend-card flex">
			<Avatar className="w-5 h-5 ml-3" userId={friend.id} avatarFile={friend.avatar} />
		    <p>{friend.name}</p>
            <IconButton icon="TrashBinSolid" color="bg-red-500" size="small" onClick={() => handleDelete(friend.id)} />
		</div>
	{/each}
	<Popup bind:open={openPopup} bind:close={closePopup}>
		<div class="flex-col">
			<p>Skriv in användarnamnet på personen du vill lägga till:</p>
			<InputField placeholder="Användarnamn" type="text" bind:value={friendUserName} />
			{#if friendId == null}
				<h4 class="font-bold">"{friendUserName}"</h4>
				<p>är inte ett giltig användarnamn</p>
			{/if}
		</div>
		<SubmitButton text="Add Friend" onClick={handleFriends} />
	</Popup>
	<FilledButton customStyles="w-full" onClick={openPopup} text="Add Friend" />
	<div class="absolute bottom-0 left-0 w-full">
		<div class="rounded-3xl bg-slate-200 py-2 mx-2 mb-2">
			<h3 class="text-center">Vänförfrågningar</h3>
			{#each friendRequests as request}
				<div class="flex justify-between">
					<p>{request.name}</p>
					<div class="flex">
						<FilledButton text="Accept" />
						<FilledButton text="Decline" />
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
