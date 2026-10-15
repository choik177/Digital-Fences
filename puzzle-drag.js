(() => {
  const drawer = document.querySelector('.pattern-drawer');
  const toggle = document.querySelector('.pattern-drawer-toggle');
  const content = document.querySelector('#pattern-drawer-content');
  const collection = document.querySelector('.pattern-collection');
  if (!drawer || !toggle || !collection) return;
  const setOpen = open => {
    drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('folder-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close sticker folder' : 'Open sticker folder');
    toggle.querySelector('.folder-arrow').textContent = open ? '↓' : '↑';
    content.inert = !open;
  };
  let swipe = null, ignoreClick = false;
  toggle.addEventListener('pointerdown', e => {
    swipe = {id:e.pointerId, y:e.clientY};
    toggle.setPointerCapture(e.pointerId);
  });
  toggle.addEventListener('pointerup', e => {
    if (!swipe || swipe.id !== e.pointerId) return;
    const distance = e.clientY - swipe.y;
    ignoreClick = Math.abs(distance) > 20;
    if (ignoreClick) setOpen(distance < 0);
    swipe = null;
  });
  toggle.addEventListener('pointercancel', () => { swipe = null; });
  toggle.addEventListener('click', () => {
    if (ignoreClick) { ignoreClick = false; return; }
    setOpen(!drawer.classList.contains('is-open'));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  // Reusable pattern sheets: leave originals in the folder when a copy is placed.
  const originals = [...collection.children];
  for (let sheet = 1; sheet < 3; sheet++) {
    originals.forEach(slot => {
      const copy = slot.cloneNode(true);
      copy.querySelector('img').style.rotate = `${sheet === 1 ? -8 : 8}deg`;
      collection.append(copy);
    });
  }
  let drag = null;
  const position = (piece, x, y) => {
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
  };
  const keyboardMove = (piece, e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); piece.remove(); return; }
    const steps = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]};
    if (!steps[e.key]) return;
    e.preventDefault();
    const step = e.shiftKey ? 20 : 5;
    position(piece, parseFloat(piece.style.left) + steps[e.key][0] * step, parseFloat(piece.style.top) + steps[e.key][1] * step);
  };
  const makeSticker = source => {
    const box = source.getBoundingClientRect();
    const piece = source.cloneNode(false);
    piece.className = 'placed-ornament';
    piece.removeAttribute('style');
    piece.style.width = `${box.width}px`;
    piece.style.height = `${box.height}px`;
    document.body.append(piece);
    position(piece, box.left + scrollX, box.top + scrollY);
    piece.addEventListener('keydown', e => keyboardMove(piece, e));
    piece.addEventListener('pointerdown', e => startDrag(piece, e));
    return piece;
  };
  function startDrag(piece, e, fresh = false) {
    if (e.button !== 0 || drag) return;
    e.preventDefault();
    const rect = piece.getBoundingClientRect();
    drag = {piece, id:e.pointerId, dx:e.clientX - rect.left, dy:e.clientY - rect.top, fresh};
    piece.classList.add('is-dragging');
    piece.focus({preventScroll:true});
    piece.setPointerCapture(e.pointerId);
  }
  collection.querySelectorAll('.pattern-piece').forEach(source => {
    source.addEventListener('pointerdown', e => {
      if (e.button !== 0 || drag) return;
      const piece = makeSticker(source);
      startDrag(piece, e, true);
    });
    source.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const piece = makeSticker(source);
      const target = document.querySelector('.arched-window').getBoundingClientRect();
      position(piece, target.left + scrollX + (target.width - parseFloat(piece.style.width)) / 2, target.top + scrollY + (target.height - parseFloat(piece.style.height)) / 2);
      piece.focus({preventScroll:true});
    });
  });
  document.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    position(drag.piece, e.clientX + scrollX - drag.dx, e.clientY + scrollY - drag.dy);
  });
  const finish = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const {piece, fresh} = drag;
    drag = null;
    piece.classList.remove('is-dragging');
    if (piece.hasPointerCapture(e.pointerId)) piece.releasePointerCapture(e.pointerId);
    const bounds = piece.getBoundingClientRect();
    const windows = [...document.querySelectorAll('.arched-window')];
    const overlapsWindow = windows.some(window => {
      const r = window.getBoundingClientRect();
      return bounds.right > r.left && bounds.left < r.right && bounds.bottom > r.top && bounds.top < r.bottom;
    });
    if (e.type === 'pointercancel' || (fresh && !overlapsWindow)) piece.remove();
  };
  document.addEventListener('pointerup', finish);
  document.addEventListener('pointercancel', finish);
  document.querySelector('.decoration-reset')?.addEventListener('click', () => {
    drag = null;
    document.querySelectorAll('.placed-ornament').forEach(piece => piece.remove());
  });
})();
