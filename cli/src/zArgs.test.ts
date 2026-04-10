import { expect, it } from "vitest";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { z } from "zod";
import { zArgs } from "./zArgs";

const a = z.object({
  a: z.string().describe("test a"),
  b: z.number().describe("test b"),
});

const CMD = yargs(hideBin(process.argv));

it("zArgs", () => {
  const f = zArgs(a, (argv) => {
    expect(argv).toEqual({ a: "test", b: 1 });
  });

  console.log(f[0](CMD));
});
