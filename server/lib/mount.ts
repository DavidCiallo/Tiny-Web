import { BaseRouterInstance } from "../../shared/lib/default/decorator";

export async function mounthttp(req: Request, controllers: BaseRouterInstance[]): Promise<Response | null> {
    const url = new URL(req.url);
    const pathName = url.pathname;
    const method = req.method.toLowerCase();

    for (const controller of controllers) {
        const { base, prefix, router } = controller;
        for (const item of router) {
            const { path, method: routeMethod, handler } = item;
            const fullPath = `${base}${prefix}${path}`;

            if (pathName === fullPath && method === routeMethod) {
                const auth = req.headers.get("token");
                let data: any = {};

                if (method === "get") {
                    data = Object.fromEntries(url.searchParams.entries());
                } else if (method === "post") {
                    try {
                        data = await req.json();
                    } catch (e) {
                        data = {};
                    }
                }

                const result = await handler({ ...data, auth });
                
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

    // Handle OPTIONS for CORS
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
