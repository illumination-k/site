import { tw } from "@twind/core";
import { Headings, PostMeta } from "common";
import Tag from "../Tag";

type Props = {
  headings: Headings;
  meta: PostMeta;
};

export default function Header({ meta, headings }: Props) {
  return (
    <article>
      <h1>{meta.title}</h1>

      <div className="flex gap-2 my-2">
        {meta.tags.map((tag, i) => <Tag tag={tag} key={i} />)}
      </div>

      <details>
        <summary>{meta.lang === "ja" ? "目次" : "Content"}</summary>
        <ul className="list-none">
          {headings.map(({ value, depth }, i) => {
            return <li key={i} className={tw(`px-${(depth - 1) * 2}`)}>{value}</li>;
          })}
        </ul>
      </details>
      {/* n 年以上前更新なら warning */}
      {}
    </article>
  );
}
