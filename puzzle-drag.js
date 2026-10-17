(() => {
  const drawer = document.querySelector('.pattern-drawer');
  const toggle = document.querySelector('.pattern-drawer-toggle');
  const content = document.querySelector('#pattern-drawer-content');
  const collection = document.querySelector('.pattern-collection');
  if (!drawer || !toggle || !collection) return;
  let autoOpenAfter = 0;
  let scrollIntent = 0;
  const setOpen = open => {
    if (!open) autoOpenAfter = Date.now() + 700;
    scrollIntent = 0;
    drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('folder-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close sticker folder' : 'Open sticker folder');
    toggle.querySelector('.folder-arrow').textContent = open ? '↓' : '↑';
    content.inert = !open;
  };
  // Let native page scrolling drive the folder without cancelling wheel/touch input.
  let scrollFrame = 0;
  const updateFromScroll = () => {
    scrollFrame = 0;
    const open = window.scrollY > 64;
    if (drawer.classList.contains('is-open') !== open) setOpen(open);
  };
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFromScroll);
  }, {passive:true});
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
  const attachToWindow = (piece, window) => {
    const bounds = piece.getBoundingClientRect();
    const frame = window.getBoundingClientRect();
    // Keep the exact dragged size and position; only change coordinate systems.
    const width = bounds.width;
    const height = bounds.height;
    const left = bounds.left - frame.left;
    const top = bounds.top - frame.top;
    window.append(piece);
    piece.style.left = `${left / frame.width * 100}%`;
    piece.style.top = `${top / frame.height * 100}%`;
    piece.style.width = `${width / frame.width * 100}%`;
    piece.style.height = `${height / frame.height * 100}%`;
  };
  const keyboardMove = (piece, e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); piece.remove(); return; }
    const steps = {ArrowLeft:[-1,0], ArrowRight:[1,0], ArrowUp:[0,-1], ArrowDown:[0,1]};
    if (!steps[e.key]) return;
    e.preventDefault();
    const step = e.shiftKey ? 20 : 5;
    if (piece.parentElement.classList.contains('arched-window')) {
      const frame = piece.parentElement.getBoundingClientRect();
      piece.style.left = `${parseFloat(piece.style.left) + steps[e.key][0] * step / frame.width * 100}%`;
      piece.style.top = `${parseFloat(piece.style.top) + steps[e.key][1] * step / frame.height * 100}%`;
    } else {
      position(piece, parseFloat(piece.style.left) + steps[e.key][0] * step, parseFloat(piece.style.top) + steps[e.key][1] * step);
    }
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
    const previous = {parent:piece.parentElement, style:piece.getAttribute('style')};
    document.body.append(piece);
    piece.style.width = `${rect.width}px`;
    piece.style.height = `${rect.height}px`;
    position(piece, rect.left + scrollX, rect.top + scrollY);
    drag = {piece, id:e.pointerId, dx:e.clientX - rect.left, dy:e.clientY - rect.top, fresh, previous};
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
      attachToWindow(piece, document.querySelector('.arched-window'));
      piece.focus({preventScroll:true});
    });
  });
  document.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    position(drag.piece, e.clientX + scrollX - drag.dx, e.clientY + scrollY - drag.dy);
  });
  const finish = e => {
    if (!drag || drag.id !== e.pointerId) return;
    const {piece, fresh, previous} = drag;
    drag = null;
    piece.classList.remove('is-dragging');
    if (piece.hasPointerCapture(e.pointerId)) piece.releasePointerCapture(e.pointerId);
    const bounds = piece.getBoundingClientRect();
    const windows = [...document.querySelectorAll('.arched-window')];
    const target = windows.map(window => {
      const r = window.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(bounds.right, r.right) - Math.max(bounds.left, r.left)) * Math.max(0, Math.min(bounds.bottom, r.bottom) - Math.max(bounds.top, r.top));
      return {window, overlap};
    }).sort((a,b) => b.overlap - a.overlap)[0];
    if (e.type !== 'pointercancel' && target?.overlap > 0) {
      attachToWindow(piece, target.window);
    } else if (!fresh && previous.parent.classList.contains('arched-window')) {
      previous.parent.append(piece);
      piece.setAttribute('style', previous.style);
    } else {
      piece.remove();
    }
  };
  document.addEventListener('pointerup', finish);
  document.addEventListener('pointercancel', finish);
  document.querySelector('.decoration-reset')?.addEventListener('click', () => {
    drag = null;
    document.querySelectorAll('.placed-ornament').forEach(piece => piece.remove());
  });
})();
