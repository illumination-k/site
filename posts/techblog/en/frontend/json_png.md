---
uuid: eff9cc47-a0d4-4c9e-9027-c15e13a88563
title: Exchanging Images via JSON between Python and JavaScript (React)
description: How to serialize PNG files created with Python (especially matplotlib) into JSON and send them to the frontend.
lang: en
category: techblog
tags:
  - frontend
  - python
  - javascript
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-06-12T15:55:39+00:00"
---

## TL;DR

matplotlib is an excellent Python plotting library, and there are cases where you want to create PNG or SVG images on the backend and send them to the frontend for display. Since I couldn't find well-organized information on how to do this, I'm writing it down here.

> Python 3.7.4
> Node v12.16.2

## Python Side

The basic approach is to read the buffer using `BytesIO` and serialize the value into JSON.
First, let's create a sample plot. Use flask, django, or another framework of your choice to send the JSON.

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

Now let's serialize the PNG/SVG to JSON. SVG can be serialized as-is, but PNG requires base64 encoding. The same applies to JPEG and other formats.

### SVG to JSON

```python
import io
import json

with io.BytesIO() as buf:
    fig.savefig(buf, format="svg")
    svg = buf.getvalue().decode("utf-8")

print(json.dumps({"svg": svg}))
# Output omitted due to length
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

## JavaScript (React) Side

There are various approaches on this side, but using JSX with React is the easiest. Assume the JSON is fetched using fetch, axios, or similar. Let's call the fetched data `json_data`.

### SVG Rendering from JSON

You could embed it as innerHTML, but here we'll use the [react-inlinesvg](https://www.npmjs.com/package/react-inlinesvg) package. Let's assume the data is passed as props.

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

### PNG Rendering from JSON

For this, you just need to create a URI from a blob and put it in `<img src={}>`.

```jsx
import React from "react";

const Png = ({ json_data }) => {
	const buf = Buffer.from(json_data.png, "base64");
	const blob = new Blob([buf], { type: "image/png" });
	const uri = URL.createObjectURL(blob);

	return <img src={uri} />;
};
```

## Closing

Since I couldn't find well-organized information on this topic, I'm leaving this here as a note.
