import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildBvh, buildSegmentBvh, bvhQueries, refitBvh, segmentQueries, trianglesOf} from './cesium-bvh.js';

// a seeded generator: the same triangles and rays every run
const random = seed => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;

// triangles in a 20 m box, some flat and axis-aligned (their boxes are flat), some tilted, some thin: a corner and two edges each
const scene = (count, next) => {
  const tris = new Float64Array(count * 9);
  for (let k = 0; k < count; k++) {
    const corner = [next() * 20, next() * 20, next() * 10];
    const flat = k % 3 === 0 ? k % 2 : -1;
    const edge = () => Array.from({length: 3}, (_, a) => (a === flat ? 0 : (next() - 0.5) * (k % 5 === 0 ? 8 : 1.5)));
    tris.set([...corner, ...edge(), ...edge()], k * 9);
  }
  return tris;
};

// the nearest hit and the number of hits within a reach, tried against every triangle (Moller-Trumbore, both sides, over 0.1 mm)
const hitAt = (T, i, [px, py, pz], [dx, dy, dz]) => {
  const o = i * 9;
  const [e1x, e1y, e1z, e2x, e2y, e2z] = [T[o + 3], T[o + 4], T[o + 5], T[o + 6], T[o + 7], T[o + 8]];
  const [hx, hy, hz] = [dy * e2z - dz * e2y, dz * e2x - dx * e2z, dx * e2y - dy * e2x];
  const a = e1x * hx + e1y * hy + e1z * hz;
  if (a > -1e-12 && a < 1e-12) {
    return -1;
  }
  const [f, sx, sy, sz] = [1 / a, px - T[o], py - T[o + 1], pz - T[o + 2]];
  const u = f * (sx * hx + sy * hy + sz * hz);
  if (u < 0 || u > 1) {
    return -1;
  }
  const [qx, qy, qz] = [sy * e1z - sz * e1y, sz * e1x - sx * e1z, sx * e1y - sy * e1x];
  const v = f * (dx * qx + dy * qy + dz * qz);
  if (v < 0 || u + v > 1) {
    return -1;
  }
  const t = f * (e2x * qx + e2y * qy + e2z * qz);
  return t > 1e-4 ? t : -1;
};
const brute = (T, count, p, d, reach) => {
  let [nearest, hits] = [Infinity, 0];
  for (let i = 0; i < count; i++) {
    const t = hitAt(T, i, p, d);
    if (t >= 0 && t <= reach) {
      hits++;
      nearest = Math.min(nearest, t);
    }
  }
  return {nearest, hits};
};

test('the nearest hit, any hit and the count of hits agree with trying every triangle, for rays of every direction, axes included', () => {
  const next = random(7);
  const count = 3000;
  const tris = scene(count, next);
  for (const leaf of [1, 4, 16]) {
    const rays = bvhQueries(buildBvh(tris, undefined, {leaf}));
    for (let r = 0; r < 600; r++) {
      const p = [next() * 24 - 2, next() * 24 - 2, next() * 14 - 2];
      // every 10th ray along an axis: a zero component, the inverse infinite
      const d = r % 10 === 0 ? [[1, 0, 0], [0, -1, 0], [0, 0, 1]][(r / 10) % 3].map(v => v) : (() => {
        const v = [next() - 0.5, next() - 0.5, next() - 0.5];
        const length = Math.hypot(...v);
        return v.map(c => c / length);
      })();
      const reach = r % 4 === 0 ? Infinity : next() * 30;
      const want = brute(tris, count, p, d, reach);
      assert.equal(rays.nearest(...p, ...d, reach), want.nearest, `nearest, leaf ${leaf}, ray ${r}`);
      const first = rays.nearestHit(...p, ...d, reach);
      assert.equal(first?.distance ?? Infinity, want.nearest, `nearestHit, leaf ${leaf}, ray ${r}`);
      if (first) {
        assert.equal(hitAt(tris, first.triangle, p, d), first.distance, `nearestHit's triangle, leaf ${leaf}, ray ${r}`);
      }
      assert.equal(rays.any(...p, ...d, reach) >= 0, want.hits > 0, `any, leaf ${leaf}, ray ${r}`);
      assert.equal(rays.count(...p, ...d, reach), want.hits, `count, leaf ${leaf}, ray ${r}`);
      assert.equal(rays.count(...p, ...d, reach, 2), Math.min(2, want.hits), `capped count, leaf ${leaf}, ray ${r}`);
    }
  }
});

