import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import type { ZodError, z } from "zod";
import { ZodType } from "zod";

interface InputProps {
  params?: Promise<unknown>;
  searchParams?: Promise<unknown>;
}

type Schema = Partial<Record<keyof InputProps, ZodType>>;
type ValidatedProps<S extends Schema> = {
  [K in keyof S]: S[K] extends ZodType ? z.infer<S[K]> : undefined;
};

type ErrorFunction = Partial<
  Record<keyof InputProps, (error?: ZodError) => never | ReactNode>
>;

function isZodType(obj: unknown): obj is ZodType {
  return obj instanceof ZodType;
}

export function withZodPage<S extends Schema>(
  schema: S,
  page: (props: ValidatedProps<S>) => ReactNode | Promise<ReactNode>,
  errors: ErrorFunction = {},
): (input: InputProps) => ReactNode | Promise<ReactNode> {
  return async (input) => {
    const validatedProps: Partial<ValidatedProps<S>> = {};
    for (const key of Object.keys(schema) as (keyof S)[]) {
      const s: unknown = schema[key];
      if (isZodType(s)) {
        const inputValue = await input[key as keyof InputProps];
        const result = await s.spa(inputValue);
        if (!result.success) {
          const errorFunction = errors[key as keyof ErrorFunction];

          if (errorFunction) {
            return errorFunction(result.error);
          } else {
            if (process.env.NODE_ENV === "development") {
              console.error(result.error);
            }
            notFound();
          }
        }

        (validatedProps as Record<string, unknown>)[key as string] =
          result.data;
      }
    }

    return page(validatedProps as ValidatedProps<S>);
  };
}
