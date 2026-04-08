---
uuid: 2e78a536-3dc2-4a4f-81aa-5f20e1db76a1
title: I Built a Tool to Format Code Inside Markdown
description: I wanted to format code inside Markdown, so I built a tool for it.
lang: en
category: techblog
tags:
  - rust
  - archive
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## Use dprint Instead

`dprint` can format code inside Markdown and has VS Code support. You should use this instead.

::gh-card[dprint/dprint]

## TL;DR

When writing technical articles, you naturally need to write code.
When writing code in VS Code or similar editors, I use code formatters like `rustfmt`, `black`, and `prettier`. Since I often verify that the code in articles actually runs, I usually write it in VS Code and copy-paste it.

However, when I'm writing code casually within an article or just making minor edits, I sometimes modify the code directly in the article instead of copy-pasting. In those cases, since the code hasn't gone through a formatter, it can deviate from my usual coding style, or I might make mistakes that a formatter would catch, such as mismatched parentheses.

So this time, I created **cmfmt**, a tool that formats code inside Markdown using arbitrary formatters, and I'd like to introduce it here.

::gh-card[illumination-k/cmfmt]

## Usage

Binaries are available for download. After downloading and adding it to your PATH, you can use it like `cmfmt example.md`. By default, it overwrites the file in place. If you don't want that, use the `--stdout` flag to output to stdout instead.

```bash
USAGE:
    cmfmt [FLAGS] [OPTIONS] <markdown>

FLAGS:
    -h, --help       Prints help information
        --stdout     Output formatted markdown to stdout instead of overwrite the input markdown
    -V, --version    Prints version information

OPTIONS:
        --config <config>    Path of the config file. default: ${home}/.config/cmfmt.toml

ARGS:
    <markdown>    Path of the input markdown you would like to format
```

## Configuration File

The configuration file has the following format. It is automatically generated at `~/.config/cmfmt.toml`. By editing it, you should be able to format code inside Markdown using your preferred languages and formatters.

```toml
[fmt.python]
command = "black"
name = ["py", "python", "python3"]
extention = "py"

[fmt.rust]
command = "rustfmt"
name = ["rs", "rust"]
extention = "rs"

[fmt.js]
command = "prettier"
args = ["--write"]
name = ["js", "javascript"]
extention = "js"
```

`fmt.langname` has no special meaning -- it's just there for human readability. Any format like `fmt.xxxxx` will work. I added the `fmt` prefix because I'd like to add `lint` support in the future.

You specify which language names to recognize using `name` as an array. Then, you specify which command to use for formatting with `command`. If arguments are needed, you can specify them as an array with `args`.

Also, since formatters like `prettier` won't work without a specific file extension, you can specify the extension for the temporary file.

## Technologies Used

| Type             |                |
| ---------------- | -------------- |
| Language         | rust           |
| Config file      | toml           |
| Markdown parsing | pulldown-cmark |

## How It Works

What it does is extremely simple:

1. Parse the Markdown
2. Detect the language name from code blocks
3. Save the code body as a temporary file
4. Run the command specified in the config file on the temporary file
5. Read the temporary file and replace the original code with the formatted code
6. Convert back to Markdown

## Conclusion

I want to bring consistency to the code in my blog articles with `cmfmt`.
