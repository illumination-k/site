import { PostMeta } from "common";

type Props = {
  className?: string;
  meta: PostMeta;
};

export default function Sidebar({ className, meta }: Props) {
  return <aside className={className}>SideBar!</aside>;
}
