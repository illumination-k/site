import { PathLike, readFile } from "fs";
import { promisify } from "util";
import { Dump, dumpSchema } from ".";

export async function readDump(path: PathLike): Promise<Dump> {
  const readFileAsync = promisify(readFile);
  const _dump = await (await readFileAsync(path)).toJSON();

  const parse = dumpSchema.safeParse(_dump);

  if (!parse.success) {
    throw "Invalid dump file";
  }

  return parse.data;
}
