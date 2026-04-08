---
uuid: fbee489f-126d-4947-8391-346044211d7c
title: Things I Frequently Do in Matplotlib but Always Forget
description: A personal collection of things I frequently use in Matplotlib but always end up searching for.
lang: en
category: techblog
tags:
  - python
  - plot
  - matplotlib
created_at: "2022-08-08T17:49:14+00:00"
updated_at: "2022-08-08T17:49:14+00:00"
---

## Prerequisites

```python
import matplotlib as mpl
import matplotlib.pyplot as plt

# Unless otherwise noted, the following are also used
fig = plt.figure()
ax = fig.add_subplot(111)
```

## Making Plots Editable in Adobe

### 1. Use `TrueType` Font Type

The default is 3, which is `Output Type`. See [this page](https://matplotlib.org/stable/tutorials/introductory/customizing.html#the-matplotlibrc-file) for details.

```python
mpl.rcParams['pdf.fonttype'] = 42
mpl.rcParams['ps.fonttype'] = 42
```

### 2. Use the `pgf` Backend

This uses a `LATEX` processing system.

```python
plt.savefig("test.pdf", backend="pgf")
```

## Using Custom Fonts

On WSL, Windows fonts are available at `/mnt/c/Windows/Fonts`, and you often want to use them.

```python
import matplotlib.font_manager as font_manager

fontpaths = ["/mnt/c/Windows/Fonts"]

font_files = font_manager.findSystemFonts(fontpaths=fontpaths)
for font_file in font_files:
    font_manager.fontManager.addfont(font_file)

plt.rcParams["font.family"] = "Arial"
```

## Listing Available Fonts

```python
import matplotlib.font_manager as font_manager

print(font_manager.fontManager.ttflist)
```

## Controlling Margins

Useful when you have long labels and need to control margins.

```python
# left, right, top, bottom
plt.rcParams['figure.subplot.left'] = 0.75
```

## Colorbar-Only Plot

Use [mpl.colorbar.Colorbar](https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.colorbar.html). `ColorbarBase` has been deprecated recently.

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

Since `mpl.colors.Normalize` and the return value of `plt.get_cmap` are callable, you can obtain the normalized value and the corresponding color as follows:

```python
value = 5
color = cmap(norm(value))
```

## Drawing Shapes

Use `patch`.

```python
import matplotlib.patch as patch

# Rectangle
ax.add_patch(patch.Rectangle(xy=(0, 0), width=10, height=10))
# Same color for border and fill (blue)
ax.add_patch(patch.Rectangle(xy=(0, 0), width=10, height=10, color="blue"))
# Different colors for border (black) and fill (blue)
ax.add_patch(patch.Rectangle(xy=(0, 0), width=10, height=10, edgecolor="black", facecolor="blue"))
```

## Adjusting Tick Labels and Positions

```python
ax = fig.add_subplot(111, xticks=[0, 0.25, 0.75, 1], xticklabels=["", "A", "B", ""])
```

## Extracting a Size Legend Independently

Normally this is fine as-is, but when you adjust the size of points in a scatter plot, for example, you need to adjust the labels. In such cases, it's useful to extract the legend and redraw it.

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

## Adjusting Subplot Spacing Nicely

Use `tight_layout`.

```python
fig = plt.figure()
ax1 = fig.add_subplot(112)
ax2 = fig.add_subplot(212)
fig.tight_layout()
```
