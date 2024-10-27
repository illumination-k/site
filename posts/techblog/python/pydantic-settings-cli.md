---
uuid: c2954724-d9a1-460e-94ee-8fcd92d8ec77
title: "Pydantic-settingsでCLIアプリケーションを作成できる話"
description: "pydantic-settings を使用することで、簡単に型安全で保守性の高いCLIアプリケーションを作成できます。"
category: "techblog"
lang: ja
tags: ["python"]
created_at: 2024-10-14
updated_at: 2024-10-14
---

## AI TL;DR

pydantic-settings を使用することで、簡単に型安全で保守性の高いCLIアプリケーションを作成できます。
argparseの代わりに、pydanticのようなクラスベースの設定を利用し、環境変数やCLI引数の読み込みが可能です。
最新バージョンでは、CLI引数のパースがサポートされ、エイリアスやデフォルト値の設定、型ヒントの補完も簡単に行えます。また、subcommandの実装もシンプルにでき、複雑なCLIツールの作成が容易になります。

## [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)について

pydantic-settingsは、環境変数やdotenvファイルなどから設定を読み込むためのライブラリとして有名です。

ただそれだけならpydanticの機能で十分だと思っていたのですが、最近CLIの引数から設定を読み込む機能が追加されました。ちなみにAzure Key Vaultもサポートされていますが、AWS Systems Managerのパラメータストアはなぜかサポートされていません (2024/10現在)。[Issue](https://github.com/pydantic/pydantic-settings/issues/399)はあるのでそのうち対応される可能性はあります。

pythonのbuiltinのコマンドライン引数のパーサーである `argparse` は、型の指定が難しく、Namespaceを二重定義する必要があるなどの問題があります。書き捨てるようなScriptには良いのですが、型の補完が効かないので、ある程度大きなCLIアプリケーションを作成するのは少し面倒です。

`pydantic-settings` は、pydanticと同様のクラスを書くだけで、CLI引数のパーサーが完成して、型の指定やデフォルト値の設定が簡単に行え、型ヒントもうまく動くので、補完が効いて快適な開発ができます。

他にも、pydanticを使って`argparse`をラップするようなライブラリは複数ありますが、ほぼ公式とも言える`pydantic-settings`を使用するのがメンテナンス性やサポート面で有利だと思います。また、argparseのGroup以外の機能は使えるので、基本的に必要な機能が網羅されています。

## install

```bash
pip install "pydantic-settings==2.6.0"
```

versionごとに多少仕様が異なるので、今回は2.6.0を指定しました。
基本的にはDocumentationを参照してください。

## 使い方

以下のように、単純なCLIアプリケーションであればほぼpydanticのクラスを書くだけで実装できます。
literalやenumも使えます。

DocstringやFieldのdescriptionを活用することで、helpメッセージをカスタマイズできます。

```python title="simple.py"
from enum import Enum
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, CliPositionalArg, SettingsConfigDict


class Animal(str, Enum):
    DOG = "dog"
    CAT = "cat"
    FISH = "fish"


class Cli(BaseSettings):
    """Pydantic Settingsで作るCLIのサンプル"""
    # ↑のようなDocstringを書くと、helpメッセージに表示される。

    # cli appであることを示すために必要
    model_config = SettingsConfigDict(cli_parse_args=True)

    # positional argを指定することができる。defaultは指定できない。
    arg: CliPositionalArg[str]

    # 特に何も指定しない場合、変数名がそのままオプション名になる
    name: str

    # AliasChoices を使うと、エイリアスを設定できる。この場合は、-a と --alias で指定できる。
    # descriptionを指定すると、helpメッセージに表示される。
    alias: str = Field(
        description="エイリアスが設定できる",
        validation_alias=AliasChoices("a", "alias"),
    )

    # Literal を使うと、指定できる値を制限できる (argparseでいうchoices)。
    # この場合、--mode には "train" か "test" しか指定できない。
    mode: Literal["train", "test"] = "train"

    # Enum でも、指定できる値を制限できる (argparseでいうchoices)。
    # この場合、--animal には "dog", "cat", "fish" しか指定できない。
    animal: Animal = Animal.DOG

    # listを使うことができる。ただし、以下のフォーマットしかサポートされておらず、whitespace区切りでは指定できない。
    # `--field='[1,2]'`, `--field 1 --field 2`, `--field=1,2`
    datasets: list[str] = []

    # dictを使える。以下の2通りが指定できる。
    # - json style: --field='{"k1": 1, "k2": 2}'
    # - key-value style: --field k1=1 --field k2=2
    config: dict[str, str] = {}


def main():
    settings = Cli()
    print(settings)


if __name__ == "__main__":
    main()
```

このスクリプトは以下のように動きます。helpメッセージもちゃんとカスタマイズされていることがわかります。

```bash
python simple.py --help
```

```
usage: simple.py [-h] [--name str] [-a str] [--mode {train,test}] [--animal {DOG,CAT,FISH}] [--datasets list[str]] [--config dict[str,str]] ARG

Pydantic Settingsで作るCLIのサンプル

positional arguments:
  ARG

options:
  -h, --help            show this help message and exit
  --name str            (required)
  -a str, --alias str   エイリアスが設定できる (required)
  --mode {train,test}   (default: train)
  --animal {DOG,CAT,FISH}
                        (default: DOG)
  --datasets list[str]  (default: [])
  --config dict[str,str]
                        (default: {})
```

実行は以下のようにできます。ちゃんと綺麗に型がついたpydantic objectが得られます。

```bash
python simple.py pos --name name -a a --mode train --animal FISH --datasets a,b,c --config k=1
# arg='pos' name='name' alias='a' mode='train' animal=<Animal.FISH: 'fish'> datasets=['a', 'b', 'c'] config={'k': '1'}
```

## Subcommand

subcommandも問題なく実装できます。`CliSubCommand` を型Annotationに指定することで、subcommandを指定できます。

例えばgit likeなCLIを作ってみます。

### `get_subcommand` を使う場合

基本的には`get_subcommand`で得られる型を使って分岐します。全て自前でかけるので、個人的には柔軟性が高いと思っています。

```python title="subcommand.py"
from pydantic import AliasChoices, BaseModel, Field
from pydantic_settings import (
    BaseSettings,
    CliPositionalArg,
    CliSubCommand,
    SettingsConfigDict,
    get_subcommand,
)


class Add(BaseModel):
    path: CliPositionalArg[str]


class Commit(BaseModel):
    message: str = Field(validation_alias=AliasChoices("m", "message"))


class Git(BaseSettings):
    model_config = SettingsConfigDict(cli_parse_args=True)
    add: CliSubCommand[Add]
    commit: CliSubCommand[Commit]


def main():
    settings = Git()

    subcommand = get_subcommand(settings)

    if isinstance(subcommand, Add):
        print(f"add: {subcommand.path}")
    elif isinstance(subcommand, Commit):
        print(f"commit: {subcommand.message}")


if __name__ == "__main__":
    main()
```

### `CliApp`を使う場合

`CliApp` は、各クラスの`cli_cmd` メソッドを自動で実行してくれるものです。subcommandに関しても再帰的に実行してくれます。
ただし、こちらの場合親クラスのパラメータを下に引き継ぐのがめんどうなので、個人的には`get_subcommand`でいいのかな、と思っています。
それが必要ない場合は楽で良さそうです。

```python title="subcommand_app.py"
from pydantic import AliasChoices, BaseModel, Field
from pydantic_settings import (
    BaseSettings,
    CliPositionalArg,
    CliSubCommand,
    SettingsConfigDict,
    CliApp,
)


class Add(BaseModel):
    path: CliPositionalArg[str]

    def cli_cmd(self):
        print(f"add: {self.path}")


class Commit(BaseModel):
    message: str = Field(validation_alias=AliasChoices("m", "message"))

    def cli_cmd(self):
        print(f"commit: {self.message}")


class Git(BaseSettings):
    model_config = SettingsConfigDict(cli_parse_args=True)
    add: CliSubCommand[Add]
    commit: CliSubCommand[Commit]

    def cli_cmd(self):
        print("git command")
        CliApp.run_subcommand(self)


def main():
    settings = CliApp.run(Git)
    print(settings)


if __name__ == "__main__":
    main()
```

## 終わりに

pydantic-settingsのCLI部分はかなり精力的に機能追加が行われており、今後もさらに使いやすくなると思います。
結構頻繁に更新されるので、最新のドキュメントを参照するとやれることが増えているかもしれません。
