---
uuid: 9f833f29-019d-447c-af34-caf44abc5132
title: 知っておくと便利なbash知識
description: 知っておくと便利そうなbash知識をまとめていきます。
lang: ja
category: techblog
tags:
  - bash
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

便利そうなbashコマンドをまとめていきます。

## 基本

### 長い文章を出力する

```bash
cat EOF<<
long sentense!
EOF
```

### コマンド結果を変数に格納する

`$()`か、\`\`でくくる。

```bash
files=$(ls)
# or
files=`ls`
```

### ファイルの代わりに標準入力を受け取らせて変数に格納

```bash
split=$(echo "/path/to/file" | cut -f 4 -d /)
echo $split
# file
```

## 計算系

### 整数の四則演算

割り算は切り捨て。

```bash
add=$((10+2))
sub=$((10-2))
time=$((10*2))
frac1=$((10/2))
frac2=$((10/3))

echo $add
# 12
echo $sub
# 8
echo $time
# 20
echo $frac1
# 5
echo $frac2
# 3
```

### 小数の四則演算

`bc`をつかう。

```bash
add=$(echo "1.2+1.3" | bc -l)
sub=$(echo "2.5-1.2" | bc -l)
time=$(echo "1.2*1.2" | bc -l)
frac=$(echo "10/3" | bc -l)

echo $add
# 2.5
echo $sub
# 1.3
echo $time
# 1.44
echo $frac
# 3.33333333333333333333
```

## ファイルを取得する

```bash
# 全ファイル
files=$(ls)
# 再帰的な全ファイル
files=$(find . -type f)

# 特定の拡張子のファイル
files=$(ls *.csv)
# 再帰的な特定の拡張子のファイル
files=$(find . -type f -name '*.csv')

# 特定の拡張子を除いたファイル
files=$(ls | grep -v *.csv)

# ディレクトリのみ取得（最後に/が入るので注意）
d=$(ls -d */)
# 最後の/を除く場合
d=$(ls -d */ | sed 's/\/$//')
# 再帰的なディレクトリの取得
d=$(find . -type d)

#lsの全体のbasenameをとってくる
d=$(ls | awk -F / 'print $NF')
```

## ファイル名を操作する

### 拡張子を除く

`%`を使うと可読性も高くて楽。後ろから見てマッチする文字列を除去できる。拡張子以外にも応用できる

```bash
filename="test.csv"
base=${filename%.csv}
# or 
base=${filename%.*}
echo $base
# test

filename="test_sorted.bam"
base=${filename%_sorted.bam}
# or
base=${filename%_*}
echo $base
# test
```

### パスからファイル名とそれ以外を取得

`basename`を使うと楽。もう一つは`##`を使う方法もある。こっちは前から見てマッチする文字列の最大を除去する。

```bash
path_to_file="/aa/bb/cc.csv"

# basename
filename=$(basename ${path_to_file})
# ##
filename=${path_to_file##*/}
echo $filename
# cc.csv

dir=${path_to_file%$filename}
echo $dir
# /aa/bb/
```

### 区切り文字を使ってファイル名から情報を取得する

`%%`は後ろから見てマッチする文字列の最大を除去する。

```bash
sample_name="aaa-bbb-ccc.csv"

# first
first=${sample_name%%-*}
# or
first=$(echo ${sample_name} | cut -f 1 -d -)
echo $first
# aaa

# ext
ext=${sample_name##*.}
# or
ext=$(echo ${sample_name} | cut -f 2 -d .)
echo $ext
# csv

# last
tmp=${sample_name%%.*}
last=${sample_name##*-}
# cutは何番目かわかっている必要がある
last=$(echo ${sample_name%%.*} | cut -f 3 -d -)

echo $last
# ccc
```

### 拡張子の一括置換

`.txt` -> `.csv`

```bash
rename .txt .csv *.txt # linuxのみ？
ls *.txt | sed -e s/\.txt// | awk '{print $1 ".txt " $1 ".csv"}' | xargs -n 2 mv
```

## csvやtsvをある程度フォーマットした状態で読み込む

`column`の`-s`はデフォルトだとtabなので、tsvなら`-s`以下が要らない。

```bash
cat sample.csv | column -t -s $"," | less -S
```

## csvなどの区切り文字を変換する

`csv` -> `tsv`

```bash
cat sample.csv | tr , \\t > sample.tsv
```

## 変数が定義されているかを確認する

`[ -v variable ]`で確認できる。

```bash
foo="foo"

if [[ -v foo ]]; then
    echo $foo
fi

if [[ ! -v who ]]; then
    echo "who is not defined
fi
```

## シェルスクリプト内でaliasを使う

非対話モードでは`alias`はデフォルトでは動かない。

```bash
man bash | grep "Alias"
```

> Aliases are not expanded when the shell is not interactive, unless the expand_aliases shell option is set using shopt (see the description of shopt under SHELL BUILTIN COMMANDS below).

```bash
shopt -s expand_aliases
```

をすれば動く。関数で同様のことができるのでそっちを使った方が楽かもしれない。

Dockerをカレントディレクトリをマウントしつつ動かす例。

```bash
shopt -s expand_aliases
alias vdocker='docker run --rm -it -v $(pwd):$(pwd)'

# or

function vdocker {
    docker run --rm -it -v $(pwd):$(pwd) $@
}
```

## 参考

- [BashFAQ100](http://mywiki.wooledge.org/BashFAQ/100)
- [ファイルの拡張子の一括置換](https://qiita.com/fujieee/items/6c3fcca4de52b84a03c1)
- [set -uしてるときに変数が定義されてるかチェックする](https://qiita.com/tadsan/items/0109d651780844acce09)
- [Bashシェルスクリプト内でaliasコマンドを使う方法](https://genzouw.com/entry/2020/03/16/090918/1947/)
