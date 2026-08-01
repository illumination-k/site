"use client";

import { useMemo, useState } from "react";

import { css } from "@/styled-system/css";

/**
 * CmpTree — Huxley-Gödel Machine の記事用インタラクティブ可視化。
 *
 * 自己改善エージェントのツリー上で、
 *  - 個体のベンチマークスコア U（DGM/SICA が見る値）
 *  - clade（自分＋全子孫）の最良到達点 CMP（HGM が推定する値）
 * を対比し、「個体スコア最大を選ぶ DGM 流」と「CMP 最大を選ぶ HGM 流」が
 * それぞれどのエージェントに投資するかを同時に可視化する。
 *
 * 依存を増やさないため描画はすべて素の SVG。
 */

interface TreeNode {
  id: string;
  label: string;
  /** 個体のベンチマークスコア U (0..1)。既知の値。 */
  score: number;
  /**
   * potential=true のノードは「まだ発見されていない、投資すれば到達しうる子孫」。
   * 候補集合には含めない（= DGM が決定時に見られない値）が、CMP の計算には含める。
   */
  potential?: boolean;
  children?: TreeNode[];
}

interface Scenario {
  key: string;
  name: string;
  description: string;
  root: TreeNode;
}

const SCENARIOS: Scenario[] = [
  {
    key: "mismatch",
    name: "Mismatch シナリオ",
    description:
      "高スコアの系統 B は子孫が伸び悩み、低スコアの系統 C から最強の子孫が現れる。個体スコアと自己改善能力が乖離する典型例。",
    root: {
      id: "A",
      label: "A (初期)",
      score: 0.3,
      children: [
        {
          id: "B",
          label: "B",
          score: 0.8,
          children: [
            { id: "B1", label: "B1", score: 0.4, potential: true },
            { id: "B2", label: "B2", score: 0.35, potential: true },
          ],
        },
        {
          id: "C",
          label: "C",
          score: 0.25,
          children: [
            {
              id: "C1",
              label: "C1",
              score: 0.55,
              potential: true,
              children: [
                { id: "C2", label: "C2", score: 0.95, potential: true },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    key: "aligned",
    name: "整合シナリオ",
    description:
      "高スコアの系統がそのまま最良の子孫を生む。個体スコアと CMP が一致し、両ポリシーは同じノードを選ぶ。",
    root: {
      id: "A",
      label: "A (初期)",
      score: 0.3,
      children: [
        {
          id: "B",
          label: "B",
          score: 0.8,
          children: [
            { id: "B1", label: "B1", score: 0.9, potential: true },
            { id: "B2", label: "B2", score: 0.6, potential: true },
          ],
        },
        {
          id: "C",
          label: "C",
          score: 0.45,
          children: [{ id: "C1", label: "C1", score: 0.5, potential: true }],
        },
      ],
    },
  },
];

// ---- ツリー操作のヘルパー（純粋関数）----

function cloneTree(node: TreeNode): TreeNode {
  return {
    ...node,
    children: node.children?.map(cloneTree),
  };
}

function eachNode(node: TreeNode, fn: (n: TreeNode) => void): void {
  fn(node);
  node.children?.forEach((c) => eachNode(c, fn));
}

function setScore(node: TreeNode, id: string, score: number): TreeNode {
  const next = cloneTree(node);
  eachNode(next, (n) => {
    if (n.id === id) n.score = score;
  });
  return next;
}

/** clade（自分＋全子孫）の最良スコア = CMP（理想化した定義）。 */
function cmpOf(node: TreeNode): number {
  let best = node.score;
  node.children?.forEach((c) => {
    best = Math.max(best, cmpOf(c));
  });
  return best;
}

// ---- レイアウト（tidy tree）----

interface Pos {
  x: number;
  depth: number;
}

function layout(node: TreeNode): {
  pos: Map<string, Pos>;
  leaves: number;
  depth: number;
} {
  const pos = new Map<string, Pos>();
  let leafCursor = 0;
  let maxDepth = 0;

  function walk(n: TreeNode, depth: number): number {
    maxDepth = Math.max(maxDepth, depth);
    if (!n.children || n.children.length === 0) {
      const x = leafCursor;
      leafCursor += 1;
      pos.set(n.id, { x, depth });
      return x;
    }
    const xs = n.children.map((c) => walk(c, depth + 1));
    const x = (Math.min(...xs) + Math.max(...xs)) / 2;
    pos.set(n.id, { x, depth });
    return x;
  }

  walk(node, 0);
  return { pos, leaves: leafCursor, depth: maxDepth };
}

// ---- 配色 ----

/** スコア 0..1 を赤→黄→緑のヒートカラーに。 */
function heat(score: number): string {
  const hue = Math.round(score * 120); // 0=赤, 120=緑
  return `hsl(${hue}, 68%, 45%)`;
}

const DGM_COLOR = "#3b82f6"; // 青: 個体スコア最大を選ぶ DGM 流
const HGM_COLOR = "#f97316"; // 橙: CMP 最大を選ぶ HGM 流

// ---- スタイル ----

const wrapper = css({
  my: 6,
  p: 4,
  borderWidth: 1,
  borderColor: "border.default",
  rounded: "xl",
  bg: "bg.surface",
});

const controlsRow = css({
  display: "flex",
  flexWrap: "wrap",
  gap: 2,
  mb: 3,
  alignItems: "center",
});

const presetButton = css({
  px: 3,
  py: 1,
  rounded: "md",
  fontSize: "sm",
  borderWidth: 1,
  borderColor: "border.default",
  bg: "bg.elevated",
  color: "text.primary",
  cursor: "pointer",
  _hover: { bg: "bg.page" },
});

const presetButtonActive = css({
  px: 3,
  py: 1,
  rounded: "md",
  fontSize: "sm",
  borderWidth: 1,
  borderColor: "accent.primary",
  bg: "accent.primary",
  color: "white",
  cursor: "pointer",
});

const toggleLabel = css({
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
  fontSize: "sm",
  color: "text.secondary",
  cursor: "pointer",
});

const descStyle = css({
  fontSize: "sm",
  color: "text.secondary",
  mb: 3,
});

const editorBox = css({
  mt: 3,
  p: 3,
  rounded: "lg",
  bg: "bg.elevated",
  fontSize: "sm",
  color: "text.primary",
});

const sliderRow = css({
  display: "flex",
  alignItems: "center",
  gap: 3,
  mt: 2,
});

const summaryGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 3,
  mt: 4,
});

const summaryCard = css({
  p: 3,
  rounded: "lg",
  borderWidth: 1,
  borderColor: "border.default",
  bg: "bg.elevated",
  fontSize: "sm",
});

const legendRow = css({
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
  mt: 3,
  fontSize: "xs",
  color: "text.secondary",
});

const legendItem = css({
  display: "inline-flex",
  alignItems: "center",
  gap: 1.5,
});

const fmt = (v: number) => v.toFixed(2);

export function CmpTree() {
  const [scenarioKey, setScenarioKey] = useState(SCENARIOS[0].key);
  const [tree, setTree] = useState<TreeNode>(() =>
    cloneTree(SCENARIOS[0].root),
  );
  const [showPotential, setShowPotential] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const applyScenario = (key: string) => {
    const sc = SCENARIOS.find((s) => s.key === key) ?? SCENARIOS[0];
    setScenarioKey(key);
    setTree(cloneTree(sc.root));
    setSelectedId(null);
  };

  const scenario = SCENARIOS.find((s) => s.key === scenarioKey) ?? SCENARIOS[0];

  // 各種計算（ツリーが変わるたびに再計算）
  const { nodes, edges, picks, viewW, viewH } = useMemo(() => {
    const { pos, leaves, depth } = layout(tree);

    const xGap = 120;
    const yGap = 110;
    const padX = 60;
    const padY = 44;
    const viewW = Math.max(1, leaves) * xGap + padX;
    const viewH = (depth + 1) * yGap + padY;

    // CMP マップ
    const cmpMap = new Map<string, number>();
    eachNode(tree, (n) => cmpMap.set(n.id, cmpOf(n)));

    // 候補集合 = potential でないノード（= 決定時に既知のエージェント）
    const candidates: TreeNode[] = [];
    eachNode(tree, (n) => {
      if (!n.potential) candidates.push(n);
    });

    // DGM 流: 個体スコア最大。HGM 流: CMP 最大（同点は過小評価＝低 U を優先）。
    let dgmPick = candidates[0];
    let hgmPick = candidates[0];
    for (const n of candidates) {
      if (n.score > dgmPick.score) dgmPick = n;
      const c = cmpMap.get(n.id) ?? n.score;
      const cBest = cmpMap.get(hgmPick.id) ?? hgmPick.score;
      if (c > cBest || (c === cBest && n.score < hgmPick.score)) hgmPick = n;
    }

    const nodes = Array.from(pos.entries()).map(([id, p]) => {
      let target: TreeNode | undefined;
      eachNode(tree, (n) => {
        if (n.id === id) target = n;
      });
      const node = target as TreeNode;
      return {
        id,
        label: node.label,
        score: node.score,
        cmp: cmpMap.get(id) ?? node.score,
        potential: !!node.potential,
        x: p.x * xGap + padX,
        y: p.depth * yGap + padY,
        isDgm: id === dgmPick.id,
        isHgm: id === hgmPick.id,
        // 過小評価: 候補ノードのうち、自分のスコアより clade が大きく勝るもの
        underrated:
          !node.potential &&
          (cmpMap.get(id) ?? node.score) - node.score >= 0.15,
      };
    });

    const edges: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      potential: boolean;
    }[] = [];
    eachNode(tree, (n) => {
      const p = pos.get(n.id);
      if (!p) return;
      n.children?.forEach((c) => {
        const cp = pos.get(c.id);
        if (!cp) return;
        edges.push({
          x1: p.x * xGap + padX,
          y1: p.depth * yGap + padY,
          x2: cp.x * xGap + padX,
          y2: cp.depth * yGap + padY,
          potential: !!c.potential,
        });
      });
    });

    return {
      nodes,
      edges,
      picks: {
        dgm: {
          id: dgmPick.id,
          label: dgmPick.label,
          score: dgmPick.score,
          reach: cmpMap.get(dgmPick.id) ?? dgmPick.score,
        },
        hgm: {
          id: hgmPick.id,
          label: hgmPick.label,
          score: hgmPick.score,
          reach: cmpMap.get(hgmPick.id) ?? hgmPick.score,
        },
      },
      viewW,
      viewH,
    };
  }, [tree]);

  const visibleNodes = showPotential
    ? nodes
    : nodes.filter((n) => !n.potential);
  const visibleEdges = showPotential
    ? edges
    : edges.filter((e) => !e.potential);

  const selectedNode = selectedId
    ? nodes.find((n) => n.id === selectedId)
    : undefined;
  const regret = picks.hgm.reach - picks.dgm.reach;

  const nodeW = 72;
  const nodeH = 50;

  return (
    <div className={wrapper}>
      <div className={controlsRow}>
        {SCENARIOS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={
              s.key === scenarioKey ? presetButtonActive : presetButton
            }
            onClick={() => applyScenario(s.key)}
          >
            {s.name}
          </button>
        ))}
        <label className={toggleLabel}>
          <input
            type="checkbox"
            checked={showPotential}
            onChange={(e) => setShowPotential(e.target.checked)}
          />
          子孫の到達点（CMP の中身）を表示
        </label>
      </div>

      <p className={descStyle}>{scenario.description}</p>

      <div className={css({ overflowX: "auto" })}>
        <svg
          viewBox={`0 0 ${viewW} ${viewH}`}
          width="100%"
          style={{
            maxWidth: `${viewW}px`,
            height: "auto",
            display: "block",
            margin: "0 auto",
          }}
          role="img"
          aria-label="自己改善エージェントのツリーと、DGM 流・HGM 流が選ぶノード"
        >
          {visibleEdges.map((e, i) => (
            <line
              key={`e-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray={e.potential ? "5 4" : undefined}
              opacity={e.potential ? 0.7 : 1}
            />
          ))}

          {visibleNodes.map((n) => {
            const x = n.x - nodeW / 2;
            const y = n.y - nodeH / 2;
            return (
              <g
                key={n.id}
                style={{ cursor: n.potential ? "default" : "pointer" }}
                onClick={() => !n.potential && setSelectedId(n.id)}
              >
                {/* DGM 流のリング（青・点線・外側） */}
                {n.isDgm && (
                  <rect
                    x={x - 7}
                    y={y - 7}
                    width={nodeW + 14}
                    height={nodeH + 14}
                    rx={12}
                    fill="none"
                    stroke={DGM_COLOR}
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                  />
                )}
                {/* HGM 流のリング（橙・実線・内側） */}
                {n.isHgm && (
                  <rect
                    x={x - 3}
                    y={y - 3}
                    width={nodeW + 6}
                    height={nodeH + 6}
                    rx={10}
                    fill="none"
                    stroke={HGM_COLOR}
                    strokeWidth={3}
                  />
                )}
                <rect
                  x={x}
                  y={y}
                  width={nodeW}
                  height={nodeH}
                  rx={8}
                  fill={heat(n.score)}
                  opacity={n.potential ? 0.45 : 1}
                  stroke={selectedId === n.id ? "#0f172a" : "rgba(0,0,0,0.25)"}
                  strokeWidth={selectedId === n.id ? 2.5 : 1}
                />
                <text
                  x={n.x}
                  y={y + 15}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  {n.label}
                </text>
                <text
                  x={n.x}
                  y={y + 30}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#ffffff"
                >
                  U={fmt(n.score)}
                </text>
                <text
                  x={n.x}
                  y={y + 43}
                  textAnchor="middle"
                  fontSize={10}
                  fill="rgba(255,255,255,0.85)"
                >
                  CMP={fmt(n.cmp)}
                </text>
                {n.underrated && (
                  <text x={n.x} y={y - 12} textAnchor="middle" fontSize={13}>
                    ⚠️
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className={legendRow}>
        <span className={legendItem}>
          <svg width="22" height="14" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="20"
              height="12"
              rx="3"
              fill="none"
              stroke={DGM_COLOR}
              strokeWidth="2.5"
              strokeDasharray="5 3"
            />
          </svg>
          DGM 流が選ぶ（個体スコア最大）
        </span>
        <span className={legendItem}>
          <svg width="22" height="14" aria-hidden="true">
            <rect
              x="1"
              y="1"
              width="20"
              height="12"
              rx="3"
              fill="none"
              stroke={HGM_COLOR}
              strokeWidth="3"
            />
          </svg>
          HGM 流が選ぶ（CMP 最大）
        </span>
        <span className={legendItem}>
          ⚠️ 過小評価（低スコアだが clade は有望）
        </span>
        <span className={legendItem}>
          薄いノード = 投資して初めて現れる子孫
        </span>
      </div>

      {selectedNode ? (
        <div className={editorBox}>
          <strong>{selectedNode.label}</strong> のスコア U
          を編集して、選ばれるノードがどう変わるか試せます。
          <div className={sliderRow}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selectedNode.score}
              onChange={(e) =>
                setTree((t) =>
                  setScore(t, selectedNode.id, Number(e.target.value)),
                )
              }
              className={css({ flex: 1 })}
            />
            <span
              className={css({
                fontVariantNumeric: "tabular-nums",
                minW: "3em",
              })}
            >
              {fmt(selectedNode.score)}
            </span>
          </div>
        </div>
      ) : (
        <div className={css({ mt: 3, fontSize: "sm", color: "text.tertiary" })}>
          ヒント: ノード（濃い色 =
          既知のエージェント）をクリックするとスコアを編集できます。
        </div>
      )}

      <div className={summaryGrid}>
        <div className={summaryCard} style={{ borderColor: DGM_COLOR }}>
          <div
            className={css({ fontWeight: "bold", color: "text.primary" })}
            style={{ color: DGM_COLOR }}
          >
            DGM 流（性能ベース）
          </div>
          <div className={css({ mt: 1, color: "text.secondary" })}>
            投資先: <strong>{picks.dgm.label}</strong>（U={fmt(picks.dgm.score)}
            ）
          </div>
          <div className={css({ color: "text.secondary" })}>
            この系統の最良到達点: <strong>{fmt(picks.dgm.reach)}</strong>
          </div>
        </div>
        <div className={summaryCard} style={{ borderColor: HGM_COLOR }}>
          <div
            style={{ color: HGM_COLOR }}
            className={css({ fontWeight: "bold" })}
          >
            HGM 流（CMP ベース）
          </div>
          <div className={css({ mt: 1, color: "text.secondary" })}>
            投資先: <strong>{picks.hgm.label}</strong>（CMP=
            {fmt(picks.hgm.reach)}）
          </div>
          <div className={css({ color: "text.secondary" })}>
            この系統の最良到達点: <strong>{fmt(picks.hgm.reach)}</strong>
          </div>
        </div>
        <div className={summaryCard}>
          <div className={css({ fontWeight: "bold", color: "text.primary" })}>
            到達点の差（リグレット）
          </div>
          <div
            className={css({ mt: 1, fontSize: "xl", fontWeight: "black" })}
            style={{
              color:
                regret > 0.001 ? HGM_COLOR : "var(--colors-text-secondary)",
            }}
          >
            {regret > 0.001 ? `+${fmt(regret)}` : "0.00"}
          </div>
          <div className={css({ color: "text.secondary" })}>
            {regret > 0.001
              ? "性能だけを見る DGM 流は、有望な系統を取り逃している。"
              : "個体スコアと CMP が整合し、両ポリシーの結論は一致。"}
          </div>
        </div>
      </div>
    </div>
  );
}
