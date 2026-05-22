import Repository from "../../../../kernel/lib/repository";
import { BlogEntity } from "../../../shared/modules/blog/blog.entity";

const blogRepository: Repository<BlogEntity> = Repository.instance("Blog");

export class BlogService {
    static async find(page: number): Promise<{ list: BlogEntity[]; total: number }> {
        const list = await blogRepository.find({}, page, 10);
        const total = await blogRepository.count();
        return { list, total };
    }

    static async create(title: string, content: string): Promise<BlogEntity> {
        return await blogRepository.insert({ title, content });
    }
}
