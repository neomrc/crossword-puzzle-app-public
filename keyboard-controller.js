(() => {
  let timer = 0;
  let focusedInput = null;

  const isCellInput = element => element?.matches?.('.cell input');

  function setViewportVariables() {
    const viewport = window.visualViewport;
    const height = viewport?.height || window.innerHeight;
    const top = viewport?.offsetTop || 0;
    const left = viewport?.offsetLeft || 0;
    const width = viewport?.width || window.innerWidth;

    document.documentElement.style.setProperty('--visual-height', `${height}px`);
    document.documentElement.style.setProperty('--visual-top', `${top}px`);
    document.documentElement.style.setProperty('--visual-left', `${left}px`);
    document.documentElement.style.setProperty('--visual-width', `${width}px`);
  }

  function positionHint() {
    const clue = document.querySelector('.bottom-clue');
    if (!clue || !focusedInput) return;

    const viewport = window.visualViewport;
    const height = clue.getBoundingClientRect().height || 58;
    const top = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight) - height;

    clue.style.position = 'fixed';
    clue.style.top = `${Math.round(top)}px`;
    clue.style.bottom = 'auto';
    clue.style.left = `${Math.round(viewport?.offsetLeft || 0)}px`;
    clue.style.width = `${Math.round(viewport?.width || window.innerWidth)}px`;
  }

  function revealFocusedCell() {
    if (!focusedInput?.isConnected) return;

    const cell = focusedInput.closest('.cell');
    const scroller = document.querySelector('.board-wrap');
    if (!cell || !scroller) return;

    const cellRect = cell.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    const margin = 18;

    if (cellRect.bottom > scrollerRect.bottom - margin) {
      scroller.scrollTop += cellRect.bottom - scrollerRect.bottom + margin;
    } else if (cellRect.top < scrollerRect.top + margin) {
      scroller.scrollTop -= scrollerRect.top + margin - cellRect.top;
    }
  }

  function update() {
    setViewportVariables();
    positionHint();
    revealFocusedCell();
  }

  function pollKeyboard() {
    window.clearInterval(timer);
    let count = 0;
    update();
    timer = window.setInterval(() => {
      update();
      count += 1;
      if (count >= 20 || !focusedInput) window.clearInterval(timer);
    }, 40);
  }

  function activate(input) {
    focusedInput = input;
    document.body.classList.add('native-keyboard-open', 'native-input-active');
    pollKeyboard();
  }

  function deactivate() {
    window.setTimeout(() => {
      if (isCellInput(document.activeElement)) return;
      focusedInput = null;
      window.clearInterval(timer);
      document.body.classList.remove('native-keyboard-open', 'native-input-active');
      const clue = document.querySelector('.bottom-clue');
      clue?.style.removeProperty('top');
      clue?.style.removeProperty('left');
      clue?.style.removeProperty('width');
      clue?.style.removeProperty('bottom');
    }, 120);
  }

  document.addEventListener('pointerdown', event => {
    const input = event.target.closest?.('.cell:not(.block)')?.querySelector('input');
    if (input) activate(input);
  }, true);

  document.addEventListener('focusin', event => {
    if (isCellInput(event.target)) activate(event.target);
  }, true);

  document.addEventListener('focusout', event => {
    if (isCellInput(event.target)) deactivate();
  }, true);

  document.addEventListener('input', event => {
    if (!isCellInput(event.target)) return;
    focusedInput = document.activeElement?.matches?.('.cell input')
      ? document.activeElement
      : document.querySelector('.cell.active input');
    pollKeyboard();
  }, true);

  window.visualViewport?.addEventListener('resize', update);
  window.visualViewport?.addEventListener('scroll', update);
  window.addEventListener('resize', update);
})();
