(() => {
  const STORAGE_KEY = 'crossword-install-seed-v1';
  let installSeed = Number(localStorage.getItem(STORAGE_KEY));

  if (!Number.isFinite(installSeed) || installSeed <= 0) {
    const values = new Uint32Array(2);
    crypto.getRandomValues(values);
    installSeed = (values[0] ^ values[1]) >>> 0;
    if (!installSeed) installSeed = Date.now() >>> 0;
    localStorage.setItem(STORAGE_KEY, String(installSeed));
  }

  const originalSin = Math.sin.bind(Math);
  const offset = (installSeed % 1000003) / 9973;

  // The crossword generator derives all of its pseudo-random ordering from Math.sin.
  // Applying a stable per-install offset gives every installation a distinct puzzle set
  // while keeping that installation deterministic across reloads and offline sessions.
  Math.sin = value => originalSin(Number(value) + offset);

  window.__crosswordInstallSeed = installSeed;
})();
