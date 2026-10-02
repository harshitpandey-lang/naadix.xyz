const motion = document.querySelector('.motion');
motion?.addEventListener('click', () => {
  const paused = document.body.classList.toggle('paused');
  motion.setAttribute('aria-pressed', String(paused));
  motion.textContent = paused ? 'Play animation' : 'Pause animation';
});
document.addEventListener('visibilitychange', () => {
  document.querySelectorAll('.browser, .mobile-preview').forEach(element => {
    element.style.animationPlayState = document.hidden || document.body.classList.contains('paused') ? 'paused' : 'running';
  });
});
