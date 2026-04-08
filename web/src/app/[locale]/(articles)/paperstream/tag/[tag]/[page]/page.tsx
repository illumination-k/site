import { TagPagerFactory } from "@/app/[locale]/(articles)/_factory/tagFactory";
import { paperStreamService } from "@/features/paperStream/constants";

const factory = new TagPagerFactory("paperstream", paperStreamService);

export const generateStaticParams = factory.createGenerateStaticParamsFn();
export const generateMetadata = factory.createGenerateMetadataFn();

export default factory.createPage();
