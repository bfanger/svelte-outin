/* eslint-disable no-console */
import { append_styles } from "svelte/internal";
import type { TransitionConfig } from "svelte/transition";

type Transition = (node: HTMLElement, options?: any) => TransitionConfig;
function outin<T extends Transition>(settings: {
  transition: T | [T, Parameters<T>[1]];
}): [T, T];
function outin<O extends Transition, I extends Transition>(settings: {
  out: O | [O, Parameters<O>[1]];
  in: I | [I, Parameters<I>[1]];
}): [O, I];
function outin<O extends Transition, I extends Transition>(settings: {
  transition?: I | [I, Parameters<I>[1]];
  out?: O | [O, Parameters<O>[1]];
  in?: I | [I, Parameters<I>[1]];
}): [O, I] {
  let outroNode: HTMLElement | undefined;
  let introNode: HTMLElement | undefined;
  let outroDuration = 0;
  const [IDLE, OUTRO, INTRO_DELAYED, INTRO, ABORTED, UNDO] = [1, 2, 3, 4, 5, 6];
  let state = IDLE;
  const className = "svelte-outin";
  let outFn: Transition;
  let outParams: any;
  let inFn: Transition;
  let inParams: any;
  if (settings.transition) {
    [outFn, outParams] = Array.isArray(settings.transition)
      ? settings.transition
      : [settings.transition, {}];
    inFn = outFn;
    inParams = outParams;
  } else {
    [outFn, outParams] = Array.isArray(settings.out)
      ? settings.out
      : [settings.out as Transition, {}];
    [inFn, inParams] = Array.isArray(settings.in)
      ? settings.in
      : [settings.in as Transition, {}];
  }

  function outro(node: HTMLElement, options: any): TransitionConfig {
    const config = outFn(node, { ...outParams, ...options });

    outroNode?.removeEventListener("outroend", onOutroEnd);
    outroNode?.classList.remove(className);
    outroNode = node;
    const { position } = window.getComputedStyle(outroNode);
    if (["fixed", "absolute"].indexOf(position) === -1) {
      append_styles(
        node,
        "outin",
        `.svelte-outin { position: absolute !important; }`
      );
      outroNode.classList.add(className);
    }

    outroDuration = (config.duration ?? 0) + (config.delay ?? 0);
    if (state === IDLE) {
      state = OUTRO;
      console.log("outro: IDLE -> OUTRO");
      outroNode.addEventListener("outroend", onOutroEnd);
    } else if (state === INTRO) {
      state = UNDO;
      console.log(`outro: INTRO -> UNDO`);
    } else if (state === INTRO_DELAYED) {
      state = ABORTED;
      console.log(`outro: INTRO_DELAYED -> ABORTED`);
    } else {
      console.warn(OUTRO, { state });
    }
    return config;
  }

  function onOutroEnd() {
    outroNode?.removeEventListener("outroend", onOutroEnd);
    if (state === INTRO_DELAYED) {
      state = INTRO;
      console.log("outroEnd: INTRO_DELAYED -> INTRO");
    } else {
      console.warn("outroEnd", { state });
    }
  }

  function intro(node: HTMLElement, options: any): TransitionConfig {
    introNode?.removeEventListener("introend", onIntroEnd);
    introNode = node;
    introNode.classList.remove(className);

    const config = inFn(node, {
      ...inParams,
      ...options,
    });
    if (state === OUTRO) {
      if (outroDuration === 0) {
        state = INTRO;
        console.log("intro: OUTRO -> INTRO_DELAYED");
        introNode.addEventListener("introend", onIntroEnd);
      } else {
        config.delay = outroDuration + (config.delay ?? 0);
        state = INTRO_DELAYED;
        console.log("intro: OUTRO -> INTRO_DELAYED");
        introNode.addEventListener("introend", onIntroEnd);
      }
    } else if (state === ABORTED) {
      state = INTRO;
      console.log("intro: ABORTED -> INTRO");
      introNode.addEventListener("introend", onIntroEnd);
    } else if (state === UNDO) {
      state = INTRO_DELAYED;
      console.log("intro: UNDO -> INTRO_DELAYED");
      config.delay = outroDuration + (config.delay ?? 0);
      introNode.addEventListener("introend", onIntroEnd);
    } else {
      console.warn(intro, { state });
    }
    return config;
  }

  function onIntroEnd() {
    introNode?.removeEventListener("introend", onIntroEnd);
    if (state === INTRO) {
      state = IDLE;
      console.log("introEnd: INTRO -> IDLE");
      introNode = undefined;
      outroNode = undefined;
    } else if (state === INTRO_DELAYED) {
      state = IDLE;
      console.log("introEnd: INTRO_DELAYED -> IDLE");
      outroNode?.removeEventListener("outroend", onOutroEnd);
      introNode = undefined;
      outroNode = undefined;
    } else {
      console.warn("introEnd:", { state });
    }
  }

  return [outro as O, intro as I];
}

export default outin;
