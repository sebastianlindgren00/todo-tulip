<script>
  // Icons found at https://flowbite-svelte-icons.codewithshin.com/
  import {
    TrashBinSolid,
    PenSolid,
    CirclePlusSolid,
    MailBoxSolid,
    UserRemoveSolid,
    CircleMinusSolid,
    CloseCircleSolid,
  } from "flowbite-svelte-icons";

  export let icon = "TrashBinSolid";
  export let color = "primary";
  export let size = "large";
  export let customStyles = "";
  export let onClick = () => {};

  // Set size of button
  let iconSize = "w-full h-full";
  if (size === "small") {
    iconSize = "w-3 h-3";
  }
  if (size === "medium") {
    iconSize = "w-6 h-6";
  }

  const iconClass = (() => {
    switch (icon) {
      case "TrashBinSolid":
        return TrashBinSolid;
      case "PenSolid":
        return PenSolid;
      case "CirclePlusSolid":
        return CirclePlusSolid;
      case "MailBoxSolid":
        return MailBoxSolid;
      case "UserRemoveSolid":
        return UserRemoveSolid;
      case "CircleMinusSolid":
        return CircleMinusSolid;
      case "CloseCircleSolid":
        return CloseCircleSolid;
      default:
        return TrashBinSolid;
    }
  })();
</script>

<button
  class={`${color} icon-btn transition-all rounded-xl p-1 shadow-lg ${customStyles}
		hover:scale-110`}
  on:click={onClick}
>
  <svelte:component this={iconClass} class={iconSize} />
</button>
