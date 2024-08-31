import TwitterIcon from "@/icons/TwitterIcon";
import { PostMeta } from "common";
import { TwitterIntent } from "./TwitterIntent";
import { css } from "@/styled-system/css";
import { flex } from "@/styled-system/patterns";

type Props = {
  className?: string;
  meta: PostMeta;
};

export default function LeftSidebar({ className, meta }: Props) {
  return (
    <div className={className}>
      <div className={flex({ justifyContent: "end", mr: 4 })}>
        <p>
          <TwitterIntent
            aria-label="twitter share"
            text={meta.title}
            url={`https://illumination-k.dev/techblog/post/${meta.uuid}`}
          >
            <TwitterIcon className={css({ h: 8, w: 8, rounded: "full" })} />
          </TwitterIntent>
        </p>
      </div>
    </div>
  );
}
