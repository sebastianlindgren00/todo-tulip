<script>
  import { onMount } from "svelte";
  import { currentUser, createList } from "../../lib/pocketbase";
  import FilledButton from "../interface/filledButton.svelte";
  import Popup from "./popup.svelte";
  import InputField from "../interface/input-field.svelte";
  import SubmitButton from "../interface/submit-button.svelte";
  import ShareButton from "../interface/share-button.svelte";
  import FriendsWindow from "@components/layout/friends-window.svelte";
  import SlideWindow from "@components/layout/slide-window.svelte";
  import AccountInformation from "./account-information.svelte";
  import { slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";

  let openPopup, closePopup;
  let openWindow, closeWindow;
  let firstName = "test";
  let title = "";
  let description = "";
  let shared = [];
  let isPublic = false;
  let showFriendsWindow = false;
  let publicListPressed = true;
  let user = null;

  // Base greeting on the time of the day
  let time = new Date().getHours();
  let greeting = "";
  if (time >= 0 && time < 12) {
    greeting = "God morgon";
  } else if (time >= 12 && time < 18) {
    greeting = "God eftermiddag";
  } else {
    greeting = "God kväll";
  }

  onMount(() => {
    // get current user
    user = $currentUser;
    // split name
    firstName = $currentUser.name.split(" ")[0];
  });

  async function handleSubmit() {
    try {
      const list = {
        name: title,
        description: "",
        isPublic: isPublic,
        shared: shared,
      };

      await createList(list);

      // Reset values
      shared = [];
      title = "";
      description = "";
    } catch (error) {
      console.error("Error creating list: ", error);
    }
    closePopup();
  }
  // called in onClick for public list
  function openPrivateListPopup() {
    isPublic = false;
    openPopup();
  }
  // called in onClick for private list
  function openPublicListPopup() {
    isPublic = true;
    openPopup();
  }

  // called in onClick for friends window
  function openFriendWindow() {
    openWindow();
  }
</script>

<div class="flex-col">
  <div class="bg-slate-100 rounded-2xl p-6 w-[22rem] soft-shadow mx-2 mb-4 flex justify-between">
    <h1>{greeting}<br />{firstName}</h1>
    {#if user != null}
      <AccountInformation {user} className="w-20 h-20 ml-10" />
    {/if}
  </div>
  <div class="bg-slate-100 rounded-2xl p-6 w-[22rem] soft-shadow mx-2">
    <h2>Vad vill du göra?</h2>
    <div class="pt-3 grid gap-3">
      <FilledButton text="Ny privat lista" customStyles="w-full" onClick={openPrivateListPopup} />
      <FilledButton text="Ny publik lista" customStyles="w-full" onClick={openPublicListPopup} />
      <FilledButton text="Se vänner" customStyles="w-full" onClick={openFriendWindow} />
    </div>
  </div>
</div>
<Popup bind:open={openPopup} bind:close={closePopup}>
  <form class="relative w-full h-full" on:submit|preventDefault>
    <InputField label="Namn på lista" placeholder="Namn på lista" type="text" bind:value={title} />
    {#if isPublic == false}
      <ShareButton bind:shared />
    {/if}
    <SubmitButton text="Skapa" onClick={handleSubmit} />
  </form>
</Popup>

<SlideWindow bind:open={openWindow} bind:close={closeWindow}>
  <FriendsWindow />
</SlideWindow>
