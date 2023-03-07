import { PathLike, readFile } from "fs";
import { promisify } from "util";
import { Dump, dumpSchema } from ".";

export async function readDump(path: PathLike): Promise<Dump> {
  const readFileAsync = promisify(readFile);
  const _dump = JSON.parse(await (await readFileAsync(path)).toString());
  const parse = dumpSchema.safeParse(_dump);

  if (!parse.success) {
    console.error(parse.error);
    throw "Invalid dump file";
  }

  return parse.data;
}
