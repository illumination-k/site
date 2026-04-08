---
uuid: 65fdce8c-8796-4caa-ae67-e1980d8ce3c2
title: Scraps on Material UI
description: Scraps on Material UI
lang: en
category: techblog
tags:
  - frontend
  - material-ui
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## Creating a Right-Aligned Element

Insert an element with `flexGrow: 1`.

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

- [How to Create Right-Aligned Elements with React Material-UI](https://kanchi0914.netlify.app/2020/03/12/react-spacer/)

## Aligning Heights Between Grids

Use `height: 100%`.

- [Auto-Setting Height for Material-UI Data Grid](https://tech-it.r-net.info/program/react/309/)

## Preventing Button Text from Being Uppercased

Use `text-transform: 'none'`.

- [Paper-Button always as upper case](https://stackoverflow.com/questions/25158435/paper-button-always-as-upper-case)

## Material-UI 4 -> 5 Migration

```bash
yarn add @mui/material @mui/styles @mui/lab @mui/icons-material @emotion/react @emotion/styled

# If you use next,
yarn add @emotion/server

npx @mui/codemod v5.0.0/preset-safe .
```

This will basically handle the replacements. Errors will go away, but some deprecated patterns may remain, so fix them as needed.
