import { createClient } from "./create-client";
import { blogRoutes } from "@app2/blog/blog.router";

export const blogApi = createClient(blogRoutes);
