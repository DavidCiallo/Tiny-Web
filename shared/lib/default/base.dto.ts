export abstract class BaseDTO {
    static fromJSON<T extends BaseDTO>(this: new () => T, json: string): T {
        const instance = new this();
        console.log(json)
        const data = JSON.parse(json);
        if (!data) return instance;

        Object.keys(data).forEach((key) => {
            if (key in instance) {
                (instance as any)[key] = data[key];
            }
        });
        return instance;
    }

    abstract toJSON(): object;
}