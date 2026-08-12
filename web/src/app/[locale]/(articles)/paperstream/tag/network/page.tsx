import { paperStreamService } from "@/features/paperStream/constants";

import TagNetworkPageFactory from "../../../_factory/tagNetworkFactory";

const factory = new TagNetworkPageFactory("paperstream", paperStreamService);

export const generateMetadata = factory.createGenerateMetadataFn();

export default factory.createPage();
