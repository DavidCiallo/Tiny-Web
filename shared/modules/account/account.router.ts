import { AccountDTO } from "./account.dto";
import { BaseRequest, BaseResponse, BaseRouterInstance } from "../../lib/default/decorator";

export class AccountRouterInstance extends BaseRouterInstance {
    base = "/api";
    prefix = "/account";
    router = [
        { path: "/list", method: "get", handler: Function },
        { path: "/detail", method: "get", handler: Function },
        { path: "/create", method: "post", handler: Function },
        { path: "/update", method: "put", handler: Function },
        { path: "/delete", method: "delete", handler: Function },
    ];

    list!: (query: AccountListQuery) => Promise<AccountListResponse>;
    detail!: (query: AccountDetailQuery) => Promise<AccountDetailResponse>;
    create!: (body: AccountCreateBody) => Promise<AccountCreateResponse>;
    update!: (body: AccountUpdateBody) => Promise<AccountUpdateResponse>;
    delete!: (body: AccountDeleteBody) => Promise<AccountDeleteResponse>;

    constructor(inject: Function, functions?: {
        list: (query: AccountListQuery) => Promise<AccountListResponse>,
        detail: (query: AccountDetailQuery) => Promise<AccountDetailResponse>,
        create: (body: AccountCreateBody) => Promise<AccountCreateResponse>,
        update: (body: AccountUpdateBody) => Promise<AccountUpdateResponse>,
        delete: (body: AccountDeleteBody) => Promise<AccountDeleteResponse>
    }) {
        super();
        inject(this, functions);
    }
}

export interface AccountListQuery extends BaseRequest {
    page: number;
}

export interface AccountListResponse extends BaseResponse<AccountDTO> {
    data: {
        list: AccountDTO[],
        total: number
    };
}

export interface AccountDetailQuery extends BaseRequest {
    id: string;
}

export interface AccountDetailResponse extends BaseResponse<AccountDTO> {
    data: {
        account: AccountDTO
    };
}

export interface AccountCreateBody extends BaseRequest {
    account: AccountDTO;
}

export interface AccountCreateResponse extends BaseResponse<AccountDTO> {
    data: {
        account: AccountDTO
    };
}

export interface AccountUpdateBody extends BaseRequest {
    id: string;
    account: AccountDTO;
}

export interface AccountUpdateResponse extends BaseResponse<AccountDTO> {
    data: {
        account: AccountDTO
    };
}

export interface AccountDeleteBody extends BaseRequest {
    id: string;
}

export interface AccountDeleteResponse extends BaseResponse<AccountDTO> { }