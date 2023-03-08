import { apply, tw } from "@twind/core";
import { Headings, PostMeta } from "common";

type Props = {
  className?: string;
  headings: Headings;
  meta: PostMeta;
};

export default function Header({ meta, headings, className }: Props) {
  return (
    <article className={tw(apply("text-center", className))}>
      <h1 className="text-4xl py-8 text-black">{meta.title}</h1>
    </article>
  );
}
