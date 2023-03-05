import Prism from "prismjs";

import { useEffect } from "react";

export type EmbedGithubProps = {
  filename: string;
  url: string;
  dataStart: number;
  language: string;
  code: string;
};

export default function EmbedGithub({
  filename,
  url,
  dataStart,
  language,
  code,
}: EmbedGithubProps) {
  useEffect(() => Prism.highlightAll(), []);
  return (
    <div>
      <span>
        <a href={url}>{filename}</a>
      </span>
      <pre className="line-numbers language-javascript" data-start={dataStart}>
        <code className="language-javascript">{code}</code>
      </pre>
    </div>
  );
}
