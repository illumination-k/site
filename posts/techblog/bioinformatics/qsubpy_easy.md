---
uuid: 42a992f4-83ad-4b68-8df0-400727d82205
title: コマンドをqsubで直接ジョブに投げられるようにする
description: スパコンを使っていると、qsubを使ってジョブを投げることがあるのではないかと思います。このときに、ワンライナーを実行したいときなど、一回ファイル作ってからコマンドを投げるのが非常にめんどくさいことがあります。そこで、Pythonのargparseとsubprocessを使って擬似的にコマンドからジョブを投げられるようにしました。
lang: ja
category: techblog
tags:
  - python
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

スパコンを使っていると、qsubを使ってジョブを投げることがあるのではないかと思います。

このときに、ワンライナーを実行したいときなど、一回ファイル作ってからコマンドを投げるのが非常にめんどくさいことがあります。そこで、Pythonのargparseとsubprocessを使って擬似的にコマンドからジョブを投げられるようにしました。

やっている事自体は単純で、引数としてコマンドと各種パラメーターを受け取って、ファイルに加工して作成したファイル対してqsubを投げるだけです。

## コード

```python
#!/usr/local/bin/python
import os
import argparse
import subprocess
import random

from datetime import datetime


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-c", "--command", type=str, required=True)
    parser.add_argument("-m", "--mem", type=str, default="4G")
    parser.add_argument("-s", "--slot", type=str, default="1")
    parser.add_argument("-n", "--name", type=str, default=None)
    parser.add_argument("--remove", action="store_true")
    args = parser.parse_args()

    mem_param = f'#$ -l s_vmem={args.mem} -l mem_req={args.mem}'
    slot_param = f'#$ -pe def_slot {args.slot}'
    time = datetime.now().strftime("%Y%m%d")

    script = [
        "#!/bin/bash",
        "#$ -S /bin/bash",
        "#$ -cwd",
        mem_param,
        slot_param,
        "",
        "source ~/.bashrc",
        "source ~/.bash_profile",
        "set -eu",
        args.command,
    ]
    if args.name is None:
        file_name = "tmp_" + time + "_" + "{:010d}".format(random.randint(0, 10**10)) + ".sh"
    else:
        file_name = args.name

    with open(file_name, "w") as f:
        f.write("\n".join(script))

    commands = ["qsub", file_name]
    subprocess.run(commands)


    if args.remove:
        os.remove(file_name)


if __name__ == "__main__":
    main()
```

### 運用

ファイルのある場所に対してパスを通して、ついでにシンボリックリンクを作成しておけばいつでも使えるようになるのでおすすめです。仮に上のファイル名を`qsubpy.py`としておくと

```bash
cat "export PATH:/path/to/qsubpy.py directory:$PATH" >> ~/.bash_profile
ln qsubpy.py qsubpy
```

みたいなことをしておけば

```bash
qsubpy -c "echo hello"
```

というような感じでジョブが投げられます。リソースを指定したければ

```bash
qsubpy -c "echo hello" --mem 16G --slot 4
```

作成したファイルなどが必要ないときは`--remove`を使ってもらえれば、作成されたshファイルは消えます。また、shファイルの名前などを指定したいときは`--name hoge.sh`してください。デフォルトでは、日付+ランダムな10桁の整数を名前につけます。

みたいな感じです。個人的には余り必要を感じませんが、引数を足せば当然簡単にlogとかそのへんもいじれるので、やってみるとより便利になる気がしました。

### 注意点

- シバン行は各自の環境に合わせてください
- 実行権限がなければ`chmod u+x qsubpy`とかしてください
