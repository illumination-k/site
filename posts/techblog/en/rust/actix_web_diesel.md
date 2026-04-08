---
uuid: 61427e60-48c8-480b-bdbf-b5f846149c3a
title: CRUD with Actix-Web + Diesel + Postgres
description: I wanted to try Actix-web, so I implemented the Diesel Getting Started guide using Actix-web.
lang: en
category: techblog
tags:
  - rust
  - actix-web
  - diesel
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

I want types -- real types, not Python's Typing. So I've been getting started with Actix-web. For now, let's try doing CRUD with Diesel.

Basically, we'll reproduce the [Diesel Getting Started](https://diesel.rs/guides/getting-started) guide using Actix-web.

## Setup

First, install `Diesel`. Since we're using PostgreSQL this time, we only enable the postgres feature. We need `libpq-dev` for PostgreSQL, so install that first.

```bash
sudo apt install libpq-dev
cargo install diesel_cli --no-default-features --features postgres
```

Start PostgreSQL. We'll use `docker-compose` this time.

```yaml title=docker-compose.yaml
version: "3.0"

services:
  db:
    image: postgres:11.7
    container_name: actix_web_crud
    volumes:
      - ./postgres_data:/var/lib/postgresql/data/
    ports:
      - 5432:5432
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=disel_demo

volumes:
  postgres_data: {}
```

Create an `.env` file for environment variables.

```bash
echo 'DATABASE_URL=postgres://postgres:postgres@localhost/actix_web_crud' >> .env
```

Create the project and run migrations.

```bash
cargo new actix-web-crud
cd actix-web-crud
docker-compose up -d
diesel setup
diesel generate create_posts
```

A directory called `migrations/${date}_create_posts` should have been created containing `up.sql` and `down.sql`. `up.sql` is used when running `migration run`, and `down.sql` is used when running `migration redo`. Modify them as follows.

```sql title=up.sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  body TEXT NOT NULL,
  published BOOLEAN NOT NULL DEFAULT 'f'
)
```

```sql title=down.sql
DROP TABLE posts
```

Run the migration.

```bash
diesel migration run
```

That completes the setup.

## Writing Rust

Let's add the dependencies we'll use. We use Diesel as the ORM, serde for JSON handling, and anyhow for error handling.

```toml title=Cargo.tml
[dependencies]
actix-web = "3"
diesel = { version = "^1.1.0", features = ["postgres", "r2d2"] }
dotenv = "0.15"
r2d2 = "0.8"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
anyhow = "1.0"
```

### Hello, World

First, let's do a Hello World with `Actix-Web`.

```rust
use anyhow::Result;
use actix_web::{get, App, HttpServer, Responder};

#[get("/")]
async fn hello() -> impl Responder {
    "Hello, world!"
}

#[actix_web::main]
async fn main() -> Result<()> {
    HttpServer::new(move || {
        App::new()
            .service(hello)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
    .expect("Error in build httpserver");
    Ok(())
}
```

```bash
cargo run
curl http://localhost:8080
# Hello, world!
```

### Directory Structure

```
src/
├── database.rs
├── main.rs
├── models.rs
├── routes/
│  ├── mod.rs
│  └── posts/
│     ├── delete.rs
│     ├── get.rs
│     ├── mod.rs
│     ├── post.rs
│     └── publish.rs
└── schema.rs
```

The directory structure above is what we'll be using. The roles are as their names suggest -- I just created a directory for routing. We'll implement PUT in the `publish` module.

### Database Setup

First, write the configuration for connecting to the database. We'll also give shorter names to long types.

```rust title=database.rs
use anyhow::Result;
use diesel::pg::PgConnection;
use diesel::r2d2::{self, ConnectionManager};

use ::r2d2::PooledConnection;
use dotenv::dotenv;

pub type Pool = r2d2::Pool<ConnectionManager<PgConnection>>;
pub type PooledPgConnection = PooledConnection<ConnectionManager<PgConnection>>;

fn database_uri() -> Result<String> {
    dotenv().ok();

    let uri = std::env::var("DATABASE_URL")?;
    Ok(uri)
}

pub fn establish_connection() -> Result<Pool> {
    let uri = database_uri()?;

    let manager = ConnectionManager::<PgConnection>::new(uri);
    let pool = r2d2::Pool::builder().build(manager)?;
    Ok(pool)
}
```

Write the models. They need to be Serialize/Deserialize for JSON when returning via GET or receiving via POST. Add `Queryable` to types used with queries, and `Insertable` to types used with POST.

```rust title=models.rs
use crate::schema::posts;
use serde::{Deserialize, Serialize};
#[derive(Debug, Serialize, Deserialize, Queryable)]
pub struct Post {
    pub id: i32,
    pub title: String,
    pub body: String,
    pub published: bool,
}

#[derive(Debug, Insertable, Serialize, Deserialize)]
#[table_name = "posts"]
pub struct NewPost {
    pub title: String,
    pub body: String,
}
```

## Implementing CRUD

First, let's write the `mod.rs` files.

```rust title=routes/mod.rs
pub mod posts;
```

```rust title=routes/posts/mod.rs
pub mod delete;
pub mod get;
pub mod post;
pub mod publish;
```

Then add the following to `main.rs`.

```rust title=main.rs
mod database;
mod models;
mod routes;
mod schema;
```

### Implementing GET and POST

Return all Posts. Since Diesel doesn't support tokio, we use `web::block`.

