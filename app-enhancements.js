const AUTO_CHECK_KEY = 'crossword-auto-check-enabled';
let celebrationShownFor = null;
let repositionTimer = 0;

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

function updateKeyboardLayout() {
  const viewport = window.visualViewport;
  const height = viewport?.height || window.innerHeight;
  const top = viewport?.offsetTop || 0;
  const width = viewport?.width || window.innerWidth;
  const left = viewport?.offsetLeft || 0;

  document.documentElement.style.setProperty('--visual-height', `${height}px`);
  document.documentElement.style.setProperty('--visual-top', `${top}px`);

  const clue = document.querySelector('.bottom-clue');
  if (!clue || !document.body.classList.contains('native-keyboard-open')) return;

  const clueHeight = clue.getBoundingClientRect().height || 58;
  clue.style.position = 'fixed';
  clue.style.top = `${Math.round(top + height - clueHeight)}px`;
  clue.style.bottom = 'auto';
  clue.style.left = `${Math.round(left)}px`;
  clue.style.width = `${Math.round(width)}px`;
}

function repositionActiveCell() {
  if (!document.body.classList.contains('native-keyboard-open')) return;

  const input = document.activeElement?.matches?.('.cell input')
    ? document.activeElement
    : document.querySelector('.cell.active input');
  const cell = input?.closest('.cell');
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

function scheduleStableReposition(delay = 260) {
  window.clearTimeout(repositionTimer);
  repositionTimer = window.setTimeout(() => {
    updateKeyboardLayout();
    repositionActiveCell();
  }, delay);
}

function activateKeyboardMode() {
  document.body.classList.add('native-keyboard-open');
  updateKeyboardLayout();
  scheduleStableReposition(300);
}

function deactivateKeyboardMode() {
  window.setTimeout(() => {
    if (document.activeElement?.matches?.('.cell input')) return;
    document.body.classList.remove('native-keyboard-open');
    window.clearTimeout(repositionTimer);
    const clue = document.querySelector('.bottom-clue');
    clue?.style.removeProperty('top');
    clue?.style.removeProperty('left');
    clue?.style.removeProperty('width');
    clue?.style.removeProperty('bottom');
  }, 120);
}

function enhanceCurrentScreen() {
  if (!isGameVisible()) return;
  addAutoCheckToggle();
  detectCompletion();
}

document.addEventListener('focusin', event => {
  if (!event.target.matches?.('.cell input')) return;
  activateKeyboardMode();
}, true);

document.addEventListener('focusout', event => {
  if (!event.target.matches?.('.cell input')) return;
  deactivateKeyboardMode();
}, true);

document.addEventListener('input', event => {
  if (!event.target.matches?.('.cell input')) return;

  if (localStorage.getItem(AUTO_CHECK_KEY) === 'true') {
    requestAnimationFrame(() => document.querySelector('#check')?.click());
  }

  scheduleStableReposition(120);

  if (allPlayableCellsFilled()) {
    window.setTimeout(() => document.querySelector('#done')?.click(), 30);
  }
}, true);

const observer = new MutationObserver(() => enhanceCurrentScreen());
observer.observe(document.documentElement, { childList: true, subtree: true });

window.visualViewport?.addEventListener('resize', updateKeyboardLayout);
window.visualViewport?.addEventListener('scroll', updateKeyboardLayout);
window.addEventListener('pageshow', enhanceCurrentScreen);
window.addEventListener('resize', updateKeyboardLayout);
window.addEventListener('orientationchange', () => window.setTimeout(updateKeyboardLayout, 150));
enhanceCurrentScreen();
