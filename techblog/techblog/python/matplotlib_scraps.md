---
uuid: fbee489f-126d-4947-8391-346044211d7c
title: Matploblibでよくやるけどよく忘れることまとめ
description: 個人的にMatploblibでよく使うけど毎回探しに行っていることをまとめておく
lang: ja
category: techblog
tags:
  - python
  - plot
  - matplotlib
updated_at: "2022-08-08T17:49:14+00:00"
---

## 前提

```python
import matplotlib as mpl
import matplotlib.pyplot as plt

# 特に断りがなければ以下も使用する
fig = plt.figure()
ax = fig.add_subplot(111)
```

## Adobeで編集できるようにする

### 1. `TrueType`のフォントタイプを使う

デフォルトは3で、`Output Type`らしい。[この辺](https://matplotlib.org/stable/tutorials/introductory/customizing.html#the-matplotlibrc-file)に詳しい。

```python
mpl.rcParams['pdf.fonttype'] = 42
mpl.rcParams['ps.fonttype'] = 42
```

### 2. `pgf` backendを使う

`LATEX`の処理系を使う。

```python
plt.savefig("test.pdf", backend="pgf")
```

## カスタムフォントを利用する

WSLなら`/mnt/c/Windows/Fonts`とかにWindows側のフォントがあって、使いたいことがよくある。

```python
import matplotlib.font_manager as font_manager

fontpaths = ["/mnt/c/Windows/Fonts"]

font_files = font_manager.findSystemFonts(fontpaths=fontpaths)
for font_file in font_files:
    font_manager.fontManager.addfont(font_file)

plt.rcParams["font.family"] = "Arial"
```

## 使えるフォント一覧を見る

```python
import matplotlib.font_manager as font_manager

print(font_manager.fontManager.ttflist)
```

## 余白を制御する

長いラベルとかのときに、余白を制御しときたいことが多い。

```python
# left, right, top, bottom
plt.rcParams['figure.subplot.left'] = 0.75
```

## ColorbarのみのPlot

[mpl.colorbar.Colorbar](https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.colorbar.html)を利用する。`ColorbarBase`は最近非推奨。

```python
cmap = plt.get_cmap("gnuplot")
norm = mpl.colors.Normalize(vmin=0, vmax=10)

cbar = fig.add_subplot(111)
mpl.colorbar.Colorbar(
    cbar,
    mappable=mpl.cm.ScalarMappable(norm=norm, cmap=cmap),
    orientation="vertical",
).set_label("label", fontsize=20)
```

`mpl.colors.Normalize`と`plt.get_cmapの返り値`はCallableなので、正規化された値や、その値に対応したいいろが欲しい場合は、以下のように取得できる。

```python
value = 5
color = cmap(norm(value))
```

## 図形を書く

`patch`を使う

```python
import matplotlib.patch as patch

# 長方形
ax.add_patch(patch.Rectangle(xy=(0, 0), width=10, height=10))
# 枠と内部を同じ色 (blue)
ax.add_patch(patch.Rectangle(xy=(0, 0), width=10, height=10, color="blue"))
# 枠 (black) と内部 (blue) を違う色
ax.add_patch(patch.Rectangle(xy=(0, 0), width=10, height=10, edgecolor="black", facecolor="blue"))
```

## tickのラベルと位置を調整する

```python
ax = fig.add_subplot(111, xticks=[0, 0.25, 0.75, 1], xticklabels=["", "A", "B", ""])
```

## Sizeを表すレジェンドを独立して取り出したい

普通はそのままでいいんですが、例えば散布図の点の大きさを調整したりすると、ラベルの調整が必要になります。そういうときにLabelを取り出して書き直すとかするときに便利です。

```python
actual_size = [0.01, 0.02, 0.03]
ax.scatter([1, 1, 1], [2, 2, 2], s=[s * 10 for s in actual_size])

handles, labels = ax.get_legend_handles_labels(prop="sizes", alpha=0.5)
legend = ax.legend(
    handles,
    labels,
    title="size",
    title_fontsize=15,
    markerscale=0.4
)
```

## Subplot感覚のいい感じな調整

`tight_layout`を使う。

```python
fig = plt.figure()
ax1 = fig.add_subplot(112)
ax2 = fig.add_subplot(212)
fig.tight_layout()
```
