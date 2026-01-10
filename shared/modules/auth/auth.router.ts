import { BaseRequest, BaseResponse, BaseRouterInstance } from "../../lib/default/decorator";

export class AuthRouterInstance extends BaseRouterInstance {
    base = "/api";
    prefix = "/auth";
    router = [
        {
            path: "/login",
            method: "post",
            handler: Function,
        },
        {
            path: "/register",
            method: "post",
            handler: Function,
        },
    ];

    alive!: (request: AliveRequest) => Promise<AliveResponse>;
    login!: (request: AuthBody) => Promise<LoginResult>;
    register!: (request: AuthBody) => Promise<RegisterResult>;

    constructor(
        inject: Function,
        functions?: {
            alive: (request: AliveRequest) => Promise<AliveResponse>;
            login: (request: AuthBody) => Promise<LoginResult>;
            register: (request: AuthBody) => Promise<RegisterResult>;
        }
    ) {
        super();
        inject(this, functions);
    }
}

export interface AuthBody {
    name?: string;
    email?: string;
    password?: string;
}

export interface AliveRequest extends BaseRequest {}

export interface AliveResponse extends BaseResponse<{}> {}

export interface LoginResult extends BaseResponse<{}> {
    data?: {
        token: string;
    };
}

export interface RegisterResult extends BaseResponse<{}> {}
