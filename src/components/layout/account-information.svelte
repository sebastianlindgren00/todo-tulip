<script lang="ts">
  import Popup from "./popup.svelte";
  import Avatar from "@components/interface/avatar.svelte";
  import IconButton from "@components/interface/icon-button.svelte";
  import { deleteFriend, currentUser } from "@lib/pocketbase";

  let openPopup, closePopup;

  // display information of the user, with the user that was bound to the component
  export let user: any;
  export let className = "w-5 h-5 ml-3";

  const handleDelete = async (id) => {
    deleteFriend(id);
    closePopup();
  };

</script>

<Avatar
  className={"hover:cursor-pointer hover:scale-110 hover:border-l-primaryVariant " +
    className}
  userId={user.id}
  avatarFile={user.avatar}
  onClick={openPopup}
/>

<Popup bind:open={openPopup} bind:close={closePopup}>
  {#if user.id != $currentUser.id}
  <IconButton
  icon="UserRemoveSolid"
  color="bg-red-500"
  size="medium"
  onClick={() => handleDelete(user.id)}
  className="absolute right-3 top-3"
/>
  {/if}
  
  <div class="flex flex-col items-center relative">
    <Avatar className="w-20 h-20" userId={user.id} avatarFile={user.avatar} />
    <h1 class="text-2xl font-bold mt-2">{user.name}</h1>
    <p class="text-gray-500">@{user.username}</p>
  </div>
  <div>
    <p>Medlem sen: {user.created.split(" ")[0]}</p>
  </div>
</Popup>
