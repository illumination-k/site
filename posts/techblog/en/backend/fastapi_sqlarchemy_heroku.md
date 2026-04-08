---
uuid: 355eb8b4-1c9e-4a0f-a1d9-4702acac26f8
title: Deploying to Heroku with FastAPI + SQLAlchemy (Postgres)
description: I wrote this because I couldn't find many articles focused solely on deploying with FastAPI and Postgres to Heroku.
lang: en
category: techblog
tags:
  - backend
  - python
  - heroku
  - sqlalchemy
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

FastAPI is a very convenient micro web framework for building RESTful APIs in Python, and it also excels in performance. It also has type support, and the automatic generation of API documentation via Swagger UI is excellent.

When actually building an API, Heroku is free to use and easy to deploy to, making it invaluable for creating test servers. Since Heroku only supports Postgres SQL in its free tier, if you want to incorporate a database, you inevitably need to use Postgres.

While there are articles that describe how to use it, there weren't many focused simply on just deploying, so I wrote this.

## Dependencies

We use `sqlalchemy` as the ORM. We also use `psycopg2-binary` to connect to Postgres. I personally use `pipenv`, so I'll prepare a `Pipfile`. Additionally, I want post data to be typed, so I'll use `pydantic`.

```toml title=Pipfile
[[source]]
name = "pypi"
url = "https://pypi.org/simple"
verify_ssl = true

[packages]
fastapi = "0.65.2"
uvicorn = "0.14.0"
sqlalchemy = "1.4.18"
psycopg2-binary = "2.8.6"
pydantic = "1.8.2"

[requires]
python_version = "3.8"

[pipenv]
allow_prereleases = true
```

### Test-Running FastAPI

Install the dependencies. I personally always create Python files under an `app/` directory, so I'll do the same this time.

```bash
pipenv install
mkdir app
```

```python title=app/main.py
from fastapi import FastAPI

### Start App ###
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}
```

Let's start it up.

```bash
uvicorn app.main:app --reload --host=0.0.0.0 --port=8002
```

If you can see `{"message": "Hello World"}` at `https://localhost:8002`, you're good to go.

### Setting Up the Local Environment

We'll use `docker` to enable local testing including the database.

```docker title=Dockerfile
FROM python:3.9.2-slim

ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

RUN pip install pipenv

COPY Pipfile /tmp
COPY Pipfile.lock /tmp
WORKDIR /tmp
RUN pipenv install --system && rm -rf /tmp/*

WORKDIR /
```

```yaml title=docker-compose.yml
version: "3.0"

services:
  api:
    container_name: "api-heroku"
    command: "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    volumes:
      - ./app:/app:Z
    build: .
    restart: always
    tty: true
    ports:
      - 8002:8000

  db:
    image: postgres:11.7
    container_name: postgres-heroku
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    ports:
      - 5432:5432
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=main
```

## Model Definition

Define the model for SQLAlchemy. This time we'll create a TODO table.
We want the table to be created automatically, so we use:

```python title=app/model.py
# Create Table
metadata = MetaData(Engine)
Base.metadata.create_all(bind=Engine, checkfirst=True)
```

to create it.

Also, since there's no `_asdict` method, we define our own function to convert to a dictionary.

```python title=app/model.py
from sqlalchemy import Column, create_engine, MetaData
from sqlalchemy.orm import scoped_session, sessionmaker

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql.functions import func
from sqlalchemy.sql.sqltypes import DateTime, Integer, String, TEXT

Engine = create_engine(
    "postgresql://postgres:postgres@postgres-heroku:5432/main",
    encoding="utf-8",
    echo=False,
)

db_session = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=Engine)
)

Base = declarative_base()

# declare for query
Base.query = db_session.query_property()


class Todo(Base):
    __tablename__ = "todo"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(TEXT)
    created_at = Column(DateTime, default=func.now())


# Create Table
metadata = MetaData(Engine)
Base.metadata.create_all(bind=Engine, checkfirst=True)


# model to dict
def to_dict(model) -> dict:
    return dict((col.name, getattr(model, col.name)) for col in model.__table__.columns)
```

We define `POST` and `GET` operations for `TODO`. For the `Post` operation, since we want `title` and `description` to always be in the request body, we define a Data class using `pydantic`.

```python title=app/main.py
from app.model import db_session, Todo, to_dict
from fastapi import FastAPI, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

### Start App ###
app = FastAPI()

### Start Session ###
db = db_session.session_factory()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/todos")
async def get_todos():
    q = db.query(Todo)
    todos = [to_dict(qq) for qq in q]
    return todos


class Data(BaseModel):
    title: str
    description: str


@app.post("/todos")
async def post_todos(data: Data):
    todo = Todo(title=data.title, description=data.description)
    try:
        db.add(todo)
        db.commit()
        db.refresh(todo)
    except:
        db.rollback()
        raise HTTPException(status_code=500, detail="Cannot Create Todo")
    return JSONResponse(status_code=status.HTTP_201_CREATED, content="created!")
```

Access `http://localhost:8002/docs` and test Get and Post using the Swagger UI. [Here's the commit up to this point](https://github.com/illumination-k/fastapi-heroku/tree/14c99ef3be19ee7af66e154d41cd74cab7fab840).

## Deploying to Heroku

Create a project using your preferred method and enable the Postgres SQL add-on.

One gotcha is that when you add the Postgres SQL add-on on Heroku, it provides a `DATABASE_URL` as an environment variable, but you can't just pass it directly to `create_engine`. The reason is that `DATABASE_URL` looks like `postgres://....`, but `create_engine` requires it to be `postgresql://...`.

Taking this into account, let's rewrite `create_engine`.

```python
def create_new_engine():
    import os

    database_url = os.environ.get("DATABASE_URL")

    if database_url is None:
        uri = "postgresql://postgres:postgres@postgres-heroku:5432/main"
        echo = True
    else:
        uri = database_url.replace("postgres", "postgresql")
        echo = False

        return create_engine(url=uri, encoding="utf-8", echo=echo)


Engine = create_new_engine()
```

Something like that.

Next, write the `Procfile`.

```text title=Procfile
web: uvicorn app.main:app --reload --host=0.0.0.0 --port=${PORT:-5000}
```

After that, just deploy and you're done.

## Conclusion

FastAPI is great to have types with.
The finished product is available on [GitHub](https://github.com/illumination-k/fastapi-heroku).
