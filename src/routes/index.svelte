<script lang="ts">
  import outin from "$lib/outin-verbose";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";

  const inConfig = { x: -10, y: -10, duration: 1000 };
  const outConfig = { x: 20, duration: 1000 };

  const [flyOut, flyIn] = outin({
    in: [fly, inConfig],
    out: [fly, outConfig],
  });

  let value = true;

  function toggle() {
    value = !value;
  }
  onMount(() => {
    toggle();
  });
  const debug = false;
  function instrument(message: string) {
    return () => debug && console.info(message);
  }
</script>

<main class="container">
  <div class="left">
    <button on:click={toggle}>{value}</button>
    <div class="before" />
    {#if value}
      <div
        in:flyIn
        out:flyOut
        on:introstart={instrument("Truty introstart")}
        on:introend={instrument("Truty introend")}
        on:outrostart={instrument("Truty outrostart")}
        on:outroend={instrument("Truty outroend")}
      >
        Truty
      </div>
    {:else}
      <div
        in:flyIn
        out:flyOut
        on:introstart={instrument("Falsy introstart")}
        on:introend={instrument("Falsy introend")}
        on:outrostart={instrument("Falsy outrostart")}
        on:outroend={instrument("Falsy outroend")}
      >
        Falsy
      </div>
    {/if}

    <div class="after" />
  </div>
  <div class="middle">
    multiple:
    <div class="before" />
    {#if value}
      <div
        in:flyIn
        out:flyOut
        on:introstart={instrument("Truty2 introstart")}
        on:introend={instrument("Truty2 introend")}
        on:outrostart={instrument("Truty2 outrostart")}
        on:outroend={instrument("Truty2 outroend")}
      >
        Truty2
      </div>
    {:else}
      <div
        in:flyIn={{ duration: 300 }}
        out:flyOut={{ duration: 300 }}
        on:introstart={instrument("Falsy2 introstart")}
        on:introend={instrument("Falsy2 introend")}
        on:outrostart={instrument("Falsy2 outrostart")}
        on:outroend={instrument("Falsy2 outroend")}
      >
        Falsy2
      </div>
    {/if}

    <div class="after" />
  </div>
  <div class="right">
    ref:
    <div class="before" />
    {#if value}
      <div in:fly={inConfig} out:fly={outConfig}>Truty</div>
    {:else}
      <div in:fly={inConfig} out:fly={outConfig}>Falsy</div>
    {/if}
    <div class="after" />
  </div>
</main>

<style>
  .container {
    padding: 50px;
    display: flex;
  }
  .left {
    margin-right: 40px;
  }
  .middle {
    margin-right: 60px;
  }
  .right {
    margin-top: 3px;
  }
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
