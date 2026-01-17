import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

// Infer output from any function returning a Promise
type InferOutput<T> = T extends (...args: never[]) => Promise<infer O> ? O : never;

// Infer input from function that takes { data: T } as first argument property
type InferInput<T> = T extends (opts: infer Opts) => Promise<unknown>
  ? Opts extends { data: infer I }
    ? I
    : never
  : never;

// Use a minimal callable interface for the constraint
interface Callable {
  // biome-ignore lint/suspicious/noExplicitAny: Required for proper type inference from TanStack server functions
  (...args: any[]): Promise<unknown>;
}

/**
 * Create a query procedure without input
 */
function createQueryProcedure<TFn extends () => Promise<unknown>>(
  path: readonly string[],
  serverFn: TFn,
) {
  return {
    query: () => serverFn() as Promise<InferOutput<TFn>>,
    queryOptions: () =>
      queryOptions({
        queryKey: path,
        queryFn: () => serverFn() as Promise<InferOutput<TFn>>,
      }),
    queryKey: () => path,
  };
}

/**
 * Create a query procedure with input
 */
function createQueryProcedureWithInput<TFn extends Callable>(
  path: readonly string[],
  serverFn: TFn,
) {
  return {
    query: (input: InferInput<TFn>) =>
      serverFn({ data: input } as Parameters<TFn>[0]) as Promise<InferOutput<TFn>>,
    queryOptions: (input: InferInput<TFn>) =>
      queryOptions({
        queryKey: [...path, input],
        queryFn: () => serverFn({ data: input } as Parameters<TFn>[0]) as Promise<InferOutput<TFn>>,
      }),
    queryKey: (input?: InferInput<TFn>) =>
      input !== undefined ? ([...path, input] as const) : path,
  };
}

/**
 * Create an infinite query procedure for paginated data
 * The input type should include an optional `cursor` field
 */
function createInfiniteQueryProcedure<
  TFn extends Callable,
  TOutput extends { nextCursor?: string | undefined },
>(path: readonly string[], serverFn: TFn) {
  type Input = InferInput<TFn>;
  type Output = InferOutput<TFn> & TOutput;

  return {
    query: (input: Input) => serverFn({ data: input } as Parameters<TFn>[0]) as Promise<Output>,
    infiniteQueryOptions: (input: Omit<Input, "cursor">) =>
      infiniteQueryOptions({
        queryKey: [...path, input] as const,
        queryFn: ({ pageParam }) =>
          serverFn({
            data: { ...input, cursor: pageParam },
          } as Parameters<TFn>[0]) as Promise<Output>,
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage: Output) => lastPage.nextCursor,
      }),
    queryKey: (input?: Omit<Input, "cursor">) =>
      input !== undefined ? ([...path, input] as const) : path,
  };
}

/**
 * Create a mutation procedure without input
 */
function createMutationProcedure<TFn extends () => Promise<unknown>>(
  path: readonly string[],
  serverFn: TFn,
) {
  return {
    mutate: () => serverFn() as Promise<InferOutput<TFn>>,
    mutationKey: () => path,
  };
}

/**
 * Create a mutation procedure with input
 */
function createMutationProcedureWithInput<TFn extends Callable>(
  path: readonly string[],
  serverFn: TFn,
) {
  return {
    mutate: (input: InferInput<TFn>) =>
      serverFn({ data: input } as Parameters<TFn>[0]) as Promise<InferOutput<TFn>>,
    mutationKey: () => path,
  };
}

export {
  createQueryProcedure,
  createQueryProcedureWithInput,
  createInfiniteQueryProcedure,
  createMutationProcedure,
  createMutationProcedureWithInput,
};
