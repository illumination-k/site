"""
GO Enrichment similarity-based visualization figures.
Nature guidelines: Arial, 7pt labels, 8pt axis titles, 300 DPI,
single column 89mm, double column 183mm.
"""

import os
import numpy as np
import polars as pl
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.colors as mcolors
import seaborn as sns
import squarify
import networkx as nx
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import squareform
from sklearn.manifold import MDS
from adjustText import adjust_text

# ---------------------------------------------------------------------------
# Nature style defaults
# ---------------------------------------------------------------------------
NATURE_RC = {
    "font.family": "sans-serif",
    "font.sans-serif": ["Arial", "Helvetica", "DejaVu Sans"],
    "font.size": 7,
    "axes.titlesize": 8,
    "axes.labelsize": 8,
    "xtick.labelsize": 7,
    "ytick.labelsize": 7,
    "legend.fontsize": 6,
    "legend.title_fontsize": 7,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
    "axes.linewidth": 0.5,
    "xtick.major.width": 0.5,
    "ytick.major.width": 0.5,
    "lines.linewidth": 0.75,
    "pdf.fonttype": 42,   # editable text in Illustrator
    "ps.fonttype": 42,
}
plt.rcParams.update(NATURE_RC)

# Nature single / double column widths in inches
COL1 = 89 / 25.4   # ~3.50 in
COL2 = 183 / 25.4  # ~7.20 in

OUTDIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(os.path.dirname(OUTDIR), "..", "techblog", "bioinformatics", "example.csv")

# ---------------------------------------------------------------------------
# Fake example CSV if not on disk – use inline data
# ---------------------------------------------------------------------------
CSV_TEXT = """\
term,score,size,name,cluster
GO:0090407,1.5297085894511266,41,organophosphate biosynthetic process,C1
GO:0006073,1.5163222189613395,83,cellular glucan metabolic process,C1
GO:0043085,1.44498285471817,14,positive regulation of catalytic activity,C1
GO:0010451,1.42343275529096,7,floral meristem growth,C1
GO:0009259,2.08444273888555,51,ribonucleotide metabolic process,C2
GO:0000209,2.626510646478822,685,protein polyubiquitination,C2
GO:1901970,3.197995679060633,207,positive regulation of mitotic sister chromatid separation,C2
GO:0055086,2.043050310202272,162,nucleobase-containing small molecule metabolic process,C2
GO:0043094,4.978646909720386,59,cellular metabolic compound salvage,C4
GO:0042819,1.5612111272483267,17,vitamin B6 biosynthetic process,C4
GO:0015979,8.466807502800558,130,photosynthesis,C4
GO:0097502,1.45417892854421,1,mannosylation,C5
GO:0044848,1.36510627820935,12,biological phase,C5
GO:0007163,2.6923744596164827,87,establishment or maintenance of cell polarity,C5
GO:0043414,3.215776159654917,116,macromolecule methylation,C5
GO:0000723,2.572069750528699,1393,telomere maintenance,C5
GO:0031331,3.2990295934320666,329,positive regulation of cellular catabolic process,C5
GO:0080135,2.5196148192030727,410,regulation of cellular response to stress,C6
GO:0040011,1.35544252617625,52,locomotion,C6
GO:0034502,2.739128030964704,705,protein localization to chromosome,C6
GO:0009553,3.35598374726875,991,embryo sac development,C6
GO:0052541,1.5212716561130444,10,plant-type cell wall cellulose metabolic process,C6
GO:0071215,3.6449534934267973,834,cellular response to abscisic acid stimulus,C7
GO:0009812,2.5663773876723597,159,flavonoid metabolic process,C7
GO:0002239,2.42790703640653,70,response to oomycetes,C7
GO:0045764,1.9573492416484901,263,positive regulation of cellular amino acid metabolic process,C7
"""

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _save(fig, name):
    path = os.path.join(OUTDIR, name)
    fig.savefig(path, dpi=300, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"  saved {path}")


def compute_sim_matrix_wang(go_terms, godag):
    """Wang graph-based semantic similarity via goatools."""
    from goatools.semantic import semantic_similarity
    n = len(go_terms)
    mat = np.zeros((n, n))
    for i in range(n):
        for j in range(i, n):
            if go_terms[i] in godag and go_terms[j] in godag:
                s = semantic_similarity(go_terms[i], go_terms[j], godag)
            else:
                s = 0.0
            mat[i, j] = s
            mat[j, i] = s
    return mat


