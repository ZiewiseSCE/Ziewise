export const STAR_LIFETIME = 1500;
export const MAX_STARS = 480;

/** Sample the pointer path, not event frequency, so fast and slow mice both leave stars. */
export function emitStars(stars, from, to, now, random = Math.random) {
  const distance = from ? Math.hypot(to.x - from.x, to.y - from.y) : 0;
  const count = Math.min(64, Math.max(8, Math.ceil(distance / 3)));
  for (let i = 0; i < count; i++) {
    const t = (i + random()) / count;
    const x = from ? from.x + (to.x - from.x) * t : to.x;
    const y = from ? from.y + (to.y - from.y) * t : to.y;
    const angle = random() * Math.PI * 2, spread = Math.sqrt(random()) * 26;
    stars.push({x:x + Math.cos(angle) * spread, y:y + Math.sin(angle) * spread,
      vx:(random() - .5) * 9, vy:(random() - .5) * 9,
      size:.55 + random() * 1.35, sparkle:random() > .82, born:now});
  }
  if (stars.length > MAX_STARS) stars.splice(0, stars.length - MAX_STARS);
}

export function starOpacity(star, now) {
  const age = now - star.born;
  if (age < 0 || age >= STAR_LIFETIME) return 0;
  const fade = Math.max(0, (age / STAR_LIFETIME - .28) / .72);
  return .88 * (1 - fade * fade);
}

export function pruneStars(stars, now) {
  let next = 0;
  for (const star of stars) if (now - star.born < STAR_LIFETIME) stars[next++] = star;
  stars.length = next;
}
