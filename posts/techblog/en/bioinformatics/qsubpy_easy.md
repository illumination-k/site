---
uuid: 42a992f4-83ad-4b68-8df0-400727d82205
title: Submit Commands Directly as Jobs via qsub
description: When using a supercomputer, you often need to submit jobs via qsub. Sometimes you just want to run a one-liner, and having to create a script file first is tedious. Here, I use Python's argparse and subprocess to pseudo-submit commands as jobs directly from the command line.
lang: en
category: techblog
tags:
  - python
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

When using a supercomputer, you often need to submit jobs via qsub.

Sometimes you just want to run a one-liner, and having to create a script file first before submitting a command is quite tedious. To solve this, I used Python's argparse and subprocess to pseudo-submit commands as jobs directly from the command line.

The concept is simple: the script accepts a command and various parameters as arguments, formats them into a script file, and then submits that file via qsub.

## Code

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

### Usage

I recommend adding the directory containing the file to your PATH and creating a symbolic link so you can use it from anywhere. Assuming the file above is named `qsubpy.py`:

```bash
cat "export PATH:/path/to/qsubpy.py directory:$PATH" >> ~/.bash_profile
ln qsubpy.py qsubpy
```

Then you can submit jobs like this:

```bash
qsubpy -c "echo hello"
```

If you want to specify resources:

```bash
qsubpy -c "echo hello" --mem 16G --slot 4
```

If you do not need the generated script file, use `--remove` and the created shell script will be deleted. If you want to specify a name for the script file, use `--name hoge.sh`. By default, the file is named with the date plus a random 10-digit integer.

Personally, I have not felt a strong need for it, but you could easily add arguments for log file settings and so on, which would make it even more convenient.

### Notes

- Adjust the shebang line to match your environment.
- If the file lacks execute permission, run `chmod u+x qsubpy`.
