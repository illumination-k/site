import ProfileRepository from "./repository";

const dumpFile = "./dump/profile.json";

export const profileRepository = new ProfileRepository(dumpFile);
