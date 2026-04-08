---
uuid: 6d75c101-9f84-4208-986c-605b5298a4ad
title: Summary of Bash Permission-Related Topics
description: A summary of bash permission-related topics that I tend to forget.
lang: en
category: techblog
tags:
  - bash
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

A summary of bash permission-related topics that I tend to forget.

## Permission Basics

You can view permissions with the `ls -l` command.

A common output looks like this:

```bash
#|u||g||a|
-rwxrwxrwx
drwxrwx---
|rw-rw----
```

## The First Character

It indicates the type of the file.

| Symbol | Meaning       |
| ------ | ------------- |
| -      | File          |
| d      | Directory     |
| \|     | Symbolic link |

## The Remaining Characters

The characters after the file type indicate what permissions exist for each scope.

| Scope     | Meaning |
| --------- | ------- |
| `[2, 4]`  | Owner   |
| `[5, 7]`  | Group   |
| `[8, 10]` | Others  |

### Meaning of Permission Symbols

| Symbol | Meaning            |
| :----: | ------------------ |
|  `r`   | Read permission    |
|  `w`   | Write permission   |
|  `x`   | Execute permission |
|  `s`   | SUID or SGID       |
|  `t`   | Sticky bit         |

- `SUID (Set User ID)`: The file is executed with the permissions of the specified user.
- `SGID (Set Group ID)`: The file is executed with the permissions of the specified group. All files created within the directory are assigned the group specified by the directory's SGID.
- `Sticky bit`: Prevents deletion of files owned by others. However, writing is still permitted.

## Changing Permissions with chmod

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

### How to Specify Permissions

#### 1. Specifying with Numbers

Each permission has an assigned value. By specifying the sum of these values, you can set the permissions. Permissions are typically specified with a 3-digit number, where the first digit is the owner, the second digit is the group, and the third digit is the others permission setting.

| Permission               | Value |
| ------------------------ | ----- |
| Read permission (`r`)    | 4     |
| Write permission (`w`)   | 2     |
| Execute permission (`x`) | 1     |

**Examples**

- `-rwxrw-r--`: `chmod 764 file`
- `-rwxrwxrxw`: `chmod 777 file`
- `-rw-rw----`: `chmod 660 file`

Additionally, when specifying SUID, SGID, or the sticky bit, a 4-digit number is used. In this case, the first digit represents the SUID, SGID, or sticky bit value, the second digit is the owner, the third digit is the group, and the fourth digit is the others permission setting.

| Permission     | Value |
| -------------- | ----- |
| SUID (s)       | 2     |
| SGID (s)       | 4     |
| Sticky bit (t) | 1     |

**Examples**

- `-rwsr-xr-x`: `chmod 4755 file`
- `drwxr-sr-x`: `chmod 2755 dir`
- `drwxrwxrxt`: `chmod 1777 dir`

#### 2. Specifying with Letters

Instead of numbers, you specify the target, the action, and the permission to change.

The specification format is as follows:

| Target | Meaning |
| :----: | ------- |
|  `u`   | Owner   |
|  `g`   | Group   |
|  `a`   | Others  |

| Action | Meaning                         |
| :----: | ------------------------------- |
|  `+`   | Grant permission                |
|  `-`   | Remove permission               |
|  `=`   | Set to the specified permission |

| Permission | Meaning            |
| :--------: | ------------------ |
|    `r`     | Read permission    |
|    `w`     | Write permission   |
|    `x`     | Execute permission |
|    `s`     | SUID or SGID       |
|    `t`     | Sticky bit         |

**Examples**

- Grant execute permission to the owner: `chmod u+x file`
- Grant execute permission to the owner and group: `chmod u+x,g+x file`
- Remove execute and write permissions from others: `chmod a-wx file`
- Set SUID: `chmod u+s file`
- Set SGID: `chmod g+s file`
- Set sticky bit: `chmod a+t dir`

### Recursive Permission Changes

