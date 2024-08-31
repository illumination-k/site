import { notFound } from "next/navigation";

import type { ZodError, z} from "zod";
import { ZodSchema } from "zod";

interface InputProps {
  params?: unknown;
  searchParams?: unknown;
}

type Schema = Partial<Record<keyof InputProps, ZodSchema>>;
type ValidatedProps<S extends Schema> = {
  [K in keyof S]: S[K] extends ZodSchema ? z.infer<S[K]> : undefined;
};

type ErrorFunction = Partial<
  Record<keyof InputProps, (error?: ZodError) => never | JSX.Element>
>;

function isZodSchema(obj: unknown): obj is ZodSchema {
  return obj instanceof ZodSchema;
}

export function withZodPage<S extends Schema>(
  schema: S,
  page: (props: ValidatedProps<S>) => JSX.Element | Promise<JSX.Element>,
  errors: ErrorFunction = {},
): (input: InputProps) => JSX.Element | Promise<JSX.Element> {
  return async (input) => {
    const validatedProps: Partial<ValidatedProps<S>> = {};
    for (const key of Object.keys(schema) as (keyof S)[]) {
      const s = schema[key];
      if (isZodSchema(s)) {
        const result = await s.spa(input[key as keyof InputProps]);
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

        validatedProps[key] = result.data; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      }
    }

    return page(validatedProps as ValidatedProps<S>);
  };
}
