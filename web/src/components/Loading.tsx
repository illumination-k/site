import { css } from "@/styled-system/css";

export default function Loading() {
  return (
    <div
      className={css({
        display: "flex",
        justifyContent: "center",
        gap: 2,
      })}
      aria-label="loading"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={css({
            animation: "ping",
            h: 2,
            w: 2,
            bg: "blue.600",
            rounded: "full",
          })}
        />
      ))}
    </div>
  );
}
