const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
// 1. Grab the overlay element
const navOverlay = document.getElementById('navOverlay'); 

if (navToggle && navLinks) {

  const closeMenu = () => {
    navLinks.classList.remove('open');
    // 2. Remove the open class from the overlay so it fades out
    if (navOverlay) navOverlay.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    navLinks.classList.add('open');
    // 3. Add the open class to the overlay so it dims the background
    if (navOverlay) navOverlay.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
  };

  navToggle.addEventListener('click', () => {
    const isCurrentlyOpen = navLinks.classList.contains('open');
    if (isCurrentlyOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navLinks.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      closeMenu();
    }
  });

  // 4. THE CLICK-TO-CLOSE FIX: Listen for clicks directly on the dark background
  if (navOverlay) {
    navOverlay.addEventListener('click', closeMenu);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      closeMenu();
      navToggle.focus();
    }
  });
}