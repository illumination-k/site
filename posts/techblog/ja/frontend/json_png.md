---
uuid: eff9cc47-a0d4-4c9e-9027-c15e13a88563
title: JSONで画像をやりとりする python <-> JavaScript (React)
description: Python、特にmatplotlibで作成したPNGファイルをJSONにSerializeしてフロントエンド側に送りたいときにどうすればいいのかについて
lang: ja
category: techblog
tags:
  - frontend
  - python
  - javascript
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-06-12T15:55:39+00:00"
---

## TL;DR

matplotlibは非常に優れたPythonのPlot libraryであり、バックエンド側でpngやsvgを作成しフロントエンド側に送って表示させたい場合があります。そういう場合にどうすればいいのか、まとまっている情報があまりなかったのでメモ。

> Python 3.7.4
> Node v12.16.2

## Python側

基本的に`BytesIO`を使ってBufferを読み込んで、その値をJSONにSerializeします。
とりあえずサンプルプロットを作成します。JSONを送信する方法はflaskなりdjangoなりを使ってください。

```python
import numpy as np
import matplotlib
import matplotlib.pyplot as plt

print(matplotlib.__version__)
# '3.2.2'

x = np.linspace(0, 10, 10000)

fig, ax = plt.subplots()
ax.plot(x, np.sin(x))
```

これについて、png/svgをJSONにシリアライズします。svgはそのままシリアライズできますが、pngについてはbase64 encodingが必要です。pngじゃなくてjpegとかでも同様です。

### SVG to JSON

```python
import io
import json

with io.BytesIO() as buf:
    fig.savefig(buf, format="svg")
    svg = buf.getvalue().decode("utf-8")

print(json.dumps({"svg": svg}))
# 長いので出力は省略
```

### PNG to JSON

```python
import io
import json
import base64

with io.BytesIO() as buf:
    fig.savefig(buf, format="png")
    png = base64.encodebytes(buf.getvalue()).decode("utf-8")

print(json.dumps({"png": png}))
```

## JavaScript (React)側

こっちは色々方法があると思いますが、JSX使うのが楽なのでReactを使います。JSONはfetchとかaxiosとかで持ってくるものとします。持ってきたデータを`json_data`としておきます。

### SVG rendering from JSON

innerHTMLとして埋め込むこともできますが、今回は[react-inlinesvg](https://www.npmjs.com/package/react-inlinesvg)というパッケージを使ってしまいます。propsで受け渡されていることにしましょう。

```bash
npm i react-inlinesvg
```

```jsx
import React from "react";
import SVG from "react-inlinesvg";

const Svg = ({ json_data }) => {
	return <SVG src={json_data.svg} />;
};
```

### PNG rendering from JSON

こちらはデフォルトで`<img src={}>`にblobから作成したURIを入れればいいです。

```jsx
import React from "react";

const Png = ({ json_data }) => {
	const buf = Buffer.from(json_data.png, "base64");
	const blob = new Blob([buf], { type: "image/png" });
	const uri = URL.createObjectURL(blob);

	return <img src={uri} />;
};
```

## 最後に

まとまった情報が見つからなかったのでメモがてら残しておきます。
