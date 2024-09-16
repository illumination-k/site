import { z } from "zod";
import type { ArgumentsCamelCase, Argv } from "yargs";

function zodTypeToYargsType(schema: z.ZodSchema): "string" | "number" | "boolean" {
    let _schema = schema;

    if (schema instanceof z.ZodEffects) {
        _schema = schema._def.schema;
    }

    if (_schema instanceof z.ZodString) {
        return "string";
    } else if (_schema instanceof z.ZodNumber) {
        return "number";
    } else if (_schema instanceof z.ZodBoolean) {
        return "boolean";
    } else {
        throw new Error(`Invalid schema: ${schema}`);
    }
}
function isZodSchema(obj: unknown): obj is z.ZodSchema {
  return obj instanceof z.ZodSchema;
}

function isZodEffects(obj: unknown): obj is z.ZodEffects<any, any> {
    return obj instanceof z.ZodEffects;
    }

export function zArgs<T extends z.ZodObject<any>>(
  schema: T,
  handler: (argv: z.infer<T>) => Promise<void> | void,
): [(yargs: Argv) => void, (argv: ArgumentsCamelCase) => Promise<void> | void] {
  for (const key of Object.keys(schema.shape)) {
    console.log(key);
  }

  return [(yargs) => {
    for (const key of Object.keys(schema.shape)) {
      const s: unknown = schema.shape[key];

      if (isZodSchema(s)) {
        yargs.positional(key, {
          type: zodTypeToYargsType(s),
          describe: s._def.description,
        });
      } else {
        throw new Error(`Invalid schema: ${s}`);
      }
    }
  }, async (argv) => {
    const result = await schema.spa(argv);
    if (!result.success) {
      console.error(result.error);
      throw "Invalid arguments";
    }

    return await handler(result.data);
  }];
}
