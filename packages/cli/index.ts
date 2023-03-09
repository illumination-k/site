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

      yargs.demandCommand();
    },
    async function(argv) {
      const mdDir = argv.mdDir as string;
      const imageDist = argv.imageDist as string;
      const output = argv.output as string;
      const dumpPosts = await getDumpPosts(mdDir, imageDist);
      await writeDump(output, dumpPosts);
    },
  )
  .help().parse();
