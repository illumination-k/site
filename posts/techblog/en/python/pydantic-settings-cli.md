---
uuid: c2954724-d9a1-460e-94ee-8fcd92d8ec77
title: "Building CLI Applications with Pydantic-settings"
description: "Using pydantic-settings, you can easily create type-safe and maintainable CLI applications."
category: "techblog"
lang: en
tags: ["python"]
created_at: 2024-10-14
updated_at: 2024-10-14
---

## AI TL;DR

Using pydantic-settings, you can easily create type-safe and maintainable CLI applications.
Instead of argparse, you can use class-based settings similar to pydantic, with support for reading environment variables and CLI arguments.
The latest version supports parsing CLI arguments, making it easy to set up aliases, default values, and type hint completion. Subcommand implementation is also straightforward, making it easy to build complex CLI tools.

## About [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)

pydantic-settings is well known as a library for loading settings from environment variables and dotenv files.

I used to think that pydantic's own functionality was sufficient for that, but recently a feature was added to load settings from CLI arguments. By the way, Azure Key Vault is supported, but AWS Systems Manager Parameter Store is not for some reason (as of October 2024). There is an [Issue](https://github.com/pydantic/pydantic-settings/issues/399) for it, so it may be supported eventually.

Python's built-in command-line argument parser `argparse` has issues such as difficulty specifying types and the need to double-define the Namespace. It's fine for throwaway scripts, but since type completion doesn't work, building larger CLI applications becomes somewhat tedious.

With `pydantic-settings`, you just write classes similar to pydantic, and the CLI argument parser is ready. Type specification and default value settings are easy, and type hints work well, providing comfortable development with autocompletion.

There are several other libraries that wrap `argparse` using pydantic, but using `pydantic-settings`, which is practically official, is advantageous in terms of maintenance and support. Also, all argparse features except groups are available, so the necessary functionality is essentially covered.

## Install

```bash
pip install "pydantic-settings==2.6.0"
```

The specification differs slightly between versions, so we specify version 2.6.0 here.
Please refer to the documentation for the basics.

## Usage

As shown below, simple CLI applications can be implemented by essentially just writing a pydantic class.
Literals and enums can also be used.

By using docstrings and Field descriptions, you can customize help messages.

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
    """A sample CLI built with Pydantic Settings"""
    # A docstring like the one above will be displayed in the help message.

    # Required to indicate this is a CLI app
    model_config = SettingsConfigDict(cli_parse_args=True)

    # You can specify positional arguments. Default values cannot be set.
    arg: CliPositionalArg[str]

    # Without any special specification, the variable name becomes the option name
    name: str

    # Using AliasChoices, you can set aliases. In this case, -a and --alias can be used.
    # Specifying a description will display it in the help message.
    alias: str = Field(
        description="Aliases can be set",
        validation_alias=AliasChoices("a", "alias"),
    )

    # Using Literal restricts the allowed values (equivalent to argparse's choices).
    # In this case, --mode only accepts "train" or "test".
    mode: Literal["train", "test"] = "train"

    # Enum also restricts the allowed values (equivalent to argparse's choices).
    # In this case, --animal only accepts "dog", "cat", or "fish".
    animal: Animal = Animal.DOG

    # Lists can be used. However, only the following formats are supported; whitespace-separated values are not:
    # `--field='[1,2]'`, `--field 1 --field 2`, `--field=1,2`
    datasets: list[str] = []

    # Dicts can be used. The following two formats are supported:
    # - JSON style: --field='{"k1": 1, "k2": 2}'
    # - Key-value style: --field k1=1 --field k2=2
    config: dict[str, str] = {}


def main():
    settings = Cli()
    print(settings)


if __name__ == "__main__":
    main()
```

This script works as follows. You can see that the help message is properly customized.

```bash
python simple.py --help
```

```
usage: simple.py [-h] [--name str] [-a str] [--mode {train,test}] [--animal {DOG,CAT,FISH}] [--datasets list[str]] [--config dict[str,str]] ARG

A sample CLI built with Pydantic Settings

positional arguments:
  ARG

options:
  -h, --help            show this help message and exit
  --name str            (required)
  -a str, --alias str   Aliases can be set (required)
  --mode {train,test}   (default: train)
  --animal {DOG,CAT,FISH}
                        (default: DOG)
  --datasets list[str]  (default: [])
  --config dict[str,str]
                        (default: {})
```

Execution looks like this. You get a properly typed pydantic object.

```bash
python simple.py pos --name name -a a --mode train --animal FISH --datasets a,b,c --config k=1
# arg='pos' name='name' alias='a' mode='train' animal=<Animal.FISH: 'fish'> datasets=['a', 'b', 'c'] config={'k': '1'}
```

## Subcommand

Subcommands can also be implemented without issues. By specifying `CliSubCommand` as a type annotation, you can define subcommands.

For example, let's build a git-like CLI.

### Using `get_subcommand`

Basically, you branch based on the type obtained from `get_subcommand`. Since everything can be written manually, I personally find this approach more flexible.

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

### Using `CliApp`

`CliApp` automatically executes the `cli_cmd` method of each class. It also recursively executes subcommands.
However, passing parent class parameters down is cumbersome with this approach, so I personally think `get_subcommand` is fine.
When that's not needed, this approach is convenient.

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

## Conclusion

The CLI portion of pydantic-settings is under active development with frequent feature additions, and it will likely become even more user-friendly in the future.
Since it is updated quite frequently, checking the latest documentation may reveal new capabilities.
