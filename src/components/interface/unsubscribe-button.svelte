<script lang="ts">
    import { onMount } from 'svelte';
    import { getUsers, currentUser, updateSharedUsers } from '../../lib/pocketbase'; // Assuming you have a module to handle Pocketbase integration
    import FilledButton from './filledButton.svelte';
    import Popup from '../layout/popup.svelte';
    import { Search, Button } from 'flowbite-svelte'; // search button
    import { SearchOutline } from 'flowbite-svelte-icons';
    import SubmitButton from './submit-button.svelte';

    let openPopup, closePopup;
    let users = [];
    //export let shared = [];
    export let listName = '';
    export let listId = '';
    export let sharedUserNames = [];

    // find the user in the shared array, then remove it from it.
    const sortSharedUsers = () => {
        let newSharedUsers = [];
        for(let i = 0; i < sharedUserNames.length; i++) {
            if(sharedUserNames[i].id != $currentUser.id) {
                newSharedUsers = [...newSharedUsers, sharedUserNames[i].id];
            }
        }
        
        return newSharedUsers;  
    };

    export let animateExit = () => {
		
	};

    const handleSharedUsers = async () => {
        let sharedUsers = sortSharedUsers();
        await updateSharedUsers(listId, sharedUsers);
        animateExit();
        closePopup();
    };

</script>

<div>
    <FilledButton customStyles="w-full" onClick={openPopup}  text="Avprenumerera" />
</div>

<Popup bind:open={openPopup} bind:close={closePopup}>
    <div class="flex-col">
        <p>Är du säker på att du vill avprenumerera på listan:</p>
        <h4 class="font-bold">"{listName}"</h4>
    </div>
    <SubmitButton text="Avprenumerera" onClick={handleSharedUsers} />
</Popup>