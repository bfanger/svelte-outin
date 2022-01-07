import { append_styles } from "svelte/internal";
import type { TransitionConfig } from "svelte/transition";

type Transition = (node: HTMLElement, options?: any) => TransitionConfig;
export default function outin<
  O extends Transition,
  I extends Transition
>(transition: {
  out: O | [O, Parameters<O>[1]];
  in: I | [I, Parameters<I>[1]];
}): [O, I] {
  let outroNode: HTMLElement | undefined;
  let introNode: HTMLElement | undefined;
  let wait = 0;
  let reversed = false;

  function reset() {
    introNode?.classList.remove("svelte-outin-hidden");
    outroNode?.removeEventListener("outroend", reset);
    introNode = undefined;
    outroNode = undefined;
    wait = 0;
    reversed = false;
  }

  function transitionOut(node: HTMLElement, options: any): TransitionConfig {
    const [fn, params] = Array.isArray(transition.out)
      ? transition.out
      : [transition.out, {}];
    const config = fn(node, { ...params, ...options });
    if (node === introNode && node !== outroNode) {
      reset();
      reversed = true;
    }
    outroNode = node;
    if (reversed) {
      wait = 0;
    } else {
      wait = (config.duration ?? 0) + (config.delay ?? 0);
    }
    return config;
  }

  function transitionIn(node: HTMLElement, options: any): TransitionConfig {
    const [fn, params] = Array.isArray(transition.in)
      ? transition.in
      : [transition.in, {}];
    introNode = node;
    if (reversed === false && wait === 0) {
      return fn(node, { ...params, ...options });
    }
    append_styles(
      undefined as any,
      "outin",
      `.svelte-outin-hidden {
        position: absolute !important;
      }`
    );
    const config = fn(node, {
      ...params,
      ...options,
    });
    if (reversed) {
      outroNode?.classList.add("svelte-outin-hidden");
      node.classList.remove("svelte-outin-hidden");
    } else {
      node.classList.add("svelte-outin-hidden");
      config.delay = wait + (config.delay ?? 0);
    }
    outroNode?.addEventListener("outroend", reset);
    return config;
  }
  return [transitionOut as O, transitionIn as I];
}
