---
uuid: 58d811be-4bcd-498f-baaf-f67abe61794d
title: PythonでGO Enrichmentの結果を図示する
description: RにはGO Enrichmentの結果をいい感じに図示してくれるライブラリがいくつかありますが、Pythonにはありません。似たような図の作成方法をまとめます。
lang: ja
category: techblog
tags:
  - goterm
  - plot
  - bioinformatics
  - python
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2026-03-25T00:00:00+00:00"
---

## TL;DR

RにはGO Enrichmentの結果をいい感じに図示してくれるライブラリがいくつかありますが(e.g., clusterProfiler, rrvgo etc.,)、Pythonにはありません。そこで、似たような図の作成方法をメモとしてまとめます。

個人的に図の微調整などはPythonのほうが知識もあって楽なのでPythonで書きたいという動機がありますが、ggplotが好きな人/Rに詳しい人は最初からRを使うのがおすすめです。

また、個人の趣味でpandasではなくpolarsを使用しています。polars、非常に体験がよいのでおすすめです。

## Dataset

列の意味としては以下を想定しています。

- term: GO Term ID
- score: -log10(padj)を想定
- size: アノテーションに含まれる遺伝子数)
- name: Go Termの名前。ラベルに使う。
- cluster: 適当なクラスターの名前

:::details[CSV data]

`example.csv`

```csv
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
```

:::

## Import & 設定

defaultでは以下の設定・ライブラリを利用している。

```python
import seaborn as sns
import matplotlib.pyplot as plt
import matplotlib as mpl
import polars as pl

print(sns.__version__)
# 0.11.2
print(pl.__version__)
# 0.13.36
print(mpl.__version__)
# 3.4.3

# seabornの設定。お好みで
sns.set(style="darkgrid", palette="muted", color_codes=True)
sns.set_context("paper")
```

## 単純なプロット

### Barplot

![barplot](../../public/go_python_plot/barplot.png)

:::details[Code]

```python
# y軸にGO Termの名前を置きたいので、余白を多めにとる
plt.rcParams['figure.subplot.left'] = 0.5

df = pl.read_csv("./example.csv").sort("size")

terms = df.select("name").to_series().to_list()
sizes = df.select("size").to_series().to_list()

fig = plt.figure(figsize=(15, 10))
xgs = 10

# colorbarを手動で置く必要があるので、gridspecを使う
# colorbarは上半分くらいでいいので、y側も2分割
gs = fig.add_gridspec(2, xgs)

# colorbar部分を開けておく
ax = fig.add_subplot(gs[0:2, 0:xgs-2])

# scoresをrgbaに変換
cmap = plt.get_cmap("gnuplot")
norm = mpl.colors.Normalize(vmin=0, vmax=10)
scores = df.select("score").to_series().apply(lambda x: cmap(norm(x))).to_list()

# barplot
ax.barh(terms, sizes, color=scores)
ax.tick_params(axis="x", labelsize=15)
ax.set_xlabel("size", fontsize=20)
ax.tick_params(axis="y", labelsize=15)

# colorbar作成
cbar = fig.add_subplot(gs[0, xgs-1])
mpl.colorbar.Colorbar(
    cbar,
    mappable=mpl.cm.ScalarMappable(norm=norm, cmap=cmap),
    orientation="vertical",
).set_label("score", fontsize=20)

plt.show()
```

:::

### dotplot

![dotplot](../../public/go_python_plot/dotplot.png)

:::details[Code]

