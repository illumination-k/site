---
uuid: de87d9d5-2362-48d7-a31e-af9b33a234aa
title: SQLに関するメモ書き
description: SQLに関するメモ
lang: ja
category: techblog
tags:
  - sql
  - backend
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

SQLに関するメモ。入門レベルです。

## 基本構文

### SELECT

見たい列名を指定できる。すべての基本。

```sql
SELECT id, name FROM A
```

### DISTINCT

`DISTINCT`をつければ重複を排除できる。`SELECT`以外でも使える。

```sql
SELECT DISTINCT id, name FROM A
```

### WHERE

条件指定できる。

```sql
SELECT id, name FROM A
    WHERE id = 1
```

### ORDER BE

条件でソート。降順なら`DESC`が必要

```sql
SELECT id FROM A ORDER BY A DESC
```

### JOIN

内部結合 (`INNER JOIN`) と外部結合 (`LEFT OUTER JOIN`) がある。`pandas`と同じ感じ。

```sql
SELECT * FROM A
    INNER JOIN B
    ON A.id = B.id
```

### IFNULL, COACESCE

- `IFNULL`: NULLをとったときのデフォルト値を指定できる。
- `COALESCE`: 複数列を調べて、NULLだったらデフォルト値を返す。

```sql
SELECT id, IFNULL(
    (SELECT name FROM A), "UnKnown"
) as name, COALESCE(id, name, "?")
```

### LIMIT

持ってくるレコードの数の制限。

```sql
SELECT id FROM A LIMIT 1
```

### OFFSET

何番目からレコードを取得するか。ソートと組み合わせて使うことが多そう。

```sql
SELECT id FROM A ORDER BY id OFFSET 1
```

### 変数定義

`DECLARE`が必要？

```sql
DECLARE N INT;
SET N = 0;
```

### 判定

NULLかどうか

```sql
N IS NULL --or
N IS NOT NULL
```

大小比較などは普通の記号は使える。同一判定は`==`ではなく`=`を使う。

## Window関数

`GROUP BY`だとまとめられてしまうけど、まとめずに新しい列を作成する。`PARTITION BY`を使ってどの列を対象とするかを決定する。通常の集計関数と、Window関数専用の関数がある。

### 基本

```sql
-- GROUP BY
SELECT gid, SUM(val) FROM t GROUP BY gid

-- WINDOW
SELECT gid, SUM(val) OVER (PARTITION BY gid) FROM t
```

### ORDER BY

window関数内での`ORDER BY`はwindow関数が処理する順序を指定する。`SUM`を使うと、その行までの和が得られる。

```sql
SELECT gid, SUM(val) OVER (PARTITION BY gid ORDER BY val) FROM t
```

### ROW

どこからどこまで処理するかを指定できる。

開始位置、終了位置で使える変数は以下

| name                | description     |
| ------------------- | --------------- |
| CURRENT ROW         | 現在行          |
| UNBOUNDED PRECEDING | PARTITIONの最初 |
| UNBOUNDED FOLLOWING | PARTITIONの最後 |
| N(INT) PRECEDING    | 現在行のN行前   |
| N(INT) FOLLOWING    | 現在行のN行後   |
