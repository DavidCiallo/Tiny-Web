import { BaseRouterInstance } from "../../shared/lib/default/decorator";
import path from "path";

export async function mounthttp(req: Request, controllers: BaseRouterInstance[]): Promise<Response | null> {
    const url = new URL(req.url);
    const pathName = url.pathname;
    const method = req.method.toLowerCase();

    for (const controller of controllers) {
        const { base, prefix, router } = controller;
        for (const item of router) {
            const { path, handler } = item;
            const fullPath = `${base}${prefix}${path}`;

            if (pathName === fullPath) {
                const auth = req.headers.get("token");
                let requestBody: Record<string, any> | null = {};
                try {
                    requestBody = await req.json();
                } catch (e) {
                    requestBody = null;
                }
                const result = handler && await handler({ ...requestBody, auth });

                return new Response(JSON.stringify(result), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, token",
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
                "Access-Control-Allow-Headers": "Content-Type, token",
            },
        });
    }

    return null;
}

const validStaticFiles = new Set<string>();

export async function mountstatic(staticPath: string, pathName: string) {
    if (pathName.endsWith(".mjs")) {
        return new Response("Forbidden", { status: 403 });
    }

    let filePath = path.join(staticPath, pathName);
    if (pathName === "/") {
        filePath = path.join(staticPath, "index.html");
    }
    if (!validStaticFiles.has(filePath)) {
        const file = Bun.file(filePath);
        if (await file.exists()) {
            validStaticFiles.add(filePath);
            return new Response(file);
        }
    } else {
        const file = Bun.file(filePath);
        return new Response(file);
    }

    if (!pathName.startsWith("/api")) {
        return new Response(Bun.file(path.join(staticPath, "index.html")));
    }

    return null;
}