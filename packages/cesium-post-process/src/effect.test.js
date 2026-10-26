import {test} from 'node:test';
import assert from 'node:assert/strict';
import Effect from './effect.js';

const fakeViewer = () => {
  const calls = [];
  return {
    calls,
    scene: {
      postProcessStages: {
        add: (stage) => calls.push(['add', stage]),
        remove: (stage) => calls.push(['remove', stage]),
      },
      requestRender: () => calls.push(['render']),
    },
  };
};

class Recorded extends Effect {
  createStage_(scene) {
    this.viewer.calls.push(['create', scene]);
    return {name: 'stage'};
  }

  activated_(scene) {
    this.viewer.calls.push(['activated', scene]);
  }

  deactivating_(scene) {
    this.viewer.calls.push(['deactivating', scene]);
  }
}

test('activating creates and adds the stage, then runs the hook, and renders once', () => {
  const viewer = fakeViewer();
  const effect = new Recorded(viewer);
  assert.equal(effect.active, false);
  effect.active = true;
  assert.equal(effect.active, true);
  assert.deepEqual(viewer.calls, [
    ['create', viewer.scene],
    ['add', {name: 'stage'}],
    ['activated', viewer.scene],
    ['render'],
  ]);
});

test('deactivating runs the hook before the stage is removed, and renders once', () => {
  const viewer = fakeViewer();
  const effect = new Recorded(viewer);
  effect.active = true;
  viewer.calls.length = 0;
  effect.active = false;
  assert.equal(effect.active, false);
  assert.deepEqual(viewer.calls, [['deactivating', viewer.scene], ['remove', {name: 'stage'}], ['render']]);
});

test('setting the same state again does nothing', () => {
  const viewer = fakeViewer();
  const effect = new Recorded(viewer);
  effect.active = false;
  effect.active = true;
  viewer.calls.length = 0;
  effect.active = true;
  assert.deepEqual(viewer.calls, []);
});

test('destroy deactivates', () => {
  const viewer = fakeViewer();
  const effect = new Recorded(viewer);
  effect.active = true;
  effect.destroy();
  assert.equal(effect.active, false);
  assert.equal(viewer.calls.filter(([name]) => name === 'remove').length, 1);
});

test('an effect without a stage cannot be activated', () => {
  const effect = new Effect(fakeViewer());
  assert.throws(() => {
    effect.active = true;
  }, /createStage_/);
});
