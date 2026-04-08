import { TagPagerFactory } from "@/app/[locale]/(articles)/_factory/tagFactory";
import { blogService } from "@/features/techblog/constant";

const factory = new TagPagerFactory("techblog", blogService);

export const generateStaticParams = factory.createGenerateStaticParamsFn();
export const generateMetadata = factory.createGenerateMetadataFn();

export default factory.createPage();
