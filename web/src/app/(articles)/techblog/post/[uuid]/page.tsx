import PostPageFactory from "@/app/(articles)/_factory/postPageFactory";
import { blogService } from "@/features/techblog/constant";

const postPageFactory = new PostPageFactory("techblog", blogService);

export const generateStaticParams =
  postPageFactory.createGenerateStaticParamsFn();

export const generateMetadata = postPageFactory.createGenerateMetadataFn();

export default postPageFactory.createPostPage();
