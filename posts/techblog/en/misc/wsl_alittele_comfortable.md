---
uuid: 460e0d7f-5fef-434f-a6e0-1eea3b9f365f
title: Tips to Make WSL2 a Little More Comfortable
description: Tips for making WSL2 a little more comfortable to use.
lang: en
category: techblog
tags:
  - wsl2
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

WSL2 is very easy to use and comfortable, but sometimes there are things that would make it even better if they were possible. I plan to add more tips as I find solutions.

## Basics

### `exe` Files

In WSL2, you can use Windows `exe` files. There are many usable exe files, but here is a summary of the ones I have used.

| Command          | Purpose        |
| ---------------- | -------------- |
| `cmd.exe`        | Command Prompt |
| `powershell.exe` | PowerShell     |
| `clip.exe`       | Clipboard      |
| `explorer.exe`   | File Explorer  |
| `notepad.exe`    | Notepad        |
| `write.exe`      | WordPad        |

By using Command Prompt or PowerShell, you can bridge the WSL2 side and the Windows side. Also, `clip.exe` is convenient when you want to copy strings to the clipboard.

### The `wslpath` Command

Since WSL2 paths have a different format from Windows, you need to convert them to a format that the Windows side can interpret when using these `exe` files.

This is easy with the `wslpath` command. It works as follows.
By default, it converts a Windows path to a WSL path, but on the WSL side you almost always want the reverse, so you will likely use `wslpath -aw`. Converting to an absolute path gives a sense of security.

```
wslpath
Usage:
    -a    force result to absolute path format
    -u    translate from a Windows path to a WSL path (default)
    -w    translate from a WSL path to a Windows path
    -m    translate from a WSL path to a Windows path, with '/' instead of '\'

EX: wslpath 'c:\users'
```

### Detecting Whether You Are on WSL2

When configuring dotfiles and similar settings, you may want to detect whether you are on WSL2.

I use the following approach:

```bash
if [[ $(uname -r) == *'microsoft'* ]]; then
    echo WSL2
fi
```

## Practical Use Cases

### The open Command

For those who have used a Mac, this is a command that opens a file with its default application. In WSL2, you can achieve this as follows:

```bash
cmd.exe /c start $(wslpath -aw $file)
```

If you want to open it with Explorer:

```bash
explorer.exe $(wslpath -aw $file)
```

### Copying Strings to the Clipboard

Simply pipe strings to `clip.exe`.

```bash
echo "hello" | clip.exe
```

### Copying Images to the Clipboard

This requires a tricky approach. If you pass a PowerShell script as an argument to `powershell.exe`, it will execute it. Create the following ps1 file with any name.

```powershell title=imgcopy.ps1
[Reflection.Assembly]::LoadWithPartialName('System.Drawing');
[Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms');

$filename = $Args[0];
$file = get-item($filename);
$img = [System.Drawing.Image]::Fromfile($file);
[System.Windows.Forms.Clipboard]::SetImage($img);
```

```bash
powershell.exe "./imgcopy.ps1 image.png"
```

### Pasting Images from the Clipboard

This can be achieved using PowerShell's `Get-Clipboard`.

```bash
powershell.exe "(Get-Clipboard -Format Image).Save('image.png')"
```

## References

- [to-clipboard.ps1](https://gist.github.com/andytuba/13b9fe7ea7f3405c04d338f93b399ff8)
