# Svelte outin transition

## States

IDLE
IDLE -> OUTRO
OUTRO -> DELAYED_INTRO_HIDDEN
DELAYED_INTRO_HIDDEN -> DELAYED_INTRO_VISIBLE
DELAYED_INTRO_VISIBLE -> IDLE

(when outro is called on intro node)

DELAYED_INTRO_HIDDEN -> UNDO
DELAYED_INTRO_VISIBLE -> UNDO
UNDO -> IDLE

(when intro is called on outro node)
UNDO -> REDO
REDO -> IDLE

REDO -> UNDO

## Tests

(cubes, linear)

only duration
