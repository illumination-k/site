import type { Metadata, ResolvingMetadata } from "next";
import { z } from "zod";

import { withZodPage } from "@/app/_util/withZodPage";
import Post from "@/features/articles/components/Post";
import type BlogService from "@/features/articles/service";

const paramsSchema = z.object({ uuid: z.string().uuid() });

type Params = z.input<typeof paramsSchema>;

export default class PostPageFactory {
  private blogService: BlogService;
  private prefix: string;

  constructor(prefix: string, blogService: BlogService) {
    this.prefix = prefix;
    this.blogService = blogService;
  }

  public createGenerateStaticParamsFn(): () => Promise<Params[]> {
    return async () => {
      const posts = await this.blogService.repo.filterPosts("ja");
      const params = posts.map((post) => ({ uuid: post.meta.uuid }));
      return params;
    };
  }

  public createGenerateMetadataFn() {
    return async (
      { params }: { params: Promise<Params> },
      _parent: ResolvingMetadata,
    ): Promise<Metadata> => {
      const _params = await params;
      const post = await this.blogService.repo.retrieve(_params.uuid);
      if (!post) {
        throw `${_params.uuid} is not found`;
      }

      const url = `https://www.illumination-k.dev/${this.prefix}/post/${post.meta.uuid}`;

      return {
        title: post.meta.title,
        description: post.meta.description,
        openGraph: {
          type: "article",
          title: post.meta.title,
          description: post.meta.description,
          url,
          publishedTime: post.meta.created_at,
          modifiedTime: post.meta.updated_at,
          tags: post.meta.tags,
          locale: post.meta.lang === "ja" ? "ja_JP" : "en_US",
          images: [
            {
              url: `/og/${this.prefix}/${post.meta.uuid}.png`,
              width: 1200,
              height: 630,
              alt: post.meta.title,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: post.meta.title,
          description: post.meta.description,
          images: [`/og/${this.prefix}/${post.meta.uuid}.png`],
        },
      };
    };
  }

  public createPostPage() {
    return withZodPage({ params: paramsSchema }, async ({ params }) => {
      const post = await this.blogService.repo.retrieve(params.uuid);

      if (!post) {
        throw `${params.uuid} is not found`;
      }

      const relatedPostMeta = await this.blogService.getRelatedPostMeta(
        post.meta,
      );

      return (
        <Post
          meta={post.meta}
          headings={post.headings}
          prefix={this.prefix}
          relatedPostMeta={relatedPostMeta}
          compiledMarkdown={post.compiledMarkdown}
        />
      );
    });
  }
}
