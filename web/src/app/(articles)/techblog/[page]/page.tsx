import { blogService } from "@/features/techblog/constant";

import PagerFactory from "../../_factory/pagerFactory";

const factory = new PagerFactory("techblog", blogService);

export const generateStaticParams = factory.createGenerateStaticParamsFn();

export default factory.createPage();
