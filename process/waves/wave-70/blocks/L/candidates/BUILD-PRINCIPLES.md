14. Render a fixed or full-screen overlay through a portal to document.body so a transformed ancestor cannot move it.
   Why: A transformed ancestor is the containing block for position:fixed, hiding it off-screen.
