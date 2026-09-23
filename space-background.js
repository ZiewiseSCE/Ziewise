import {emitStars, pruneStars, starOpacity} from './starfield-particles.js?v=20260924-space1';

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
  for (let i = 0; i < 220; i++) field.push({x:random(),y:random(),r:.4 + random() * .65,a:.15 + random() * .34});
  const active = () => !paused && !reduce.matches && !dialog && !document.hidden;
  function paint(now) {
    context.clearRect(0,0,width,height);
    context.fillStyle = '#d9e9ff';
    for (const star of field) {
      context.globalAlpha = star.a;
      context.beginPath();context.arc(star.x * width,star.y * height,star.r,0,Math.PI * 2);context.fill();
    }
    for (const star of stars) {
      const age = (now - star.born) / 1000, alpha = starOpacity(star,now);
      const x = star.x + star.vx * age, y = star.y + star.vy * age;
      context.globalAlpha = alpha * .12;
      context.beginPath();context.arc(x,y,star.size * 3,0,Math.PI * 2);context.fill();
      context.globalAlpha = alpha;
      context.beginPath();context.arc(x,y,star.size,0,Math.PI * 2);context.fill();
      if (star.sparkle) {
        const r = star.size * 3.2;
        context.globalAlpha = alpha * .6;context.lineWidth = .6;context.strokeStyle = '#e4efff';
        context.beginPath();context.moveTo(x-r,y);context.lineTo(x+r,y);context.moveTo(x,y-r);context.lineTo(x,y+r);context.stroke();
      }
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
    if (previous && now - previous.time < 16) return;
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