test('any gives a triangle that blocks the ray, and a hint that still blocks is the one given back', () => {
  const tris = Float64Array.of(-1, -1, 5, 2, 0, 0, 0, 2, 0, -1, -1, 9, 2, 0, 0, 0, 2, 0);
  const rays = bvhQueries(buildBvh(tris));
  const k = rays.any(0, 0, 0, 0, 0, 1, Infinity);
  assert.ok(k >= 0);
  // the ray beside both: none, the hint ignored
  assert.equal(rays.any(5, 5, 0, 0, 0, 1, Infinity, k), -1);
  // a hint that blocks is returned, though the other triangle is nearer
  const nearer = rays.any(0, 0, 6, 0, 0, 1, Infinity);
  assert.notEqual(nearer, k);
  assert.equal(rays.any(0, 0, 0, 0, 0, 1, Infinity, nearer), nearer);
  // short of the reach: not a hit
  assert.equal(rays.any(0, 0, 0, 0, 0, 1, 4), -1);
});

test('the triangles taken, a subset by number; none: nothing is hit, whatever the ray', () => {
  const tris = Float64Array.of(-1, -1, 5, 2, 0, 0, 0, 2, 0, -1, -1, 9, 2, 0, 0, 0, 2, 0);
  const top = bvhQueries(buildBvh(tris, [1]));
  assert.equal(top.nearest(0, 0, 0, 0, 0, 1, Infinity), 9);
  const none = bvhQueries(buildBvh(tris, []));
  assert.equal(none.nearest(0, 0, 0, 0, 0, 1, Infinity), Infinity);
  assert.equal(none.any(0, 0, 0, 0, 0, 1, Infinity), -1);
  assert.equal(none.count(0, 0, 0, 0, 0, 1, Infinity), 0);
});

test('triangles in one place, and all the centers one point, still build and answer', () => {
  const same = new Float64Array(40 * 9);
  for (let k = 0; k < 40; k++) {
    same.set([0, 0, 3, 1, 0, 0, 0, 1, 0], k * 9);
  }
  const rays = bvhQueries(buildBvh(same, undefined, {leaf: 2}));
  assert.equal(rays.nearest(0.2, 0.2, 0, 0, 0, 1, Infinity), 3);
  assert.equal(rays.count(0.2, 0.2, 0, 0, 0, 1, Infinity), 40);
});

// the distance from a point to a triangle by another way than the tree's: to its plane when the point's projection is inside it, else to
// the nearest of its three edges
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const distanceTo = (T, i, p) => {
  const o = i * 9;
  const a = [T[o], T[o + 1], T[o + 2]];
  const b = [a[0] + T[o + 3], a[1] + T[o + 4], a[2] + T[o + 5]];
  const c = [a[0] + T[o + 6], a[1] + T[o + 7], a[2] + T[o + 8]];
  const n = cross3(sub3(b, a), sub3(c, a));
  const length = Math.hypot(...n);
  const unitNormal = n.map(v => v / length);
  const edges = [[a, b], [b, c], [c, a]];
  const sides = edges.map(([u, v]) => dot3(cross3(sub3(v, u), sub3(p, u)), unitNormal));
  if (sides.every(side => side >= 0) || sides.every(side => side <= 0)) {
    return Math.abs(dot3(sub3(p, a), unitNormal));
  }
  return Math.min(...edges.map(([u, v]) => {
    const d = sub3(v, u);
    const t = Math.min(1, Math.max(0, dot3(sub3(p, u), d) / dot3(d, d)));
    return Math.hypot(...[0, 1, 2].map(k => p[k] - u[k] - d[k] * t));
  }));
};

test('every hit along a ray, nearest first, agrees with trying every triangle', () => {
  const next = random(11);
  const count = 1500;
  const tris = scene(count, next);
  const rays = bvhQueries(buildBvh(tris));
  for (let r = 0; r < 300; r++) {
    const p = [next() * 24 - 2, next() * 24 - 2, next() * 14 - 2];
    const v = [next() - 0.5, next() - 0.5, next() - 0.5];
    const d = v.map(c => c / Math.hypot(...v));
    const want = [];
    for (let i = 0; i < count; i++) {
      const t = hitAt(tris, i, p, d);
      if (t >= 0 && t <= 40) {
        want.push(t);
      }
    }
    assert.deepEqual(rays.hits(...p, ...d, 40), want.sort((a, b) => a - b), `ray ${r}`);
  }
});

test('the least distance a hit is from the ray\'s start is the caller\'s: a ray starting on a surface does not hit it', () => {
  const floor = Float64Array.of(-5, -5, 0, 10, 0, 0, 0, 10, 0);
  assert.equal(bvhQueries(buildBvh(floor), {min: 0.01}).nearest(0, 0, 0.003, 0, 0, -1, 10), Infinity);
  assert.equal(bvhQueries(buildBvh(floor)).nearest(0, 0, 0.003, 0, 0, -1, 10), 0.003);
  // a negative least distance: a hit at the start counts
  assert.equal(bvhQueries(buildBvh(floor), {min: -Infinity}).nearest(0, 0, 0, 0, 0, -1, 10), 0);
  assert.equal(bvhQueries(buildBvh(floor)).nearest(0, 0, 0, 0, 0, -1, 10), Infinity);
});

