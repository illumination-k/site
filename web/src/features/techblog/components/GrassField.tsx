import { css } from "@/styled-system/css";

const BLADE_COUNT = 80;

interface Blade {
  left: number;
  height: number;
  width: number;
  delay: number;
  duration: number;
  hue: number;
}

const frac = (n: number): number => n - Math.floor(n);
const pseudoRandom = (i: number, salt: number): number =>
  frac(Math.sin(i * salt) * 43758.5453);

const BLADES: readonly Blade[] = Array.from({ length: BLADE_COUNT }, (_, i) => {
  const r1 = pseudoRandom(i + 1, 12.9898);
  const r2 = pseudoRandom(i + 1, 78.233);
  const r3 = pseudoRandom(i + 1, 39.346);
  return {
    left: (i / BLADE_COUNT) * 100 + (r1 - 0.5) * 1.4,
    height: 36 + r2 * 40,
    width: 2.4 + r3 * 1.6,
    delay: r1 * 3,
    duration: 2.6 + r2 * 1.8,
    hue: 92 + Math.floor((r3 + r2) * 18),
  };
});

const fieldStyle = css({
  position: "relative",
  width: "100%",
  height: { base: "84px", md: "108px" },
  marginBottom: 6,
  overflow: "hidden",
  pointerEvents: "none",
});

const bladeStyle = css({
  position: "absolute",
  bottom: 0,
  borderTopLeftRadius: "999px",
  borderTopRightRadius: "999px",
  transformOrigin: "bottom center",
  willChange: "transform",
  animationName: "grassSway",
  animationIterationCount: "infinite",
  animationTimingFunction: "ease-in-out",
  animationDirection: "alternate",
});

export default function GrassField() {
  return (
    <div className={fieldStyle} aria-hidden="true">
      {BLADES.map((b, i) => (
        <span
          key={i}
          className={bladeStyle}
          style={{
            left: `${b.left}%`,
            height: `${b.height}px`,
            width: `${b.width}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            background: `linear-gradient(to top, hsl(${b.hue}, 55%, 26%), hsl(${b.hue + 10}, 70%, 48%))`,
          }}
        />
      ))}
    </div>
  );
}
