import yargs from "yargs";
import path from "path";
import { hideBin } from "yargs/helpers";
import { getDumpPosts, writeDump } from "./io";
import { template } from "./template";

yargs(hideBin(process.argv))
  .scriptName("post-utils")
  .usage("$0 <cmd> [args]")
  .command(
    "dump",
    "Dump markdown file into json",
    (yargs) => {
      yargs.positional("mdDir", {
        type: "string",
        describe: "Root directory of the markdown files",
      });

      yargs.positional("imageDist", {
        type: "string",
        describe: "",
      });

      yargs.positional("output", {
        type: "string",
        describe: "",
        alias: ["o"],
      });
    },
    async function(argv) {
      const rootDir = path.resolve(path.join(__dirname), "../..");
      const mdDir = path.resolve(path.join(rootDir, argv.mdDir as string));
      const imageDist = path.resolve(path.join(rootDir, argv.imageDist as string));
      const output = path.resolve(path.join(rootDir, argv.output as string));
      const dumpPosts = await getDumpPosts(mdDir, imageDist);
      await writeDump(output, dumpPosts);
    },
  )
  .help().parse();
