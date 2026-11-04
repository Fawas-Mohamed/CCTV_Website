export function flyToCart(image) {
  const cart = document.querySelector('.cart-button');
  if (!image || !cart) return;

  const source = image.getBoundingClientRect();
  const destination = cart.getBoundingClientRect();
  if (!source.width || !source.height || !destination.width || !destination.height) return;

  const clone = image.cloneNode();
  clone.setAttribute('aria-hidden', 'true');
  Object.assign(clone.style, {
    position: 'fixed',
    zIndex: '200',
    left: source.left + 'px',
    top: source.top + 'px',
    width: source.width + 'px',
    height: source.height + 'px',
    objectFit: 'contain',
    margin: '0',
    pointerEvents: 'none',
    transformOrigin: 'top left',
    transition: 'transform 650ms cubic-bezier(.2,.8,.2,1), opacity 650ms ease',
  });
  document.body.append(clone);

  window.requestAnimationFrame(() => {
    clone.style.transform = `translate3d(${destination.left - source.left}px, ${destination.top - source.top}px, 0) scale(${destination.width / source.width}, ${destination.height / source.height})`;
    clone.style.opacity = '0.35';
  });

  const badge = cart.querySelector('.cart-count');
  const removeClone = () => {
    clone.remove();
    if (badge?.isConnected && typeof badge.animate === 'function') {
      badge.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }],
        { duration: 420, easing: 'ease-out' },
      );
    }
  };
  clone.addEventListener('transitionend', removeClone, { once: true });
  window.setTimeout(removeClone, 750);
}
