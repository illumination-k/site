import { type PathLike, readFile } from "node:fs";
import { promisify } from "node:util";
import { type ProfileDump, profileDumpSchema } from "./profile";

export async function readProfileDump(path: PathLike): Promise<ProfileDump> {
  const readFileAsync = promisify(readFile);
  const _dump = JSON.parse(await (await readFileAsync(path)).toString());
  const parse = profileDumpSchema.safeParse(_dump);

  if (!parse.success) {
    console.error(parse.error);
    throw "Invalid profile dump file";
  }

  return parse.data;
}
