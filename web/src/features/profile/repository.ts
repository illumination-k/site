import type { PathLike } from "fs";

import type { ProfileDump } from "common/profile";
import { readProfileDump } from "common/profileIo";

export default class ProfileRepository {
  private path: PathLike;
  private cache?: ProfileDump;

  constructor(path: PathLike) {
    this.path = path;
  }

  async get(): Promise<ProfileDump> {
    if (!this.cache) {
      this.cache = await readProfileDump(this.path);
    }
    return this.cache;
  }
}