test('the closest triangle to a point within a radius agrees with trying every triangle: above, beside, near an edge or a corner', () => {
  const next = random(23);
  const count = 1500;
  const tris = scene(count, next);
  const queries = bvhQueries(buildBvh(tris, undefined, {leaf: 3}));
  for (let r = 0; r < 400; r++) {
    const p = [next() * 24 - 2, next() * 24 - 2, next() * 14 - 2];
    const radius = r % 5 === 0 ? 0.05 : next() * 3;
    let [best, who] = [Infinity, -1];
    for (let i = 0; i < count; i++) {
      const d = distanceTo(tris, i, p);
      if (d < best) {
        [best, who] = [d, i];
      }
    }
    const found = queries.closest(...p, radius);
    if (best > radius) {
      assert.equal(found, undefined, `point ${r}`);
    } else {
      assert.ok(found, `point ${r}`);
      assert.ok(Math.abs(found.distance - best) < 1e-9, `point ${r}: ${found.distance} is not ${best}`);
      assert.ok(Math.abs(distanceTo(tris, found.triangle, p) - best) < 1e-9);
      assert.ok(Math.abs(Math.hypot(found.point[0] - p[0], found.point[1] - p[1], found.point[2] - p[2]) - best) < 1e-9, `point ${r}: its point is not at that distance`);
      assert.ok(distanceTo(tris, found.triangle, found.point) < 1e-9, `point ${r}: its point is not on the triangle`);
    }
  }
  assert.equal(bvhQueries(buildBvh(new Float64Array(0))).closest(0, 0, 0, 5), undefined);
});

test('a refitted tree answers as the triangles moved do: the same boxes if none moved, and every query agreeing with trying every triangle after', () => {
  const next = random(41);
  const count = 1500;
  const tris = scene(count, next);
  const bvh = buildBvh(tris, undefined, {leaf: 3});
  const boxes = Float64Array.from(bvh.bounds);
  assert.equal(refitBvh(bvh, tris), bvh);
  assert.deepEqual(bvh.bounds, boxes);
  // a third of the triangles moved by up to 6 m and stretched, the tree made for the old places
  const moved = Float64Array.from(tris);
  for (let k = 0; k < count; k += 3) {
    for (let a = 0; a < 3; a++) {
      moved[k * 9 + a] += (next() - 0.5) * 12;
      moved[k * 9 + 3 + a] *= 1.5;
    }
  }
  refitBvh(bvh, moved);
  const queries = bvhQueries(bvh);
  for (let r = 0; r < 400; r++) {
    const p = [next() * 24 - 2, next() * 24 - 2, next() * 14 - 2];
    const d = (() => {
      const v = [next() - 0.5, next() - 0.5, next() - 0.5];
      const length = Math.hypot(...v);
      return v.map(c => c / length);
    })();
    const reach = r % 4 === 0 ? Infinity : next() * 30;
    const want = brute(moved, count, p, d, reach);
    assert.equal(queries.nearest(...p, ...d, reach), want.nearest, `nearest, ray ${r}`);
    assert.equal(queries.count(...p, ...d, reach), want.hits, `count, ray ${r}`);
    let best = Infinity;
    for (let i = 0; i < count; i++) {
      best = Math.min(best, distanceTo(moved, i, p));
    }
    const found = queries.closest(...p, 2);
    assert.equal(found === undefined, best > 2, `closest, point ${r}`);
    if (found) {
      assert.ok(Math.abs(found.distance - best) < 1e-9, `closest, point ${r}`);
    }
  }
});

test('refit refuses what is not a triangle tree: a segment tree has six numbers an element, and would be spoiled', () => {
  const segments = buildSegmentBvh(Float64Array.of(0, 0, 0, 1, 0, 0, 5, 5, 5, 6, 5, 5));
  assert.throws(() => refitBvh(segments, new Float64Array(18)), /triangle/);
});

test('refit: a tree over some of the triangles follows those; an empty tree is left as it is', () => {
  const next = random(5);
  const tris = scene(300, next);
  const even = Array.from({length: 150}, (_, i) => i * 2);
  const bvh = buildBvh(tris, even);
  const moved = Float64Array.from(tris);
  for (let k = 0; k < 300; k++) {
    moved[k * 9 + 2] += 5;
  }
  refitBvh(bvh, moved);
  const fresh = bvhQueries(buildBvh(moved, even));
  const queries = bvhQueries(bvh);
  for (let r = 0; r < 100; r++) {
    const p = [next() * 20, next() * 20, next() * 20];
    assert.equal(queries.nearest(...p, 0, 0, -1, 40), fresh.nearest(...p, 0, 0, -1, 40));
  }
  assert.doesNotThrow(() => refitBvh(buildBvh(new Float64Array(0)), new Float64Array(0)));
});

