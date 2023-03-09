# Site

## Web

```bash
pnpm run web:build && pnpm run web:start
```

## Blog Posts

## Build cli command

```bash
pnpm run cli:build
```

## Generate template

```bash
pnpm run cli template -o filename
```

### Dump post

```bash
pnpm run cli dump --mdFiles ./posts/techblog  --imageDist ./packages/web/public/techblog --dumpFile ./packages/web/dumps/techbolog.json
```

- markdownのコンパイル
  - md-pluginsのtransformを実行
- ヘッダー情報、token情報の取得
- imageのresize, webp変換, size propertyの追加

### Check outdated

```bash
pnpm run cli check --mdFiles ./techblog
```
