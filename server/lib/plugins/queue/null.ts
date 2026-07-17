import type { QueueDriver } from "./interface";

/** Inline queue driver — runs the payload handler immediately in the current process. */
export class NullQueueDriver implements QueueDriver {
    async submit(queue: string, payload: any): Promise<boolean> {
        if (typeof payload?.handler === "function") {
            try {
                await payload.handler();
            } catch (e) {
                console.error(`[NullQueue] task ${queue} failed:`, e);
                return false;
            }
        }
        return true;
    }
}
