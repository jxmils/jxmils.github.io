const projectLinks = document.querySelectorAll('.project-card-link');

projectLinks.forEach(link => {
  link.addEventListener('mouseenter', () => {
    projectLinks.forEach(otherLink => {
      if (otherLink !== link) {
        otherLink.style.opacity = '0.5';
      }
    });
  });

  link.addEventListener('mouseleave', () => {
    projectLinks.forEach(otherLink => {
      otherLink.style.opacity = '1';
    });
  });
});
