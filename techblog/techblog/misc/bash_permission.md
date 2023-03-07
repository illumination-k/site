---
uuid: 6d75c101-9f84-4208-986c-605b5298a4ad
title: bashのPermission関連についてのまとめ
description: bashのPermission関連について、すぐ忘れてしまうのでまとめておきます。
lang: ja
category: techblog
tags:
  - bash
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

bashのpermission関連について、すぐ忘れてしまうのでまとめておきます。

## Permissionの基本

`ls -l`コマンドで見れる。

よく見るのは以下のような出力

```bash
#|u||g||a|
-rwxrwxrwx
drwxrwx---
|rw-rw----
```

## 1文字目

そのファイルの種類を示している。

| 記号 | 意味               |
| ---- | ------------------ |
| -    | ファイル           |
| d    | ディレクトリ       |
| \|   | シンボリックリンク |

## それ以外

ファイル種別以外の部分は、それぞれの範囲でどのパーミッションがあるのかを示している。

| 範囲      | 意味               |
| --------- | ------------------ |
| `[2, 4]`  | 所有者の権限       |
| `[5, 7]`  | 所有グループの権限 |
| `[8, 10]` | その他             |

### パーミッション記号の意味

| 記号 | 意味               |
| :--: | ------------------ |
| `r`  | 読み取り権限       |
| `w`  | 書き込み権限       |
| `x`  | 実行権限           |
| `s`  | SUIDかSGID         |
| `t`  | スティッキービート |

- `SUID (Set User ID)`: 指定したユーザーの権限でファイルが実行される。
- `SGID (Set Group ID)`: 指定したグループの権限でファイルが実行される。ディレクトリ内部で作成されたファイルはすべてディレクトリのSGIDで指定したグループが割り当てられる。
- `スティッキービート`: 自身のファイル以外の削除を行えない。ただし書き込みは行える。

## 権限の変更 chmod

```bash
chmod --help
# Usage: chmod [OPTION]... MODE[,MODE]... FILE...
#   or:  chmod [OPTION]... OCTAL-MODE FILE...
#   or:  chmod [OPTION]... --reference=RFILE FILE...
# Change the mode of each FILE to MODE.
# With --reference, change the mode of each FILE to that of RFILE.
# 
#   -c, --changes          like verbose but report only when a change is made
#   -f, --silent, --quiet  suppress most error messages
#   -v, --verbose          output a diagnostic for every file processed
#       --no-preserve-root  do not treat '/' specially (the default)
#       --preserve-root    fail to operate recursively on '/'
#       --reference=RFILE  use RFILE's mode instead of MODE values
#   -R, --recursive        change files and directories recursively
#       --help     display this help and exit
#       --version  output version information and exit
# 
# Each MODE is of the form '[ugoa]*([-+=]([rwxXst]*|[ugo]))+|[-+=][0-7]+'.
# 
# GNU coreutils online help: <http://www.gnu.org/software/coreutils/>
# Full documentation at: <http://www.gnu.org/software/coreutils/chmod>
# or available locally via: info '(coreutils) chmod invocation'
```

### permissionの指定の仕方

#### 1. 数字で指定

それぞれの権限には値が割り当てられている。その数字の和を指定することで権限を設定できる。基本的に3桁の数字で指定して、1桁目が所有者、2桁目がグループ、3桁目がその他のパーミッションの設定となる。

| 権限               | 値 |
| ------------------ | -- |
| 読み取り権限 (`r`) | 4  |
| 書き込み権限 (`w`) | 2  |
| 実行権限 (`x`)     | 1  |

**例**

- `-rwxrw-r--`: `chmod 764 file`
- `-rwxrwxrxw`: `chmod 777 file`
- `-rw-rw----`: `chmod 660 file`

また、SUID、SGID、スティッキービートを指定する場合は少し特殊で、4桁の数字を使って指定することになる。この場合、1桁目がSUID、SGID、スティッキービートのどれかの値、2桁目が所有者、3桁目がグループ、4桁目がその他のパーミッションの設定となる。

| 権限                   | 値 |
| ---------------------- | -- |
| SUID (s)               | 2  |
| SGID (s)               | 4  |
| スティッキービート (t) | 1  |

**例**

- `-rwsr-xr-x`: `chmod 4755 file`
- `drwxr-sr-x`: `chmod 2755 dir`
- `drwxrwxrxt`: `chmod 1777 dir`

#### 2. アルファベットで指定

数字の代わりに、変更対象、変更方法、変更内容を指定する。

指定の仕方は以下の通り。

| 変更対象 | 意味         |
| :------: | ------------ |
|   `u`    | 所有者       |
|   `g`    | 所有グループ |
|   `a`    | その他       |

| 変更方法 | 意味               |
| :------: | ------------------ |
|   `+`    | 権限を付与         |
|   `-`    | 権限を削除         |
|   `=`    | 指定した権限にする |