#### All files and directories

```bash
chmod -R 755 .
```

### Changing Permissions for Specific Files

Use `find`. Using `xargs` is recommended over `-exec` (Reference: [What is the trailing `{} ;` when using -exec option with the find command?](https://qiita.com/legitwhiz/items/e609537fb6226081f5b5)).

```bash
# directories
find . -type d | xargs chmod 755
# files
find . -type f | xargs chmod 755
# specific extensions
find . -name '*.sh' | xargs chmod 755
```

## Setting Default Directory Permissions (umask)

Sometimes you want all files created in a certain directory to always have the same permissions. In that case, the `umask` command is useful.

The `umask` command specifies the permissions that will **not be granted**. For directories, the execute permission can be set, but for files, it cannot be set to executable. To make a file executable, you need to use chmod afterward.

### 1. Specifying with Numbers

Like `chmod`, permissions are specified by the sum of values.

| Permission **not granted** | Value |
| -------------------------- | ----- |
| Read permission (`r`)      | 4     |
| Write permission (`w`)     | 2     |
| Execute permission (`x`)   | 1     |

**Examples**

- `-rwxr-xr-x`: `umask 022`
- `-rw-rw----`: `umask 117`

### 2. Specifying with Letters

You can also specify with letters using `umask -S target=permission`. Note that in this case, you are also specifying permissions that will **not be granted**.

- `-rwxr-xr-x`: `umask g=x,a=x`
- `-rw-rw----`: `umask u=x,g=x,a=rwx`

## SELinux

**I don't fully understand this yet**

Separate from standard permissions, by adding MAC (Mandatory Access Control), you can configure permissions at a finer granularity than traditional Linux permissions.

> SELinux (Security-Enhanced Linux) adds MAC (Mandatory Access Control) to the Linux kernel. After the standard Discretionary Access Controls (DAC) are checked, it checks permitted operations. Developed by the U.S. National Security Agency, it can enforce rules on files, processes, and other actions within a Linux system based on defined policies.

- [SECURITY-ENHANCED LINUX](https://access.redhat.com/documentation/ja-jp/red_hat_enterprise_linux/6/html/security-enhanced_linux/chap-security-enhanced_linux-introduction)

SELinux permissions can be checked with `ls -Z` or `ps -Z`.

### Operation Modes

| Mode       | Description                                               |
| ---------- | --------------------------------------------------------- |
| Enforcing  | SELinux enabled. Blocks operations that violate rules.    |
| Permissive | SELinux enabled. Only logs operations that violate rules. |
| Disable    | SELinux disabled.                                         |

Checking and setting the operation mode:

```bash
# Check
getenforce
# Enforcing

# Set
setenforce Permissive
```

### Using Docker on SELinux-enabled Linux

When specifying volumes, you can use the `:z` or `:Z` suffix to tell Docker about shared content labels, allowing you to specify volumes as private and individual (Reference: [Docker-docs-ja](http://docs.docker.jp/engine/userguide/dockervolumes.html#id6)).

## References

- [Linux Permission Check and Change (chmod) (For Beginners)](https://qiita.com/shisama/items/5f4c4fa768642aad9e06)
- [What is SGID in Linux Permissions and How to Set It](https://eng-entrance.com/linux-permission-sgid)
- [What is SUID and How to Set It (Easy for Beginners)](https://eng-entrance.com/linux-permission-suid)
- [Linux: SUID, SGID, Sticky Bit Summary](https://qiita.com/aosho235/items/16434a490f9a05ddb0dc)
- [Linux Command Study: Changing Permissions Recursively](https://qiita.com/NoTASK/items/9b0b466f9bd4eea3efe9)
- [Detailed Summary of the umask Command (Linux Command Collection)](https://eng-entrance.com/linux-command-umask)
- [No Need to Fear When You Understand the Reason! Getting Along with SELinux](https://blog.fenrir-inc.com/jp/2016/09/selinux.html)
