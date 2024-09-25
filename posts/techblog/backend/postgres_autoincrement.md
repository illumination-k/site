---
uuid: be25bb0f-7578-4206-80f5-0745174a0ef7
title: "PostgresのSerial型のPrimary keyの挙動について"
description: "PostgreSQLでERROR: duplicate key value violates unique constraintエラーが発生する原因の1つとして、Serial型のPrimary keyに手動で値を割り当てた際にシーケンスが正しく更新されないことがあります。これは、Default値であるnextvalが呼び出されないことによって起こります。この問題を解決するためには、テーブルのPrimary keyの現在の最大値をシーケンスオブジェクトに設定する必要があります。具体的な手順としては、setval関数を使用してシーケンスオブジェクトの値を調整することで、INSERT操作が正しく実行されるようになります。"
category: "techblog"
lang: ja
tags: ["postgresql"]
created_at: 2024-09-25
updated_at: 2024-09-25
---

## TL;DR

`ERROR:  duplicate key value violates unique constraint`がpostgresで起こる原因の1つとして、Serial型の採番が行われないことによってPrimary keyの整合が取れない場合が挙げられれます。
この問題が起こるのは基本的には手動でPrimary keyに値を代入した時に起こりやすいです。

この問題の解決策は多くの記事で述べられていますが、挙動そのものについてはあまり触れられていなかったため、本記事ではその時シーケンスオブジェクトがどうなっているのかの挙動の確認を置いておきます。

## 環境

以下の`docker-compose.yaml`を利用します。

```yaml title=docker-compose.yaml
services:
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=postgres
```

```bash
docker compose exec postgres /bin/bash
psql -U postgres
```

## シーケンスオブジェクト (Sequence Object) に関する検証

### テーブル準備とスキーマの説明

検証用のテーブルを作ります。明示的にprimary keyにはSerial型を与えます。

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
```

テーブルができていることを確認します。`users`テーブルとSerial型の`users_id_seq`ができています。

```
postgres=# \d
              List of relations
 Schema |     Name     |   Type   |  Owner   
--------+--------------+----------+----------
 public | users        | table    | postgres
 public | users_id_seq | sequence | postgres
(2 rows)
```

`users`テーブルのスキーマを確認します。Default値は`nextval('users_id_seq'::regclass)`になっています。

```
postgres=# \d users
                                    Table "public.users"
 Column |          Type          | Collation | Nullable |              Default              
--------+------------------------+-----------+----------+-----------------------------------
 id     | integer                |           | not null | nextval('users_id_seq'::regclass)
 name   | character varying(255) |           | not null | 
Indexes:
    "users_pkey" PRIMARY KEY, btree (id)
```

`nextval`は[Sequence Manipulation functions](https://www.postgresql.org/docs/16/functions-sequence.html)です。公式の説明は以下です。

> Advances the sequence object to its next value and returns that value. This is done atomically: even if multiple sessions execute nextval concurrently, each will safely receive a distinct sequence value. If the sequence object has been created with default parameters, successive nextval calls will return successive values beginning with 1. Other behaviors can be obtained by using appropriate parameters in the CREATE SEQUENCE command.

`nextval`自体はシーケンスオブジェクトを採番して次の値に進め、その値を返す関数です。これによって、INSERT時のauto incrementが行われます。
また、言い換えると、**このDefaultが呼ばれない限り採番が行われません**。

### 実際に挙動を確認する

まず、初期状態に対してINSETして採番がどうなるかを確認します。`currval`関数を使って、現状のシーケンスオブジェクトを取得しています。
`currval`関数は、シーケンスオブジェクトの現在の数を返します。

これを見るとちゃんと採番されていることがわかります (シーケンスオブジェクトは1-indexです)。この場合は問題は起こりません。

```sql
INSERT INTO users (name) VALUES
('John'),
('Mary');

SELECT currval('users_id_seq');
-- 2
```

一回`DROP TABLE users;`をしてテーブルを再作成します。その後IDを明示してみると、現状のシーケンスオブジェクトを取得しようとすると採番がされておらずエラーすることがわかります。
また、この後idを明示せずにINSERTを試みると、冒頭で記述した`duplicate key value violates unique constraint`が起こります。

ちなみにINSERTが失敗しても採番されます。なので後2回同じことをすれば最後には成功します。これはDefaultの`nextval('users_id_seq'::regclass)`が毎回呼ばれるため起こります。

```sql
INSERT INTO users (id, name) VALUES
(1, 'John'),
(2, 'Mary');

SELECT currval('users_id_seq');
-- ERROR:  currval of sequence "users_id_seq" is not yet defined in this session

INSERT INTO users (name) VALUES
('Bob');
-- ERROR:  duplicate key value violates unique constraint "users_pkey"
-- DETAIL:  Key (id)=(1) already exists.

SELECT currval('users_id_seq');
-- 1
```

## 解決方法

一旦また`DROP TABLE users`をしてテーブルを再作成します。

要は`currval`で取得できる値の辻褄があっていればいいわけです。
なので、`setval`を使って現状のテーブルのprimary keyの最大値を対応するシーケンスオブジェクトに書き込めば解決します。

```sql
INSERT INTO users (id, name) VALUES
(1, 'John'),
(2, 'Mary');

SELECT currval('users_id_seq');
-- ERROR:  currval of sequence "users_id_seq" is not yet defined in this session

SELECT setval(
    pg_get_serial_sequence('users', 'id'), 
    (SELECT MAX(id) FROM "users")
);
-- 2

SELECT currval('users_id_seq');
-- 2

INSERT INTO users (name) VALUES
('Bob');
-- INSERT 0 1

SELECT currval('users_id_seq');
-- 3
```

:::details[setvalに関するTips]

ちなみに`setval`は3個目の引数に`is_called`を取ります。ここをFalseにしておくと、`nextval`で取得できる値を指定できます。

この場合以下のように書いておくと、`currval`では確認できませんが、次のINSERT時に採番される値は`MAX(id) + 1`になります。

```sql
SELECT setval(
    pg_get_serial_sequence('users', 'id'), 
    (SELECT MAX(id)+1 FROM "users"),
    false
);
```

[公式の例](https://www.postgresql.org/docs/16/functions-sequence.html)がわかりやすいです

```sql
SELECT setval('myseq', 42);           Next nextval will return 43
SELECT setval('myseq', 42, true);     Same as above
SELECT setval('myseq', 42, false);    Next nextval will return 42
```

:::
