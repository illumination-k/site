---
uuid: 65fdce8c-8796-4caa-ae67-e1980d8ce3c2
title: material-uiに関するスクラップ
description: material-uiに関するスクラップ
lang: ja
category: techblog
tags:
  - frontend
  - material-ui
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## 右揃えの要素を作る

`flexGrow: 1`とした要素を挿入する。

```jsx
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";

const Header = () => {
	return (
		<div styles={{ flexGrow: 1 }}>
			<AppBar>
				<Button>Left Button</Button>
				<strong>title</strong>
				<div styles={{ flexGrow: 1 }} />
				<Button>Right Button</Button>
			</AppBar>
		</div>
	);
};
```

- [ReactのMaterial-UIで、右揃えの要素を作るには](https://kanchi0914.netlify.app/2020/03/12/react-spacer/)

## Grid間の高さを揃える

`height: 100%`を使う。

- [Material-UIの「Data Grid」で高さを自動設定する](https://tech-it.r-net.info/program/react/309/)

## Buttonの中身を大文字にしない

`text-transform: 'none'`を使う。

- [Paper-Button always as upper case](https://stackoverflow.com/questions/25158435/paper-button-always-as-upper-case)

## Material-UI 4 -> 5のmigration

```bash
yarn add @mui/material @mui/styles @mui/lab @mui/icons-material @emotion/react @emotion/styled

# If you use next,
yarn add @emotion/server

npx @mui/codemod v5.0.0/preset-safe .
```

で基本的には置換される。エラーは起きなくなるが、推奨されていないものが残ったりはするので適宜修正していく。
