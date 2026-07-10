const AUTO_CHECK_KEY = 'crossword-auto-check-enabled';
let celebrationShownFor = null;

function isGameVisible() {
  return Boolean(document.querySelector('.grid'));
}

function allPlayableCellsFilled() {
  const inputs = [...document.querySelectorAll('.cell:not(.block) input')];
  return inputs.length > 0 && inputs.every(input => input.value.trim().length === 1);
}

function addAutoCheckToggle() {
  const toolbar = document.querySelector('.toolbar .tool-group');
  if (!toolbar || document.querySelector('#autoCheckToggle')) return;

  const enabled = localStorage.getItem(AUTO_CHECK_KEY) === 'true';
  const label = document.createElement('label');
  label.className = 'native-auto-check';
  label.innerHTML = `
    <input id="autoCheckToggle" type="checkbox" ${enabled ? 'checked' : ''} />
    <span class="native-switch" aria-hidden="true"><span></span></span>
    <strong>Auto-check</strong>
  `;

  label.querySelector('input').addEventListener('change', event => {
    localStorage.setItem(AUTO_CHECK_KEY, String(event.target.checked));
    if (event.target.checked) document.querySelector('#check')?.click();
    else document.querySelectorAll('.cell.wrong').forEach(cell => cell.classList.remove('wrong'));
  });

  toolbar.appendChild(label);
}

function showCelebration() {
  if (document.querySelector('.native-celebration')) return;
  const puzzleTitle = document.querySelector('.game-title h1')?.textContent || 'Crossword';
  const puzzleMeta = document.querySelector('.game-title p')?.textContent || '';
  const signature = `${puzzleTitle}|${puzzleMeta}`;
  if (celebrationShownFor === signature) return;
  celebrationShownFor = signature;

  const overlay = document.createElement('div');
  overlay.className = 'native-celebration';
  overlay.innerHTML = `
    <section class="native-celebration-card" role="dialog" aria-modal="true" aria-labelledby="nativeHoorayTitle">
      <div class="native-celebration-icon" aria-hidden="true">✦</div>
      <div class="eyebrow">Puzzle complete</div>
      <h2 id="nativeHoorayTitle">Hooray!</h2>
      <p>You solved this crossword. Your progress has been saved.</p>
      <button class="native-primary" type="button">Back to puzzles</button>
      <button class="native-secondary" type="button">View completed grid</button>
    </section>
  `;

  overlay.querySelector('.native-primary').addEventListener('click', () => {
    overlay.remove();
    document.querySelector('#back')?.click();
  });
  overlay.querySelector('.native-secondary').addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

function detectCompletion() {
  if (document.querySelector('.completion')) showCelebration();
}

function positionClueBar() {
  const clue = document.querySelector('.bottom-clue');
  if (!clue) return;

  const viewport = window.visualViewport;
  if (!viewport || !document.body.classList.contains('native-keyboard-open')) {
    clue.style.removeProperty('top');
    clue.style.removeProperty('left');
    clue.style.removeProperty('width');
    clue.style.removeProperty('bottom');
    return;
  }

  const height = clue.getBoundingClientRect().height || 56;
  const top = viewport.offsetTop + viewport.height - height;

  clue.style.position = 'fixed';
  clue.style.top = `${Math.round(top)}px`;
  clue.style.bottom = 'auto';
  clue.style.left = `${Math.round(viewport.offsetLeft)}px`;
  clue.style.width = `${Math.round(viewport.width)}px`;
}

function keepActiveCellVisible() {
  const input = document.activeElement?.matches?.('.cell input')
    ? document.activeElement
    : document.querySelector('.cell.active input');
  const cell = input?.closest('.cell');
  const scroller = document.querySelector('.board-wrap');
  if (!cell || !scroller || !document.body.classList.contains('native-keyboard-open')) return;

  const scrollerRect = scroller.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();
  const padding = 14;
  const visibleTop = scrollerRect.top + padding;
  const visibleBottom = scrollerRect.bottom - padding;

  let delta = 0;
  if (cellRect.bottom > visibleBottom) delta = cellRect.bottom - visibleBottom;
  else if (cellRect.top < visibleTop) delta = cellRect.top - visibleTop;

  if (Math.abs(delta) > 1) scroller.scrollBy({ top: delta, left: 0, behavior: 'auto' });
}

function settleKeyboardLayout() {
  positionClueBar();
  keepActiveCellVisible();
}

function stabilizeViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;

  const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
  document.documentElement.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
  document.documentElement.style.setProperty('--visual-height', `${viewport.height}px`);
  document.documentElement.style.setProperty('--visual-top', `${viewport.offsetTop}px`);
  document.body.classList.toggle('native-keyboard-open', keyboardInset > 120);

  requestAnimationFrame(settleKeyboardLayout);
}

function scheduleVisibilityCorrection() {
  [0, 70, 180, 320, 500].forEach(delay => window.setTimeout(() => {
    stabilizeViewport();
    keepActiveCellVisible();
  }, delay));
}

function enhanceCurrentScreen() {
  if (!isGameVisible()) return;
  addAutoCheckToggle();
  detectCompletion();
  stabilizeViewport();
}

document.addEventListener('pointerdown', event => {
  if (!event.target.closest?.('.cell:not(.block)')) return;
  scheduleVisibilityCorrection();
}, true);

document.addEventListener('focusin', event => {
  if (!event.target.matches?.('.cell input')) return;
  const input = event.target;
  requestAnimationFrame(() => {
    try {
      if (input.value) input.setSelectionRange(0, input.value.length);
      else input.setSelectionRange(0, 0);
    } catch {}
    scheduleVisibilityCorrection();
  });
}, true);

document.addEventListener('focusout', event => {
  if (!event.target.matches?.('.cell input')) return;
  window.setTimeout(stabilizeViewport, 100);
}, true);

document.addEventListener('input', event => {
  if (!event.target.matches?.('.cell input')) return;

  if (localStorage.getItem(AUTO_CHECK_KEY) === 'true') {
    requestAnimationFrame(() => document.querySelector('#check')?.click());
  }

  scheduleVisibilityCorrection();

  if (allPlayableCellsFilled()) {
    window.setTimeout(() => document.querySelector('#done')?.click(), 30);
  }
}, true);

const observer = new MutationObserver(() => enhanceCurrentScreen());
observer.observe(document.documentElement, { childList: true, subtree: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', stabilizeViewport);
  window.visualViewport.addEventListener('scroll', stabilizeViewport);
}

window.addEventListener('pageshow', enhanceCurrentScreen);
window.addEventListener('resize', stabilizeViewport);
window.addEventListener('orientationchange', () => window.setTimeout(stabilizeViewport, 150));
stabilizeViewport();
enhanceCurrentScreen();
