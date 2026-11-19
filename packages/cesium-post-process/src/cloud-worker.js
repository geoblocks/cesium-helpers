// The clouds' worker, started by cloud-work.js: does the work a message names and hands its pixels
// back, transferred rather than copied, or the error's message.
import tasks from './cloud-tasks.js';

self.onmessage = (/** @type {MessageEvent<{type: keyof typeof tasks, request: any}>} */ {data: {type, request}}) => {
  try {
    const reply = tasks[type](request);
    const pixels = ArrayBuffer.isView(reply) ? reply : reply.data;
    self.postMessage({reply}, {transfer: [pixels.buffer]});
  } catch (error) {
    self.postMessage({error: error instanceof Error ? error.message : String(error)});
  }
};
