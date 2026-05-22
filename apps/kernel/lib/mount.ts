import path from "path";

export interface RouteMount {
    routes: { base: string; prefix: string; [key: string]: any };
    handlers: Record<string, Function>;
}

export async function mounthttp(req: Request, mounts: RouteMount[]): Promise<Response | null> {
    const url = new URL(req.url);
    const pathName = url.pathname;
    const method = req.method.toLowerCase();
    const requertQuery = Object.fromEntries(url.searchParams.entries());

    for (const mount of mounts) {
        const { routes, handlers } = mount;
        const { base, prefix } = routes;

        for (const [name, val] of Object.entries(routes)) {
            if (name === "base" || name === "prefix") continue;
            const route = val as { path: string };
            const fullPath = `${base}${prefix}${route.path}`;

            if (pathName !== fullPath) continue;

            const handler = handlers[name];
            if (!handler) continue;

            const auth = req.headers.get("token") || req.headers.get("x-api-key") || req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
            let requestBody: Record<string, any> | null = {};
            try {
                const contentType = req.headers.get("content-type") || "";
                const rawHeaders = Object.fromEntries(req.headers.entries());
                const rawBody = await req.text();
                if (contentType.includes("application/json")) {
                    requestBody = JSON.parse(rawBody);
                } else if (contentType.includes("application/x-www-form-urlencoded")) {
                    const params = new URLSearchParams(rawBody);
                    requestBody = Object.fromEntries(params.entries());
                } else {
                    try {
                        requestBody = JSON.parse(rawBody);
                    } catch {
                        const params = new URLSearchParams(rawBody);
                        requestBody = Object.fromEntries(params.entries());
                    }
                }
                (requestBody as any).__raw_body = rawBody;
                (requestBody as any).__headers = rawHeaders;
            } catch (e) {
                requestBody = null;
            }

            try {
                const result = handler && (await handler({ ...requertQuery, ...requestBody, auth }));
                if (result instanceof Response) return result;

                return new Response(JSON.stringify(result), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, token, Authorization, x-api-key",
                    },
                });
            } catch (error: any) {
                console.error(`Error in handler for ${fullPath}:`, error);
                return new Response(JSON.stringify({
                    success: false,
                    message: error?.message || error?.toString() || "Internal server error",
                    data: null
                }), {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, token, Authorization, x-api-key",
                    },
                });
            }
        }
    }

    if (method === "options") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, token, Authorization, x-api-key",
            },
        });
    }

    return null;
}

const validStaticFiles = new Set<string>();

export async function mountstatic(staticPath: string, pathName: string, appName?: string) {
    if (pathName.endsWith(".mjs")) {
        return new Response("Forbidden", { status: 403 });
    }

    let filePath = path.join(staticPath, pathName);
    if (pathName === "/" || pathName === `/${appName}`) {
        filePath = path.join(staticPath, appName ? `${appName}.html` : "index.html");
    }
    if (!validStaticFiles.has(filePath)) {
        // @ts-ignore
        const file = Bun.file(filePath);
        if (await file.exists()) {
            validStaticFiles.add(filePath);
            return new Response(file);
        }
    } else {
        // @ts-ignore
        const file = Bun.file(filePath);
        return new Response(file);
    }

    if (!pathName.startsWith("/api") && !pathName.startsWith(`/${appName}/api`)) {
        let fallback = appName ? `${appName}.html` : "index.html";
        let fallbackFile = path.join(staticPath, fallback);
        // @ts-ignore
        if (!(await Bun.file(fallbackFile).exists())) {
            fallback = "index.html";
            fallbackFile = path.join(staticPath, fallback);
        }
        // @ts-ignore
        return new Response(Bun.file(fallbackFile));
    }

    return null;
}

export const activeSockets = new Set<any>();

export function mountws(req: Request, server: any): boolean {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
        return server.upgrade(req);
    }
    return false;
}

export const wshandler = {
    open(ws: any) {
        activeSockets.add(ws);
    },
    message(ws: any, message: any) {},
    close(ws: any, code: number, message: string) {
        activeSockets.delete(ws);
    },
};

export function broadcastWsMessage(message: any) {
    const msgString = JSON.stringify(message);
    for (const ws of activeSockets) {
        try {
            ws.send(msgString);
        } catch (e) {
            try { activeSockets.delete(ws); } catch (_) {}
            console.error("Failed to send WebSocket message", e);
        }
    }
}
