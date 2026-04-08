---
uuid: be25bb0f-7578-4206-80f5-0745174a0ef7
title: "Behavior of Serial Type Primary Keys in PostgreSQL"
description: "One cause of the ERROR: duplicate key value violates unique constraint error in PostgreSQL is that the sequence is not properly updated when values are manually assigned to a Serial type primary key. This happens because the default nextval is not called. To resolve this issue, you need to set the current maximum value of the primary key in the table to the sequence object. Specifically, by using the setval function to adjust the sequence object value, INSERT operations will execute correctly."
category: "techblog"
lang: en
tags: ["postgresql", "database"]
created_at: 2024-09-25
updated_at: 2024-09-25
---

## TL;DR

One cause of `ERROR:  duplicate key value violates unique constraint` in PostgreSQL is when the Serial type's numbering does not occur, causing the primary key to become inconsistent.
This issue typically arises when you manually assign values to a primary key.

While solutions to this problem are described in many articles, the underlying behavior itself is not often covered. This article documents what happens with the sequence object in such cases.

## Environment

The following `docker-compose.yaml` is used.

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

## Verifying Sequence Object Behavior

### Table Preparation and Schema Explanation

Create a table for verification. We explicitly assign the Serial type to the primary key.

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
```

Verify that the table has been created. You can see the `users` table and the Serial type's `users_id_seq`.

```
postgres=# \d
              List of relations
 Schema |     Name     |   Type   |  Owner
--------+--------------+----------+----------
 public | users        | table    | postgres
 public | users_id_seq | sequence | postgres
(2 rows)
```

Check the schema of the `users` table. The default value is `nextval('users_id_seq'::regclass)`.

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

`nextval` is a [Sequence Manipulation function](https://www.postgresql.org/docs/16/functions-sequence.html). The official description is as follows:

> Advances the sequence object to its next value and returns that value. This is done atomically: even if multiple sessions execute nextval concurrently, each will safely receive a distinct sequence value. If the sequence object has been created with default parameters, successive nextval calls will return successive values beginning with 1. Other behaviors can be obtained by using appropriate parameters in the CREATE SEQUENCE command.

`nextval` itself is a function that advances the sequence object to the next value and returns it. This is how auto-increment works during INSERT.
In other words, **numbering does not occur unless this default is called**.

### Verifying the Actual Behavior

First, let's INSERT into the initial state and check how the numbering works. We use the `currval` function to get the current sequence object value.
The `currval` function returns the current number of the sequence object.

As you can see, the numbering is working correctly (sequence objects are 1-indexed). In this case, no problems occur.

```sql
INSERT INTO users (name) VALUES
('John'),
('Mary');

SELECT currval('users_id_seq');
-- 2
```

Let's `DROP TABLE users;` and recreate the table. When we then try to specify the ID explicitly, attempting to get the current sequence object results in an error because no numbering has occurred.
Furthermore, if you then attempt an INSERT without specifying the id, the `duplicate key value violates unique constraint` error mentioned at the beginning occurs.

Incidentally, numbering still advances even when an INSERT fails. So if you repeat the same operation two more times, it will eventually succeed. This happens because the default `nextval('users_id_seq'::regclass)` is called each time.

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

## Solution

Let's `DROP TABLE users` once more and recreate the table.

The point is that the value obtained by `currval` just needs to be consistent.
So you can solve this by using `setval` to write the current maximum value of the primary key in the table to the corresponding sequence object.

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

:::details[Tips about setval]

Incidentally, `setval` takes a third argument called `is_called`. If you set this to False, you can specify the value that `nextval` will return.

In this case, if you write it as follows, while it cannot be confirmed with `currval`, the value that will be assigned during the next INSERT is `MAX(id) + 1`.

```sql
SELECT setval(
    pg_get_serial_sequence('users', 'id'),
    (SELECT MAX(id)+1 FROM "users"),
    false
);
```

The [official examples](https://www.postgresql.org/docs/16/functions-sequence.html) are very clear:

```sql
SELECT setval('myseq', 42);           Next nextval will return 43
SELECT setval('myseq', 42, true);     Same as above
SELECT setval('myseq', 42, false);    Next nextval will return 42
```

:::
