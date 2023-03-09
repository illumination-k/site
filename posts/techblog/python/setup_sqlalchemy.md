---
uuid: d25f2fac-eda2-4f52-8a33-4d772c21ce06
title: SQLAlchemy + mypy + pytestの環境を整える
description: "SQLAlchemyは素晴らしいORMですが、`django`等と違ってテストや、migrationは自分でセットアップする必要があります。この記事では、alembic, pytest, mypyを使った環境をセットアップします。"
lang: ja
category: techblog
tags:
  - python
  - sqlalchemy
created_at: "2022-08-08T17:49:14+00:00"
updated_at: "2022-08-08T17:49:14+00:00"
---

## TL;DR

SQLAlchemyは素晴らしいORMですが、`django`等と違ってテストや、migrationは自分でセットアップする必要があります。
ツールは色々あると思いますが、今回は以下の構成で環境を整えます。また、型があると嬉しいので`mypy`でチェックします。

- migration -> alembic
- test -> pytest

実際にやることとしては、以下です。

1. テスト環境のセットアップ
2. `User`と`Post`モデルを作成
3. テスト
4. Migration

::gh-card[illumination-k/sqlalchemy-starter]

## Install

好きなツールを使ってください。最近は`poetry`を使っています。

```bash
poetry add "sqlalchemy[mypy]" psycopg2 
poetry add --dev pytest mypy alembic sqlalchemy-utils
```

`pyproject.toml`にmypyのsqlalchemy pluginsを追加します。
以下のようになります。

```toml title=pyproject.toml
[tool.poetry]
name = "sqlalchemy-starter"
version = "0.1.0"
description = ""
authors = ["illumination-k <illumination.k.27@gmail.com>"]
license = "MIT"

[tool.poetry.dependencies]
python = "^3.10"
SQLAlchemy = {extras = ["mypy"], version = "^1.4.37"}
psycopg2 = "^2.9.3"

[tool.poetry.dev-dependencies]
pytest = "^7.1.2"
mypy = "^0.961"
alembic = "^1.8.0"
isort = "^5.10.1"
black = "^22.3.0"
SQLAlchemy-Utils = "^0.38.2"

[build-system]
requires = ["poetry-core>=1.0.0"]
build-backend = "poetry.core.masonry.api"

[tool.mypy]
plugins = ["sqlalchemy.ext.mypy.plugin"]
```

## DBのセットアップ

migrationできるようにします。

```bash
alembic init migrations
```

DBも準備します。`postgresql`を使用します。永続化したい場合はvolumeのコメントアウトを解除してください。

```yaml title=docker-compose.yaml
version: "3.0"

services:
  db:
    image: postgres:11.7
    container_name: postgres
    # volumes:
    #   - ./postgres_data:/var/lib/postgresql/data
    ports:
      - 5432:5432
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=main
```

## ディレクトリ構成

以下のようなディレクトリ構成を使用します。`models`の中身を分割できるようにしておきます。

```
./
├── alembic.ini
├── docker-compose.yaml
├── migrations/
│  ├── env.py
│  ├── README
│  ├── script.py.mako
│  └── versions/
├── models/
│  ├── __init__.py
│  ├── base.py # 全体で使うクラス・関数を置く
│  └── blog.py # 実際のモデル
├── poetry.lock
├── pyproject.toml
└── tests/
   ├── __init__.py
   ├── conftest.py
   └── test_blog.py
```

## 1. Test環境のセットアップ

まず、全体で使うもの（DBへのURLの取得、`DeclativeMeta`、セッション中のクエリのカウントクラス）を`models/base.py`に置きます。
クエリのカウントはテストで主に使うかと思うので、場所はここじゃないほうがいいかもしれません。

```python title=models/base.py
from sqlalchemy import event
from sqlalchemy.engine import Connection
from sqlalchemy.ext.declarative import declarative_base


def get_postgres_url(database: str = "main", port: str = "5432") -> str:
    return f"postgresql://postgres:postgres@localhost:{port}/{database}"


Base = declarative_base()


class QueryCounter:
    """
    Queryの数をカウントできるようにする
    https://stackoverflow.com/questions/19073099/how-to-count-sqlalchemy-queries-in-unit-tests
    """

    def __init__(self, connection: Connection) -> None:
        self.engine = connection.engine
        self.count = 0

    def callback(self, *args, **kwargs):
        self.count += 1

    def __enter__(self):
        event.listen(self.engine, "before_cursor_execute", self.callback)
        return self

    def __exit__(self, *args, **kwargs):
        event.remove(self.engine, "before_cursor_execute", self.callback)
```

