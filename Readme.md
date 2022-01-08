# Svelte outin transition

## States

READY
OUTRO
INTRO_DELAYED
INTRO
ABORTED (intro was not visible)
UNDO (intro was visible)

## State mutatioms

| Transition               | Reason                                          |
| ------------------------ | ----------------------------------------------- |
| READY -> OUTRO           | the transition started                          |
| OUTRO -> DELAYED_INTRO   | the intro started (with delay)                  |
| OUTRO -> INTRO           | the intro started (no outro duration, no delay) |
| DELAYED_INTRO -> INTRO   | the outro completed                             |
| DELAYED_INTRO -> ABORTED | a new outro started during outro                |
| INTRO -> READY           | the transition ended                            |
| INTRO -> UNDO            | a new outro started during intro                |
| ABORTED -> INTRO         |
| UNDO -> INTRO_DELAYED    |
