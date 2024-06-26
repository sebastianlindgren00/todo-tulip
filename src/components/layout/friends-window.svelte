<script lang="ts">
  import {
    pb,
    currentUser,
    sendFriendRequest,
    getUsersByIds,
    getUserByUsername,
    deleteFriend,
    getFriends,
    getRequests,
    acceptFriendRequest,
    rejectFriendRequest,
  } from "@lib/pocketbase";
  import { onMount } from "svelte";
  import Popup from "./popup.svelte";
  import FilledButton from "@components/interface/filledButton.svelte";
  import SubmitButton from "@components/interface/submit-button.svelte";
  import InputField from "@components/interface/input-field.svelte";
  import IconButton from "@components/interface/icon-button.svelte";
  import AccountInformation from "./account-information.svelte";

  let openAddPopup, closeAddPopup;
  let openRequestsPopup, closeRequestsPopup;
  let friends = [];
  let friendId = "";
  let friendUserName = "";
  let requests = { received: [], sent: [] };

  onMount(async () => {
    console.log("currentUser", $currentUser);

    friends = await getFriends();
    requests = await getRequests();

    console.log("friends", friends);
    console.log("requests", requests);

    pb.collection("users").subscribe(
      "*",
      async function (e) {
        switch (e.action) {
          case "update":
            if (e.record.id === $currentUser.id) {
              friends = await getUsersByIds(e.record.friends);
              requests.received = await getUsersByIds(e.record.friend_requests);
              requests.sent = await getUsersByIds(e.record.sent_requests);
            }
            break;
        }
      },
      {},
    );
  });

  const handleFriends = async () => {
    const friend = await getUserByUsername(friendUserName);
    if (friend) {
      sendFriendRequest(friend.id);
      closeAddPopup();
    } else friendId = null;
  };
</script>

<div class="px-4 pt-4">
  <h1 class="pb-8">Dina vänner</h1>
  {#each friends as friend}
    <div class="friend-card flex pb-4">
      <AccountInformation user={friend} className="w-14 h-14" />
      <div class="self-center ml-3">
        <p class="font-semibold">{friend.name}</p>
        <p class="text-gray-500">@{friend.username}</p>
      </div>
    </div>
  {/each}
  {#each requests.sent as request}
    <div class="friend-card flex pb-4 grayscale">
      <AccountInformation user={request} className="w-14 h-14" />
      <div class="self-center ml-3">
        <p class="font-semibold">{request.name}</p>
        <p class="text-gray-500">@{request.username}</p>
      </div>
    </div>
  {/each}
  <Popup bind:open={openAddPopup} bind:close={closeAddPopup}>
    <div class="flex-col">
      <p>Skriv in användarnamnet på personen du vill lägga till:</p>
      <InputField placeholder="Användarnamn" type="text" bind:value={friendUserName} />
      {#if friendId == null}
        <h4 class="font-bold">"{friendUserName}"</h4>
        <p>är inte ett giltig användarnamn</p>
      {/if}
    </div>
    <SubmitButton text="Add Friend" onClick={handleFriends} />
  </Popup>
  <div class="absolute bottom-3 left-0 w-full px-3 flex h-12">
    <FilledButton customStyles="w-full" onClick={openAddPopup} text="Lägg till vän" />
    {#if requests.received.length > 0}
      <div class="ml-2 w-12 relative">
        <div
          class="absolute mr-[-5px] mt-[-5px] -right-1 -top-1 h-5 w-5 z-50 bg-red-500 rounded-full text-textLight text-xs flex items-center justify-center"
        >
          {requests.received.length}
        </div>
        <IconButton
          icon="MailBoxSolid"
          color="bg-primaryVariant"
          size="large"
          onClick={openRequestsPopup}
        />
      </div>
    {/if}
  </div>
  <Popup width="w-[35rem]" bind:open={openRequestsPopup} bind:close={closeRequestsPopup}>
    <div class="px-2">
      <h3 class="text-center">Vänförfrågningar</h3>
      <div class="grid gap-y-3">
        {#each requests.received as request}
          <div class="flex justify-between">
            <p class="self-center">{request.name}</p>
            <div class="grid-cols-2 gap-3">
              <FilledButton
                text="Acceptera"
                color="green-500"
                onClick={() => acceptFriendRequest(request.id)}
              />
              <FilledButton
                text="Neka"
                color="red-500"
                onClick={() => rejectFriendRequest(request.id)}
              />
            </div>
          </div>
        {/each}
      </div>
    </div>
  </Popup>
</div>
