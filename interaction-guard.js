(() => {
  const isCrosswordTarget = target => Boolean(target?.closest?.('.cell'));

  document.addEventListener('dblclick', event => {
    if (!isCrosswordTarget(event.target)) return;
    event.preventDefault();
    window.getSelection()?.removeAllRanges();
  }, { capture: true, passive: false });

  document.addEventListener('selectstart', event => {
    if (!isCrosswordTarget(event.target)) return;
    event.preventDefault();
  }, { capture: true, passive: false });

  document.addEventListener('contextmenu', event => {
    if (!isCrosswordTarget(event.target)) return;
    event.preventDefault();
  }, { capture: true, passive: false });

  document.addEventListener('copy', event => {
    if (!isCrosswordTarget(event.target) && !document.activeElement?.closest?.('.cell')) return;
    event.preventDefault();
  }, { capture: true, passive: false });

  document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const anchor = selection.anchorNode?.parentElement || selection.anchorNode;
    if (anchor?.closest?.('.cell')) selection.removeAllRanges();
  });
})();