```rust title=routes/posts/get.rs
use crate::database::Pool;
use crate::models::Post;
use crate::schema::posts;
use actix_web::{get, web, HttpResponse};
use diesel::prelude::*;

#[get("/posts")]
pub async fn index(pool: web::Data<Pool>) -> HttpResponse {
    let conn = pool
        .get()
        .expect("couldn't get driver connection from pool");

    let results: Vec<Post> = web::block(move || posts::table.load(&conn))
        .await
        .map_err(|e| {
            eprintln!("Error: {}", e);
            HttpResponse::InternalServerError().finish()
        })
        .expect("Error in load posts");

    HttpResponse::Ok().json(results)
}
```

Since we haven't inserted anything yet, GET will only return an empty list, so let's implement POST as well.

```rust title=routes/posts/post.rs
use crate::database::{Pool, PooledPgConnection};
use crate::models::NewPost;
use crate::schema::posts;
use actix_web::{post, web, HttpResponse};
use anyhow::Result;
use diesel::prelude::*;

fn add_post(conn: &PooledPgConnection, new_post: &NewPost) -> Result<()> {
    diesel::insert_into(posts::table)
        .values(new_post)
        .execute(conn)?;
    Ok(())
}

#[post("/posts")]
pub async fn index(pool: web::Data<Pool>, form: web::Json<NewPost>) -> HttpResponse {
    let conn = pool
        .get()
        .expect("couldn't get driver connection from pool");

    let new_post = NewPost {
        title: form.title.clone(),
        body: form.body.clone(),
    };

    web::block(move || add_post(&conn, &new_post))
        .await
        .map_err(|e| {
            eprintln!("ERROR: {}", e);
            HttpResponse::InternalServerError().finish()
        })
        .expect("Error in add post");

    eprintln!("Accecpted!");

    HttpResponse::Created().body("Created!")
}
```

Update `main.rs`. Add routing and the database connection.

```rust title=main.rs
#[macro_use]
extern crate diesel;

use anyhow::Result;

use actix_web::{get, App, HttpServer, Responder};

mod database;
mod models;
mod routes;
mod schema;

#[get("/")]
async fn hello() -> impl Responder {
    "Hello, world!"
}

#[actix_web::main]
async fn main() -> Result<()> {
    // Connect to the database
    let pool = database::establish_connection()?;
    HttpServer::new(move || {
        App::new()
            .data(pool.clone())
            .service(hello)
            .service(routes::posts::get::index)
            .service(routes::posts::post::index)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
    .expect("Error in build httpserver");
    Ok(())
}
```

Let's try it out.

```bash
curl -H "Content-type: application/json" -X POST http://localhost:8080/posts -d '{ "title": "First post", "body": "this is first post for actix-web-crud" }'
# Created!
curl http://localhost:8080/posts
# [{"id":1,"title":"First post","body":"this is first post for actix-web-crud","published":false}]
```

### Implementing PUT

Implement PUT to change the publish status. For simplicity, sending a request to `/posts/publish/$post_id` will set the post to published.

`web::Path<T>` becomes `T` when calling `to_owned`.

```rust title=routes/posts/publish.rs
use crate::models::Post;
use crate::schema::posts;
use actix_web::{put, web, HttpResponse};
use anyhow::Result;
use diesel::prelude::*;

fn published(conn: &PooledPgConnection, id: i32) -> Result<Post> {
    let post: Post = diesel::update(posts::table.find(id))
        .set(posts::published.eq(true))
        .get_result(conn)?;

    Ok(post)
}

#[put("/posts/publish/{post_id}")]
pub async fn index(pool: web::Data<Pool>, post_id: web::Path<i32>) -> HttpResponse {
    let conn = pool
        .get()
        .expect("couldn't get driver connection from pool");

    let id = post_id.to_owned();

    let post: Post = web::block(move || published(&conn, id))
        .await
        .expect("Error in published");

    HttpResponse::Ok().body(format!("Published:\n title: {}", post.title))
}
```

After adding the routing to `main.rs`, let's run it.

```bash
curl -X PUT http://localhost:8080/posts/publish/1
# Published:
#  title: First post
curl http://localhost:8080/posts
# [{"id":1,"title":"First post","body":"this is first post for actix-web-crud","published":true}]
```

### Implementing DELETE

DELETE at `/posts/$post_id`.

```rust:routes/posts/delete.rs
use crate::database::{Pool, PooledPgConnection};
use crate::schema::posts;
use actix_web::{delete, web, HttpResponse};
use anyhow::Result;
use diesel::prelude::*;

fn delete(conn: &PooledPgConnection, id: i32) -> Result<()> {
    diesel::delete(posts::table.find(id)).execute(conn)?;
    Ok(())
}

#[delete("/posts/{post_id}")]
pub async fn index(pool: web::Data<Pool>, post_id: web::Path<i32>) -> HttpResponse {
    let conn = pool
        .get()
        .expect("couldn't get driver connection from pool");

    let id = post_id.to_owned();

    web::block(move || delete(&conn, id))
        .await
        .expect("Error in delete");

    HttpResponse::Ok().body(format!("Delete: {}", id))
}
```

Add the routing and run it.

```bash
curl -X DELETE http://localhost:8080/posts/1
# Delete: 1
curl http://localhost:8080/posts
# []
```

CRUD is complete.

## Conclusion

The implementation is available below. It has a few more features added.

::gh-card[illumination-k/actix-web-crud]
