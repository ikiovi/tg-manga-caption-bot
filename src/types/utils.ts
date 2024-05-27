export type Empty = Record<never, never>;
export type NotUndefined<T> = T extends undefined ? never : T;
