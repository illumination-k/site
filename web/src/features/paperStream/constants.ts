import DumpRepository from "../articles/repository/dump";
import BlogService from "../articles/service";

const dumpFile = "./dump/paperStream.json";
const dumpRepository = new DumpRepository(dumpFile);

export const paperStreamService = new BlogService(dumpRepository);
