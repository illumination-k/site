import { apply, tw } from "@twind/core";

type TagProps = {
  tag: string;
  className?: string;
};

export default function Tag({ tag, className }: TagProps) {
  return (
    <span
      className={tw(apply(
        "rounded-3xl bg-blue-100 px-4 py-1 text-sans",
        className,
      ))}
    >
      {tag}
    </span>
  );
}