# Nature-friendly qualitative palette (colorblind-safe, from Wong 2011)
WONG_COLORS = [
    "#0072B2",  # blue
    "#E69F00",  # orange
    "#009E73",  # green
    "#CC79A7",  # pink
    "#56B4E9",  # sky blue
    "#D55E00",  # vermillion
    "#F0E442",  # yellow
    "#000000",  # black
]

def _synthetic_similarity(go_terms, clusters, seed=42):
    """Generate a plausible similarity matrix when OBO is unavailable.
    Same-cluster terms get higher similarity."""
    rng = np.random.default_rng(seed)
    n = len(go_terms)
    mat = np.eye(n)
    for i in range(n):
        for j in range(i + 1, n):
            if clusters[i] == clusters[j]:
                s = rng.uniform(0.4, 0.85)
            else:
                s = rng.uniform(0.0, 0.3)
            mat[i, j] = s
            mat[j, i] = s
    return mat


def cluster_cmap(clusters):
    unique = sorted(set(clusters))
    return {c: WONG_COLORS[i % len(WONG_COLORS)] for i, c in enumerate(unique)}


# ===========================================================================
# Main
# ===========================================================================
def main():
    # --- load data ---
    import io
    df = pl.read_csv(io.StringIO(CSV_TEXT))
    go_terms = df["term"].to_list()
    names = df["name"].to_list()
    scores = df["score"].to_list()
    sizes = df["size"].to_list()
    clusters = df["cluster"].to_list()

    # --- compute similarity matrix ---
    # Try goatools first; fall back to synthetic similarity if OBO unavailable
    obo_path = os.path.join(OUTDIR, "go-basic.obo")
    if os.path.exists(obo_path):
        from goatools.obo_parser import GODag
        godag = GODag(obo_path)
        print("Computing Wang similarity matrix ...")
        sim_matrix = compute_sim_matrix_wang(go_terms, godag)
    else:
        print("go-basic.obo not found, using synthetic similarity ...")
        sim_matrix = _synthetic_similarity(go_terms, clusters)

    # --- hierarchical clustering from similarity ---
    dist_condensed = squareform(1 - sim_matrix, checks=False)
    dist_condensed = np.clip(dist_condensed, 0, None)
    Z = linkage(dist_condensed, method="average")
    auto_clusters = fcluster(Z, t=0.7, criterion="distance")
    auto_labels = [f"C{c}" for c in auto_clusters]

    # -----------------------------------------------------------------------
    # 1. Similarity Heatmap  (clustermap)
    # -----------------------------------------------------------------------
    print("1. Heatmap ...")
    # short labels for heatmap readability
    short_names = [n[:40] + "…" if len(n) > 40 else n for n in names]

    g = sns.clustermap(
        sim_matrix,
        xticklabels=short_names,
        yticklabels=short_names,
        cmap="viridis",
        figsize=(COL2, COL2 * 0.85),
        linewidths=0.2,
        linecolor="white",
        dendrogram_ratio=(0.12, 0.12),
        cbar_kws={"label": "Wang similarity"},
        method="average",
    )
    g.ax_heatmap.tick_params(axis="x", labelsize=5, rotation=90)
    g.ax_heatmap.tick_params(axis="y", labelsize=5)
    _save(g.fig, "similarity_heatmap.png")

    # -----------------------------------------------------------------------
    # 2. MDS Scatter Plot
    # -----------------------------------------------------------------------
    print("2. MDS scatter ...")
    dist_matrix = 1 - sim_matrix
    np.fill_diagonal(dist_matrix, 0)
    dist_matrix = np.clip(dist_matrix, 0, None)

    mds = MDS(n_components=2, dissimilarity="precomputed", random_state=42,
              normalized_stress="auto")
    coords = mds.fit_transform(dist_matrix)

    ccmap = cluster_cmap(clusters)
    fig, ax = plt.subplots(figsize=(COL2, COL2 * 0.65))

    for cl in sorted(set(clusters)):
        idx = [i for i, c in enumerate(clusters) if c == cl]
        ax.scatter(
            coords[idx, 0], coords[idx, 1],
            s=[scores[i] * 25 for i in idx],
            c=ccmap[cl], label=cl, alpha=0.85, edgecolors="white", linewidths=0.3,
        )

    texts = []
    for i, name in enumerate(names):
        short = name[:35] + "…" if len(name) > 35 else name
        texts.append(ax.text(coords[i, 0], coords[i, 1], short, fontsize=4.5))
    adjust_text(texts, ax=ax, arrowprops=dict(arrowstyle="-", color="grey", lw=0.3))

    ax.legend(title="Cluster", frameon=True, edgecolor="0.8", fancybox=False)
    ax.set_xlabel("MDS1")
    ax.set_ylabel("MDS2")
    sns.despine(ax=ax)
    _save(fig, "similarity_scatter.png")

    # -----------------------------------------------------------------------
    # 3. Network Plot (NetworkX)
    # -----------------------------------------------------------------------
    print("3. Network ...")
    threshold = 0.3  # similarity edge threshold
    G = nx.Graph()
    n = len(go_terms)

    for i in range(n):
        G.add_node(i, label=names[i], cluster=clusters[i],
                   score=scores[i], size=sizes[i])

    for i in range(n):
        for j in range(i + 1, n):
            if sim_matrix[i, j] >= threshold:
                G.add_edge(i, j, weight=sim_matrix[i, j])

    fig, ax = plt.subplots(figsize=(COL2, COL2 * 0.75))

    # spring layout weighted by similarity
    pos = nx.spring_layout(G, weight="weight", seed=42, k=1.5)

    # draw edges with alpha proportional to weight
    edges = G.edges(data=True)
    if edges:
        weights = [d["weight"] for _, _, d in edges]
        max_w = max(weights) if weights else 1
        edge_alphas = [0.15 + 0.6 * (w / max_w) for w in weights]
        edge_widths = [0.3 + 1.0 * (w / max_w) for w in weights]
        for (u, v, d), alpha, lw in zip(edges, edge_alphas, edge_widths):
            ax.plot(
                [pos[u][0], pos[v][0]], [pos[u][1], pos[v][1]],
                color="0.6", alpha=alpha, lw=lw, zorder=0,
            )

    # draw nodes
    node_colors = [ccmap[G.nodes[i]["cluster"]] for i in G.nodes]
    node_sizes = [G.nodes[i]["score"] * 25 for i in G.nodes]
    nx.draw_networkx_nodes(G, pos, ax=ax, node_color=node_colors,
                           node_size=node_sizes, alpha=0.9,
                           edgecolors="white", linewidths=0.3)

    # labels
    texts = []
    for i in G.nodes:
        short = names[i][:30] + "…" if len(names[i]) > 30 else names[i]
        texts.append(ax.text(pos[i][0], pos[i][1], short, fontsize=4.5,
                             ha="center", va="center"))
    adjust_text(texts, ax=ax, arrowprops=dict(arrowstyle="-", color="grey", lw=0.3))

    # legend
    handles = [mpatches.Patch(color=ccmap[c], label=c) for c in sorted(set(clusters))]
    ax.legend(handles=handles, title="Cluster", frameon=True,
              edgecolor="0.8", fancybox=False, loc="upper left")
    ax.set_axis_off()
    ax.set_title("GO Term Similarity Network (Wang, threshold ≥ 0.3)")
    _save(fig, "similarity_network.png")

    # -----------------------------------------------------------------------
    # 4. Treemap
    # -----------------------------------------------------------------------
    print("4. Treemap ...")
    fig, ax = plt.subplots(figsize=(COL2, COL2 * 0.55))

    df_sorted = df.sort("cluster", "score", descending=[False, True])
    t_sizes = df_sorted["size"].to_list()
    t_labels = df_sorted["name"].to_list()
    t_clusters = df_sorted["cluster"].to_list()

    t_colors = [ccmap[c] for c in t_clusters]

    squarify.plot(
        sizes=t_sizes, label=t_labels, color=t_colors, alpha=0.85,
        ax=ax, text_kwargs={"fontsize": 4.5, "wrap": True},
        ec="white", linewidth=1,
    )
    handles = [mpatches.Patch(color=ccmap[c], label=c) for c in sorted(set(t_clusters))]
    ax.legend(handles=handles, title="Cluster", frameon=True,
              edgecolor="0.8", fancybox=False, loc="lower right", fontsize=5)
    ax.axis("off")
    ax.set_title("GO Term Treemap")
    _save(fig, "treemap.png")

    print("Done!")


if __name__ == "__main__":
    main()
