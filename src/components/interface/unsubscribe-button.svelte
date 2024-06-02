<script lang="ts">
  import { currentUser, updateSharedUsers } from "../../lib/pocketbase"; // Assuming you have a module to handle Pocketbase integration
  import FilledButton from "./filledButton.svelte";
  import Popup from "../layout/popup.svelte";
  import SubmitButton from "./submit-button.svelte";
  import IconButton from './icon-button.svelte';

  let openPopup, closePopup;
  let users = [];
  //export let shared = [];
  export let listName = "";
  export let listId = "";
  export let sharedUserNames = [];

  // find the user in the shared array, then remove it from it.
  const sortSharedUsers = () => {
    let newSharedUsers = [];
    for (let i = 0; i < sharedUserNames.length; i++) {
      if (sharedUserNames[i].id != $currentUser.id) {
        newSharedUsers = [...newSharedUsers, sharedUserNames[i].id];
      }
    }

    return newSharedUsers;
  };

  export let animateExit = () => {};

  const handleSharedUsers = async () => {
    let sharedUsers = sortSharedUsers();
    await updateSharedUsers(listId, sharedUsers);
    animateExit();
    closePopup();
  };
</script>

<div>
    <IconButton icon="CircleMinusSolid" customStyles="bg-yellow-300" size="medium" onClick={openPopup} />
</div>

<Popup bind:open={openPopup} bind:close={closePopup}>
  <div class="flex-col">
    <p>Är du säker på att du vill avprenumerera på listan:</p>
    <h4 class="font-bold">"{listName}"</h4>
  </div>
  <SubmitButton text="Avprenumerera" onClick={handleSharedUsers} />
</Popup>
