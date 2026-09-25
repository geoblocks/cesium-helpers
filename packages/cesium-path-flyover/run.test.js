import {test} from "node:test";
import assert from "node:assert/strict";
import {RUN_TABLE, deriveRun} from "./run.js";

test("deriveRun with no options is today's run", () => {
  const run = deriveRun({});
  assert.deepEqual(run, {range: 400, pitch: -25, lookAhead: 400, bendZoom: 0, reliefRise: 0, turnCost: 1.5, headingTau: 1, panRate: 30, breathing: 0, bank: 0});
});

test("deriveRun reaches the ends of the table at 0 and 1", () => {
  const pilot = deriveRun({style: 0, motion: 0});
  assert.equal(pilot.range, 250);
  assert.equal(pilot.pitch, -15);
  assert.equal(pilot.panRate, 45);
  assert.equal(pilot.bank, 12);
  const spectator = deriveRun({style: 1, motion: 1});
  assert.equal(spectator.range, 900);
  assert.equal(spectator.bendZoom, 1);
  assert.equal(spectator.reliefRise, 0.5);
  assert.equal(spectator.breathing, 1);
  assert.equal(spectator.headingTau, 3);
  assert.equal(spectator.turnCost, 30);
});

test("deriveRun interpolates within each half", () => {
  assert.equal(deriveRun({style: 0.25}).range, 325);
  assert.equal(deriveRun({style: 0.75}).range, 650);
  assert.equal(deriveRun({motion: 0.75}).breathing, 0.5);
});

test("an explicit option wins over the dial, and undefined counts as unset", () => {
  const run = deriveRun({style: 1, range: 300, pitch: undefined});
  assert.equal(run.range, 300);
  assert.equal(run.pitch, -45);
  assert.equal(run.lookAhead, 700);
});

test("motion does not move a style row and dials are clamped", () => {
  assert.equal(deriveRun({motion: 1}).range, 400);
  assert.equal(deriveRun({style: 2}).range, 900);
  assert.equal(deriveRun({style: -1}).range, 250);
});

test("every row names a dial the derivation knows", () => {
  for (const row of RUN_TABLE) {
    assert.ok(["style", "motion"].includes(row.dial), row.name);
    assert.equal(row.values.length, 3, row.name);
  }
});
