import type { QueueDriver } from "./interface";

/** Redis-backed queue driver — placeholder for when Redis infrastructure is available. */
export class RedisQueueDriver implements QueueDriver {
    async submit(queue: string, payload: any): Promise<boolean> {
        console.warn("[RedisQueue] not yet implemented, falling back to inline");
        if (typeof payload?.handler === "function") {
            try {
                await payload.handler();
            } catch (e) {
                console.error(`[RedisQueue] task ${queue} failed:`, e);
                return false;
            }
        }
        return true;
    }
}
