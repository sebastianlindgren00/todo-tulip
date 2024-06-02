<script lang="ts">
import {pb, currentUser} from '../../lib/pocketbase';
import {onMount} from 'svelte';
import Popup from './popup.svelte';
import Avatar from '@components/interface/avatar.svelte';


let openPopup, closePopup;

// display information of the user, with the user that was bound to the component
export let user;

</script>
<Avatar className="w-5 h-5 ml-3" userId={user.id} avatarFile={user.avatar} onClick={openPopup} />

<Popup bind:open={openPopup} bind:close={closePopup}>
    <div class="flex flex-col items-center">
        <h1 class="text-2xl font-bold">User information</h1>
        <div class="flex flex-col items-center">
            
            <h1 class="text-2xl font-bold mt-2">{user.name}</h1>
            <p class="text-gray-500">{user.username}</p>
        </div>
        <div class="flex flex-col items-center mt-4">
            <p class="text-lg font-semibold">Email:</p>
            <p>{user.email}</p>
        </div>
    </div>
</Popup>