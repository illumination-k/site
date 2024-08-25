import { TagIcon } from "@heroicons/react/24/outline";
import { PostMeta } from "common";
import Link from "next/link";

import Tag from "./Tag";

import Category from "@/icons/Category";
import { pagesPath } from "@/lib/$path";

export default function PostCard({ meta }: { meta: PostMeta }) {
  return (
    <article className="px-8 py-2 rounded-lg bg-white my-3 mx-4 border-1">
      <h2 className="font-bold text-2xl flex justify-between hover:text-blue-400">
        <Link className="border-b-2 hover:border-blue-300 px-2" href={pagesPath.techblog.post._uuid(meta.uuid).$url()}>
          {meta.title}
        </Link>
      </h2>

      <div className="px-3 pt-2 flex gap-2">
        <p className="font-bold">作成</p>
        <p>{meta.created_at}</p>
        <p className="font-bold">更新</p>
        <p>{meta.updated_at}</p>
      </div>
      <div className="px-3 md:flex gap-4 items-center">
        <div className="flex gap-2 py-2 items-center font-bold">
          <Category className="icon-5" />
          <Link
            className="hover:text-blue-400"
            href={pagesPath.techblog.categories._category(meta.category)._page(1).$url()}
          >
            {meta.category}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 py-2 items-center">
          <TagIcon className="icon-5 hidden md:block" />
          {meta.tags.map((tag, i) => <Tag tag={tag} key={i} />)}
        </div>
      </div>

      <p className="px-2">{meta.description}</p>
    </article>
  );
}
