import { paperStreamService } from "@/features/paperStream/constants";

import PagerFactory from "../../_factory/pagerFactory";

const factory = new PagerFactory("paperstream", paperStreamService);

export const generateStaticParams = factory.createGenerateStaticParamsFn();

export default factory.createPage();