test('the triangles of groups: a corner and two edges each, the groups one after the other, into a given array too', () => {
  const groups = [
    {vertices: Float32Array.of(0, 0, 0, 2, 0, 0, 0, 3, 0, 2, 3, 1), triangles: Uint32Array.of(0, 1, 2, 3, 2, 1)},
    {vertices: [10, 10, 10, 11, 10, 10, 10, 12, 10], triangles: [0, 1, 2]},
  ];
  const tris = trianglesOf(groups);
  assert.deepEqual([...tris], [0, 0, 0, 2, 0, 0, 0, 3, 0, 2, 3, 1, -2, 0, -1, 0, -3, -1, 10, 10, 10, 1, 0, 0, 0, 2, 0]);
  const into = new Float64Array(27).fill(7);
  assert.equal(trianglesOf(groups, into), into);
  assert.deepEqual(into, tris);
  assert.equal(trianglesOf([]).length, 0);
  // a tree over them is the triangles', the groups' numbering
  assert.equal(bvhQueries(buildBvh(tris)).nearestHit(10.2, 10.2, 12, 0, 0, -1, 5)?.triangle, 2);
});

// segments scattered in a 20 m box, some axis-aligned, some points
const segmentScene = (count, next) => {
  const segments = new Float64Array(count * 6);
  for (let k = 0; k < count; k++) {
    const a = [next() * 20, next() * 20, next() * 10];
    const long = k % 7 === 0 ? 6 : 1;
    const b = a.map((v, axis) => (k % 11 === 0 ? v : k % 3 === axis ? v + (next() - 0.5) * long : v + (k % 5 === 0 ? 0 : (next() - 0.5) * long)));
    segments.set([...a, ...b], k * 6);
  }
  return segments;
};
const distanceToSegment = (S, i, p) => {
  const o = i * 6;
  const [a, d] = [[S[o], S[o + 1], S[o + 2]], [S[o + 3] - S[o], S[o + 4] - S[o + 1], S[o + 5] - S[o + 2]]];
  const length = dot3(d, d);
  const t = length > 0 ? Math.min(1, Math.max(0, dot3(sub3(p, a), d) / length)) : 0;
  return Math.hypot(...[0, 1, 2].map(k => p[k] - a[k] - d[k] * t));
};

test('the segments near a point and those whose boxes meet a box agree with trying every segment', () => {
  const next = random(5);
  const count = 2000;
  const segments = segmentScene(count, next);
  for (const leaf of [1, 4, 12]) {
    const queries = segmentQueries(buildSegmentBvh(segments, undefined, {leaf}));
    for (let r = 0; r < 300; r++) {
      const p = [next() * 24 - 2, next() * 24 - 2, next() * 14 - 2];
      const radius = next() * 2;
      const want = Array.from({length: count}, (_, i) => i).filter(i => distanceToSegment(segments, i, p) <= radius);
      assert.deepEqual(queries.near(...p, radius).sort((a, b) => a - b), want, `near, leaf ${leaf}, point ${r}`);
      const [lo, hi] = [p.map(v => v - radius), p.map(v => v + radius * 2)];
      const overlapping = Array.from({length: count}, (_, i) => i).filter(i => [0, 1, 2].every(axis => Math.min(segments[i * 6 + axis], segments[i * 6 + 3 + axis]) <= hi[axis]
        && Math.max(segments[i * 6 + axis], segments[i * 6 + 3 + axis]) >= lo[axis]));
      assert.deepEqual(queries.overlapping(...lo, ...hi).sort((a, b) => a - b), overlapping, `overlapping, leaf ${leaf}, point ${r}`);
    }
  }
});

test('segments: a subset by number, none, one point-like segment', () => {
  const segments = Float64Array.of(0, 0, 0, 1, 0, 0, 5, 5, 5, 6, 5, 5, 9, 9, 9, 9, 9, 9);
  assert.deepEqual(segmentQueries(buildSegmentBvh(segments, [1])).near(5.5, 5, 5, 0.1), [1]);
  assert.deepEqual(segmentQueries(buildSegmentBvh(segments, [0])).near(5.5, 5, 5, 0.1), []);
  assert.deepEqual(segmentQueries(buildSegmentBvh(segments, [])).near(0, 0, 0, 100), []);
  assert.deepEqual(segmentQueries(buildSegmentBvh(segments)).near(9, 9, 9.05, 0.1), [2]);
});
