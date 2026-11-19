import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CloudWork} from './cloud-work.js';
import tasks from './cloud-tasks.js';

// a worker that answers as cloud-worker.js does, a moment later, and records the calls it was
// posted; or fails to start, as one whose module does not load
class FakeWorker {
  /** @type {Array<{type: string, request: any}>} */
  posted = [];
  /** @type {((event: any) => void) | null} */
  onmessage = null;
  /** @type {((event: any) => void) | null} */
  onerror = null;
  terminated = false;

  constructor(fails = false) {
    this.fails = fails;
  }

  /** @param {{type: keyof typeof tasks, request: any}} message */
  postMessage(message) {
    this.posted.push(message);
    setImmediate(() => {
      if (this.fails) {
        this.onerror?.({message: 'failed', preventDefault: () => {}});
      } else {
        this.onmessage?.({data: {reply: /** @type {Function} */ (tasks[message.type])(message.request)}});
      }
    });
  }

  terminate() {
    this.terminated = true;
  }
}

test('the calls are made in the worker, one at a time, the worker started once', async () => {
  const workers = /** @type {FakeWorker[]} */ ([]);
  const work = new CloudWork(() => /** @type {any} */ (workers[workers.push(new FakeWorker()) - 1]));
  const [noise, detail] = await Promise.all([work.call('mapNoise', 4), work.call('cloudDetail', 4)]);
  assert.equal(noise.length, 4 * 4 * 4);
  assert.equal(detail.length, 4 ** 3 * 4);
  assert.equal(workers.length, 1);
  assert.deepEqual(workers[0].posted.map(({type}) => type), ['mapNoise', 'cloudDetail']);
});

test('a call aborted while it waits is dropped, rejected with the signal\'s reason', async () => {
  const worker = new FakeWorker();
  const work = new CloudWork(() => /** @type {any} */ (worker));
  const controller = new AbortController();
  const first = work.call('mapNoise', 4);
  const dropped = work.call('mapNoise', 8, controller.signal);
  controller.abort();
  await first;
  await assert.rejects(dropped, {name: 'AbortError'});
  assert.equal(worker.posted.length, 1);
});

test('without a worker, or once it failed to start, the calls run on the page\'s thread, with a warning', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  assert.equal((await new CloudWork(undefined).call('mapNoise', 4)).length, 4 * 4 * 4);
  const worker = new FakeWorker(true);
  let started = 0;
  const work = new CloudWork(() => (started++, /** @type {any} */ (worker)));
  assert.equal((await work.call('mapNoise', 4)).length, 4 * 4 * 4);
  assert.equal(worker.terminated, true);
  assert.equal((await work.call('mapNoise', 4)).length, 4 * 4 * 4);
  assert.equal(started, 1);
  assert.equal(worker.posted.length, 1);
  assert.equal(warn.mock.callCount(), 1);
});

test('an error in the work rejects its call', async () => {
  const work = new CloudWork(undefined);
  await assert.rejects(work.call('cloudMap', /** @type {any} */ ({})));
});