`conftest.py`で、テスト用のデータベースとテスト用のセッションを作成する`fixture`を書きます。

テストを便利にするため、テスト用のデータベースの設定をコマンドライン上で上書きできるようにします。

- **テスト用のデータベースはpytestのsession単位で初期化されます。**
- **テスト用のセッションはpytestのfunction単位で初期化されます。**

また、relationが存在する場合、`drop_all`がうまくいかないので、`SET CONSTRAINTS ALL DEFERRED;`で制約を無効にしています。
mysqlの場合は`SET FOREIGN_KEY_CHECKS=0;`を使ってください。

```python title=tests/conftest.py
import dataclasses
from typing import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.engine import Connection
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy_utils import create_database, database_exists  # type: ignore

from models.base import Base, get_postgres_url


@dataclasses.dataclass
class DBSetting:
    port: str = "5432"
    database: str = "test"
    encoding: str = "utf-8"
    echo: bool = False


def pytest_addoption(parser: pytest.Parser):
    """
    コマンドライン上でテストデータベースの設定の上書きができるようにします。
    """
    parser.addoption("--port", action="store", default="5432")
    parser.addoption("--database", action="store", default="test")
    parser.addoption("--encoding", action="store", default="utf-8")
    parser.addoption("--echo", action="store_true")


@pytest.fixture(scope="session")
def db_setting(request: pytest.FixtureRequest) -> DBSetting:
    return DBSetting(
        port=request.config.getoption("--port"),
        database=request.config.getoption("--database"),
        encoding=request.config.getoption("--encoding"),
        echo=request.config.getoption("--echo"),
    )


@pytest.fixture(scope="session")
def connection(db_setting: DBSetting) -> Connection:
    """
    test sessionが開始されると、connectionを作ります。
    test用のデータベースがなければ作成したあと接続します。
    """
    TEST_SQLALCHEMY_DATABASE_URL = get_postgres_url(
        port=db_setting.port, database=db_setting.database
    )
    engine = create_engine(
        TEST_SQLALCHEMY_DATABASE_URL, encoding=db_setting.encoding, echo=db_setting.echo
    )

    if not database_exists(TEST_SQLALCHEMY_DATABASE_URL):
        create_database(TEST_SQLALCHEMY_DATABASE_URL)

    return engine.connect()


@pytest.fixture(scope="session")
def testdb(connection: Connection) -> Generator[None, None, None]:
    """
    test sessionが開始されると、メタデータ上にあるテーブルの作成を行います。
    test sessionが終了すると、作成されたテーブルをすべて削除します。
    """
    Base.metadata.bind = connection
    connection.execute("SET CONSTRAINTS ALL DEFERRED;")
    Base.metadata.create_all()

    yield

    Base.metadata.drop_all()
    connection.execute("SET CONSTRAINTS ALL IMMEDIATE;")


@pytest.fixture(scope="function")
def test_session(
    testdb, connection: Connection
) -> Generator[scoped_session, None, None]:
    """
    各テストが開始されるたびにセッションを作成します。
    テストが終了するとロールバックします。
    """
    transaction = connection.begin()
    yield scoped_session(
        sessionmaker(autocommit=False, autoflush=False, bind=connection)
    )
    transaction.rollback()
```

## 2. Model作成

Userが複数Postを持っている普通のブログを想定します。
dialect, relationには型推論が効かないので明記する必要があります。あと`UUID(as_uuid=True)`を設定しないと上手く動かないので現状は機械的につけています。

