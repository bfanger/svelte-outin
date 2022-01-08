/* eslint-disable no-console */
import { append_styles } from "svelte/internal";
import type { TransitionConfig } from "svelte/transition";

type Transition = (node: HTMLElement, options?: any) => TransitionConfig;
export default function outin<
  O extends Transition,
  I extends Transition
>(settings: // | { transition: I | [I, Parameters<I>[1]]; }
{
  out: O | [O, Parameters<O>[1]];
  in: I | [I, Parameters<I>[1]];
}): [O, I] {
  if (typeof document !== "undefined") {
    append_styles(
      undefined as any,
      "outin",
      `.svelte-outin {
        position: absolute !important;
      }`
    );
  }
  let outroNode: HTMLElement | undefined;
  let introNode: HTMLElement | undefined;
  let outroDuration = 0;

  let state = "IDLE";
  const className = "svelte-outin";

  function outro(node: HTMLElement, options: any): TransitionConfig {
    const [fn, params] = Array.isArray(settings.out)
      ? settings.out
      : [settings.out, {}];
    const config = fn(node, { ...params, ...options });

    introNode?.removeEventListener("introend", onIntroEnd);
    outroNode?.removeEventListener("outroend", onOutroEnd);
    outroNode = node;

    outroDuration = (config.duration ?? 0) + (config.delay ?? 0);
    if (state === "IDLE") {
      state = "OUTRO";
      console.log("outro: IDLE -> OUTRO");
      outroNode.addEventListener("outroend", onOutroEnd);
    } else if (state === "DELAYED_INTRO_VISIBLE") {
      state = "UNDO_SHOWING";
      console.log(`outro: DELAYED_INTRO_VISIBLE -> UNDO_SHOWING`);
      outroNode.classList.add(className);
    } else if (state === "DELAYED_INTRO_HIDDEN") {
      state = "UNDO_SHOWING";
      console.log(`outro: DELAYED_INTRO_HIDDEN -> UNDO_SHOWING`);
      //   introNode?.classList.remove(className);
      outroNode.classList.add(className);
    } else if (state === "UNDO_HIDING") {
      state = "OUTRO";
      console.log("outro: UNDO_HIDING -> OUTRO"); // redo
      outroNode.classList.remove(className);
      outroNode.addEventListener("outroend", onOutroEnd);
    } else {
      console.warn("outro", { state });
    }
    return config;
  }

  function onOutroEnd() {
    outroNode?.removeEventListener("outroend", onOutroEnd);
    if (state === "DELAYED_INTRO_HIDDEN") {
      introNode?.classList.remove(className);
      state = "DELAYED_INTRO_VISIBLE";
      console.log("outroEnd: DELAYED_INTRO_HIDDEN -> DELAYED_INTRO_VISIBLE");
    } else {
      console.warn("outroEnd", { state });
    }
  }

  function intro(node: HTMLElement, options: any): TransitionConfig {
    const [fn, params] = Array.isArray(settings.in)
      ? settings.in
      : [settings.in, {}];
    introNode?.removeEventListener("introend", onIntroEnd);
    introNode = node;

    const config = fn(node, {
      ...params,
      ...options,
    });
    if (state === "OUTRO") {
      if (outroDuration === 0) {
        // @todo
      }
      config.delay = outroDuration + (config.delay ?? 0);
      state = "DELAYED_INTRO_HIDDEN";
      console.log("intro: OUTRO -> DELAYED_INTRO_HIDDEN");
      node.classList.add(className);
      introNode.addEventListener("introend", onIntroEnd);
    } else if (state === "UNDO_SHOWING") {
      state = "UNDO_HIDING";
      console.log("intro: UNDO_SHOWING -> UNDO_HIDING");
      // @todo delay reshowing?
      introNode.classList.remove(className);
      introNode.addEventListener("introend", onIntroEnd);
    } else {
      console.warn("intro", { state });
    }
    return config;
  }

  function onIntroEnd() {
    introNode?.removeEventListener("introend", onIntroEnd);
    if (state === "DELAYED_INTRO_VISIBLE") {
      state = "IDLE";
      console.log("introEnd: DELAYED_INTRO_VISIBLE -> IDLE");
      introNode = undefined;
      outroNode = undefined;
    } else if (state === "DELAYED_INTRO_HIDDEN") {
      introNode?.classList.remove(className);
      outroNode?.classList.add(className);
      state = "IDLE";
      console.log("introEnd: DELAYED_INTRO_HIDDEN -> IDLE");
      outroNode?.removeEventListener("outroend", onOutroEnd);
    } else if (state === "UNDO_HIDING") {
      state = "IDLE";
      console.log("introEnd: UNDO_HIDING -> IDLE");
      introNode = undefined;
      outroNode = undefined;
    } else {
      console.warn("introEnd:", { state });
    }
  }

  return [outro as O, intro as I];
}
