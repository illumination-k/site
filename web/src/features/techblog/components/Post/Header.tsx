import type { PostMeta } from "common";

interface Props {
  className?: string;
  meta: PostMeta;
}

export default function Header({ meta }: Props) {
  return (
    <>
      {meta.tags.includes("archive")
        ? (
          <div className="bg-yellow-100 text-lg text-center font-bold rounded-full p-3 mx-2">
            この記事はArchiveされています。記事の内容が古い可能性が高いです。
          </div>
        )
        : null}

      {meta.tags.includes("draft")
        ? (
          <div className="bg-gray-100 text-lg text-center font-bold rounded-full p-3 mx-2">
            この記事はドラフト段階です。
          </div>
        )
        : null}
    </>
  );
}
