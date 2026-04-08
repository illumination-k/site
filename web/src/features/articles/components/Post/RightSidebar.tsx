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

import SearchBar from "./SearchBar";
import Toc from "./Toc";
import Tag from "../Tag";

interface Props {
  className?: string;
  meta: PostMeta;
  headings: Headings;
  prefix: string;
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
  const iconInner = cloneElement(
    icon as ReactElement<Record<string, unknown>>,
    {
      className: css({ h: 4, w: 4, color: "text.tertiary" }),
      "aria-hidden": true,
    },
  );

  return (
    <li
      className={css({
        p: 2,
        borderTopWidth: 1,
        borderTopColor: "border.default",
        _first: { borderTopWidth: 0 },
      })}
    >
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
          <p
            className={css({
              fontWeight: "bold",
              fontSize: "lg",
              color: "text.secondary",
            })}
          >
            {title}
          </p>
        </span>

        {content ? (
          <p className={css({ px: 5, color: "text.primary" })}>{content}</p>
        ) : null}
      </div>
      {children}
    </li>
  );
}

export default function Sidebar({ className, meta, headings, prefix }: Props) {
  return (
    <aside className={className}>
      <article
        className={css({
          bg: "bg.surface",
          rounded: "xl",
          p: 4,
          borderWidth: 1,
          borderColor: "border.default",
          mb: 5,
        })}
      >
        <ul>
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
                className={css({ _hover: { color: "accent.primary" } })}
                href={`/${prefix}/post/${meta.uuid}` as Route}
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
                <Tag prefix={prefix} tag={tag} key={i} />
              ))}
            </div>
          </SidebarMetaList>
        </ul>
      </article>

      <SearchBar
        className={css({ my: 5 })}
        category={prefix}
        locale={prefix.split("/")[0]}
      />

      <Toc
        meta={meta}
        headings={headings}
        className={css({
          bg: "bg.surface",
          rounded: "xl",
          p: 4,
          borderWidth: 1,
          borderColor: "border.default",
        })}
      />
    </aside>
  );
}
