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
  const [IDLE, OUTRO, INTRO_DELAYED, INTRO, ABORTED, UNDO] = [1, 2, 3, 4, 5, 6];
  const className = "svelte-outin";

  let state = IDLE;
  let delay = 0;
  function splitOptions<T extends Transition>(
    transition: T | [T, Parameters<T>[1]]
  ): [Transition, Parameters<T>[1]] {
    return Array.isArray(transition) ? transition : [transition, {}];
  }
  const [outFn, outParams] = settings.out
    ? splitOptions(settings.out)
    : splitOptions(settings.transition as Transition);
  const [inFn, inParams] = settings.in
    ? splitOptions(settings.in)
    : splitOptions(settings.transition as Transition);

  let outroNode: HTMLElement | undefined;
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

    delay = (config.duration ?? 0) + (config.delay ?? 0);
    if (state === IDLE) {
      state = OUTRO;
      outroNode.addEventListener("outroend", onOutroEnd);
    } else if (state === INTRO) {
      state = UNDO;
    } else if (state === INTRO_DELAYED) {
      state = ABORTED;
    }
    return config;
  }

  function onOutroEnd() {
    outroNode?.removeEventListener("outroend", onOutroEnd);
    if (state === INTRO_DELAYED) {
      state = INTRO;
    }
  }

  let introNode: HTMLElement | undefined;
  function intro(node: HTMLElement, options: any): TransitionConfig {
    introNode?.removeEventListener("introend", onIntroEnd);
    introNode = node;
    introNode.classList.remove(className);

    const config = inFn(node, {
      ...inParams,
      ...options,
    });
    if (state === OUTRO) {
      introNode.addEventListener("introend", onIntroEnd);
      if (delay === 0) {
        state = INTRO;
      } else {
        config.delay = delay + (config.delay ?? 0);
        state = INTRO_DELAYED;
      }
    } else if (state === ABORTED) {
      state = INTRO;
      introNode.addEventListener("introend", onIntroEnd);
    } else if (state === UNDO) {
      state = INTRO_DELAYED;
      config.delay = delay + (config.delay ?? 0);
      introNode.addEventListener("introend", onIntroEnd);
    }
    return config;
  }

  function onIntroEnd() {
    introNode?.removeEventListener("introend", onIntroEnd);
    if (state === INTRO_DELAYED) {
      outroNode?.removeEventListener("outroend", onOutroEnd);
    }
    state = IDLE;
    introNode = undefined;
    outroNode = undefined;
  }

  return [outro as O, intro as I];
}

export default outin;
