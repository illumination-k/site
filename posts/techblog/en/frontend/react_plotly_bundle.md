---
uuid: 1c2d022d-dabc-4a33-9483-0faecba52618
title: Reducing the Bundle Size of plotly.js
description: Plotly is a highly versatile library used not only in JavaScript but also in Python and R. However, its bundle size is too large for frontend use. This article summarizes how to reduce Plotly's bundle size and how to apply it with react-plotly.js.
lang: en
category: techblog
tags:
  - plotly
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Plotly is a highly versatile visualization library used not only in JavaScript but also in Python and R. However, its bundle size is too large for frontend use. This article summarizes how to reduce Plotly's bundle size and how to apply it with react-plotly.js.

## About Plotly's Bundle Size

If you simply run something like `npm install plotly`, you'll get an 8MB bundle. Even minified and gzipped, it's still 1MB, which is huge.

Generally speaking, using this bundle size on the frontend makes things very slow. So Plotly provides pre-split bundles to some extent.

The following table summarizes the contents and sizes of the split bundles. They're still fairly large even when split.

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

You can install them with something like `npm install plotly.js-cartesian-dist`. CDN links also have dedicated URLs for each bundle.

For drawing basic charts, I think `cartesian` is the best choice. Beyond that, pick the appropriate bundle for your use case to keep things lighter.

## Using Split Bundles with react-plotly.js

Use `createPlotlyComponent` from `react-plotly.js/factory`.

```jsx title=Plot.jsx
import Plotly from "plotly.js-cartesian-dist";
import createPlotlyComponent from "react-plotly.js/factory";

const Plot = createPlotlyComponent(Plotly);
export default Plot;
```

This gives you a `Plot` component that uses the split bundle.
Since you don't want the Plotly bundle to load on pages that don't use Plotly, you can use `React.lazy`:

```jsx
import React from "react";
const Plot = React.lazy(() => import("./Plot"));
```

This way, it only loads where the Plotly component is actually used, which is nice.
