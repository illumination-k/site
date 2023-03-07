import { Headings, PostMeta } from "common";
import Toc from "./Toc";

type Props = {
  className?: string;
  meta: PostMeta;
  headings: Headings;
};

export default function Sidebar({ className, meta, headings }: Props) {
  return (
    <aside className={className}>
      <Toc meta={meta} headings={headings} />
    </aside>
  );
}
