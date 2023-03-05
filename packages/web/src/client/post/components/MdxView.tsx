import { run } from "@mdx-js/mdx";
import { Fragment, useEffect, useState } from "react";
import * as runtime from "react/jsx-runtime";

import "prismjs/themes/prism-twilight.css";

export type MdViewProps = {
  compiledMarkdown: string;
  components: JSX.Element[];
};

export default function MdView({ compiledMarkdown, components }: MdViewProps) {
  const [mdxModule, setMdxModule] = useState<{ default: any } | undefined>();

  useEffect(() => {
    (async () => {
      setMdxModule(await run(compiledMarkdown, runtime));
    });
  });

  const Content = mdxModule ? mdxModule.default : Fragment;

  return <Content components={components} />;
}
