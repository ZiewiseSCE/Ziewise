export const STAR_LIFETIME = 2500;
export const STAR_SPREAD = 180;
export const MAX_STARS = 2400;

/** Ambient and pointer stars use exactly the same size and brightness range. */
export function createStarAppearance(random = Math.random) {
  return {size:.4 + random() * .65, brightness:.15 + random() * .34};
}

/** Scatter across a broad disk along the pointer sweep, keeping the center from becoming a line. */
export function emitStars(stars, from, to, now, random = Math.random) {
  const distance = from ? Math.hypot(to.x - from.x, to.y - from.y) : 0;
  const count = Math.min(28, Math.max(16, Math.ceil(distance / 12)));
  for (let i = 0; i < count; i++) {
    const t = (i + random()) / count;
    const x = from ? from.x + (to.x - from.x) * t : to.x;
    const y = from ? from.y + (to.y - from.y) * t : to.y;
    const angle = random() * Math.PI * 2, spread = Math.sqrt(random()) * STAR_SPREAD;
    stars.push({x:x + Math.cos(angle) * spread, y:y + Math.sin(angle) * spread,
      ...createStarAppearance(random), born:now});
  }
  if (stars.length > MAX_STARS) stars.splice(0, stars.length - MAX_STARS);
}

export function starOpacity(star, now) {
  const age = now - star.born;
  if (age < 0 || age >= STAR_LIFETIME) return 0;
  const fade = Math.max(0, (age / STAR_LIFETIME - .6) / .4);
  return star.brightness * Math.min(1,age / 180) * (1 - fade * fade);
}

export function pruneStars(stars, now) {
  let next = 0;
  for (const star of stars) if (now - star.born < STAR_LIFETIME) stars[next++] = star;
  stars.length = next;
}
