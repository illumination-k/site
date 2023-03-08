import { DocumentCheckIcon, DocumentPlusIcon, TagIcon } from "@heroicons/react/24/outline";
import { apply, tw } from "@twind/core";
import { Headings, PostMeta } from "common";
import { formatDate } from "common/utils";
import Link from "next/link";
import { cloneElement, PropsWithChildren, ReactElement } from "react";

import Toc from "./Toc";
import Tag from "../Tag";

import Category from "@/icons/Category";
import { pagesPath } from "@/lib/$path";

type Props = {
  className?: string;
  meta: PostMeta;
  headings: Headings;
};

type SidebarMetaListProps = {
  className?: string;
  icon: ReactElement;
  title: string;
  content?: ReactElement | string;
} & PropsWithChildren;

function SidebarMetaList({ className, icon, title, content, children }: SidebarMetaListProps) {
  const iconInner = cloneElement(icon, {
    className: "icon-4",
    "aria-hidden": true,
  });

  return (
    <li className={tw(apply("py-2 px-2", className))}>
      <div className="flex items-center justify-between">
        <span className="flex gap-2 items-center">
          {iconInner}
          <p className="font-bold text-lg">{title}</p>
        </span>

        {content ? <p className="px-5">{content}</p> : null}
      </div>
      {children}
    </li>
  );
}

export default function Sidebar({ className, meta, headings }: Props) {
  return (
    <aside className={className}>
      <article className="sidebar-card mb-5">
        <ul className="divide-y">
          <SidebarMetaList
            icon={<DocumentPlusIcon />}
            title="作成"
            content={formatDate(meta.created_at)}
          />
          <SidebarMetaList title="更新" content={formatDate(meta.updated_at)} icon={<DocumentCheckIcon />} />
          <SidebarMetaList
            title="カテゴリ"
            content={
              <Link
                className="hover:text-blue-400"
                href={pagesPath.techblog.categories._category(meta.category)._page(1).$url()}
              >
                {meta.category}
              </Link>
            }
            icon={<Category />}
          />
          <SidebarMetaList title="Tag" icon={<TagIcon />}>
            <div className="flex gap-2 items-center mt-2">
              {meta.tags.map((tag, i) => <Tag tag={tag} key={i} />)}
            </div>
          </SidebarMetaList>
        </ul>
      </article>
      <Toc meta={meta} headings={headings} className="sidebar-card" />
    </aside>
  );
}
