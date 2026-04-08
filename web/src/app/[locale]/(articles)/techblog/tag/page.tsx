import { blogService } from "@/features/techblog/constant";

import { TagTopPageFactory } from "../../_factory/tagFactory";

const factory = new TagTopPageFactory("techblog", blogService);

export const generateMetadata = factory.createGenerateMetadataFn();

export default factory.createPage();
