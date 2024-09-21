import PostPageFactory from "@/app/(articles)/_factory/postPageFactory";
import { paperStreamService } from "@/features/paperStream/constants";

const postPageFactory = new PostPageFactory("paperstream", paperStreamService);

export const generateStaticParams =
  postPageFactory.createGenerateStaticParamsFn();

export const generateMetadata = postPageFactory.createGenerateMetadataFn();

export default postPageFactory.createPostPage();
