---
uuid: f35e013e-6067-44ec-a1e2-706e82ac2c3e
title: Git Scraps
description: Notes on Git commands that I often forget.
lang: en
category: techblog
tags:
  - git
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## Types of HEAD

| Name       | Meaning                                |
| ---------- | -------------------------------------- |
| HEAD       | The latest commit                      |
| ORIG_HEAD  | One commit before the latest           |
| FETCH_HEAD | The latest commit of the remote branch |
| MERGE_HEAD | The latest commit of the merged target |

- [What are Git's HEAD, ORIG_HEAD, FETCH_HEAD, and MERGE_HEAD?](https://qiita.com/t-mochizuki/items/347cba461fd570bca03c)

### Tips

```bash
git push origin HEAD
```

This pushes the current branch, which is convenient.

## Reverting to a Specific Commit

- `${hash}`: A specific commit
- `${dirname}`: A directory name
- `${file_n}`: A file name

```bash
# Entire repository
git checkout ${hash}

# A specific directory
git checkout ${hash} ${dirname}

# Specific files
git checkout ${hash} ${file_1} ${file_2}
```

## Reset Operations

```bash
# Undo add
git reset --mixed HEAD
# Undo commit
git reset --soft HEAD^
# Delete the last commit
git reset --hard HEAD^
# Discard changes after commit
git reset --hard HEAD
# Undo the last reset
git reset --hard ORIG_HEAD
# Overwrite with the remote branch's HEAD (e.g., when you accidentally amended and pushed)
git reset origin/${branch_name}
```

- [Mastering working tree, index, and HEAD with git reset (--hard/--soft)](https://qiita.com/shuntaro_tamura/items/db1aef9cf9d78db50ffe)

## reflog

A useful subcommand when you accidentally run `git reset`. `reflog` is a list of commits that `HEAD` has pointed to, and it is stored locally only. By default, `reflog` entries are deleted after 90 days. Since it is local-specific, it is not retained on the remote side.

- [Rewriting history](https://www.atlassian.com/ja/git/tutorials/rewriting-history)
- [What's the difference between git reflog and log?](https://stackoverflow.com/questions/17857723/whats-the-difference-between-git-reflog-and-log)

## git push Freezes

```bash
unset SSH_ASKPASS && unset GIT_ASKPASS
```

- [git push freezes](https://www.mazn.net/blog/2020/10/25/2099.html)

## Resetting git credentials

Change `--local` or `--system` as needed.

```bash
git config --global --unset credential.helper
```

## Getting the Current Branch Name

```bash
git symbolic-ref --short HEAD
```
