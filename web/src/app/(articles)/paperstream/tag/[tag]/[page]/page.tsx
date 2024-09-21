import { TagPagerFactory } from "@/app/(articles)/_factory/tagFactory";
import { paperStreamService } from "@/features/paperStream/constants";

const factory = new TagPagerFactory("paperstream", paperStreamService);

export const generateStaticParams = factory.createGenerateStaticParamsFn();

export default factory.createPage();
