import { paperStreamService } from "@/features/paperStream/constants";

import { TagTopPageFactory } from "../../_factory/tagFactory";

const factory = new TagTopPageFactory("paperstream", paperStreamService);

export const generateMetadata = factory.createGenerateMetadataFn();

export default factory.createPage();
