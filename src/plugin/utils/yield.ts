/**
 * Hand control back to Figma so it can paint and deliver queued messages.
 *
 * `await Promise.resolve()` looks like it does this and does not: a microtask
 * drains inside the task that scheduled it, so the sandbox never returns to the
 * host loop. Everything a long run posts with `figma.ui.postMessage` sits in the
 * queue until the whole run finishes, which means the progress bar jumps from 0
 * to 100 at the end and Figma is unresponsive in between — the plugin looks
 * frozen precisely while it is doing the most work.
 *
 * setTimeout is a macrotask and is available in the plugin sandbox, so this is
 * the yield that actually lets the panel update.
 *
 * Each call costs a frame, so yield per page or per batch of nodes — not per
 * node. Yielding per node on a large file is slower than not yielding at all.
 */
export function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
