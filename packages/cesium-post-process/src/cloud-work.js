import tasks from './cloud-tasks.js';

/** @typedef {keyof typeof tasks} CloudTask */

/**
 * A call's reply made on the page's thread.
 * @param {CloudTask} type
 * @param {any} request
 * @returns {Promise<any>}
 */
const runHere = (type, request) => Promise.try(/** @type {(request: any) => any} */ (tasks[type]), request);

/**
 * The clouds' work (cloud-tasks.js) in a module worker, off the page's thread: one worker, started
 * at the first call, doing one call at a time, so that a call aborted while it waits, a map
 * replaced before it was made, is dropped rather than made. Without a worker (Node), or once the
 * worker failed to start, the calls run on the page's thread.
 */
export class CloudWork {
  // undefined for none, or once the worker failed
  /** @type {(() => Worker) | undefined} */
  #start;
  /** @type {Worker | undefined} */
  #worker = undefined;
  /** @type {Array<{type: CloudTask, request: any, signal: AbortSignal | undefined, resolve: (reply: any) => void, reject: (reason: any) => void}>} */
  #queue = [];
  #running = false;

  /**
   * @param {(() => Worker) | undefined} start starts the worker, undefined for none
   */
  constructor(start) {
    this.#start = start;
  }

  /**
   * The reply to a call, its pixels made in the worker.
   * @template {CloudTask} T
   * @param {T} type
   * @param {Parameters<typeof tasks[T]>[0]} request
   * @param {AbortSignal} [signal] aborted while the call waits, the call is dropped, rejected with its reason
   * @returns {Promise<ReturnType<typeof tasks[T]>>}
   */
  call(type, request, signal) {
    return new Promise((resolve, reject) => {
      this.#queue.push({type, request, signal, resolve, reject});
      this.#next();
    });
  }

  #next() {
    const call = this.#running ? undefined : this.#queue.shift();
    if (!call) {
      return;
    }
    if (call.signal?.aborted) {
      call.reject(call.signal.reason);
      this.#next();
      return;
    }
    this.#running = true;
    this.#run(call.type, call.request)
      .then(call.resolve, call.reject)
      .finally(() => {
        this.#running = false;
        this.#next();
      });
  }

  /**
   * @param {CloudTask} type
   * @param {any} request
   * @returns {Promise<any>}
   */
  #run(type, request) {
    const worker = this.#startWorker();
    if (!worker) {
      return runHere(type, request);
    }
    /** @type {Promise<any>} */
    const reply = new Promise((resolve, reject) => {
      worker.onmessage = ({data}) => (data.error === undefined ? resolve(data.reply) : reject(new Error(data.error)));
      // the worker did not start, or died: this call and the next ones on the page's thread
      worker.onerror = (event) => {
        event.preventDefault();
        this.#stopWorker(event.message || 'the worker did not load');
        resolve(runHere(type, request));
      };
      worker.postMessage({type, request});
    });
    // not to keep the request alive
    return reply.finally(() => {
      worker.onmessage = worker.onerror = null;
    });
  }

  #startWorker() {
    try {
      this.#worker ??= this.#start?.();
    } catch (error) {
      this.#stopWorker(error);
    }
    return this.#worker;
  }

  /**
   * @param {any} reason
   */
  #stopWorker(reason) {
    console.warn('The clouds\' worker failed, their maps and noise are made on the page\'s thread:', reason);
    this.#worker?.terminate();
    this.#worker = undefined;
    this.#start = undefined;
  }
}

/**
 * The page's clouds' work, in cloud-worker.js where there are workers.
 */
export default new CloudWork(
  typeof Worker === 'undefined' ? undefined : () => new Worker(new URL('./cloud-worker.js', import.meta.url), {type: 'module'}),
);
