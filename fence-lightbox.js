(() => {
  const dialog = document.querySelector('.fence-lightbox');
  const enlarged = dialog.querySelector('.fence-lightbox-image');
  let opener = null;
  const open = photo => {
    opener = photo;
    enlarged.src = photo.currentSrc || photo.src;
    enlarged.alt = photo.alt;
    dialog.showModal();
    dialog.focus();
  };
  document.querySelectorAll('.entry-thumbnails > img').forEach(photo => {
    photo.tabIndex = 0;
    photo.setAttribute('role', 'button');
    photo.setAttribute('aria-label', `Enlarge: ${photo.alt || 'fence photograph'}`);
    photo.addEventListener('click', () => open(photo));
    photo.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(photo);
      }
    });
  });
  dialog.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (opener) opener.focus({preventScroll:true});
  });
})();
