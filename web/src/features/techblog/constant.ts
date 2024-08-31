import DumpRepository from "./repository/dump";
import BlogService from "./service";

const dumpFile = "./dump/techblog.json";
const dumpRepository = new DumpRepository(dumpFile);

export const blogService = new BlogService(dumpRepository);
