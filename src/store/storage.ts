/* eslint-disable @typescript-eslint/no-explicit-any */
import { isObject } from "lodash-es";

export type StorageKeysType = {
  todayMulDeal: Record<string, string>;
  todayNoMulDeal: Record<string, string>;
};

class Storage<T extends keyof StorageKeysType> {
  async set(key: string, data: StorageKeysType[T], expire?: number) {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        data,
        expire: expire ? new Date().getTime() + expire : undefined,
      })
    );
  }

  get(key: string, defaultValue: unknown = null) {
    const data = window.localStorage.getItem(key) ?? null;
    const user = (typeof data === "string"
      ? JSON.parse(data)
      : data) as unknown as {
      expire?: number;
      data?: StorageKeysType[T];
    };
    if (user && isObject(user)) {
      if (user.expire) {
        if (user.expire && user.expire < new Date().getTime()) {
          return defaultValue;
        }
      }
      return user.data ?? user;
    }
    return defaultValue;
  }

  remove(key: string) {
    window.localStorage.removeItem(key);
  }
}

type RestParameters<T extends (...args: any[]) => any> = T extends (
  arg1: any,
  ...args: infer R
) => any
  ? R
  : never;

type OmitFunctionFirstParameters<T extends (...args: any[]) => any> = (
  ...args: RestParameters<T>
) => ReturnType<T>;

type StorageInstance<T extends keyof StorageKeysType> = InstanceType<
  typeof Storage<T>
>;

type StorageType<E extends keyof StorageKeysType> = {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  [T in keyof StorageInstance<E>]: StorageInstance<E>[T] extends Function
    ? OmitFunctionFirstParameters<StorageInstance<E>[T]>
    : never;
};

export const storage = new Proxy<{
  [T in keyof StorageKeysType]: StorageType<T>;
}>(
  new Storage() as any,
  {
    get<T extends keyof StorageKeysType>(
      target: StorageInstance<T>,
      propKey: T
    ) {
      return {
        get: (defaultValue = null) => target.get(propKey, defaultValue),
        set: (data: any, expire?: number) => target.set(propKey, data, expire),
        remove: () => target.remove(propKey),
      };
    },
  } as any
);
