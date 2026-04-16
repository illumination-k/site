"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Route } from "next";

interface TagNode {
  tag: string;
  count: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface TagEdge {
  source: string;
  target: string;
  weight: number;
}

interface TagNetworkProps {
  nodes: { tag: string; count: number }[];
  edges: { source: string; target: string; weight: number }[];
  prefix: string;
}

const NODE_MIN_RADIUS = 8;
const NODE_MAX_RADIUS = 32;
const REPULSION = 800;
const ATTRACTION = 0.005;
const EDGE_REST_LENGTH = 120;
const DAMPING = 0.85;
const MIN_VELOCITY = 0.01;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function TagNetwork({ nodes, edges, prefix }: TagNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<TagNode[]>([]);
  const edgesRef = useRef<TagEdge[]>(edges);
  const animRef = useRef<number>(0);
  const draggingRef = useRef<TagNode | null>(null);
  const hoveredRef = useRef<TagNode | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ width: 800, height: 600 });
  const [hovered, setHovered] = useState<string | null>(null);
  const router = useRouter();

  const isDarkRef = useRef(false);

  useEffect(() => {
    const check = () => {
      const el = document.documentElement;
      isDarkRef.current = el.getAttribute("data-color-mode") === "dark";
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-mode"],
    });
    return () => observer.disconnect();
  }, []);

  // Initialize nodes with positions
  useEffect(() => {
    const maxCount = Math.max(...nodes.map((n) => n.count), 1);
    const { width, height } = sizeRef.current;
    const cx = width / 2;
    const cy = height / 2;

    nodesRef.current = nodes.map((n, i) => {
      const t = n.count / maxCount;
      const radius = lerp(NODE_MIN_RADIUS, NODE_MAX_RADIUS, t);
      const angle = (2 * Math.PI * i) / nodes.length;
      const spread = Math.min(width, height) * 0.35;
      return {
        ...n,
        x: cx + Math.cos(angle) * spread * (0.5 + Math.random() * 0.5),
        y: cy + Math.sin(angle) * spread * (0.5 + Math.random() * 0.5),
        vx: 0,
        vy: 0,
        radius,
      };
    });
    edgesRef.current = edges;
  }, [nodes, edges]);

  const simulate = useCallback(() => {
    const ns = nodesRef.current;
    const es = edgesRef.current;
    const { width, height } = sizeRef.current;

    const nodeMap = new Map<string, TagNode>();
    for (const n of ns) {
      nodeMap.set(n.tag, n);
    }

    // Repulsion between all pairs
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i];
        const b = ns[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        a.vx += dx;
        a.vy += dy;
        b.vx -= dx;
        b.vy -= dy;
      }
    }

    // Attraction along edges
    for (const e of es) {
      const a = nodeMap.get(e.source);
      const b = nodeMap.get(e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - EDGE_REST_LENGTH) * ATTRACTION * e.weight;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Center gravity
    const cx = width / 2;
    const cy = height / 2;
    for (const n of ns) {
      n.vx += (cx - n.x) * 0.001;
      n.vy += (cy - n.y) * 0.001;
    }

    // Update positions
    let moving = false;
    for (const n of ns) {
      if (n === draggingRef.current) {
        n.vx = 0;
        n.vy = 0;
        continue;
      }
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x += n.vx;
      n.y += n.vy;

      // Keep in bounds
      const margin = n.radius + 2;
      n.x = Math.max(margin, Math.min(width - margin, n.x));
      n.y = Math.max(margin, Math.min(height - margin, n.y));

      if (Math.abs(n.vx) > MIN_VELOCITY || Math.abs(n.vy) > MIN_VELOCITY) {
        moving = true;
      }
    }

    return moving;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dark = isDarkRef.current;
    const ns = nodesRef.current;
    const es = edgesRef.current;
    const nodeMap = new Map<string, TagNode>();
    for (const n of ns) {
      nodeMap.set(n.tag, n);
    }

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = sizeRef.current;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    const maxWeight = Math.max(...es.map((e) => e.weight), 1);
    for (const e of es) {
      const a = nodeMap.get(e.source);
      const b = nodeMap.get(e.target);
      if (!a || !b) continue;

      const isHighlighted =
        hoveredRef.current &&
        (e.source === hoveredRef.current.tag ||
          e.target === hoveredRef.current.tag);

      const alpha = isHighlighted
        ? 0.8
        : hoveredRef.current
          ? 0.08
          : lerp(0.1, 0.5, e.weight / maxWeight);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = dark
        ? `rgba(148, 163, 184, ${alpha})`
        : `rgba(71, 85, 105, ${alpha})`;
      ctx.lineWidth = isHighlighted
        ? lerp(1.5, 4, e.weight / maxWeight)
        : lerp(0.5, 3, e.weight / maxWeight);
      ctx.stroke();
    }

    // Draw nodes
    for (const n of ns) {
      const isHovered = hoveredRef.current === n;
      const isConnected =
        hoveredRef.current &&
        es.some(
          (e) =>
            (e.source === hoveredRef.current!.tag && e.target === n.tag) ||
            (e.target === hoveredRef.current!.tag && e.source === n.tag),
        );
      const dimmed = hoveredRef.current && !isHovered && !isConnected;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);

      if (isHovered) {
        ctx.fillStyle = dark ? "#38bdf8" : "#0ea5e9";
      } else if (dimmed) {
        ctx.fillStyle = dark
          ? "rgba(30, 58, 95, 0.5)"
          : "rgba(219, 234, 254, 0.5)";
      } else {
        ctx.fillStyle = dark ? "#1e3a5f" : "#dbeafe";
      }
      ctx.fill();

      ctx.strokeStyle = isHovered
        ? dark
          ? "#7dd3fc"
          : "#0284c7"
        : dark
          ? "rgba(56, 189, 248, 0.4)"
          : "rgba(14, 165, 233, 0.4)";
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.stroke();

      // Label
      const fontSize = Math.max(10, Math.min(14, n.radius * 0.8));
      ctx.font = `${isHovered ? "bold " : ""}${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (dimmed) {
        ctx.fillStyle = dark
          ? "rgba(148, 163, 184, 0.3)"
          : "rgba(71, 85, 105, 0.3)";
      } else {
        ctx.fillStyle = dark ? "#e2e8f0" : "#0f172a";
      }

      // Draw label below node
      ctx.fillText(n.tag, n.x, n.y + n.radius + fontSize * 0.8);

      // Draw count inside node
      if (n.radius >= 14) {
        ctx.font = `bold ${Math.max(9, fontSize - 2)}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = isHovered ? "#ffffff" : dark ? "#7dd3fc" : "#1e40af";
        ctx.fillText(String(n.count), n.x, n.y);
      }
    }
  }, []);

  const tick = useCallback(() => {
    const moving = simulate();
    draw();
    if (moving || draggingRef.current) {
      animRef.current = requestAnimationFrame(tick);
    }
  }, [simulate, draw]);

  // Resize handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onResize = () => {
      const rect = container.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      draw();
    };

    const observer = new ResizeObserver(onResize);
    observer.observe(container);
    onResize();

    return () => observer.disconnect();
  }, [draw]);

  // Start simulation
  useEffect(() => {
    let running = true;
    let frame = 0;
    const maxFrames = 500;

    const loop = () => {
      if (!running) return;
      const moving = simulate();
      draw();
      frame++;
      if ((moving || draggingRef.current) && frame < maxFrames) {
        animRef.current = requestAnimationFrame(loop);
      }
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [simulate, draw]);

  const getNodeAt = useCallback((x: number, y: number): TagNode | null => {
    const ns = nodesRef.current;
    for (let i = ns.length - 1; i >= 0; i--) {
      const n = ns[i];
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy <= (n.radius + 4) * (n.radius + 4)) {
        return n;
      }
    }
    return null;
  }, []);

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getCanvasPos(e);
      const node = getNodeAt(pos.x, pos.y);
      if (node) {
        draggingRef.current = node;
        offsetRef.current = { x: pos.x - node.x, y: pos.y - node.y };
        animRef.current = requestAnimationFrame(tick);
      }
    },
    [getCanvasPos, getNodeAt, tick],
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getCanvasPos(e);

      if (draggingRef.current) {
        draggingRef.current.x = pos.x - offsetRef.current.x;
        draggingRef.current.y = pos.y - offsetRef.current.y;
        return;
      }

      const node = getNodeAt(pos.x, pos.y);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = node ? "pointer" : "default";
      }

      if (node !== hoveredRef.current) {
        hoveredRef.current = node;
        setHovered(node?.tag ?? null);
        draw();
      }
    },
    [getCanvasPos, getNodeAt, draw],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const pos = getCanvasPos(e);
      const node = getNodeAt(pos.x, pos.y);
      if (node) {
        router.push(`/${prefix}/tag/${node.tag}/1` as Route);
      }
    },
    [getCanvasPos, getNodeAt, router, prefix],
  );

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "70vh", minHeight: "400px" }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onClick={handleClick}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 16px",
            borderRadius: "9999px",
            fontSize: "14px",
            fontFamily: "system-ui, sans-serif",
            pointerEvents: "none",
            backgroundColor: "var(--colors-bg-surface, #fff)",
            color: "var(--colors-text-primary, #0f172a)",
            border: "1px solid var(--colors-border-default, #e2e8f0)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {hovered}
        </div>
      )}
    </div>
  );
}
