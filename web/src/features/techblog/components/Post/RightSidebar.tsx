import Link from "next/link";
import type { PropsWithChildren, ReactElement } from "react";
import { cloneElement } from "react";

import { css } from "@/styled-system/css";

import {
  DocumentCheckIcon,
  DocumentPlusIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import type { Headings, PostMeta } from "common";
import type { Route } from "next";

import Toc from "./Toc";
import Tag from "../Tag";

interface Props {
  className?: string;
  meta: PostMeta;
  headings: Headings;
}

type SidebarMetaListProps = {
  className?: string;
  icon: ReactElement;
  title: ReactElement | string;
  content?: ReactElement | string;
} & PropsWithChildren;

function SidebarMetaList({
  icon,
  title,
  content,
  children,
}: SidebarMetaListProps) {
  const iconInner = cloneElement(icon, {
    className: css({ h: 4, w: 4 }),
    "aria-hidden": true,
  });

  return (
    <li className={css({ p: 2 })}>
      <div
        className={css({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span
          className={css({ display: "flex", gap: 2, alignItems: "center" })}
        >
          {iconInner}
          <p className={css({ fontWeight: "bold", fontSize: "lg" })}>{title}</p>
        </span>

        {content ? <p className={css({ px: 5 })}>{content}</p> : null}
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
            content={meta.created_at}
          />
          <SidebarMetaList
            title="更新"
            content={meta.updated_at}
            icon={<DocumentCheckIcon />}
          />
          <SidebarMetaList
            title={
              <Link
                className={css({ _hover: { color: "blue.500" } })}
                href={`/techblog/posts/${meta.uuid}` as Route}
              >
                タグ
              </Link>
            }
            icon={<TagIcon />}
          >
            <div
              className={css({
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                alignItems: "center",
                mt: 2,
              })}
            >
              {meta.tags.map((tag, i) => (
                <Tag prefix="techblog" tag={tag} key={i} />
              ))}
            </div>
          </SidebarMetaList>
        </ul>
      </article>

      <Toc
        meta={meta}
        headings={headings}
        className={css({ bg: "white", rounded: "lg", p: 2 })}
      />
    </aside>
  );
}
