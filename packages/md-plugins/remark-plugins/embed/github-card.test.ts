import { describe, expect, it } from "vitest";

import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { remark } from "remark";

import remarkDirectiveEmbedGenerator from ".";
import GithubCardTransformer from "./github-card";

const remarkEmbed = remarkDirectiveEmbedGenerator([new GithubCardTransformer()]);
const processor = unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkEmbed)
  .use(remarkRehype)
  .use(rehypeStringify);

describe("github-card embed", () => {
  it("test oneline", async () => {
    const vfile = await processor.process(`::gh-card[illumination-k/blog]`);

    expect(vfile.value).toStrictEqual(
      "<div class=\"gh-card\"><a href=\"https://github.com/illumination-k/blog\"><img src=\"https://gh-card.dev/repos/illumination-k/blog.svg?fullname=\" alt=\"illumination-k/blog\"></a></div>",
    );
  });

  it("part of real post", async () => {
    const vfile = await remark().process(
      `## TL;DR
      
      SQLAlchemyは素晴らしいORMですが、django等と違ってテストや、migrationは自分でセットアップする必要があります。
      ツールは色々あると思いますが、今回は以下の構成で環境を整えます。また、型があると嬉しいのでmypyでチェックします。
      
      * migration -> alembic
      * test -> pytest\n\n実際にやることとしては、以下です。
      
      1. テスト環境のセットアップ
      2. UserとPostモデルを作成
      3. テスト
      4. Migration
      
      ::gh-card[illumination-k/sqlalchemy-starter]\n\n## Install`,
    );

    console.log(vfile);
  });

  it("part of real post", async () => {
    const vfile = await processor.process(
      "::gh-card[illumination-k/sqlalchemy-starter]\n\n## Install",
    );

    console.log(vfile);
  });
});
