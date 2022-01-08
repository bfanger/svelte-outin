# Svelte outin transition

## States

IDLE
OUTRO
INTRO_DELAYED
INTRO
ABORTED (intro was not visible)
UNDO (intro was visible)

## State mutatioms

IDLE -> OUTRO
OUTRO -> DELAYED_INTRO
OUTRO -> INTRO (outro duration was 0)
DELAYED_INTRO -> INTRO
DELAYED_INTRO -> ABORTED
INTRO -> IDLE
INTRO -> UNDO

ABORTED -> INTRO
UNDO -> INTRO_DELAYED
