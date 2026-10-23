import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3} from '@cesium/core';
import {alongSegment, clipPolygon, insideRange, nearRange, runsAlong} from './overlay-lines.js';

const near = (a, b, tolerance, message) => assert.ok(Math.abs(a - b) <= tolerance, `${message ?? ''} ${a} is not ${b}`);
// in front of the plane x = 1: what is ahead of it, in meters
const aheadOfX1 = point => point.x - 1;

test('a line seen all along is one run, each sample tested once', () => {
  let calls = 0;
  assert.deepEqual(runsAlong(() => (calls++, false), 4, 5), [[0, 1, false]]);
  assert.equal(calls, 5);
});

test('where the test changes between two samples, the change is found by halving', () => {
  // hidden from 0.3 to 0.7: the samples at 0.25 and 0.75 miss both changes, 0.5 is hidden
  const runs = runsAlong(t => t > 0.3 && t < 0.7, 4, 6);
  assert.equal(runs.length, 3);
  assert.deepEqual(runs.map(([, , hidden]) => hidden), [false, true, false]);
  near(runs[0][1], 0.3, 1 / (4 * 2 ** 6), 'first change');
  near(runs[1][1], 0.7, 1 / (4 * 2 ** 6), 'second change');
  assert.equal(runs[0][0], 0);
  assert.equal(runs[2][1], 1);
  assert.equal(runs[1][0], runs[0][1], 'runs meet');
});

test('a line hidden at its start opens with a hidden run', () => {
  const runs = runsAlong(t => t < 0.5, 2, 4);
  assert.deepEqual(runs.map(([, , hidden]) => hidden), [true, false]);
});

test('the part of a segment in front of the near plane, as a range along it', () => {
  assert.deepEqual(nearRange(new Cartesian3(2, 0, 0), new Cartesian3(5, 3, 0), aheadOfX1), [0, 1]);
  assert.equal(nearRange(new Cartesian3(0, 0, 0), new Cartesian3(-5, 3, 0), aheadOfX1), undefined);
  const [from, to] = nearRange(new Cartesian3(-1, 0, 0), new Cartesian3(3, 4, 0), aheadOfX1);
  near(from, 0.5, 1e-12);
  assert.equal(to, 1);
  const [start, end] = nearRange(new Cartesian3(3, 4, 0), new Cartesian3(-1, 0, 0), aheadOfX1);
  assert.equal(start, 0);
  near(end, 0.5, 1e-12);
});

test('the part of a segment inside several planes is where their ranges overlap', () => {
  // in front of x = 1 and behind x = 4
  const behindX4 = point => 4 - point.x;
  const [from, to] = insideRange(new Cartesian3(0, 0, 0), new Cartesian3(8, 0, 0), [aheadOfX1, behindX4]);
  near(from, 1 / 8, 1e-12);
  near(to, 4 / 8, 1e-12);
  assert.equal(insideRange(new Cartesian3(0, 0, 0), new Cartesian3(0.5, 0, 0), [aheadOfX1, behindX4]), undefined);
});

test('a place on the screen between two ends, as a place along the segment: even on the screen, not in the world', () => {
  assert.equal(alongSegment(0.5, 2, 2), 0.5);
  // ends 1 m and 3 m deep: halfway on the screen is a quarter of the way in the world (1.5 m deep)
  near(alongSegment(0.5, 1, 3), 0.25, 1e-12);
  assert.equal(alongSegment(0, 1, 3), 0);
  assert.equal(alongSegment(1, 1, 3), 1);
});

test('a polygon is cut to what is inside the planes, a corner where it crosses each', () => {
  // the square 0..2 in x and y, cut at x = 1: its right half
  const square = [new Cartesian3(0, 0, 0), new Cartesian3(2, 0, 0), new Cartesian3(2, 2, 0), new Cartesian3(0, 2, 0)];
  const half = clipPolygon(square, [aheadOfX1]);
  assert.deepEqual(half.map(({x, y}) => [x, y]), [[1, 0], [2, 0], [2, 2], [1, 2]]);
  assert.deepEqual(clipPolygon(square, [point => -1 - point.x]), [], 'all outside');
  assert.deepEqual(clipPolygon(square, []), square, 'no plane');
});
