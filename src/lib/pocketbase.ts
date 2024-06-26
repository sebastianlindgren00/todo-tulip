import PocketBase from 'pocketbase';

// Import the createAvatar function from the dicebear/core package
import { createAvatar } from '@dicebear/core';
import { thumbs } from '@dicebear/collection';

import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

const pbURL = "https://todo-tulip.pockethost.io/"
export const pb = new PocketBase(pbURL); // remote
pb.autoCancellation(false);
export const currentUser = writable(pb.authStore.model);
export const cachedUsers = writable([]);
export const cachedAvatars = writable([{ userId: '', url: '' }]);

pb.authStore.onChange(() => {
    currentUser.set(pb.authStore.model);
});

console.log("Auth store changed", pb.authStore.model);


/* #region Avatar */
async function generateAvatar(seed: string) {
    const svg = createAvatar(thumbs, {
        seed: seed,
        radius: 40,
        shapeColor: ['#505050', '#404040', '#303030', '#202020', '#101010', '#000000']
    }).toString();

    return svg;
}

export async function getAvatar(userId: string, fileName: string) {
    if (fileName == "")
        fileName = pb.authStore.model?.avatar;

    if (userId == "")
        userId = pb.authStore.model?.id;

    try {
        // Get the current user's record. Use requestKey: null to avoid autocancelling the request if many avatar requests are made in a short time
        const record = await pb.collection('users').getOne(userId, { requestKey: null });
        const url = pb.files.getUrl(record, fileName, { 'thumb': '100x250' });

        cachedAvatars.update((avatars) => [...avatars, { userId: userId, url: url }]);

        return url;
    } catch (error) {
        console.error(error);
    }
}
/* #endregion */

/* #region Get users */
export async function getUserByUsername(username: string) {
    if (username == "") {
        return null;
    }

    try {
        const user = await pb.collection('users').getFirstListItem(`username = "${username}"`, {
            sort: 'created',
        });

        cachedUsers.update((users) => [...users, user]);

        return user;
    } catch (error) {
        console.error("Get user by username: ", error);
    }
}

export async function getUsersByIds(userIds: string[]) {
    if (userIds.length == 0) {
        return [];
    }

    try {
        // Get user details for the provided user IDs
        const users = await pb.collection('users').getList(1, 50, {
            requestKey: null,
            filter: userIds.map((id) => `id="${id}"`).join("||"),
        });
        return users.items;
    }
    catch (error) {
        console.error("Get users by IDs: ", error);
        return [];
    }
}

/* #endregion */

/* #region Friend functionality */
export async function sendFriendRequest(friendId: string) {
    try {
        const currentUser = pb.authStore.model;

        const friend = await pb.collection('users').getOne(friendId);

        if (!friend) {
            console.error("User not found");
            return;
        }

        // Check if the friend-user is already a friend
        if (currentUser.friends.includes(friendId)) {
            console.error("User is already a friend");
            return;
        }

        // Check if the friend request has already been sent
        if (friend.friend_requests.includes(friendId)) {
            console.error("Friend request already sent");
            return;
        }

        // Create a new friend request
        const createdRequest = await pb.collection('users').update(friend.id, {
            friend_requests: [...friend.friend_requests, currentUser.id]
        });
        console.log("current user friend req: ", currentUser.friend_requests);

        const sentRequest = await pb.collection('users').update(currentUser.id, {
            sent_requests: [...currentUser.sent_requests, friendId]
        });

        return createdRequest && sentRequest;
    } catch (error) {
        console.error("Send friend request: ", error);
    }
}

export async function acceptFriendRequest(friendId: string) {
    try {
        const currentUser = pb.authStore.model;
        const user = await pb.collection('users').getOne(currentUser.id);

        // Remove the friend request from the user's friend_requests
        const friendRequests = user.friend_requests.filter((id: string) => id !== friendId);

        // Add the friend to the user's friends
        const friends = [...user.friends, friendId];

        let data = currentUser;
        data.friends = friends;
        data.friend_requests = friendRequests;

        // Update the user's record
        const updatedUser = await pb.collection('users').update(currentUser.id, data);

        // Add the user to the friend's friends
        const friend = await pb.collection('users').getOne(friendId);
        const friendFriends = [...friend.friends, currentUser.id];

        // Update the friend's record
        const updatedFriend = await pb.collection('users').update(friendId, {
            friends: friendFriends,
            requestKey: null,
            sent_requests: friend.sent_requests.filter((id: string) => id !== currentUser.id)

        });


        return updatedUser && updatedFriend;
    } catch (error) {
        console.error("Accept friend request: ", error);
    }
}

export async function rejectFriendRequest(friendId: string) {
    try {
        const currentUser = pb.authStore.model;
        const user = await pb.collection('users').getOne(currentUser.id);

        // Remove the friend request from the user's friend_requests
        const friendRequests = user.friend_requests.filter((id: string) => id !== friendId);

        // Update the user's record
        const updatedUser = await pb.collection('users').update(currentUser.id, {
            friend_requests: friendRequests
        });

        const updatedFriend = await pb.collection('users').update(friendId, {
            sent_requests: user.sent_requests.filter((id: string) => id !== currentUser.id)
        });

        return updatedUser && updatedFriend;
    } catch (error) {
        console.error("Reject friend request: ", error);
    }
}
/* #endregion */

/* #region List functionality */
/* #region Get */
export async function getFriends() {
    try {
        const userId = pb.authStore.model?.id;

        // fetch a paginated records list
        const record = await pb.collection('users').getOne(userId, {
            expand: 'friends'
        });

        return await getUsersByIds(record.friends);
    } catch (error) {
        console.error("Get friends: ", error);
    }
}

