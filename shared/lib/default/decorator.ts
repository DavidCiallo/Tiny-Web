export interface BaseRequest {
    auth?: string;
}

type Value = string | number | boolean | null | { [key: string]: Value } | Value[];

export interface BaseResponse<T> {
    success: boolean;
    data?: Record<string, Value | T | Array<T | Value>> | Array<T | Value>;
    message?: string;
}

export type Route = { path: string; handler: Function | null; raw?: boolean };

export class BaseRouterInstance {
    base!: string;
    prefix!: string;
    router!: Route[];
    [key: string]: string | Function | Route[];
}
