(() => {
  const scene = document.querySelector('.letter-scroll-scene');
  const viewport = document.querySelector('.letter-viewport');
  const letter = document.querySelector('#field-notes');
  const envelope = document.querySelector('.fence-envelope');
  if (!scene || !viewport || !letter) return;
  let frame = 0;
  let openingFrame = 0;
  function cancelOpening() { cancelAnimationFrame(openingFrame); openingFrame = 0; }
  window.addEventListener("wheel", cancelOpening, { passive: true });
  window.addEventListener("touchstart", cancelOpening, { passive: true });
  function update() {
    frame = 0;
    const distance = Math.max(1, scene.offsetHeight - viewport.offsetHeight);
    const progress = Math.min(1, Math.max(0, -scene.getBoundingClientRect().top / distance));
    const reveal = 1 - progress;
    const paper = letter.querySelector('.note-paper');
    const scale = Math.min(.92, envelope.clientHeight * .82 / Math.max(letter.offsetHeight, paper.offsetHeight + 60), envelope.clientWidth * .88 / letter.offsetWidth);
    viewport.style.setProperty('--letter-scale', scale);
    viewport.style.setProperty('--letter-shift', `${progress * -.005 * viewport.offsetHeight}px`);
    viewport.style.setProperty('--envelope-shift', `${reveal * viewport.offsetHeight}px`);
    letter.style.visibility = reveal === 0 ? 'hidden' : 'visible';
    letter.inert = progress === 1;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  function startAtEnvelope() {
    const top = window.scrollY + scene.getBoundingClientRect().top + scene.offsetHeight - viewport.offsetHeight;
    window.scrollTo({ top, behavior: 'instant' });
    update();
  }
  // Start at the lower end of the scene so scrolling upward pulls out the letter.
  history.scrollRestoration = 'manual';
  if (document.readyState === 'complete') startAtEnvelope();
  else window.addEventListener('load', startAtEnvelope, { once: true });
  document.querySelector('.envelope-footer a').addEventListener('click', event => {
    event.preventDefault();
    const top = window.scrollY + scene.getBoundingClientRect().top;
    cancelOpening();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top, behavior: 'instant' });
      return;
    }
    const start = window.scrollY;
    const startedAt = performance.now();
    function animate(now) {
      const t = Math.min(1, (now - startedAt) / 1200);
      const eased = t * t * (3 - 2 * t);
      window.scrollTo({ top: start + (top - start) * eased, behavior: 'instant' });
      update();
      if (t < 1) openingFrame = requestAnimationFrame(animate);
      else openingFrame = 0;
    }
    openingFrame = requestAnimationFrame(animate);
  });
  startAtEnvelope();
})();
