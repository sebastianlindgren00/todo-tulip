<script lang="ts">
  import Popup from "./popup.svelte";
  import Avatar from "@components/interface/avatar.svelte";

  let openPopup, closePopup;

  // display information of the user, with the user that was bound to the component
  export let user: any;
  export let className = "w-5 h-5 ml-3";
</script>

<Avatar
  className={"hover:cursor-pointer hover:scale-110 hover:border-l-primaryVariant " + className}
  userId={user.id}
  avatarFile={user.avatar}
  onClick={openPopup}
/>

<Popup bind:open={openPopup} bind:close={closePopup}>
  <div class="flex flex-col items-center">
    <div class="flex flex-col items-center">
      <Avatar className="w-20 h-20" userId={user.id} avatarFile={user.avatar} />
      <h1 class="text-2xl font-bold mt-2">{user.name}</h1>
      <p class="text-gray-500">@{user.username}</p>
    </div>
    <!-- <div class="flex flex-col items-center mt-4">
            <p class="text-lg font-semibold">Email: {user.email}</p>
            <p>{user.email}</p>
        </div> -->
    <div>
      <p>Member since: {user.created.split(" ")[0]}</p>
    </div>
  </div>
</Popup>
