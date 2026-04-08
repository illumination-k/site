---
uuid: 432eaa6e-f795-4bf5-9f8d-443fd0c7e917
title: Using peco with Windows (PowerShell) for Incremental History Search
description: Using peco with PowerShell to perform incremental search on command history.
lang: en
category: techblog
tags:
  - powershell
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2024-10-27T18:42:50+00:00"
---

## TL;DR

There is an argument that you should just use WSL2 instead of PowerShell. That said, if you are using Windows, you still want to set up a minimal PowerShell environment. Also, WSL2 becomes extremely slow when using external hard drives, which can be quite stressful. When developing on your own PC, storage capacity is a significant concern, and there are times when you want to use an external hard drive.

peco is commonly used with zsh, but it is also a tool that can easily implement incremental search in PowerShell. Since the default `Ctrl + r` history search is not very user-friendly, let's start by enabling incremental search for command history.

## Installing peco

Install using Chocolatey. Administrator privileges are required, so you need to open PowerShell with administrator rights.

```powershell
choco install peco
```

## Displaying History

PowerShell's input history is saved in a text file at the path shown by `(Get-PSReadlineOption).HistorySavePath`. So to retrieve history in PowerShell:

```powershell
Get-Content -Path (Get-PSReadlineOption).HistorySavePath | Select-Object -Unique
```

We also use `Select-Object -Unique` because we want the command history to be unique.

## Piping to peco and Executing the Selected Result

To execute the selected output, use `Invoke-Expression`.

```powershell
Get-Content -Path (Get-PSReadlineOption).HistorySavePath | Select-Object -Unique | peco | Invoke-Expression
```

So the function to execute is:

```powershell
function pecoHistory() {
    Get-Content -Path (Get-PSReadlineOption).HistorySavePath | Select-Object -Unique | peco | Invoke-Expression
}
```

That's all we need.

## Profile

This is PowerShell's equivalent of `.bashrc`.

```powershell
echo $profile # Check the path
notepad $profile # Open with Notepad
```

You can check the path or open it with an editor like this.

Write the function from earlier into this file. Now you can use `pecoHistory` for a nice incremental search experience.

### Registering a Keybind

To set keybinds in PowerShell, use `Set-PSReadLineKeyHandler`. For built-in functions, write them after `-Function`, but for custom scripts, use `-ScriptBlock`. Inside the ScriptBlock, we insert the registered `pecoHistory` command and execute it.

```powershell
Set-PSReadLineKeyHandler -Chord Ctrl+r -ScriptBlock {
    [Microsoft.PowerShell.PSConsoleReadLine]::RevertLine()
    [Microsoft.PowerShell.PSConsoleReadLine]::Insert("pecoHistory")
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
}
```

With this setup, you can use `Ctrl + r` for incremental history search in PowerShell.

## References

- [Recommendations for PsReadLine Settings (PowerShell)](https://qiita.com/AWtnb/items/5551fcc762ed2ad92a81)
- [Simple Launcher Using peco (PowerShell)](https://qiita.com/AWtnb/items/d2842d86c5482832daa5)
- [PowerShell Input History](https://www.vwnet.jp/Windows/w10/PSHistry.htm)
- [Having a Good Day with poco](https://krymtkts.github.io/posts/2019-07-28-have-a-good-day-with-poco)
- [Windows PowerShell Profiles](https://docs.microsoft.com/en-us/previous-versions//bb613488(v=vs.85)?redirectedfrom=MSDN#understanding-the-profiles)
- [Set-PSReadLineKeyHandler](https://docs.microsoft.com/ja-jp/powershell/module/psreadline/set-psreadlinekeyhandler?view=powershell-7.1)
- [peco](https://github.com/peco/peco)

## Revision History

- Addressed [#65](https://github.com/illumination-k/site/issues/65).
