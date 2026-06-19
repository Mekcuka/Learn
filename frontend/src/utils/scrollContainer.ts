/** Scroll `element` only inside its nearest overflow parent — never the document. */
export function scrollIntoOverflowParent(element: HTMLElement): void {
  let parent = element.parentElement;
  while (parent) {
    const { overflowY } = getComputedStyle(parent);
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      parent.scrollHeight > parent.clientHeight
    ) {
      const parentRect = parent.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      if (elementRect.top < parentRect.top) {
        parent.scrollTop += elementRect.top - parentRect.top;
      } else if (elementRect.bottom > parentRect.bottom) {
        parent.scrollTop += elementRect.bottom - parentRect.bottom;
      }
      return;
    }
    parent = parent.parentElement;
  }
}
