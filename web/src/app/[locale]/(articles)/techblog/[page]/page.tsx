import { blogService } from "@/features/techblog/constant";

import PagerFactory from "../../_factory/pagerFactory";

const factory = new PagerFactory("techblog", blogService);

export const generateStaticParams = factory.createGenerateStaticParamsFn();
export const generateMetadata = factory.createGenerateMetadataFn();

export default factory.createPage();
