declare const brand: unique symbol;

/** Nominal typing for primitives, e.g. `Brand<string, 'MenuItemId'>`. */
export type Brand<T, B extends string> = T & { readonly [brand]: B };
