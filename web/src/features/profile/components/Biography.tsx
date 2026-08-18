import { css } from "@/styled-system/css";

interface Props {
  paragraphs: string[];
}

export function Biography({ paragraphs }: Props) {
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: 3,
      })}
    >
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className={css({
            fontSize: { base: "sm", md: "md" },
            lineHeight: "1.8",
            color: "text.secondary",
          })}
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
