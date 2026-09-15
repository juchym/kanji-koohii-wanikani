// i don't like any of this
declare module "*.css" {}
declare module "*.css?inline" {}

declare const GM: {
    getValue<T>(key: string, defaultValue?: T): Promise<T>;
    setValue<T>(key: string, value: T): Promise<void>;
};

