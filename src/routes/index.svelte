<script lang="ts">
  import outin from "$lib/outin";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  const [fadeOut, fadeIn] = outin({ in: fade, out: fade });

  let value = true;

  function toggle() {
    value = !value;
  }
  onMount(() => {
    toggle();
  });
  function instrument(message: string) {
    return () => console.info(message);
  }
</script>

<button on:click={toggle}>{value}</button>

<div class="before" />
{#if value}
  <div
    in:fadeIn
    out:fadeOut
    on:introstart={instrument("Truty introstart")}
    on:introend={instrument("Truty introend")}
    on:outrostart={instrument("Truty outrostart")}
    on:outroend={instrument("Truty outroend")}
  >
    Truty
  </div>
{:else}
  <div
    in:fadeIn
    out:fadeOut
    on:introstart={instrument("Falsy introstart")}
    on:introend={instrument("Falsy introend")}
    on:outrostart={instrument("Falsy outrostart")}
    on:outroend={instrument("Falsy outroend")}
  >
    Falsy
  </div>
{/if}
<div class="after" />

<style>
  .before,
  .after {
    width: 200px;
    height: 20px;
    opacity: 0.2;
  }
  .before {
    margin-top: 10px;
    background: rebeccapurple;
  }
  .after {
    background: firebrick;
  }
</style>
