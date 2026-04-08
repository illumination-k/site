---
uuid: 9f833f29-019d-447c-af34-caf44abc5132
title: Useful Bash Knowledge to Know
description: A collection of useful bash knowledge and commands.
lang: en
category: techblog
tags:
  - bash
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

A collection of useful bash commands.

## Basics

### Outputting long text

```bash
cat EOF<<
long sentense!
EOF
```

### Storing command results in a variable

Wrap with `$()` or backticks.

```bash
files=$(ls)
# or
files=`ls`
```

### Storing standard input in a variable instead of reading from a file

```bash
split=$(echo "/path/to/file" | cut -f 4 -d /)
echo $split
# file
```

## Arithmetic

### Integer arithmetic

Division truncates toward zero.

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

### Floating-point arithmetic

Use `bc`.

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

## Getting files

```bash
# All files
files=$(ls)
# All files recursively
files=$(find . -type f)

# Files with a specific extension
files=$(ls *.csv)
# Files with a specific extension recursively
files=$(find . -type f -name '*.csv')

# Files excluding a specific extension
files=$(ls | grep -v *.csv)

# Get directories only (note: trailing / is included)
d=$(ls -d */)
# Remove trailing /
d=$(ls -d */ | sed 's/\/$//')
# Get directories recursively
d=$(find . -type d)

# Get the basename of all ls output
d=$(ls | awk -F / 'print $NF')
```

## Manipulating file names

### Removing the extension

Using `%` is readable and convenient. It removes the matching string from the end. This can be applied to more than just extensions.

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

### Extracting the file name and directory from a path

Using `basename` is easy. Another approach uses `##`, which removes the longest match from the beginning.

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

### Extracting information from a file name using delimiters

`%%` removes the longest match from the end.

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
# cut requires knowing the field number
last=$(echo ${sample_name%%.*} | cut -f 3 -d -)

echo $last
# ccc
```

### Batch renaming file extensions

`.txt` -> `.csv`

```bash
rename .txt .csv *.txt # Linux only?
ls *.txt | sed -e s/\.txt// | awk '{print $1 ".txt " $1 ".csv"}' | xargs -n 2 mv
```

## Reading CSV or TSV files with basic formatting

The `-s` option of `column` defaults to tab, so for TSV files you can omit `-s`.

```bash
cat sample.csv | column -t -s $"," | less -S
```

## Converting delimiters in CSV and similar files

`csv` -> `tsv`

```bash
cat sample.csv | tr , \\t > sample.tsv
```

## Checking whether a variable is defined

You can check with `[ -v variable ]`.

```bash
foo="foo"

if [[ -v foo ]]; then
    echo $foo
fi

if [[ ! -v who ]]; then
    echo "who is not defined
fi
```

## Using aliases in shell scripts

In non-interactive mode, `alias` does not work by default.

```bash
man bash | grep "Alias"
```

> Aliases are not expanded when the shell is not interactive, unless the expand_aliases shell option is set using shopt (see the description of shopt under SHELL BUILTIN COMMANDS below).

```bash
shopt -s expand_aliases
```

This enables aliases. Since functions can achieve the same thing, using functions might be easier.

An example of running Docker while mounting the current directory.

```bash
shopt -s expand_aliases
alias vdocker='docker run --rm -it -v $(pwd):$(pwd)'

# or

function vdocker {
    docker run --rm -it -v $(pwd):$(pwd) $@
}
```

## References

- [BashFAQ100](http://mywiki.wooledge.org/BashFAQ/100)
- [Batch renaming file extensions](https://qiita.com/fujieee/items/6c3fcca4de52b84a03c1)
- [Checking if a variable is defined when set -u is enabled](https://qiita.com/tadsan/items/0109d651780844acce09)
- [How to use the alias command in bash shell scripts](https://genzouw.com/entry/2020/03/16/090918/1947/)
