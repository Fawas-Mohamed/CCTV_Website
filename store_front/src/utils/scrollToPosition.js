let lenisInstance = null;

export function registerLenis(instance) {
  lenisInstance = instance;
  return () => {
    if (lenisInstance === instance) lenisInstance = null;
  };
}

export function scrollToPosition(top, smooth = true) {
  if (lenisInstance) {
    lenisInstance.scrollTo(top, { duration: smooth ? 0.9 : 0 });
    return;
  }
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
}
