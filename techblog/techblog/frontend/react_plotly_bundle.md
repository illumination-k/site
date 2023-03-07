---
uuid: 1c2d022d-dabc-4a33-9483-0faecba52618
title: plotly.jsのbundle sizeを削減する
description: plotlyはJavascriptだけでなくPythonやRでも使われている非常に利便性の高いライブラリです。しかし、フロントエンドで使うにはバンドルサイズが大きすぎるという問題があります。plotlyのバンドルサイズの削減方法と、react-plotly.jsでの適用方法をまとめておきます。
lang: ja
category: techblog
tags:
  - plotly
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

plotlyはJavascriptだけでなくPythonやRでも使われている非常に利便性の高い可視化ライブラリです。しかし、フロントエンドで使うにはバンドルサイズが大きすぎるという問題があります。plotlyのバンドルサイズの削減方法と、react-plotly.jsでの適用方法をまとめておきます。

## Plotlyのバンドルサイズについて

普通に`npm install plotly`みたいなことをするともれなく8MBのバンドルが生成されます。`minify+gzip`しても1MBという巨大さです。

一般的に言って、このバンドルサイズをフロントエンドで使うとすごく重くなります。なので、Plotly側である程度分割されたバンドルが用意されています。

分割されたバンドルの内容とサイズを以下の表にまとめました。分割されてもまあまあでかいですね。

| Name                                                                               | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | size   | minify    | minify+gzip |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------- | ----------- |
| [plotly.js](https://www.npmjs.com/package/plotly.js)                               | all                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 8 MB   | 3.4 MB    | 1019.6 kB   |
| [plotly.js-basic-dist](https://www.npmjs.com/package/plotly.js-basic-dist)         | `bar`, `pie`, `scatter`                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | 2.7 MB | 1007.3 kB | 327.3 kB    |
| [plotly.js-cartesian-dist](https://www.npmjs.com/package/plotly.js-cartesian-dist) | `bar`, `box`, `contour`, `heatmap`, `histogram`, `histgram2d`, `histgram2dcountour`, `image`, `pie`, `scatter`, `scattertenary`, `violin`                                                                                                                                                                                                                                                                                                                                                          | 3.3 MB | 1.2 MB    | 398.7 kB    |
| [plotly.js-geo-dist](https://www.npmjs.com/package/plotly.js-geo-dist)             | `choropleth`, `scatter`, `scattergeo`                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 2.9 MB | 1 MB      | 337.3 kB    |
| [plotly.js-gl3d-dist](https://www.npmjs.com/package/plotly.js-gl3d-dist)           | `cone`, `isosurface`, `mesh3d`, `scatter`, `scatter3d`, `streamtube`, `surface`, `volume`                                                                                                                                                                                                                                                                                                                                                                                                          | 3.8 MB | 1.5 MB    | 482.7 kB    |
| [plotly.js-gl2d-dist](https://www.npmjs.com/package/plotly.js-gl2d-dist)           | `heatmapgl`, `parcoords`, `pointcloud`, `scatter`, `scattergl`, `splom`                                                                                                                                                                                                                                                                                                                                                                                                                            | 3.8 MB | 1.5 MB    | 503.1 kB    |
| [plotly.js-mapbox-dist](https://www.npmjs.com/package/plotly.js-mapbox-dist)       | `choroplethmapbox`, `densitymapbox`, `scatter`, `scattermapbox`                                                                                                                                                                                                                                                                                                                                                                                                                                    | 4.4 MB | 1.8 MB    | 525 kB      |
| [plotly.js-finance-dist](https://www.npmjs.com/package/plotly.js-finance-dist)     | `bar`, `candlestick`, `funnel`, `funnelarea`, `histogram`, `indicator`, `ohlc`, `pie`, `scatter`, `waterfall`                                                                                                                                                                                                                                                                                                                                                                                      | 3 MB   | 1.1 MB    | 353.5 kB    |
| [plotly.js-strict-dist](https://www.npmjs.com/package/plotly.js-strict-dist)       | `bar`, `barpolar`, `box`, `candlestick`, `carpet`, `choropleth`, `choroplethmapbox`, `contour`, `contourcarpet`, `densitymapbox`, `funnel`, `funnelarea`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `icicle`, `image`, `indicator`, `ohlc`, `parcats`, p`arcoords`, `pie`, `sankey`, `scatter`, `scattercarpet`, `scattergeo`, `scattergl`, `scattermapbox`, `scatterpolar`, `scatterpolargl`, `scatterternary`, `splom`, `sunburst`, `table`, `treemap`, `violin`, `waterfall` | 6.7 MB | 2.8 MB    | 840.4 kB    |

> [Using distributed files](https://github.com/plotly/plotly.js/blob/master/dist/README.md)

`npm install plotly.js-cartesian-dist`というような形でインストールできます。CDNとかでも同様に専用のリンクがあります。

基本的な図を書く分には`cartesian`あたりが一番いいんじゃないかと思っています。あとは用途に合わせて使い分ければ少しは軽くなるはずです。

## react-plotly.jsで分割されたバンドルを使う

`react-plotly.js/factory`にある`createPlotlyComponent`を使います。

```jsx:title=Plot.jsx
import Plotly from "plotly.js-cartesian-dist";
import createPlotlyComponent from "react-plotly.js/factory";

const Plot = createPlotlyComponent(Plotly);
export default Plot;
```

のような形で分割されたバンドルを利用した`Plot`が使えるようになります。
あとはPlotlyが使われてないところでPlotlyのバンドルが読み込まれるのは嫌なので、

```jsx
import React from "react";
const Plot = React.lazy(() => import("./Plot"));
```

のような形で、`React.lazy`を使えばPlotlyを使っているコンポーネントがある場所でのみロードされるので嬉しいかもしれません。
