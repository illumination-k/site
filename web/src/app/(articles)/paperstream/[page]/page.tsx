import { paperStreamService } from "@/features/paperStream/constants";

import PagerFactory from "../../_factory/pagerFactory";

const factory = new PagerFactory("paperstream", paperStreamService);

export const generateStaticParams = factory.createGenerateStaticParamsFn();
export const generateMetadata = factory.createGenerateMetadataFn();

export default factory.createPage();
