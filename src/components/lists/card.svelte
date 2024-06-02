<script lang="ts">
  import { getItems, pb, deleteList, getUsersByIds, currentUser } from "@lib/pocketbase";
  import { onDestroy, onMount } from "svelte";
  import ListItem from "./list-item.svelte";
  import CreateItem from "./create-item.svelte";
  import IconButton from "@components/interface/icon-button.svelte";
  import { quintOut } from "svelte/easing";
  import { slide } from "svelte/transition";
  import Avatar from "@components/interface/avatar.svelte";
  import UnsubscribeButton from "@components/interface/unsubscribe-button.svelte";

  export let listName = "[name]";
  export let listId;
  export let sharedUsers = [];
  export let listOwner;

  export let sharedUserNames = [];

  let items = [];

  let useDeletionSlide1 = false;
  let useDeletionSlide2 = false;

  // subscribe to 'items' for realtime updates
  pb.collection("items").subscribe(
    "*",
    function (e) {
      console.log("Subscription triggered:", e);
      switch (e.action) {
        case "create":
          if (e.record.list === listId) items = [...items, e.record];
          break;
        case "update":
          // update the item in the array
          items = items.map((item) => (item.id === e.record.id ? e.record : item));
          break;
        case "delete":
          // remove the item from the array
          items = items.filter((item) => item.id !== e.record.id);
          break;
        default:
          break;
      }
    },
    {},
  );

  // subscribe to 'lists' for realtime updates
  pb.collection("lists").subscribe(
    "*",
    function (e) {
      console.log("Lists subscription triggered:", e);
      switch (e.action) {
        case "update":
          //if (e.record.id === listId) {
          sharedUsers = e.record.shared;
          getUsersByIds(sharedUsers).then((fetchedUsers) => {
            sharedUserNames = fetchedUsers;
          });
          //}
          break;
        default:
          break;
      }
    },
    {},
  );

  // cleanup subscription on component destroy
  onDestroy(() => {
    pb.collection("items").unsubscribe();
  });

  onMount(async () => {
    items = await getItems(listId);
    sharedUserNames = await getUsersByIds(sharedUsers);
  });

  onMount(async () => {
    try {
      console.log("Shared users 1:", sharedUsers);
      sharedUserNames = await getUsersByIds(sharedUsers);
      console.log("Shared users 2:", sharedUserNames);
    } catch (error) {
      console.error("onMount - Error fetching user details: ", error);
    }
  });
  const handleDelete = async () => {
    deleteList(listId);
    // Two step deletion process, to trigger the different transitions
    animateExit();
  };

  function animateExit() {
    useDeletionSlide1 = true;
    setTimeout(() => {
      useDeletionSlide2 = true;
    }, 100 + 300);
  }
</script>

{#if !useDeletionSlide2}
  <div
    transition:slide={{ delay: 100, duration: 300, easing: quintOut, axis: "x" }}
    id={listId}
    class="bg-slate-100 rounded-2xl p-6 w-96 soft-shadow mx-2 transition-all h-min"
  >
    <div class="mb-4 flex items-center justify-between">
      <h2>{listName}</h2>
      {#if $currentUser.id != listOwner}
        <UnsubscribeButton {listName} {listId} {sharedUserNames} {animateExit} />
      {:else}
        <IconButton icon="TrashBinSolid" color="bg-red-500" size="medium" onClick={handleDelete} />
      {/if}
    </div>
    <!-- Showcase the shared users -->
    {#if sharedUsers.length > 0}
      <div class="mb-4">
        <p class="text-sm font-semibold">Shared with:</p>
        <ul class="list-disc list-inside">
          {#each sharedUserNames as user}
            <div class="flex items-center">
              <p>{user.name}</p>
              <!-- <AccountInformation user={user} /> -->
              <Avatar className="w-5 h-5 ml-3" userId={user.id} avatarFile={user.avatar} />
            </div>
          {/each}
        </ul>
      </div>
    {/if}
    {#if !useDeletionSlide1}
      <div transition:slide={{ delay: 100, duration: 300, easing: quintOut, axis: "y" }}>
        {#each items as item}
          <ListItem
            itemId={item.id}
            creatorId={item.creator}
            title={item.content.title}
            text={item.content.text}
            priority={item.priority}
          />
        {/each}
        <CreateItem {listId} />
      </div>
    {/if}
  </div>
{/if}
