import yargs from "yargs";
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
        requried: true,
      });
    },
    async function(argv) {
      const dumpPosts = await getDumpPosts(argv.mdDir as string);
      await writeDump("./test.json", dumpPosts);
    },
  )
  .help().parse();
