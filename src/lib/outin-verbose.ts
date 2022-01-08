/* eslint-disable no-console */
import { append_styles } from "svelte/internal";
import type { TransitionConfig } from "svelte/transition";

type Transition = (node: Element, options?: any) => TransitionConfig;
function outin<T extends Transition>(settings: { transition: T }): [T, T];
function outin<O extends Transition, I extends Transition>(settings: {
  out: O;
  in: I;
}): [O, I];
function outin<O extends Transition, I extends Transition>(settings: {
  transition?: I | [I, Parameters<I>[1]];
  out?: O;
  in?: I;
}): [O, I] {
  const states = [
    "INIT",
    "OUTRO",
    "INTRO_DELAYED",
    "INTRO",
    "COMPLETED",
    "ABORTED",
    "UNDO",
  ] as const;
  const [INIT, OUTRO, INTRO_DELAYED, INTRO, COMPLETED, ABORTED, UNDO] = states;
  const className = "svelte-outin";

  type OutInActive = {
    state: typeof states[number];
    delay: number;
    out: Element;
    in?: Element;
  };
  const concurrent: Record<number | string, OutInActive> = {};
  function findActive(
    node: Element
  ): [OutInActive | undefined, string | number] {
    const found = Object.entries(concurrent).find(
      ([, entry]) => entry.out === node || entry.in === node
    );
    if (found) {
      return [found[1], found[0]];
    }
    return [undefined, -1];
  }
  let idle = true;
  const starting: OutInActive[] = [];
  let autoincrement = 0;

  const outFn = settings.out || (settings.transition as Transition);
  const inFn = settings.in || (settings.transition as Transition);

  function outro(node: Element, options: any): TransitionConfig {
    const config = outFn(node, options);
    const { position } = window.getComputedStyle(node);
    if (["fixed", "absolute"].indexOf(position) === -1) {
      append_styles(
        node,
        "outin",
        `.svelte-outin { position: absolute !important; }`
      );
      node.classList.add(className);
    }
    let [active] = findActive(node);
    if (active) {
      if (idle) {
        active.out = node;
        active.in = undefined;
      }
    } else if (idle) {
      active = {
        delay: (config.duration ?? 0) + (config.delay ?? 0),
        out: node,
        in: undefined,
        state: INIT,
      };
      autoincrement += 1;
      concurrent[autoincrement] = active;
      console.log(`outro: -> INIT (${autoincrement})`);
    } else {
      console.warn("hmm", { idle, active });
      return config;
      // active = concurrent[autoincrement];
    }
    const first = idle;
    if (idle) {
      starting.push(active);
    }

    if (active.state === INIT) {
      if (first) {
        active.state = OUTRO;
        console.log("outro: INIT -> OUTRO");
        node.addEventListener("outroend", onOutroEnd);
      }
    } else if (active.state === INTRO) {
      active.state = UNDO;
      console.log(`outro: INTRO -> UNDO`);
    } else if (active.state === INTRO_DELAYED) {
      active.state = ABORTED;
      console.log(`outro: INTRO_DELAYED -> ABORTED`);
    } else if (
      active.state === OUTRO ||
      active.state === ABORTED ||
      active.state === UNDO
    ) {
      if (first) {
        console.warn("outro", active.state);
      }
      // second
    } else {
      console.warn("outro", active.state);
    }
    return config;
  }

  function onOutroEnd(e: any) {
    const node = e.target;
    node.removeEventListener("outroend", onOutroEnd);

    const [active] = findActive(node);
    if (!active) {
      return;
    }
    if (active.state === INTRO_DELAYED) {
      active.state = INTRO;
      console.log("outroEnd: INTRO_DELAYED -> INTRO");
    } else {
      console.warn("outroEnd", active.state);
    }
  }

  function intro(node: Element, options: any): TransitionConfig {
    node.classList.remove(className);
    const config = inFn(node, options);
    let [active] = findActive(node);
    if (idle) {
      if (active) {
        console.warn("?", active);
      }
      const startIndex = starting.findIndex((start) => start.in === undefined);
      let last = true;
      if (startIndex !== -1) {
        active = starting[startIndex];
        active.in = node;
        last = startIndex === starting.length - 1;
      } else {
        console.warn("idle?");
      }
      if (last) {
        idle = true;
        starting.length = 0;
      }
    }
    if (!active) {
      // missing connected outro
      idle = false;
      starting.length = 0;
      return config;
    }

    if (!active.in) {
      active.in = node;
    }
    const first = active.in === node;
    if (active.state === OUTRO) {
      if (active.delay === 0) {
        if (first) {
          active.state = INTRO;
          console.log("intro: OUTRO -> INTRO_DELAYED");
          node.addEventListener("introend", onIntroEnd);
        }
      } else {
        config.delay = active.delay + (config.delay ?? 0);
        if (first) {
          active.state = INTRO_DELAYED;
          console.log("intro: OUTRO -> INTRO_DELAYED");
          node.addEventListener("introend", onIntroEnd);
        }
      }
    } else if (active.state === INTRO_DELAYED) {
      config.delay = active.delay + (config.delay ?? 0);
    } else if (active.state === ABORTED) {
      if (first) {
        active.state = INTRO;
        console.log("intro: ABORTED -> INTRO");
        node.addEventListener("introend", onIntroEnd);
      }
    } else if (active.state === UNDO) {
      if (first) {
        active.state = INTRO_DELAYED;
        console.log("intro: UNDO -> INTRO_DELAYED");
        config.delay = active.delay + (config.delay ?? 0);
        node.addEventListener("introend", onIntroEnd);
      }
    } else if (active.state === INTRO) {
      // second
      if (first) {
        console.warn("intro", active.state);
      }
    } else {
      console.warn("intro", active.state);
    }
    return config;
  }

  function onIntroEnd(e: any) {
    const node = e.target;
    node.removeEventListener("introend", onIntroEnd);

    const [ref, id] = findActive(node);
    if (!ref) {
      return;
    }
    if (ref.state === INTRO) {
      ref.state = COMPLETED;
      console.log("introEnd: INTRO -> COMPLETED");
      delete concurrent[id];
    } else if (ref.state === INTRO_DELAYED) {
      ref.state = COMPLETED;
      console.log("introEnd: INTRO_DELAYED -> COMPLETED");
      ref.out.removeEventListener("outroend", onOutroEnd);
      delete concurrent[id];
    } else {
      console.warn("introEnd:", ref.state);
    }
  }

  return [outro as O, intro as I];
}

export default outin;
