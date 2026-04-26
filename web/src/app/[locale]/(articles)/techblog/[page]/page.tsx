import GrassField from "@/features/techblog/components/GrassField";
import { blogService } from "@/features/techblog/constant";

import PagerFactory from "../../_factory/pagerFactory";

const factory = new PagerFactory("techblog", blogService, {
  renderHeader: (page) => (page === 1 ? <GrassField /> : null),
});

export const generateStaticParams = factory.createGenerateStaticParamsFn();
export const generateMetadata = factory.createGenerateMetadataFn();

export default factory.createPage();
