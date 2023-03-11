import TwitterIcon from "@/icons/TwitterIcon";
import { PostMeta } from "common";
import { TwitterIntent } from "./TwitterIntent";

type Props = {
  className?: string;
  meta: PostMeta;
};

export default function LeftSidebar({ className, meta }: Props) {
  return (
    <div className={className}>
      <div className="flex justify-end mr-4">
        <p>
          <TwitterIntent
            aria-label="twitter share"
            text={meta.title}
            url={`https://illumination-k.dev/techblog/post/${meta.uuid}`}
          >
            <TwitterIcon className="rounded-full icon-10" />
          </TwitterIntent>
        </p>
      </div>
    </div>
  );
}
