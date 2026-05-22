import { fileURLToPath } from "url";
import path from "path";

const staticPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../dist");

import { blogMount } from "../modules/blog/blog.controller";

function getMounts() {
    return [blogMount];
}

export async function setupApp2() {
    return {
        mounts: getMounts(),
        staticPath,
    };
}
