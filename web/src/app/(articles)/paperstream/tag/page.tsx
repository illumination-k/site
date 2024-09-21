import { paperStreamService } from "@/features/paperStream/constants";

import { TagTopPageFactory } from "../../_factory/tagFactory";

const factory = new TagTopPageFactory("paperstream", paperStreamService);

export default factory.createPage();
