import { tw } from "@twind/core";
import { Headings, PostMeta } from "common";

import Tag from "../Tag";

type Props = {
  headings: Headings;
  meta: PostMeta;
};

export default function Header({ meta, headings }: Props) {
  return (
    <article className="text-center">
      <h1 className="text-4xl py-8 text-black">{meta.title}</h1>
    </article>
  );
}
