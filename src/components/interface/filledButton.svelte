<script>
  export let text = "Button";
  export let color = "primary";
  export let customStyles = "";
  export let onClick = () => {};
  export let loader = false;

  // Unknown error caused the color to be undefined when button is loaded, this is a workaround to define the color at the beginning
  let bgColor = "bg-primary";
  bgColor = "bg-" + color;
  let hoverColor = "hover:bg-primaryVariant";

  // Set the color of the hover effect when using tailwindcss color palette
  if (color !== "primary" && color.includes("00") && color.includes("-")) {
    hoverColor = "hover:scale-110";
  }
</script>

{#if loader}
  <button
    class={`${bgColor + " " + hoverColor} text-white font-bold rounded-xl soft-shadow transition-all duration-300 ease-in-out ${customStyles}`}
  >
    <div class="bg-slate-200 h-10 rounded-lg loadingField"></div>
  </button>
{:else}
  <button
    class={`${bgColor + " " + hoverColor} text-white font-bold py-2 px-4 rounded-xl soft-shadow transition-all duration-300 ease-in-out ${customStyles}`}
    on:click={onClick}
  >
    {text}
  </button>
{/if}