```python
# y軸にGO Termの名前を置きたいので、余白を多めにとる
plt.rcParams['figure.subplot.left'] = 0.5

background_gene = 10000

df = pl.read_csv("./example.csv").sort("score")

terms = df.select("name").to_series().to_list()
sizes = df.select("size").to_series().to_list()
ratio = list(map(lambda x: x / background_gene, sizes))

vmin = 0
vmax = 10

fig = plt.figure(figsize=(17.5, 10))
xgs = 10

# colorbarを手動で置く必要があるので、gridspecを使う
# colorbarは上半分くらいでいいので、y側も2分割
gs = fig.add_gridspec(2, xgs)

# colorbar部分を開けておく
ax = fig.add_subplot(gs[0:2, 0:xgs-1])

cmap = plt.get_cmap("gnuplot")
scores = df.select("score").to_series().to_list()

# barplot
scatter = ax.scatter(ratio, terms, c=scores, s=sizes, cmap=cmap, vmin=vmin, vmax=vmax)
ax.tick_params(axis="x", labelsize=15)
ax.set_xlabel("Gene Ratio", fontsize=20)
ax.tick_params(axis="y", labelsize=15)

handles, labels = scatter.legend_elements(prop="sizes", alpha=0.5)
legend = ax.legend(
    handles,
    labels,
    # 単純な位置指定だといい位置にいかないので、bbox_to_anchorでマニュアル調整
    bbox_to_anchor=(1.15, 0.5),
    title="size",
    title_fontsize=15,
    markerscale=0.4
)

cbar = fig.add_subplot(gs[0, xgs-1])

# colorbarをつける
# 位置を好き勝手したいので、ColorbarBaseを使用
norm = mpl.colors.Normalize(vmin=vmin, vmax=vmax)
mpl.colorbar.Colorbar(
    cbar,
    mappable=mpl.cm.ScalarMappable(norm=norm, cmap=cmap),
    orientation="vertical",
).set_label("score", fontsize=20)

plt.show()
```

:::

### グループごとのdotplot

![dotplot-cluster](../../public/go_python_plot/dotplot_cluster.png)

:::details[Code]

```python
# seabornの設定はお好みで
sns.set(style="darkgrid", palette="muted", color_codes=True)
sns.set_context("paper")

# x軸にGO Termの名前を置きたいので、余白を多めにとる
plt.rcParams['figure.subplot.bottom'] = 0.5

df = pl.read_csv("example.csv")

terms = df.select("name").to_series().to_list()
clusters = df.select("cluster").to_series().to_list()

fig = plt.figure(figsize=(15, 7.5))
ax = fig.add_subplot(111)

# 後でcolorbarを加えるために取得する
cmap = plt.get_cmap("gnuplot")
scatter = ax.scatter(
    terms,
    clusters,
    s=df.select(pl.col("size")).to_series().to_list(),
    c=df.select("score"),
    cmap=cmap,
    vmin=0,
    vmax=10,
)

# axisのラベル制御
# rotationするときは開始位置をhaで適切に指定する必要がある
# e.g., 315 -> left, 45 -> right
ax.set_xticklabels(terms, rotation=315, ha="left")
ax.tick_params(axis="y", labelsize=20)

# sizeのlegendを作成しておく
handles, labels = scatter.legend_elements(prop="sizes", alpha=0.5)
legend = ax.legend(
    handles,
    labels,
    # 単純な位置指定だといい位置にいかないので、bbox_to_anchorでマニュアル調整
    bbox_to_anchor=(1.175, 1),
    title="size",
    title_fontsize=15,
    markerscale=0.4
)

# colorbarをつける
fig.colorbar(scatter, ax=ax, pad=0.01).set_label("score", size=15)

fig.tight_layout()

plt.show()
```

:::

## Similarityを利用したプロット

