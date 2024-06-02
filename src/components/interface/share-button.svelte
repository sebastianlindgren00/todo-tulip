<script lang="ts">
    import { onMount } from 'svelte';
    import { getUsers } from '../../lib/pocketbase'; // Assuming you have a module to handle Pocketbase integration
    import FilledButton from './filledButton.svelte';
    import Popup from '../layout/popup.svelte';
    import { Search, Button } from 'flowbite-svelte'; // search button
    import { SearchOutline } from 'flowbite-svelte-icons';
    import SubmitButton from './submit-button.svelte';
    import Avatar from './avatar.svelte';

    let openPopup, closePopup;
    let searchTerm = ''; // Variable to store the search term

    let users = [];
    let filteredUsers = []; // Array to store filtered users

    export let shared = [];

    onMount(async () => {
        const result = await getUsers();
        users = result.items.map(item => ({ id: item.id, name: item.name }));
        filterUsers(); // filtering on mount
    });

    // Function to filter users based on search term
    const filterUsers = () => {
    if(searchTerm.length > 2)
        filteredUsers = users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
        ); 
    };

    const toggleUser = (user) => {
        if (shared.includes(user.id)) {
            // remove
            shared = shared.filter(userId => userId !== user.id); // was !==, fixed cache thingy when i removed it
        } else {
            // add
            shared = [...shared, user.id];
        }
    };

    const handleShare = () => {
        closePopup();
    };
</script>

<div class="pb-5">
    <FilledButton customStyles="w-1/2" onClick={openPopup} text="Dela med" />
</div>

<Popup bind:open={openPopup} bind:close={closePopup}>
    <Search size="md" bind:value={searchTerm} on:input={() => filterUsers()} />
    <Button class="!p-2.5">
        <SearchOutline class="w-6 h-6" />
    </Button>
    <div class="flex-col">
        <p>Vem vill du dela listan med?</p>
        <div class="flex-col">
            {#each filteredUsers as user (user.id)}
                <label for={user.id}>
                    {user.name}
                    <input type="checkbox"
                           id={user.id}
                           checked={shared.includes(user.id)}
                           on:change={() => {toggleUser(user)}}
                    />
                </label>
                <p>{"\n"}</p>
            {/each}
        </div>
    </div>
    <SubmitButton text="Klar" onClick={handleShare} />
</Popup>