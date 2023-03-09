---
uuid: 2e20078f-198e-4a45-92d1-d73fed726eca
title: Prisma + Next.jsでシンプルなCRUD APIを作成する
description: O/Rマッパとしてprismaを使用して、簡単なCRUDをNext.jsと一緒に作成します。
lang: ja
category: techblog
tags:
  - next.js
  - prisma
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

O/Rマッパとしてprismaを使用して、簡単なCRUDをNext.jsと一緒に作成します。

## Next.jsのセットアップ

なにはともあれNext.jsをセットアップします。

```bash
yarn create next-app --typescript
```

## prismaのセットアップ

### prismaをインストール

```bash
# install
yarn add @prisma/client
yarn add prisma --dev

# init
npx prisma init
```

`.env`が作成され、その中にDATABASE_URLが設定されています。今回は`sqlite3`を使います。

```env title=.env
DATABASE_URL="file:./dev.db"
```

schemaを書きます。とりあえず、titleとcontentがあれば良さそうです。

```prisma title=prisma/schema.prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Todo {
  id        Int      @default(autoincrement()) @id
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  title String @db.VarChar(255)
  content String?
}
```

準備ができたので、データベースを起動した後、migrationをし、prisma clientのセットアップをします。

```bash
npx prisma migrate dev --name init
```

migrateをすると自動的に`@prisma/client`が`node_modules`配下に作成されます。明示的に`npx prisma generate`をすることでも生成できます。

テーブルができているか一応チェックします。

```bash
sqlite3 prisma/dev.db
> .tables
Todo                _prisma_migrations
> .schema TODO
CREATE TABLE IF NOT EXISTS "Todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT
);
```

<details>
<summary>Postgresの場合</summary>

herokuかなんかにデプロイする気がするので、postgresを使用する場合についても書いておきます。まず、postgresをdockerで用意しておきます。頻繁にpostgresのdockerを使っているので、使用するportは15432です。

```yml
version: "3"
services:
  db:
    image: postgres:13.3
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - 15432:5432
    volumes:
      - ./postgres:/var/lib/postgresql
volumes:
  postgres:
```

`.env`のDATABASE_URLを以下のように設定します。portを今回はいじっているのと、パスワード、ユーザーネームが設定されているので注意が必要です。

```env title=.env
DATABASE_URL="postgresql://postgres:postgres@localhost:15432/main?schema=public"
```

</details>

### prisma clientの設定

`libs`以下にprisma clientの設定を作成しておきます。どんなクエリが投げられているか一応みたいなので、logにqueryを追加しています。

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
  log: ["query", "error", "info", "warn"],
});
export default prisma;

export * from "@prisma/client";
```

## CRUDできるAPIの作成

今回は単純な確認なので、メソッドの確認は行っていません。また、実際にはパスパラメタなどでIDを受け取ったほうがいいと思いますが、`Next.js`でやるのは少し面倒だったので、全てデータの中で受け取っています。

### Create

まず、Todoを作成する`create-todo`を作成します。

```ts: title=pages/api/create-todo.ts
import type { NextApiHandler } from "next"
import prisma from "../../libs/prisma"

const handler: NextApiHandler = async (req, res) => {
    try {
        await prisma.todo.create({data: {...req.body, updatedAt: new Date()}})
        res.status(200).send("ok");
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
}

export default handler;
```

`yarn dev`で起動して、APIにPOSTを投げてみます。

```bash
curl -X POST -H "Content-Type: application/json" -d '{ "title": "test", "content": "Test Todo Items" }' localhost:3000/api/create-todo
# ok
```

### READ

TODO LISTを取得するEND POINTを作成します。

```ts title=pages/api/get-todos.ts
import type { NextApiHandler } from "next"
import prisma from "../../libs/prisma"

const handler: NextApiHandler = async (req, res) => {
    try {
        const todos = await prisma.todo.findMany();
        res.status(200).json(todos);
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
}

export default handler;
```

GETリクエストしてみます。ちゃんと作成されていることが分かります。

```bash
curl localhost:3000/api/get-todos | jq
```

```json
[
  {
    "id": 1,
    "createdAt": "2021-11-09T00:01:37.223Z",
    "updatedAt": "2021-11-09T00:01:37.215Z",
    "title": "test",
    "content": "Test Todo Items"
  }
]
```

### UPDATE

UPDATE用のAPIを作ります。

```ts title=pages/api/update-todo.ts
import type { NextApiHandler } from "next"
import prisma from "../../libs/prisma"

const handler: NextApiHandler = async (req, res) => {
    if (!req.body.id) {
        res.status(400).send("Bad Request. need id!");
        return
    }
    try {
        await prisma.todo.update({data: {...req.body, updatedAt: new Date()}, where: {id: req.body.id}})
        res.status(200).send("ok");
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
}

export default handler;
```

curlでチェックします。

```bash
curl -X PUT -H "Content-Type: application/json" -d '{ "id": 1, "title": "test", "content": "Update Test Todo Items" }' localhost:3000/api/update-todo
# ok
curl localhost:3000/api/get-todos | jq
```

```json
[
  {
    "id": 1,
    "createdAt": "2021-11-09T00:01:37.223Z",
    "updatedAt": "2021-11-09T00:12:38.526Z",
    "title": "test",
    "content": "Update Test Todo Items"
  }
]
```

contentとupdatedAtがたしかに更新されています。

### Delete

最後にDelete部分を実装します。

```ts title=pages/api/delete-todo.ts
import type { NextApiHandler } from "next"
import prisma from "../../libs/prisma"

const handler: NextApiHandler = async (req, res) => {
    try {
        await prisma.todo.delete({where: {id: req.body.id}})
        res.status(200).send("ok");
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
}

export default handler;
```

DELETできるか確認します。

```bash
curl -X DELETE -H "Content-Type: application/json" -d '{ "id": 1 }' localhost:3000/api/delete-todo
# ok
curl localhost:3000/api/get-todos | jq
# []
```
