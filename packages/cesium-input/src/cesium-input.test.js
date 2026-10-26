import {test} from "node:test";
import assert from "node:assert/strict";
import Controls, {standardGamepad} from "./cesium-input.js";

/** @type {Record<string, (event: any) => void>} */
const listeners = {};
const target = {addEventListener: (/** @type {string} */ type, /** @type {any} */ f) => listeners[type] = f, removeEventListener: () => {}};
globalThis.document = /** @type {any} */ (target);
globalThis.window = /** @type {any} */ (target);

const key = (/** @type {string} */ type, /** @type {string} */ code) =>
  listeners[type]({type, code, composedPath: () => [{}], preventDefault: () => {}});

/**
 * @param {() => (Gamepad | null)[]} getGamepads
 */
const withGamepads = getGamepads => {
  Object.defineProperty(globalThis.navigator, "getGamepads", {value: getGamepads, configurable: true});
};

test("a key tapped between two reads reads as pressed, once", () => {
  withGamepads(() => []);
  const controls = new Controls({jump: {type: "button", keys: ["Space"]}});
  controls.active = true;
  key("keydown", "Space");
  key("keyup", "Space");
  assert.equal(controls.read().jump, true);
  assert.equal(controls.read().jump, false);
});

test("the keys and a stick add up, the stick without its dead zone, the whole no longer than 1", () => {
  // the stick a little right of straight right: kept, not snapped to the axis
  withGamepads(() => [/** @type {any} */ ({mapping: "standard", axes: [1, 0.1], buttons: []})]);
  const controls = new Controls({move: {type: "vector", keys: {up: ["KeyW"]}, stick: "left"}});
  controls.active = true;
  key("keydown", "KeyW");
  const {move} = /** @type {{move: {x: number, y: number}}} */ (controls.read());
  assert.ok(Math.abs(Math.hypot(move.x, move.y) - 1) < 1e-9);
  assert.ok(move.x > 0 && move.y > 0);
  // a dead zone per axis would drop the stick's slight down, and give as much up as right
  assert.ok(move.y < move.x);
});

test("a gamepad blocked by a Permissions Policy reads as none", async () => {
  // a new task: the gamepad is read once per task
  await new Promise(resolve => setTimeout(resolve));
  withGamepads(() => {
    throw new DOMException("blocked", "SecurityError");
  });
  assert.equal(standardGamepad(), undefined);
});

const bindings = /** @satisfies {Record<string, import("./cesium-input.js").Binding>} */ ({
  move: {type: "vector", keys: {up: ["KeyW"]}},
  turn: {type: "axis", keys: {positive: ["KeyE"]}},
  jump: {type: "button", keys: ["Space"]},
});

test("a source's actions are read with the devices' at rest", () => {
  withGamepads(() => []);
  const controls = new Controls(bindings, {sources: [{read: () => ({move: {x: 1, y: 0}, turn: 0.5, jump: true})}, {read: () => ({})}]});
  assert.deepEqual(controls.read(), {move: {x: 1, y: 0}, turn: 0.5, jump: true});
});

test("a source's button is true if either is", () => {
  withGamepads(() => []);
  const controls = new Controls(bindings, {sources: [{read: () => ({jump: false})}]});
  controls.active = true;
  key("keydown", "Space");
  assert.equal(controls.read().jump, true);
  key("keyup", "Space");
  assert.equal(controls.read().jump, false);
});

test("a source's axis adds to the keys' and the whole is clamped to 1", () => {
  withGamepads(() => []);
  const controls = new Controls(bindings, {sources: [{read: () => ({turn: 0.5})}]});
  controls.active = true;
  assert.equal(controls.read().turn, 0.5);
  key("keydown", "KeyE");
  key("keyup", "KeyE");
  key("keydown", "KeyE");
  assert.equal(controls.read().turn, 1);
  key("keyup", "KeyE");
});

test("a source's vector adds to the keys', the whole no longer than 1", () => {
  withGamepads(() => []);
  const controls = new Controls(bindings, {sources: [{read: () => ({move: {x: 1, y: 0}})}]});
  controls.active = true;
  key("keydown", "KeyW");
  const {move} = controls.read();
  assert.ok(Math.abs(Math.hypot(move.x, move.y) - 1) < 1e-9 && move.x > 0 && move.y > 0);
  key("keyup", "KeyW");
});

test("a source's name not bound is ignored", () => {
  withGamepads(() => []);
  const controls = new Controls(bindings, {sources: [{read: () => /** @type {any} */ ({other: 1, jump: true})}]});
  assert.deepEqual(Object.keys(controls.read()).sort(), ["jump", "move", "turn"]);
});

test("the sources are read when the controls are not active, and are left as they are", () => {
  withGamepads(() => []);
  let reads = 0;
  const source = {read: () => (reads++, {jump: true})};
  const controls = new Controls(bindings, {sources: [source]});
  controls.active = true;
  controls.active = false;
  assert.equal(controls.read().jump, true);
  assert.equal(reads, 1);
  assert.deepEqual(controls.sources, [source]);
});

test("the sources given are copied", () => {
  withGamepads(() => []);
  const given = [{read: () => ({jump: true})}];
  const controls = new Controls(bindings, {sources: given});
  given.length = 0;
  assert.equal(controls.read().jump, true);
});
