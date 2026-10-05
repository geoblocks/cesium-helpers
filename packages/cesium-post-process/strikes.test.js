import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceStrikes, MAX_STRIKES, STRIKE_LIFE} from './strikes.js';

const create = (start) => ({start});

test('a strike starts when the random number is under the chance of one over the step', () => {
  const strikes = [];
  advanceStrikes(strikes, 10, 0.1, 5, () => 0.5, create);
  // 1 - exp(-0.5) is 0.39
  assert.deepEqual(strikes, []);
  advanceStrikes(strikes, 10, 0.1, 5, () => 0.3, create);
  assert.deepEqual(strikes, [{start: 10}]);
});

test('no strike starts without a rate', () => {
  const strikes = [];
  advanceStrikes(strikes, 0, 1, 0, () => 0, create);
  assert.deepEqual(strikes, []);
});

test('the strikes that are over are dropped', () => {
  const strikes = [{start: 0}, {start: 5}];
  advanceStrikes(strikes, 5 + STRIKE_LIFE / 2, 0.03, 0, () => 0, create);
  assert.deepEqual(strikes, [{start: 5}]);
});

test('there are never more than the maximum', () => {
  const strikes = [];
  for (let i = 0; i < 2 * MAX_STRIKES; i++) {
    advanceStrikes(strikes, i * 0.01, 1, 100, () => 0, create);
  }
  assert.equal(strikes.length, MAX_STRIKES);
});
