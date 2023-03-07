---
uuid: 355eb8b4-1c9e-4a0f-a1d9-4702acac26f8
title: FastAPI + SQLAlchemy (Postgres) でHerokuにデプロイ
description: 思ったよりFastAPI、PostgresでHerokuにデプロイするということにだけ焦点を当てた記事が見つからなかったので書いておきました。
lang: ja
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

FastAPIはRestfulなAPIをPythonで構築するときに非常に便利なマイクロウェブフレームワークで、パフォーマンスにも優れています。また、型についてサポートしており、Swagger UIでAPIドキュメントが自動的に生成される点も素晴らしいです。

実際にAPIを構築するにあたって、Herokuは無料で利用でき、デプロイも簡単なのでテストサーバーを作成するときに重宝します。Herokuが無料枠でサポートしているのはPostgres SQLだけなので、もしデータベースを絡めようと思うと、必然的にPostgresを使う必要があります。

使い方を書いてある記事はあるのですが、単純にデプロイするだけ、といったことに焦点を当てた記事がなかったので書きました。

## Dependencies

ORMとして`sqlalchemy`を利用します。また、postgresと接続するために`psycopg2-binary`を使います。個人的に`pipenv`を使っているので、`Pipfile`を用意します。あとはpostのデータには型がついていてほしいので`pydantic`を使います。

```toml:title=Pipfile
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

### FastAPIを試運転

依存関係をインストールします。個人的にいつも`app/`下にpythonファイルとかを作成しているので、今回もそうします。

```bash
pipenv install
mkdir app
```

```python:title=app/main.py
from fastapi import FastAPI

### Start App ###
app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}
```

起動してみます。

```bash
uvicorn app.main:app --reload --host=0.0.0.0 --port=8002
```

`https://localhost:8002`で`{"message": "Hello World"}`で見えていれば成功です。

### local環境の構築

`docker`を使ってローカルでDBに関してもテストできるようにします。

```docker:title=Dockerfile
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

```yaml:title=docker-compose.yml
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

## モデルの定義

SQLalechemyのためにモデルを定義します。今回はTODOテーブルを作成します。
テーブルは自動で作成されてほしいので、

```python:title=app/model.py
# Create Table
metadata = MetaData(Engine)
Base.metadata.create_all(bind=Engine, checkfirst=True)
```

で作成するようにしています。

また、`_asdict`メソッドがないので、自前で辞書型に変換する関数を定義しています。

```python:title=app/model.py
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

`TODO`に対する`POST`と`GET`を定義します。`Post`の際に、必ず`title`と`description`をリクエストボディに入れてほしいので、`pydantic`でDataクラスを定義しています。

```python:title=app/main.py
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

`http://localhost:8002/docs`にアクセスしてSwagger UIでGetとPostのテストをしてみてください。[このへんまでのcommit](https://github.com/illumination-k/fastapi-heroku/tree/14c99ef3be19ee7af66e154d41cd74cab7fab840)です。

## Herokuにデプロイ

好みのやり方でプロジェクトを作って、Postgres SQLのアドオンを有効にしてください。

ちょっとハマりどころなのが、`heroku`でPostgres SQLアドオンを追加すると環境変数として`DATABASE_URL`が提供されるんですが、これをそのまま`create_engine`に入れてもうまく行かないという点です。というのは`DATABASE_URL`は`postgres://....`みたいな感じなんですが、`create_engine`の引数としては`postgresql://...`みたいな感じである必要があります。

この点を考慮して、`create_engine`を書き直します。

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

のような感じにします。

次に`Procfile`を書きます。

```text:title=Procfile
web: uvicorn app.main:app --reload --host=0.0.0.0 --port=${PORT:-5000}
```

あとはデプロイしたら終わりです。

## 終わりに

FastAPI、型があって嬉しいですね。
完成品は[github](https://github.com/illumination-k/fastapi-heroku)にあります。
