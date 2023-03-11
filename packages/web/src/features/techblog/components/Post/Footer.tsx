import GithubIcon from "@/icons/GithubIcon";
import { BugAntIcon, ChatBubbleBottomCenterIcon } from "@heroicons/react/24/outline";
import { PostMeta } from "common";

type Props = {
  meta: PostMeta;
};

export default function Footer({ meta }: Props) {
  return (
    <div className="flex items-center flex-col mt-10">
      <p className="flex items-center gap-3 text-lg font-semibold">
        <GithubIcon className="icon-5" />
        {meta.lang === "ja"
          ? "この記事に関するIssueをGithubで作成する"
          : "Create a issue on Github about this article"}
      </p>
      <ul>
        <li>
          <a
            className="flex items-center gap-2 text-lg"
            href="https://github.com/illumination-k/site/issues/new?labels=comment,techblog"
          >
            <ChatBubbleBottomCenterIcon className="icon-5" />
            Comment
          </a>
        </li>
        <li>
          <a
            className="flex items-center gap-2 text-lg"
            href="https://github.com/illumination-k/site/issues/new?labels=bug,techblog"
          >
            <BugAntIcon className="icon-5" />
            Problem
          </a>
        </li>
      </ul>
    </div>
  );
}
