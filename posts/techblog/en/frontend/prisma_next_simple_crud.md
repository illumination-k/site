---
uuid: 2e20078f-198e-4a45-92d1-d73fed726eca
title: Building a Simple CRUD API with Prisma + Next.js
description: Using Prisma as an ORM to build a simple CRUD application together with Next.js.
lang: en
category: techblog
tags:
  - next.js
  - prisma
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Using Prisma as an ORM to build a simple CRUD application together with Next.js.

## Setting Up Next.js

First things first, let's set up Next.js.

```bash
yarn create next-app --typescript
```

## Setting Up Prisma

### Installing Prisma

```bash
# install
yarn add @prisma/client
yarn add prisma --dev

# init
npx prisma init
```

A `.env` file is created with a DATABASE_URL configured. This time we'll use `sqlite3`.

```env title=.env
DATABASE_URL="file:./dev.db"
```

Let's write the schema. For now, having a title and content should suffice.

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

Now that we're ready, start the database and run the migration to set up the Prisma client.

```bash
npx prisma migrate dev --name init
```

Running migrate automatically creates `@prisma/client` under `node_modules`. You can also explicitly generate it with `npx prisma generate`.

Let's verify the table was created.

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

:::details[>For Postgres]

Since I might deploy to Heroku or something, I'll also document the Postgres case. First, prepare Postgres with Docker. Since I frequently use Postgres Docker, I use port 15432.

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

Set the DATABASE_URL in `.env` as follows. Note that the port has been changed and a password and username are configured.

```env title=.env
DATABASE_URL="postgresql://postgres:postgres@localhost:15432/main?schema=public"
```

:::

### Prisma Client Configuration

Create the Prisma client configuration under `libs`. I added query to the log since I want to see what queries are being sent.

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({
	log: ["query", "error", "info", "warn"],
});
export default prisma;

export * from "@prisma/client";
```

## Creating the CRUD API

Since this is just a simple verification, I'm not checking the HTTP methods. Also, while it would be better to receive the ID via path parameters in practice, it was a bit cumbersome to do in Next.js, so everything is received in the request body.

### Create

First, let's create `create-todo` to create a Todo.

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

Start with `yarn dev` and send a POST to the API.

```bash
curl -X POST -H "Content-Type: application/json" -d '{ "title": "test", "content": "Test Todo Items" }' localhost:3000/api/create-todo
# ok
```

### READ

Create an endpoint to retrieve the TODO list.

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

Send a GET request. We can confirm it was created correctly.

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

Create an API for updating.

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

Check with curl.

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

The content and updatedAt have indeed been updated.

### Delete

Finally, let's implement the Delete part.

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

Let's verify the delete works.

```bash
curl -X DELETE -H "Content-Type: application/json" -d '{ "id": 1 }' localhost:3000/api/delete-todo
# ok
curl localhost:3000/api/get-todos | jq
# []
```
