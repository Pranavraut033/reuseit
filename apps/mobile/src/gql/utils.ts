// GraphQL scalar mapping
type ScalarMap = {
  DateTime: Date;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

// Unwrap InputMaybe<T> = T | null | undefined
type UnwrapMaybe<T> = T extends null | undefined ? Exclude<T, null | undefined> : T;

// Unwrap GraphQL scalar type
type UnwrapScalar<T> = T extends { input: infer V }
  ? V extends keyof ScalarMap
    ? ScalarMap[V]
    : V
  : T;

// Check if a type is primitive
type IsPrimitive<T> = T extends string | number | boolean | Date | null | undefined ? true : false;

// Recursively unwrap and flatten
type DeepUnwrap<T> = UnwrapScalar<UnwrapMaybe<T>>;

// Main flatten utility
export type Flatten<T> = {
  [K in keyof T]: DeepUnwrap<T[K]> extends (infer U)[]
    ? Flatten<U>[] // Array case: recurse into items
    : IsPrimitive<DeepUnwrap<T[K]>> extends true
      ? DeepUnwrap<T[K]> // Primitive case
      : DeepUnwrap<T[K]> extends object
        ? null extends T[K]
          ? Flatten<DeepUnwrap<T[K]>> | null
          : undefined extends T[K]
            ? Flatten<DeepUnwrap<T[K]>> | undefined
            : Flatten<DeepUnwrap<T[K]>>
        : DeepUnwrap<T[K]>;
};
