---
uuid: de87d9d5-2362-48d7-a31e-af9b33a234aa
title: SQL Notes
description: Notes on SQL
lang: en
category: techblog
tags:
  - sql
  - backend
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Notes on SQL. This is at an introductory level.

## Basic Syntax

### SELECT

You can specify the column names you want to see. This is the foundation of everything.

```sql
SELECT id, name FROM A
```

### DISTINCT

Adding `DISTINCT` eliminates duplicates. It can be used in contexts other than `SELECT` as well.

```sql
SELECT DISTINCT id, name FROM A
```

### WHERE

You can specify conditions.

```sql
SELECT id, name FROM A
    WHERE id = 1
```

### ORDER BY

Sort by a condition. `DESC` is required for descending order.

```sql
SELECT id FROM A ORDER BY A DESC
```

### JOIN

There are inner joins (`INNER JOIN`) and outer joins (`LEFT OUTER JOIN`). It works the same way as in `pandas`.

```sql
SELECT * FROM A
    INNER JOIN B
    ON A.id = B.id
```

### IFNULL, COALESCE

- `IFNULL`: Specify a default value when a value is NULL.
- `COALESCE`: Examines multiple columns and returns a default value if NULL.

```sql
SELECT id, IFNULL(
    (SELECT name FROM A), "UnKnown"
) as name, COALESCE(id, name, "?")
```

### LIMIT

Limits the number of records retrieved.

```sql
SELECT id FROM A LIMIT 1
```

### OFFSET

Specifies which record number to start retrieving from. Often used in combination with sorting.

```sql
SELECT id FROM A ORDER BY id OFFSET 1
```

### Variable Definition

`DECLARE` may be required.

```sql
DECLARE N INT;
SET N = 0;
```

### Comparison

Checking if NULL:

```sql
N IS NULL --or
N IS NOT NULL
```

Standard comparison operators work for greater/less than comparisons. For equality, use `=` instead of `==`.

## Window Functions

Unlike `GROUP BY` which aggregates rows, window functions create a new column without aggregating. Use `PARTITION BY` to specify which column to target. Both regular aggregate functions and window function-specific functions can be used.

### Basics

```sql
-- GROUP BY
SELECT gid, SUM(val) FROM t GROUP BY gid

-- WINDOW
SELECT gid, SUM(val) OVER (PARTITION BY gid) FROM t
```

### ORDER BY

`ORDER BY` within a window function specifies the order in which the window function processes rows. When using `SUM`, it gives the cumulative sum up to the current row.

```sql
SELECT gid, SUM(val) OVER (PARTITION BY gid ORDER BY val) FROM t
```

### ROW

You can specify from where to where processing should occur.

The following variables can be used for start and end positions:

| name                | description                   |
| ------------------- | ----------------------------- |
| CURRENT ROW         | Current row                   |
| UNBOUNDED PRECEDING | Start of the PARTITION        |
| UNBOUNDED FOLLOWING | End of the PARTITION          |
| N(INT) PRECEDING    | N rows before the current row |
| N(INT) FOLLOWING    | N rows after the current row  |
