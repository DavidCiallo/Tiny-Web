export interface BaseRequest {
    auth?: string;
}

type Value = string | number | boolean | undefined | null | { [key: string]: Value } | Value[];

export interface BaseResponse<T> {
    success: boolean;
    data?: Record<string, Value | T | Array<T | Value>> | Array<T | Value>;
    message?: string;
}

export type Route = { path: string; method: string; handler: Function | null };

export type HTTPMethodConstructor = Route;
export class BaseRouterInstance {
    base!: string;
    prefix!: string;
    router!: Array<{
        path: string;
        method: string;
        handler: Function | null;
    }>;
    [key: string]: string | Function | HTTPMethodConstructor[] | ((...args: any) => Promise<any>);
}
