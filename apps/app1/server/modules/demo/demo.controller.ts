import { DemoEntity, DemoDTO } from "../../../shared/modules/demo/demo.entity";
import { DemoListRequest, DemoListResponse, DemoCreateRequest, DemoCreateResponse } from "../../../shared/modules/demo/demo.interface";
import { demoToutes } from "../../../shared/modules/demo/demo.router";
import { getIdentifyByVerify } from "../auth/auth.service";
import { DemoService } from "./demo.service";

export const demoMount = {
    routes: demoToutes,
    handlers: {
        async list(request: any): Promise<DemoListResponse> {
            const req = DemoListRequest.self(request);
            if (!req.auth || !getIdentifyByVerify(req.auth)) {
                throw "Authorization failed";
            }

            const search: Partial<DemoEntity> = {};
            if (req.filter?.name) search.name = req.filter.name;

            const { list: data, total } = await DemoService.find(req.page, search);
            const list = data.map((item) => new DemoDTO(item));

            return new DemoListResponse({
                success: true,
                data: { list, total },
                message: "success",
            });
        },

        async create(request: any): Promise<DemoCreateResponse> {
            const req = DemoCreateRequest.self(request);
            if (!req.items || !req.items.length) {
                throw "miss params";
            }
            if (!req.auth || !getIdentifyByVerify(req.auth)) {
                throw "Authorization failed";
            }

            const data = await DemoService.createMany(req.items);
            const list = data.map((item) => new DemoDTO(item));

            return new DemoCreateResponse({
                success: true,
                data: { list },
                message: "success",
            });
        },
    },
};
