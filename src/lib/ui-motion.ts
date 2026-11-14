/** Exit timing comes from CSS tokens; reduced motion never waits for animation. */
export async function finishExit(element: HTMLElement | null, action: () => void) {
  if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { action(); return; }
  element.dataset.exiting = "true";
  element.inert = true;
  const animations = element.getAnimations();
  await Promise.allSettled(animations.map((animation) => animation.finished));
  action();
}
