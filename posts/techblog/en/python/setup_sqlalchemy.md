---
uuid: d25f2fac-eda2-4f52-8a33-4d772c21ce06
title: Setting Up SQLAlchemy + mypy + pytest
description: "SQLAlchemy is an excellent ORM, but unlike Django and similar frameworks, you need to set up testing and migrations yourself. This article covers setting up an environment with alembic, pytest, and mypy."
lang: en
category: techblog
tags:
  - python
  - sqlalchemy
created_at: "2022-08-08T17:49:14+00:00"
updated_at: "2022-08-08T17:49:14+00:00"
---

## TL;DR

SQLAlchemy is an excellent ORM, but unlike `django` and similar frameworks, you need to set up testing and migrations yourself.
There are various tools available, but this time we will set up the environment with the following stack. We also use `mypy` for type checking since types are always welcome.

- migration -> alembic
- test -> pytest

The actual steps are:

1. Set up the test environment
2. Create `User` and `Post` models
3. Test
4. Migration

::gh-card[illumination-k/sqlalchemy-starter]

## Install

Use your preferred tool. Recently I've been using `poetry`.

```bash
poetry add "sqlalchemy[mypy]" psycopg2
poetry add --dev pytest mypy alembic sqlalchemy-utils
```

Add the mypy SQLAlchemy plugins to `pyproject.toml`.
The result should look like this:

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

## Database Setup

Set things up so we can perform migrations.

```bash
alembic init migrations
```

Also prepare the database. We use `postgresql`. If you want persistence, uncomment the volume section.

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

## Directory Structure

We use the following directory structure. The `models` directory is set up to allow splitting its contents.

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
│  ├── base.py # Place classes and functions used across the project
│  └── blog.py # Actual models
├── poetry.lock
├── pyproject.toml
└── tests/
   ├── __init__.py
   ├── conftest.py
   └── test_blog.py
```

## 1. Setting Up the Test Environment

First, place globally used items (DB URL retrieval, `DeclarativeMeta`, session query counter class) in `models/base.py`.
The query counter is mainly used in tests, so it might be better placed elsewhere.

```python title=models/base.py
from sqlalchemy import event
from sqlalchemy.engine import Connection
from sqlalchemy.ext.declarative import declarative_base


def get_postgres_url(database: str = "main", port: str = "5432") -> str:
    return f"postgresql://postgres:postgres@localhost:{port}/{database}"


Base = declarative_base()


class QueryCounter:
    """
    Enables counting the number of queries.
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

In `conftest.py`, write `fixture`s that create a test database and test sessions.

To make testing convenient, we allow overriding the test database settings via command-line options.

- **The test database is initialized per pytest session.**
- **Test sessions are initialized per pytest function.**

Also, when relations exist, `drop_all` may not work properly, so we disable constraints with `SET CONSTRAINTS ALL DEFERRED;`.
For MySQL, use `SET FOREIGN_KEY_CHECKS=0;` instead.

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
    Allows overriding test database settings via command-line options.
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
    When the test session starts, creates a connection.
    Creates the test database if it doesn't exist, then connects.
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
    When the test session starts, creates tables defined in the metadata.
    When the test session ends, drops all created tables.
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
    Creates a session each time a test starts.
    Rolls back when the test ends.
    """
    transaction = connection.begin()
    yield scoped_session(
        sessionmaker(autocommit=False, autoflush=False, bind=connection)
    )
    transaction.rollback()
```

## 2. Model Creation

We assume a standard blog where a User has multiple Posts.
Type inference does not work for dialects and relations, so they need explicit type annotations. Also, `UUID(as_uuid=True)` must be set for things to work correctly, so I mechanically add it for now.

```python title=models/blog.py
import uuid
from typing import List

from sqlalchemy import TEXT, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from models.base import Base


class User(Base):
    __tablename__ = "user"
    # as_uuid = True is required
    # https://stackoverflow.com/questions/47429929/attributeerror-uuid-object-has-no-attribute-replace-when-using-backend-agno
    id: uuid.UUID = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )  # Type annotation is required for dialects
    name = Column(String)

    posts: List["Post"] = relationship(
        "Post", back_populates="user"
    )  # Type annotation is required for relations


class Post(Base):
    __tablename__ = "blog"
    id: uuid.UUID = Column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )  # Type annotation is required for dialects
    title = Column(String)
    text = Column(TEXT)

    user_id: uuid.UUID = Column(
        UUID(as_uuid=True), ForeignKey("user.id")
    )  # Type annotation is required for dialects
    user: "User" = relationship("User", back_populates="posts")  # Type annotation is required for relations
```

## 3. Test

You can test as follows. Add `--echo` if you want to see details.

```bash
pytest -vv tests/test_blog.py::test_counter

# When you want to see details
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

Let's also verify the database contents.

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

Now that the tests passed, let's run migration to reflect the changes in the main DB.

Edit the `migrations/env.py` generated by alembic.

**You must import all models that inherit from Base.**

```python title=migrations/env.py
from models.blog import *
from models.base import Base, get_postgres_url

config = context.config
config.set_main_option("sqlalchemy.url", get_postgres_url())  # +

target_metadata = None # -
target_metadata = Base.metadata # +
```

Run the migration with alembic.

```bash
alembic revision --autogenerate -m "added user and post"
alembic upgrade head
```

Verify that the results are reflected in the database.

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

## Conclusion

That completes my personal setup for a usable SQLAlchemy test environment.
If you have suggestions for improvement, please let me know via issues on the following repository.

::gh-card[illumination-k/sqlalchemy-starter]
