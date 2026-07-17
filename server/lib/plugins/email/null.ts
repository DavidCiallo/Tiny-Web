import type { EmailDriver } from "./interface";

/** No-op email driver — used when no provider is configured. Logs to console in dev. */
export class NullDriver implements EmailDriver {
    async send(params: { to: string; subject: string; html: string }): Promise<boolean> {
        console.log("[Email/Null] would send:", params.to, params.subject);
        return true;
    }
}
