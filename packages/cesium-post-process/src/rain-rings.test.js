import {test, mock} from 'node:test';
import assert from 'node:assert/strict';
import {Cartesian3, Color, FixedFrameTransforms, Matrix4, Math as CesiumMath} from '@cesium/core';
import OpenSky from './open-sky.js';
import RainRings from './rain-rings.js';
import {localFromEye} from './local-frame.js';

const fakeViewer = (view = Matrix4.IDENTITY) => {
  const scene = {
    renders: 0,
    requestRender() {
      this.renders++;
    },
    isDestroyed: () => false,
    camera: {viewMatrix: view, positionWC: Cartesian3.fromDegrees(7.5, 46.9, 800)},
    postProcessStages: {add() {}, remove() {}},
  };
  return {scene};
};

test('the defaults: half the cells, 2 m across, rings 0.35 m wide at most, no water, flat ground to 30 degrees', () => {
  const {uniforms} = new RainRings(fakeViewer()).createStage_(fakeViewer().scene);
  assert.equal(uniforms.intensity(), 0.5);
  assert.equal(uniforms.cell(), 2);
  assert.equal(uniforms.reach(), 0.35);
  assert.ok(uniforms.waterLevel() > 1e8);
  assert.ok(Math.abs(uniforms.maxSlope() - CesiumMath.toRadians(30)) < 1e-12);
});

test('the options given, changed live: each asks for a render', () => {
  const viewer = fakeViewer();
  const rings = new RainRings(viewer, {intensity: 0.8, cell: 3, reach: 0.5, waterLevel: 372, maxSlope: 20, color: new Color(1, 0, 0, 0.4)});
  const read = () => rings.createStage_(viewer.scene).uniforms;
  assert.equal(read().intensity(), 0.8);
  assert.equal(read().cell(), 3);
  assert.equal(read().reach(), 0.5);
  assert.equal(read().waterLevel(), 372);
  assert.deepEqual([read().color().x, read().color().w], [1, 0.4]);
  rings.intensity = 0.2;
  rings.cell = 4;
  rings.reach = 0.6;
  rings.waterLevel = undefined;
  rings.maxSlope = 10;
  rings.color = new Color(0, 0, 1, 0.5);
  assert.equal(viewer.scene.renders, 6);
  assert.equal(read().cell(), 4);
  assert.ok(read().waterLevel() > 1e8);
  assert.equal(read().color().z, 1);
});

test('the rings\' cells are laid about the origin given: the local frame there, from the camera\'s view', () => {
  const view = Matrix4.inverseTransformation(Matrix4.fromTranslation(new Cartesian3(1000, 2000, 3000), new Matrix4()), new Matrix4());
  const viewer = fakeViewer(view);
  const origin = Cartesian3.fromDegrees(7.6, 46.95, 450);
  const {uniforms} = new RainRings(viewer, {origin}).createStage_(viewer.scene);
  assert.ok(Matrix4.equals(uniforms.localFromEye(), localFromEye(FixedFrameTransforms.eastNorthUpToFixedFrame(origin), view)));
});

test('without an origin, they are laid about where the camera was when the effect was activated, and stay there as it moves', () => {
  const viewer = fakeViewer();
  const rings = new RainRings(viewer);
  rings.active = true;
  const at = Cartesian3.clone(viewer.scene.camera.positionWC);
  viewer.scene.camera.positionWC = Cartesian3.fromDegrees(8, 47, 900);
  const {uniforms} = rings.stage_;
  assert.ok(Matrix4.equals(uniforms.localFromEye(), localFromEye(FixedFrameTransforms.eastNorthUpToFixedFrame(at), viewer.scene.camera.viewMatrix)));
  rings.active = false;
});

test('a cell has a drop only if its hash is under the intensity: a hash of exactly 0, the origin cell\'s, is no drop at no rain', () => {
  const viewer = fakeViewer();
  const {fragmentShader} = new RainRings(viewer).createStage_(viewer.scene);
  assert.match(fragmentShader, /float\(hash\(id\) < intensity\)/);
  assert.doesNotMatch(fragmentShader, /step\(hash\(id\)/);
});

test('the stage shares the depth effects\' chunks: the eye from the depth, the height, the rebuilt normal', () => {
  const viewer = fakeViewer();
  const {fragmentShader} = new RainRings(viewer).createStage_(viewer.scene);
  for (const part of ['vec4 eyeAt(', 'float heightAt(', 'vec3 smoothNormalAt(']) {
    assert.ok(fragmentShader.includes(part), part);
  }
});

test('with no intensity the stage is off and asks for no frames; with some, the scene renders 30 times a second while active', () => {
  mock.timers.enable({apis: ['setInterval']});
  try {
    const viewer = fakeViewer();
    const rings = new RainRings(viewer, {intensity: 0});
    rings.active = true;
    assert.equal(rings.stage_.enabled, false);
    const before = viewer.scene.renders;
    mock.timers.tick(1000);
    assert.equal(viewer.scene.renders, before);
    rings.intensity = 0.5;
    assert.equal(rings.stage_.enabled, true);
    const raining = viewer.scene.renders;
    mock.timers.tick(1000);
    assert.ok(Math.abs(viewer.scene.renders - raining - 30) <= 1);
    rings.active = false;
    const stopped = viewer.scene.renders;
    mock.timers.tick(1000);
    assert.equal(viewer.scene.renders, stopped);
  } finally {
    mock.timers.reset();
  }
});

test('the rings run by the clock given, in seconds, wrapped at an hour: a clock that stands still keeps them still', () => {
  const viewer = fakeViewer();
  let now = 3600 + 12.5;
  const {uniforms} = new RainRings(viewer, {clock: () => now}).createStage_(viewer.scene);
  assert.equal(uniforms.time(), 12.5);
  now = 0;
  assert.equal(uniforms.time(), 0);
});

test('without an open sky every flat surface takes rings; with one, its grid, and a change asks for a render', () => {
  const viewer = fakeViewer();
  const rings = new RainRings(viewer);
  const read = () => rings.createStage_(viewer.scene).uniforms;
  assert.equal(read().hasSky(), 0);
  const openSky = new OpenSky({covers: new Float32Array(4), columns: 2, rows: 2, extent: [0, 4, 0, 4], frame: Matrix4.IDENTITY});
  rings.openSky = openSky;
  assert.equal(viewer.scene.renders, 1);
  assert.equal(read().hasSky(), 1);
  assert.equal(read().skyGrid(), openSky.grid);
});
