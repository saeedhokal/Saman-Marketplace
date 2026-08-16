// Shared scroll-position memory for list pages that restore their scroll
// when the user returns from a detail page (e.g. product detail -> back).
//
// Tab switches via the bottom nav / desktop menu must always start at the
// top, so nav components call resetScrollMemoryForNavigation() on tap,
// which clears every saved position and scrolls the shared container up.

const store = new Map<string, number>();

export function getSavedScroll(key: string): number {
  return store.get(key) ?? 0;
}

export function setSavedScroll(key: string, value: number): void {
  store.set(key, value);
}

export function clearAllSavedScroll(): void {
  store.clear();
}

export function scrollMainContainerToTop(): void {
  const el = document.getElementById("main-scroll-container");
  if (el) {
    el.scrollTop = 0;
  } else {
    window.scrollTo(0, 0);
  }
}

/** Call when navigation originates from a nav tab tap. */
export function resetScrollMemoryForNavigation(): void {
  clearAllSavedScroll();
  scrollMainContainerToTop();
}
