import {createStarAppearance, emitStars, pruneStars, starOpacity} from './starfield-particles.js?v=20260924-space2';

/** One decorative canvas, idle when the pointer is idle. All hit testing stays on the page. */
export function mountSpaceBackground() {
  const canvas = document.createElement('canvas');
  canvas.id = 'space-stars'; canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const context = canvas.getContext('2d', {alpha:true});
  if (!context) {canvas.remove();return {dispose(){}};}
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const stars = [], field = [];
  let width = 0, height = 0, dpr = 1, frame = 0, previous = null;
  let paused = document.documentElement.classList.contains('motion-paused'), dialog = false;
  let seed = 307;
  const random = () => {seed = (seed * 1664525 + 1013904223) >>> 0;return seed / 4294967296;};
  for (let i = 0; i < 220; i++) field.push({x:random(),y:random(),...createStarAppearance(random)});
  const active = () => !paused && !reduce.matches && !dialog && !document.hidden;
  function dot(x,y,size,brightness) {
    context.globalAlpha = brightness;
    context.beginPath();context.arc(x,y,size,0,Math.PI * 2);context.fill();
  }
  function paint(now) {
    context.clearRect(0,0,width,height);
    context.fillStyle = '#d9e9ff';
    for (const star of field) {
      dot(star.x * width,star.y * height,star.size,star.brightness);
    }
    for (const star of stars) {
      dot(star.x,star.y,star.size,starOpacity(star,now));
    }
    context.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0;pruneStars(stars,now);paint(now);
    if (stars.length && active()) frame = requestAnimationFrame(tick);
  }
  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;stars.length = 0;previous = null;paint(performance.now());
  }
  function resize() {
    width = innerWidth;height = innerHeight;dpr = Math.min(devicePixelRatio || 1,1.5);
    canvas.width = Math.round(width*dpr);canvas.height = Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);reset();
  }
  function move(event) {
    if (event.pointerType !== 'mouse' || !active()) {previous = null;return;}
    const now = performance.now(), point = {x:event.clientX,y:event.clientY};
    // At most 28 stars per 32 ms: the bounded buffer holds every star for its full lifetime.
    if (previous && now - previous.time < 32) return;
    if (previous && now - previous.time > 100) previous = null;
    emitStars(stars,previous,point,now);previous = {...point,time:now};
    if (!frame) frame = requestAnimationFrame(tick);
  }
  const leave = () => {previous = null;};
  const motion = event => {paused = event.detail.paused;if (paused) reset();};
  const modal = event => {dialog = !!event.detail;if (dialog) reset();};
  const visibility = () => {if (document.hidden) reset();};
  const events = [[document,'pointermove',move],[document,'pointerleave',leave],[window,'blur',reset],
    [window,'resize',resize],[window,'ziewise:motion',motion],[window,'ziewise:dialog',modal],
    [document,'visibilitychange',visibility],[window,'ziewise:pagechange',reset]];
  events.forEach(([target,type,fn])=>target.addEventListener(type,fn,{passive:true}));
  reduce.addEventListener('change',reset);resize();
  return {dispose(){if(frame)cancelAnimationFrame(frame);events.forEach(([target,type,fn])=>target.removeEventListener(type,fn));reduce.removeEventListener('change',reset);canvas.remove();}};
}
