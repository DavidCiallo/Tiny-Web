import type { QueueDriver } from "./interface";
import { NullQueueDriver } from "./null";

export class Queue {
    private static _instance: QueueDriver;

    static instance(): QueueDriver {
        if (!this._instance) {
            // Inline execution for now; swap to RedisQueueDriver when Redis is wired up
            this._instance = new NullQueueDriver();
        }
        return this._instance;
    }
}
