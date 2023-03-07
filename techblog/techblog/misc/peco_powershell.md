---
uuid: 432eaa6e-f795-4bf5-9f8d-443fd0c7e917
title: Windows(Powershell)でpecoを使ってみる (履歴のインクリメンタルサーチ)
description: Powershellでpecoを使って履歴をインクリメンタルサーチしてみます。
lang: ja
category: techblog
tags:
  - powershell
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Powershell使うくらいならWLS2を使えという話はあります。とはいえ、Windowを使うならPowershellの環境は最低限整えておきたいです。また、WSL2は外部HDDなんかを使うと非常に遅くなってしまい、かなりストレスフルになるという問題もあります。自分のPCで開発しているとやはり容量は大きな問題となり、外部HDDを使いたいこともあります。

pecoはzshとよく併用されていますが、Powershellでも使えるインクリメンタルサーチを簡易に実装できるツールです。`Ctrl + r`での履歴検索は標準のままだとやっぱり使いづらいので、まず履歴をインクリメンタルサーチできるようにします。

## pecoのインストール

Chocolateyを使ってインストールします。管理者権限が必要なので、管理者権限つきのpowershellを開く必要があります。

```powershell
choco install peco
```

## 履歴の表示

Powershellの入力履歴は`(Get-PSReadlineOption).HistorySavePath`で表示されるパスにあるテキストファイルに保存されています。なので、Powershellで履歴を得るには

```powershell
Get-Content (Get-PSReadlineOption).HistorySavePath | Select-Object -Unique
```

のようなことをすればよいです。また、コマンド履歴はユニークであってほしいので、`Select-Object -Unique`を使用しています。

## pecoに流して選択結果を実行

得られた出力結果を実行するには`Invoke-Expression`を使います。

```powershell
Get-Content (Get-PSReadlineOption).HistorySavePath | Select-Object -Unique | peco | Invoke-Expression
```

ということで、実行する関数は

```powershell
function pecoHistory() {
    Get-Content (Get-PSReadlineOption).HistorySavePath | Select-Object -Unique | peco | Invoke-Expression
}
```

でいいですね。

## profile

Powershellの`.bashrc`みたいなやつです。

```powershell
echo $profile # pathの確認
notepad $profile # メモ帳で開く
```

みたいな感じでパスを確認したり、エディタで開いたりできます。

ここにさっきの関数を書き込んでおきます。これで、`pecoHistory`を使えばいい感じにインクリメンタルサーチができます。

### Keybindの登録

PowershellでKeybindを設定するには、`Set-PSReadLineKeyHandler`を使います。組み込み関数の場合は`-Function`以下に書けばいいんですが、自前のスクリプトを実行する場合は`-ScriptBlock`を使います。ScriptBlock内では、登録した`pecoHistory`コマンドを入力させて、それを実行しています。

```powershell
Set-PSReadLineKeyHandler -Chord Ctrl+r -ScriptBlock {
    [Microsoft.PowerShell.PSConsoleReadLine]::RevertLine()
    [Microsoft.PowerShell.PSConsoleReadLine]::Insert("pecoHistory")
    [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
}
```

以上で`Ctrl + r`を使うことでPowershellでも履歴のインクリメンタルサーチができるようになります。

## 参考

- [【PowerShell】PsReadLine 設定のススメ](https://qiita.com/AWtnb/items/5551fcc762ed2ad92a81)
- [【PowerShell】peco を使った簡易ランチャ](https://qiita.com/AWtnb/items/d2842d86c5482832daa5)
- [PowerShell の入力履歴](https://www.vwnet.jp/Windows/w10/PSHistry.htm)
- [pocoで捗る日常生活](https://krymtkts.github.io/posts/2019-07-28-have-a-good-day-with-poco)
- [Windows PowerShell Profiles](https://docs.microsoft.com/en-us/previous-versions//bb613488(v=vs.85)?redirectedfrom=MSDN#understanding-the-profiles)
- [Set-PSReadLineKeyHandler](https://docs.microsoft.com/ja-jp/powershell/module/psreadline/set-psreadlinekeyhandler?view=powershell-7.1)
- [peco](https://github.com/peco/peco)
