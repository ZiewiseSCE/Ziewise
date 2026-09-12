/** A photographic image surface with restrained, optional cinematic movement. */
export function mountPhotographic(element, { src = 'assets/infrastructure-photo-1536-v1.webp', srcset, sizes, alt = '', onReady } = {}) {
  if (!element) return { setPaused() {}, setScrollProgress() {}, setAlt() {}, dispose() {} };

  const surface = document.createElement('div');
  surface.className = 'photographic-surface';
  const picture = document.createElement('img');
  picture.className = 'photographic-image';
  picture.alt = alt;
  picture.decoding = 'async';
  picture.draggable = false;
  if (element.id === 'hero-webgl') picture.fetchPriority = 'high';
  if (sizes) picture.sizes = sizes;
  if (srcset) picture.srcset = srcset;
  surface.append(picture);
  element.append(surface);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let reducedMotion = reduced.matches;
  let paused = false;
  let manualMotionOverride = false;
  let visible = true;
  let ready = false;
  let disposed = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let scrollProgress = 0;
  let currentScroll = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentX = 0;
  let currentY = 0;
  let fallback;

  const clamp = value => Math.max(-1, Math.min(1, Number(value) || 0));
  const canMove = () => ready && !disposed && !paused && (!reducedMotion || manualMotionOverride) && visible && !document.hidden;
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    surface.classList.remove('is-moving');
  }
  function draw(now) {
    frame = 0;
    if (!canMove()) return;
    const delta = lastTime ? Math.min(now - lastTime, 50) : 0;
    lastTime = now;
    elapsed += delta;
    const ease = 1 - Math.exp(-delta / 650);
    currentX += (pointerX - currentX) * ease;
    currentY += (pointerY - currentY) * ease;
    currentScroll += (scrollProgress - currentScroll) * ease;
    const phase = elapsed / 32000 * Math.PI * 2;
    const x = Math.sin(phase) * 3 + currentX * 2;
    const y = (Math.cos(phase * .73) - 1) * 1.1 + currentY * 1.5 + currentScroll;
    const scale = 1.025 + (1 - Math.cos(phase * .45)) * .005;
    picture.style.transform = `translate3d(${x.toFixed(3)}px,${y.toFixed(3)}px,0) scale(${scale.toFixed(5)})`;
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    if (canMove()) {
      surface.classList.add('is-moving');
      if (!frame) frame = requestAnimationFrame(draw);
    } else stop();
  }
  function onReducedChange() {
    reducedMotion = reduced.matches;
    manualMotionOverride = false;
    surface.classList.remove('has-motion-override');
    if (reducedMotion) {
      picture.style.transform = 'none';
      currentX = currentY = pointerX = pointerY = currentScroll = 0;
      elapsed = 0;
    }
    sync();
  }
  function onPointer(event) {
    if (!finePointer.matches || !canMove()) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX = clamp((event.clientX - rect.left) / rect.width * 2 - 1);
    pointerY = clamp((event.clientY - rect.top) / rect.height * 2 - 1);
  }
  function resetPointer() { pointerX = pointerY = 0; }
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    sync();
  }, { rootMargin: '40px' });
  observer.observe(element);
  element.addEventListener('pointermove', onPointer, { passive: true });
  element.addEventListener('pointerleave', resetPointer, { passive: true });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', onReducedChange);
  finePointer.addEventListener('change', resetPointer);

  async function loaded() {
    try { await picture.decode(); } catch { /* Complete images can still be displayed after decode rejects. */ }
    if (disposed || ready || !picture.naturalWidth) return;
    ready = true;
    surface.classList.add('is-ready');
    element.classList.add('has-photographic-surface');
    if (reducedMotion && !manualMotionOverride) picture.style.transform = 'none';
    sync();
    onReady?.({ photographic: true });
  }
  function failed() {
    if (disposed || ready) return;
    stop();
    surface.remove();
    fallback = document.createElement('div');
    fallback.className = 'photographic-fallback';
    fallback.textContent = picture.alt;
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', picture.alt);
    element.append(fallback);
    onReady?.({ photographic: false });
  }
  picture.addEventListener('load', loaded, { once: true });
  picture.addEventListener('error', failed, { once: true });
  picture.src = src;

  return {
    setPaused(value, { manual = false } = {}) {
      paused = Boolean(value);
      if (manual && !paused) {
        manualMotionOverride = true;
        surface.classList.add('has-motion-override');
      }
      sync();
    },
    setScrollProgress(value) { scrollProgress = clamp(value); },
    setAlt(value) {
      picture.alt = value || '';
      if (fallback) { fallback.textContent = picture.alt; fallback.setAttribute('aria-label', picture.alt); }
    },
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      element.removeEventListener('pointermove', onPointer);
      element.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', onReducedChange);
      finePointer.removeEventListener('change', resetPointer);
      picture.removeEventListener('load', loaded);
      picture.removeEventListener('error', failed);
      surface.remove();
      fallback?.remove();
      element.classList.remove('has-photographic-surface');
    }
  };
}
