/* eslint-disable no-param-reassign */
import type { TransitionConfig } from "svelte/transition";

type Transition = (node: HTMLElement, options?: any) => TransitionConfig;
let injected = false;
export default function outin<
  O extends Transition,
  I extends Transition
>(transition: { out: O; in: I }): [O, I] {
  if (!injected) {
    injected = true;
    if (typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent =
        ".svelte-outin-hidden { position: absolute !important; }";
      document.head.appendChild(style);
    }
  }
  let delay = 0;
  const triggers: Array<() => void> = [];
  function transitionOut(node: HTMLElement, options: any): TransitionConfig {
    const config = transition.out(node, options);
    delay = config.duration ? config.duration : 0;
    function onOutroend() {
      triggers.forEach((trigger) => trigger());
      triggers.length = 0;
      node.removeEventListener("outroend", onOutroend);
    }
    node.addEventListener("outroend", onOutroend);
    return config;
  }
  function transitionIn(node: HTMLElement, options: any): TransitionConfig {
    if (delay === 0) {
      return transition.in(node, options);
    }
    options = options || {};
    options.delay = options.delay || 0;
    const config = transition.in(node, {
      ...(options ?? {}),
      delay: options.delay + delay,
    });
    if (delay !== 0) {
      //   config.delay = config.delay ? config.delay + delay : delay;
    }
    node.classList.add("svelte-outin-hidden");
    triggers.push(() => {
      node.classList.remove("svelte-outin-hidden");
    });
    delay = 0;
    return config;
  }
  return [transitionOut as O, transitionIn as I];
}
