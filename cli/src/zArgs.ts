import type { ArgumentsCamelCase, Argv } from "yargs";
import { ZodBoolean, ZodNumber, ZodString, ZodType, type z } from "zod";

import { logger } from "./logger";

function zodTypeToYargsType(
  schema: z.ZodType,
): "string" | "number" | "boolean" {
  let _schema: z.ZodType = schema;

  // Zod 4: transforms/pipes use _zod.def.type === "pipe" with inner schema at _zod.def.in
  if (
    "_zod" in _schema &&
    (_schema._zod.def as unknown as { type: string; in?: z.ZodType }).type ===
      "pipe"
  ) {
    _schema = (_schema._zod.def as unknown as { in: z.ZodType }).in;
  }

  if (_schema instanceof ZodString) {
    return "string";
  }

  if (_schema instanceof ZodNumber) {
    return "number";
  }

  if (_schema instanceof ZodBoolean) {
    return "boolean";
  }

  throw new Error(`Invalid schema: ${schema}`);
}
function isZodType(obj: unknown): obj is z.ZodType {
  return obj instanceof ZodType;
}

// biome-ignore lint: lint/suspicious/noExplicitAny
export function zArgs<T extends z.ZodObject<any>>(
  schema: T,
  handler: (argv: z.infer<T>) => Promise<void> | void,
): [(yargs: Argv) => void, (argv: ArgumentsCamelCase) => Promise<void> | void] {
  for (const key of Object.keys(schema.shape)) {
    logger.debug({ key }, "Registering argument");
  }

  return [
    (yargs) => {
      for (const key of Object.keys(schema.shape)) {
        const s: unknown = schema.shape[key];

        if (isZodType(s)) {
          yargs.positional(key, {
            type: zodTypeToYargsType(s),
            describe: s.description,
          });
        } else {
          throw new Error(`Invalid schema: ${s}`);
        }
      }
    },
    async (argv) => {
      const result = await schema.spa(argv);
      if (!result.success) {
        logger.error({ validationError: result.error }, "Invalid arguments");
        throw new Error("Invalid arguments");
      }

      return await handler(result.data);
    },
  ];
}
