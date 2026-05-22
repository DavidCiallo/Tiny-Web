import { BlogDTO } from "../../../shared/modules/blog/blog.entity";
import { BlogListRequest, BlogListResponse, BlogCreateRequest, BlogCreateResponse } from "../../../shared/modules/blog/blog.interface";
import { blogRoutes } from "../../../shared/modules/blog/blog.router";
import { BlogService } from "./blog.service";

export const blogMount = {
    routes: blogRoutes,
    handlers: {
        async list(request: any): Promise<BlogListResponse> {
            const req = BlogListRequest.self(request);
            const { list: data, total } = await BlogService.find(req.page);
            const list = data.map((item) => new BlogDTO(item));
            return new BlogListResponse({
                success: true,
                data: { list, total },
                message: "success",
            });
        },

        async create(request: any): Promise<BlogCreateResponse> {
            const req = BlogCreateRequest.self(request);
            const data = await BlogService.create(req.title, req.content);
            const blog = new BlogDTO(data);
            return new BlogCreateResponse({
                success: true,
                data: { blog },
                message: "success",
            });
        },
    },
};
