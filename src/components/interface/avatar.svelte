<script lang="ts">
  import { currentUser, getAvatar, cachedAvatars } from "@lib/pocketbase";

  export let userId: string = "";
  export let avatarFile: string = "";
  export let url: string = "";
  export let className: string = "";

  export let onClick = () => {
    console.log("Empty submit");
  };

  const avatarUrl = async () => {
    // If url is provided, just return it
    if (url != "") return url;

    // If no user id or avatar file is provided, get the current user's avatar
    if (userId == "") userId = $currentUser?.id;
    if (avatarFile == "") avatarFile = $currentUser?.avatar;

    // Check if avatar is cached
    console.log("Checking if avatar is cached", cachedAvatars);
    console.log("userId", $currentUser.id);

    if (cachedAvatars[userId]) {
      console.log("Avatar is cached");
      return cachedAvatars[userId].url;
    }

    return await getAvatar(userId, avatarFile);
  };
</script>

{#await avatarUrl()}
  <div class={className}>
    <div class="loadingField">&nbsp;</div>
  </div>
{:then srcUrl}
  <div class={className}>
    <img src={srcUrl} alt="Avatar" on:click={onClick} />
  </div>
{:catch error}
  <div class={className}>
    <p>Error loading avatar: {error.message}</p>
  </div>
{/await}
