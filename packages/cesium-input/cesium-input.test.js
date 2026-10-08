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