```python title=models/blog.py
import uuid
from typing import List

from sqlalchemy import TEXT, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from models.base import Base


class User(Base):
    __tablename__ = "user"
    # as_uuid = Trueが必要
    # https://stackoverflow.com/questions/47429929/attributeerror-uuid-object-has-no-attribute-replace-when-using-backend-agno
    id: uuid.UUID = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )  # dialectには型アノテーションが必要
    name = Column(String)

    posts: List["Post"] = relationship(
        "Post", back_populates="user"
    )  # relationにも型アノテーションが必要


class Post(Base):
    __tablename__ = "blog"
    id: uuid.UUID = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )  # dialectには型アノテーションが必要
    title = Column(String)
    text = Column(TEXT)

    user_id: uuid.UUID = Column(
        UUID(as_uuid=True), ForeignKey("user.id")
    )  # dialectには型アノテーションが必要
    user: "User" = relationship("User", back_populates="posts")  # relationにも型アノテーションが必要
```

## 3. Test

以下のような感じでテストできます。詳細が見たい場合は`--echo`とかつけるといいです。

```bash
pytest -vv tests/test_blog.py::test_counter

# 詳細が見たいとき
pytest --capture=tee-sys -vv --echo tests/test_blog.py::test_counter
```

```python title=tests/test_blog.py
from typing import Optional

from sqlalchemy.orm import scoped_session

from models.base import QueryCounter
from models.blog import Post, User


def test_user(test_session: scoped_session):
    user = User(name="a")
    test_session.add(user)
    test_session.commit()

    result: Optional[User] = test_session.query(User).filter(User.name == "a").first()
    assert result is not None
    assert user.id == result.id
    assert user.name == result.name


def test_user_post(test_session: scoped_session):
    post1 = Post(title="1", text="1")
    post2 = Post(title="2", text="2")
    posts = [post1, post2]
    user = User(name="a", posts=posts)

    test_session.add(user)
    test_session.commit()

    result: Optional[User] = test_session.query(User).filter(User.name == "a").first()
    assert result is not None
    assert len(user.posts) == len(result.posts)
    assert result.posts[0].id == post1.id
    assert result.posts[1].id == post2.id


def test_counter(test_session: scoped_session):
    with QueryCounter(test_session.connection()) as counter:
        post1 = Post(title="1", text="1")
        post2 = Post(title="2", text="2")
        posts = [post1, post2]
        user = User(name="a", posts=posts)

        test_session.add(user)
        test_session.commit()

        result: Optional[User] = (
            test_session.query(User).filter(User.name == "a").first()
        )

        assert counter.count == 3

        assert result is not None
        assert len(user.posts) == len(result.posts)

        assert counter.count == 4
```

一応DBの中身を確認しておきます。

```
docker compose exec db psql -U postgres
postgres=# \l
>  main      | postgres | UTF8     | en_US.utf8 | en_US.utf8 | 
>  postgres  | postgres | UTF8     | en_US.utf8 | en_US.utf8 | 
>  template0 | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
>            |          |          |            |            | postgres=CTc/postgres
>  template1 | postgres | UTF8     | en_US.utf8 | en_US.utf8 | =c/postgres          +
>            |          |          |            |            | postgres=CTc/postgres
>  test      | postgres | UTF8     | en_US.utf8 | en_US.utf8 | 
postgres=# \c test
test=# \dt
> Did not find any relations.
```

## 4. Migration

テストがうまくいったのでmigrationしてmain DBに反映します。

alembicで生成された`migrations/env.py`を編集します。

**Baseを継承したモデルをすべてimportする必要があります**

```python title=migrations/env.py
from models.blog import *
from models.base import Base, get_postgres_url

config = context.config
config.set_main_option("sqlalchemy.url", get_postgres_url())  # +

target_metadata = None # -
target_metadata = Base.metadata # +
```

alembicでmigrationします。

```bash
alembic revision --autogenerate -m "added user and post"
alembic upgrade head
```

DBに結果が反映されているかを確認します。

```
postgres=# \c main;
> You are now connected to database "main" as user "postgres".
main=# \dt
>               List of relations
>  Schema |      Name       | Type  |  Owner   
> --------+-----------------+-------+----------
>  public | alembic_version | table | postgres
>  public | blog            | table | postgres
>  public | user            | table | postgres
> (3 rows)
```

## 終わりに

以上で個人的に使いやすいSQLAlchemyのテスト環境のセットアップは終わりです。
こうすればもっとよくなる！みたいなものがあれば以下のレポジトリのissueとかで教えてくれると助かります。

::gh-card[illumination-k/sqlalchemy-starter]
