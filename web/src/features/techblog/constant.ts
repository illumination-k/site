import DumpRepository from "../articles/repository/dump";
import BlogService from "../articles/service";

const dumpFile = "./dump/techblog.json";
const dumpRepository = new DumpRepository(dumpFile);

export const blogService = new BlogService(dumpRepository);
