import { append_styles } from "svelte/internal";
import type { TransitionConfig } from "svelte/transition";

type Transition = (node: Element, options?: any) => TransitionConfig;
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
  const states = [1, 2, 3, 4, 5, 6, 7] as const;
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

  function outro(node: Element, options: any): TransitionConfig {
    const config = outFn(node, { ...outParams, ...options });
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
    } else {
      return config;
    }
    if (idle) {
      starting.push(active);
    }
    if (active.state === INIT) {
      if (idle) {
        active.state = OUTRO;
        node.addEventListener("outroend", onOutroEnd);
      }
    } else if (active.state === INTRO) {
      active.state = UNDO;
    } else if (active.state === INTRO_DELAYED) {
      active.state = ABORTED;
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
    }
  }

  function intro(node: Element, options: any): TransitionConfig {
    node.classList.remove(className);
    const config = inFn(node, {
      ...inParams,
      ...options,
    });

    let [active] = findActive(node);
    if (idle) {
      const startIndex = starting.findIndex((start) => start.in === undefined);
      let last = true;
      if (startIndex !== -1) {
        active = starting[startIndex];
        active.in = node;
        last = startIndex === starting.length - 1;
      }
      if (last) {
        idle = true;
        starting.length = 0;
      }
    }
    if (!active) {
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
          node.addEventListener("introend", onIntroEnd);
        }
      } else {
        config.delay = active.delay + (config.delay ?? 0);
        if (first) {
          active.state = INTRO_DELAYED;
          node.addEventListener("introend", onIntroEnd);
        }
      }
    } else if (active.state === INTRO_DELAYED) {
      config.delay = active.delay + (config.delay ?? 0);
    } else if (active.state === ABORTED) {
      if (first) {
        active.state = INTRO;
        node.addEventListener("introend", onIntroEnd);
      }
    } else if (active.state === UNDO) {
      if (first) {
        active.state = INTRO_DELAYED;
        config.delay = active.delay + (config.delay ?? 0);
        node.addEventListener("introend", onIntroEnd);
      }
    }
    return config;
  }

  function onIntroEnd(e: any) {
    e.target.removeEventListener("introend", onIntroEnd);
    const [ref, id] = findActive(e.target);
    if (!ref) {
      return;
    }
    if (ref.state === INTRO) {
      ref.state = COMPLETED;
      delete concurrent[id];
    } else if (ref.state === INTRO_DELAYED) {
      ref.state = COMPLETED;
      ref.out.removeEventListener("outroend", onOutroEnd);
      delete concurrent[id];
    }
  }

  return [outro as O, intro as I];
}

export default outin;