export async function getRequests() {
    try {
        const userId = pb.authStore.model?.id;

        // fetch a paginated records list
        const record = await pb.collection('users').getOne(userId, {
            expand: 'friend_requests, sent_requests'
        });

        console.log("friend req: ", record.friend_requests, "sent req: ", record.sent_requests);

        return {
            received: await getUsersByIds(record.friend_requests), sent: await getUsersByIds(record.sent_requests)
        };
    } catch (error) {
        console.error("Get friend requests: ", error);
    }
}
export async function getLists() {
    try {
        const userId = pb.authStore.model?.id;

        // fetch a paginated records list
        const resultList = await pb.collection('lists').getList(1, 50, {
            requestKey: `"${userId}"`,
            sort: 'created',
            filter: `owner = "${userId}" || shared ?~ "${userId}" || isPublic = true`
        });
        return resultList.items;
    } catch (error) {
        console.error("Get lists: ", error);
    }
}

export async function getItems(listId: string) {
    try {
        // fetch a paginated records list
        const resultList = await pb.collection('items').getList(1, 50, {
            requestKey: `"${listId}"`,
            sort: 'created',
            filter: `list.id = "${listId}"`
        });
        return resultList.items;
    } catch (error) {
        console.error("Get items: ", error);
    }
}
/* #endregion */
/* #region Create */
// create the list from the json object 
export async function createList(list: { name: string; description: string; isPublic: boolean; shared: string[]; }) {
    try {
        const userId = pb.authStore.model?.id; // fetch the user
        const data = {
            name: list.name,
            description: list.description,
            isPublic: list.isPublic,
            shared: list.shared,
            owner: userId
        };

        const createdList = await pb.collection('lists').create(data);
        return createdList;
    } catch (error) {
        console.error("Create list: ", error);
    }
}
// takes in strings and uses stores content in json object. store the json object in the database under "items"
export async function createItem(listId: string, title: string, text: string) {
    try {
        const userId = pb.authStore.model?.id;
        const content = { "title": title, "text": text }
        const data = {
            creator: userId,
            list: listId,
            content: content,
        };

        const createdItem = await pb.collection('items').create(data);
        return createdItem;
    } catch (error) {
        console.error("Create list: ", error);
    }
}
/* #endregion */
/* #region Delete */
export async function deleteItem(itemId: string) {
    try {
        const deletedItem = await pb.collection('items').delete(itemId);
        return deletedItem;
    } catch (error) {
        console.error("Delete item: ", error);
    }
}

// delete list
export async function deleteList(listId: string) {
    try {
        // delete the items in the list
        const resultList = await getItems(listId);
        resultList.forEach(async (item: { id: string }) => { // Specify the type of 'item' as { id: string }
            await deleteItem(item.id);
        });

        // delete the list
        const deletedList = await pb.collection('lists').delete(listId);
        return deletedList;
    } catch (error) {
        console.error("Delete list: ", error);
    }
}
// delete a friend
export async function deleteFriend(friendId: string) {
    try {
        // Remove the friend from the user's friends
        const userId = pb.authStore.model?.id;
        const user = await pb.collection('users').getOne(userId);

        let friends = user.friends.filter((id: string) => id !== friendId);

        const updatedUser = await pb.collection('users').update(userId, {
            friends: friends
        });

        // Remove the user from the friend's friends
        const friend = await pb.collection('users').getOne(friendId);
        const friendFriends = friend.friends.filter((id: string) => id !== userId);

        const updatedFriend = await pb.collection('users').update(friendId, {
            friends: friendFriends
        });

        return updatedUser && updatedFriend;
    } catch (error) {
        console.error("Delete friend: ", error);
        return -1;
    }
}

export async function updateSharedUsers(listId: string, shared: string[]) {
    try {
        const data = {
            shared: shared
        };

        const updatedList = await pb.collection('lists').update(listId, data);
        return updatedList;
    } catch (error) {
        console.error('Failed to update shared users', error);
    }
}
// update item
export async function updateItem(itemId: string, title: string, text: string) {
    try {
        const content = { "title": title, "text": text }
        const data = {
            content: content
        };

        const updatedItem = await pb.collection('items').update(itemId, data);
        return updatedItem;
    } catch (error) {
        console.error("Update item: ", error);
    }
}
/* #endregion */
/* #endregion */

/* #region Local user handling */

/// Login a user
export async function login(user: { username: string; password: string; }) {
    try {
        // Try to login the user with the provided credentials, if successful return true
        await pb.collection('users').authWithPassword(user.username, user.password);

        return true;
    } catch (error) {
        console.error("Login error: ", error);

        // If login fails, return false
        return false;
    }
}

/// Sign up a new user
export async function signUp(user: { name: string; username: string; email: string; password: string; }) {
    try {
        // Generate an avatar for the user and convert it to a SVG file (Blob)
        const svgString = await generateAvatar(user.username);
        const avatar = new Blob([svgString], { type: 'image/svg+xml' });

        // Try to create a new user with the provided data
        const data = {
            email: user.email,
            username: user.username,
            password: user.password,
            passwordConfirm: user.password,
            avatar: avatar,
            name: user.name
        };
        const createdUser = await pb.collection('users').create(data);

        if (createdUser) {
            // If user was created successfully, try to login the user
            return await login({ username: user.username, password: user.password });
        }

    } catch (err) {
        // If user creation fails, log the error and return false
        console.error(err)
        return false
    }
}

/// Sign out the current user
export function signOut() {
    const id = pb.authStore.model?.id;
    pb.collection('users').unsubscribe(id);
    pb.authStore.clear();
    goto('/login');
}
/* #endregion */