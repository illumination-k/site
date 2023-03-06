import "katex/dist/katex.min.css";

import { runSync } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";

export type MdViewProps = {
  compiledMarkdown: string;
  components: JSX.Element[];
};

export default function MdView({ compiledMarkdown, components }: MdViewProps) {
  const Content = runSync(compiledMarkdown, runtime).default;

  return <Content components={components} />;
}