| 変更内容 | 意味               |
| :------: | ------------------ |
|   `r`    | 読み取り権限       |
|   `w`    | 書き込み権限       |
|   `x`    | 実行権限           |
|   `s`    | SUIDかSGID         |
|   `t`    | スティッキービート |

**例**

- 所有者に実行権限を付与: `chmod u+x file`
- 所有者と所有グループに実行権限を付与: `chmod u+x,g+x file`
- その他から実行権限と書き込み権限を除去: `chmod a-wx file`
- SUIDを設定: `chmod u+s file`
- SGIDを設定: `chmod g+s file`
- スティッキービートを設定: `chmod a+t dir`

### 再帰的なパーミッション変更

#### 全て

```bash
chmod -R 755 .
```

### 特定のファイルの権限変更

`find`を使う。`-exec`より`xargs`を使うほうが推奨されているらしい(参考: [findコマンドで-execオプションを使用する時の最後の「{} ;」ってなんだっけ？](https://qiita.com/legitwhiz/items/e609537fb6226081f5b5))。

```bash
# dir
find . -type d | xargs chmod 755
# file 
find . -type f | xargs chmod 755
# 特定拡張子
find . -name '*.sh' | xargs chmod 755
```

## ディレクトリのデフォルトパーミッションの設定 (umask)

あるディレクトリにおいて作成されるファイルに常に同じパーミッションを割り当てたくなる時がある。その場合は`umask`コマンドが使える

`umask`コマンドは、**付与しない権限**を指定する。ディレクトリの場合は実行可能の設定は可能だが、ファイルの場合は実行可能に設定することはできないため、ファイルを実行可能にする場合は、後からchmodコマンドで指定する必要がある。

### 1. 数字で指定

`chmod`と同様に数字の和で権限を指定する。

| **付与しない**権限 | 値 |
| ------------------ | -- |
| 読み取り権限 (`r`) | 4  |
| 書き込み権限 (`w`) | 2  |
| 実行権限 (`x`)     | 1  |

**例**

- `-rwxr-xr-x`: `umask 022`
- `-rw-rw----`: `umask 117`

### 2. アルファベットで指定

`umask -S 変更対象=変更内容`でアルファベットで指定することもできる。この場合も、**付与しない権限**を指定することに注意する。

- `-rwxr-xr-x`: `umask g=x,a=x`
- `-rw-rw----`: `umask u=x,g=x,a=rwx`

## SELinux

**あまりちゃんと理解できていない**

通常のパーミッションとは別に、MAC (Mandatory Access Control)を追加することで従来のLinuxの権限より粒度の小さい権限を設定することが可能。

> SELinux (Security-Enhanced Linux) は Linux カーネルに MAC (Mandatory Access Control) を追加するもので、標準の Discretionary Access Controls (DAC: 任意アクセス制御) がチェックされた後で許可された操作をチェックします。これは米国国家安全保障局 (National Security Agency) が開発したもので、定義されたポリシーを基に Linx システム内のファイルやプロセスおよびその他のアクションにルールを強制できます。

- [SECURITY-ENHANCED LINUX](https://access.redhat.com/documentation/ja-jp/red_hat_enterprise_linux/6/html/security-enhanced_linux/chap-security-enhanced_linux-introduction)

SELinuxの権限は`ls -Z`や`ps -Z`で確認することができる。

### 動作モード

| モード     | 説明                                                     |
| ---------- | -------------------------------------------------------- |
| Enforcing  | SELinux 有効。ルール外の動作があれば止める。             |
| Permissive | SELinux 有効。ただしルール外の動作はログに記録するのみ。 |
| Disable    | SELinux 無効。                                           |

動作モードの確認・設定

```bash
# 確認
getenforce
# Enforcing

# 設定
setenforce Permissive
```

### SELinuxが有効なLinux上でdockerを使う方法

ボリュームを指定する際に`:z`か`:Z`の接尾語を使用することで共有コンテントとラベルをDockerに伝えることで、privateかつ個別にボリュームを指定できる(参考: [Docker-docs-ja](http://docs.docker.jp/engine/userguide/dockervolumes.html#id6))。

## 参考

- [Linuxの権限確認と変更(chmod)（超初心者向け）](https://qiita.com/shisama/items/5f4c4fa768642aad9e06)
- [【Linuxパーミッション】SGIDとは？と設定方法](https://eng-entrance.com/linux-permission-sgid)
- [【初心者でもすぐわかる】SUIDとは？と設定方法](https://eng-entrance.com/linux-permission-suid)
- [Linux: SUID、SGID、スティッキービットまとめ](https://qiita.com/aosho235/items/16434a490f9a05ddb0dc)
- [Linuxコマンドのお勉強 再帰的にパーミッションを変更](https://qiita.com/NoTASK/items/9b0b466f9bd4eea3efe9)
- [umaskコマンドについて詳しくまとめました 【Linuxコマンド集】](https://eng-entrance.com/linux-command-umask)
- [理由がわかれば怖くない！SELinux とのつきあい方](https://blog.fenrir-inc.com/jp/2016/09/selinux.html)