GO Termにはsimilarityがあります。[Overview of semantic similarity analysis](https://yulab-smu.top/biomedical-knowledge-mining-book/semantic-similarity-overview.html)あたりが詳しいです。これは、Pythonでは`goatools`を利用することで計算できます。Rだと`GoSemSim`が利用できます。

`goatools`では、以下の手法をサポートしているようです。

**IC Base**

- Resnik
  - Philip, Resnik. 1999. “Semantic Similarity in a Taxonomy: An Information-Based Measure and Its Application to Problems of Ambiguity in Natural Language.” Journal of Artificial Intelligence Research 11: 95–130.
- Lin
  - Lin, Dekang. 1998. “An Information-Theoretic Definition of Similarity.” In Proceedings of the 15th International Conference on Machine Learning, 296—304. https://doi.org/10.1.1.55.1832.

**Graph Base**

- wang
  - Wang, James Z, Zhidian Du, Rapeeporn Payattakool, Philip S Yu, and Chin-Fu Chen. 2007. “A New Method to Measure the Semantic Similarity of GO Terms.” Bioinformatics (Oxford, England) 23 (May): 1274–81. https://doi.org/btm087.

Similarityベースの可視化では、追加で以下のライブラリを使用します。

```bash
pip install goatools scikit-learn squarify adjustText
```

### Similarity Matrixの計算

まず、GO Term間のペアワイズなsemantic similarityを計算します。Wang法はグラフ構造のみを利用するため、アノテーションデータが不要で手軽に使えます。IC-based（Resnik, Lin）を使いたい場合は、別途アノテーションコーパスと`TermCounts`の準備が必要です。

:::details[Code]

```python
from goatools.obo_parser import GODag
from goatools.semantic import semantic_similarity
import numpy as np
import polars as pl

# go-basic.oboをダウンロードしておく
# curl -L -o go-basic.obo "https://release.geneontology.org/2024-06-17/ontology/go-basic.obo"
godag = GODag("go-basic.obo")

df = pl.read_csv("example.csv")
go_terms = df.select("term").to_series().to_list()

n = len(go_terms)
sim_matrix = np.zeros((n, n))

for i in range(n):
    for j in range(i, n):
        if i == j:
            sim_matrix[i][j] = 1.0
        else:
            try:
                # Wang法（グラフベース）でsimilarityを計算
                sim = semantic_similarity(go_terms[i], go_terms[j], godag)
                sim_matrix[i][j] = sim
                sim_matrix[j][i] = sim
            except KeyError:
                # obsoleteなtermなどはスキップ
                sim_matrix[i][j] = 0.0
                sim_matrix[j][i] = 0.0
```

:::

### クラスタリング

Similarity matrixからクラスタを自動生成することもできます。サンプルデータにはすでにcluster列がありますが、実データではsimilarityに基づいてクラスタリングするのが一般的です。`scipy`の階層クラスタリングを利用します。

:::details[Code]

```python
from scipy.cluster.hierarchy import linkage, fcluster

# similarity → distanceに変換して階層クラスタリング
Z = linkage(1 - sim_matrix, method="ward")

# 閾値でクラスタを切り出す（閾値は適宜調整）
clusters = fcluster(Z, t=0.7, criterion="distance")
df = df.with_columns(pl.Series("cluster", [f"C{c}" for c in clusters]))
```

:::

### Similarity Heatmap

Similarity matrixをヒートマップとして可視化します。seabornの`clustermap`を使うと、階層クラスタリングの樹形図（デンドログラム）も同時に表示できるので、GO Term間の関係が直感的にわかります。

![similarity-heatmap](../../public/go_python_plot/similarity_heatmap.png)

:::details[Code]

```python
import seaborn as sns
import matplotlib.pyplot as plt

names = df.select("name").to_series().to_list()

sns.set(style="white")
g = sns.clustermap(
    sim_matrix,
    xticklabels=names,
    yticklabels=names,
    cmap="viridis",
    figsize=(16, 14),
    dendrogram_ratio=0.15,
    cbar_pos=(0.02, 0.8, 0.03, 0.15),
    linewidths=0.5,
)

g.ax_heatmap.tick_params(axis="x", labelsize=8)
g.ax_heatmap.tick_params(axis="y", labelsize=8)
g.ax_heatmap.set_xticklabels(g.ax_heatmap.get_xticklabels(), rotation=90)

plt.show()
```

:::

### MDSによるScatter Plot

Similarity matrixをMDS（Multi-Dimensional Scaling）で2次元に圧縮し、散布図として可視化します。Rの`rrvgo`のscatter plotに相当するものです。意味的に近いGO Termが近くに配置されるので、enrichmentの全体像を把握するのに便利です。

![similarity-scatter](../../public/go_python_plot/similarity_scatter.png)

:::details[Code]

```python
from sklearn.manifold import MDS
from adjustText import adjust_text
import matplotlib.pyplot as plt

# similarity → distanceに変換
dist_matrix = 1 - sim_matrix

mds = MDS(n_components=2, dissimilarity="precomputed", random_state=42, normalized_stress="auto")
coords = mds.fit_transform(dist_matrix)

df_plot = df.with_columns([
    pl.Series("x", coords[:, 0]),
    pl.Series("y", coords[:, 1]),
])

fig, ax = plt.subplots(figsize=(14, 10))

clusters = sorted(df_plot.select("cluster").to_series().unique().to_list())
cmap = plt.get_cmap("tab10")

for i, cluster in enumerate(clusters):
    subset = df_plot.filter(pl.col("cluster") == cluster)
    ax.scatter(
        subset.select("x").to_series().to_list(),
        subset.select("y").to_series().to_list(),
        # scoreに応じてサイズを変える
        s=[v * 50 for v in subset.select("score").to_series().to_list()],
        label=cluster,
        color=cmap(i),
        alpha=0.7,
        edgecolors="white",
        linewidths=0.5,
    )

# ラベルの重なりをadjustTextで自動調整
texts = []
for row in df_plot.iter_rows(named=True):
    texts.append(ax.text(
        row["x"], row["y"], row["name"],
        fontsize=7, ha="center", va="bottom",
    ))
adjust_text(texts, ax=ax)

ax.legend(title="Cluster", fontsize=11, title_fontsize=13, loc="best")
ax.set_xlabel("MDS1", fontsize=14)
ax.set_ylabel("MDS2", fontsize=14)
ax.set_title("GO Term Similarity (MDS)", fontsize=16)

plt.tight_layout()
plt.show()
```

:::

MDSの代わりにUMAPを使うこともできます。特にGO Termの数が多い場合はUMAPのほうが適切な場合があります。

```python
# UMAPを使う場合
# pip install umap-learn
from umap import UMAP

reducer = UMAP(metric="precomputed", random_state=42)
coords = reducer.fit_transform(dist_matrix)
```

### Treemap

Treemapは各GO Termを矩形として描画し、面積でサイズ（遺伝子数）を、色でクラスタを表現します。Rの`rrvgo`における`treemapPlot`に相当する可視化です。enrichmentされたGO Termの全体的な構成を俯瞰するのに適しています。

![treemap](../../public/go_python_plot/treemap.png)

:::details[Code]

```python
import squarify
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(16, 10))

# クラスターごとにソートしてまとめる
df_sorted = df.sort("cluster", "score", descending=[False, True])

sizes = df_sorted.select("size").to_series().to_list()
labels = df_sorted.select("name").to_series().to_list()
clusters_list = df_sorted.select("cluster").to_series().to_list()

# クラスターごとに色を割り当て
unique_clusters = sorted(set(clusters_list))
cmap = plt.get_cmap("tab10")
color_map = {c: cmap(i) for i, c in enumerate(unique_clusters)}
colors = [color_map[c] for c in clusters_list]

# sizeが0だとエラーになるので最低値を保証
sizes_safe = [max(s, 1) for s in sizes]

squarify.plot(
    sizes=sizes_safe,
    label=[f"{l}\n({c})" for l, c in zip(labels, clusters_list)],
    color=colors,
    alpha=0.8,
    ax=ax,
    text_kwargs={"fontsize": 7, "wrap": True},
)

# legend作成
handles = [mpatches.Patch(color=color_map[c], label=c) for c in unique_clusters]
ax.legend(handles=handles, title="Cluster", fontsize=12, title_fontsize=14, loc="upper right")

ax.axis("off")
ax.set_title("GO Term Treemap", fontsize=18)

plt.tight_layout()
plt.show()
```

:::
