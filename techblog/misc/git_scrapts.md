---
uuid: f35e013e-6067-44ec-a1e2-706e82ac2c3e
title: Gitに関するスクラップ
description: Gitに関してコマンドをよく忘れるのでメモ
lang: ja
category: techblog
tags:
  - git
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## HEADの種類

| 名前       | 意味                             |
| ---------- | -------------------------------- |
| HEAD       | 最新のコミット                   |
| ORIG_HEAD  | 最新のコミットの1つ手前          |
| FETCH_HEAD | リモートブランチの最新のコミット |
| MERGE_HEAD | MERGEした対象の最新のコミット    |

- [GitのHEAD, ORIG_HEAD, FETCH_HEAD, MERGE_HEADとは？](https://qiita.com/t-mochizuki/items/347cba461fd570bca03c)

### 小技

```bash
git push origin HEAD
```

すれば現在のブランチをpushできて嬉しい。

## 特定のコミットに戻す

- `${hash}`: 特定のコミット
- `${dirname}`: ディレクトリ名
- `${file_n}`: ファイル名

```bash
# 全体
git checkout ${hash}

# 特定のディレクトリ
git checkout ${hash} ${dirname}

# 特定のファイル
git checkout ${hash} ${file_1} ${file_2}
```

## reset系

```bash
# add取り消し
git reset --mixed HEAD
# commit取り消し
git reset --soft HEAD^
# 直前のcommitの削除
git reset --hard HEAD^
# commit後の変更取り消し
git reset --hard HEAD
# 直前のresetを取り消す
git reset --hard ORIG_HEAD
# remote branchのHEADで上書き (間違ってamendしてpushしたときなどに)
git reset origin/${branch_name}
```

- [[git reset (--hard/--soft)]ワーキングツリー、インデックス、HEADを使いこなす方法](https://qiita.com/shuntaro_tamura/items/db1aef9cf9d78db50ffe)

## reflog

`git reset`を間違えてしたときに便利なサブコマンド。`reflog`は`HEAD`が指しているcommitのリストで、ローカルでのみ保存される。`reflog`はデフォルトでは直近90日で削除される。local特有のものなので、リモート側では保持されていない。

- [履歴の書き換え](https://www.atlassian.com/ja/git/tutorials/rewriting-history)
- [What's the difference between git reflog and log?](https://stackoverflow.com/questions/17857723/whats-the-difference-between-git-reflog-and-log)

## git pushがフリーズ

```bash
unset SSH_ASKPASS && unset GIT_ASKPASS
```

- [git pushでフリーズする](https://www.mazn.net/blog/2020/10/25/2099.html)

## git credentialsのreset

`--local`, `--system`あたりは任意で変更。

```bash
git config --global --unset credential.helper
```

## 現在のbranch名の取得

```bash
git symbolic-ref --short HEAD
```
