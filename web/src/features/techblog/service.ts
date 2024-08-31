import type { PostMeta } from "common";

import type { IBlogRepository } from "./repository";

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length; i > 1; i--) {
    const r = Math.floor(Math.random() * i);
    const temp = array[r];
    array[r] = array[i - 1];
    array[i - 1] = temp;
  }

  return array;
}

export default class BlogService {
  repo: IBlogRepository;

  constructor(repo: IBlogRepository) {
    this.repo = repo;
  }

  async getRelatedPostMeta(meta: PostMeta): Promise<PostMeta[]> {
    // langが一致かつuuidが違う、tagがarchive, draftでない
    const restPostMetas = shuffle(await this.repo.list())
      .filter(
        (post) =>
          post.meta.uuid !== meta.uuid
          && post.meta.lang === meta.lang
          && !post.meta.tags.includes("archive")
          && !post.meta.tags.includes("draft"),
      )
      .map((post) => post.meta);

    // tagが一致しているポスト
    let relatedPostMetas = restPostMetas.filter((restMeta) => {
      if (meta.tags.filter((tag) => restMeta.tags.includes(tag)).length !== 0) {
        return true;
      }

      return false;
    });

    // 関係しているポストが足りなければ、ランダムにポストを加える
    if (relatedPostMetas.length < 6) {
      let restCount = 6 - relatedPostMetas.length;
      let postMetaIndex = 0;

      const relatedPostMetaUuids = relatedPostMetas.map((m) => m.uuid);

      while (restCount !== 0) {
        const curPostMeta = restPostMetas[postMetaIndex];
        if (!relatedPostMetaUuids.includes(curPostMeta.uuid)) {
          relatedPostMetas.push(curPostMeta);
          relatedPostMetaUuids.push(curPostMeta.uuid);
          restCount -= 1;
        }

        postMetaIndex += 1;
      }
    } else {
      relatedPostMetas = relatedPostMetas.slice(0, 6);
    }

    return relatedPostMetas;
  }
}
