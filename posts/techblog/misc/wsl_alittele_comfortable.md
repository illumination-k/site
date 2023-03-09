---
uuid: 460e0d7f-5fef-434f-a6e0-1eea3b9f365f
title: WSL2を少しだけ快適にするTips
description: WSL2をもう少しだけ快適に使うためのTips
lang: ja
category: techblog
tags:
  - wsl2
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

WSL2はとても使いやすく快適なのですが、たまにこれできるとすごく快適になるのに、ということがあると思います。解決できるたびに追記していきたいです。

## 基本

### `exe`ファイル

WSL2ではWindows上の`exe`ファイルが使えます。使えるexeファイルは色々ありますが、使ったことがあるものをまとめます。

| コマンド         | 用途               |
| ---------------- | ------------------ |
| `cmd.exe`        | コマンドプロンプト |
| `powershell.exe` | Powershell         |
| `clip.exe`       | clipboard          |
| `explorer.exe`   | エクスプローラー   |
| `notepad.exe`    | メモ帳             |
| `write.exe`      | ワードパッド       |

コマンドプロンプトやPowershellを使うことで、WSL2側とWindows側をつなげることが可能です。また、`clip.exe`を使えば、クリップボードに文字列をコピーしたいときとかに便利です。

### `wslpath`コマンド

WSL2のパスはWindows側とは違った形態なので、こういった`exe`ファイルを使う際にはWindows側が解釈できる形に加工する必要があります。

これは、`wslpath`コマンドを使うと簡単です。以下のような感じのコマンドです。
デフォルトだと、windowsのパスをWSLパスに加工するのですが、WSL側では逆がしたいことがほとんどなので、`wslpath -aw`をつけることになると思います。絶対パスに変換するのは安心感があるからです。

```
wslpath
Usage:
    -a    force result to absolute path format
    -u    translate from a Windows path to a WSL path (default)
    -w    translate from a WSL path to a Windows path
    -m    translate from a WSL path to a Windows path, with '/' instead of '\'

EX: wslpath 'c:\users'
```

### WSL2かどうかを判別する

dotfileの設定などの際にWSL2上かどうかを判定したいことがあります。

自分は以下のように判定しています。

```bash
if [[ $(uname -r) == *'microsoft'* ]]; then
    echo WSL2
fi
```

## 実際の用途

### openコマンド

Macを使用している方には通じると思うのですが、ファイルを規定のアプリで開いてくれるコマンドです。WSL2では以下のような形で実現できます。

```bash
cmd.exe /c start $(wslpath -aw $file)
```

Explorerで開きたい場合は、

```bash
explorer.exe $(wslpath -aw $file)
```

### clipboardに文字列をコピー

`clip.exe`にパイプで文字列を流せばいいです。

```bash
echo "hello" | clip.exe
```

### clipboardに画像をコピー

トリッキーなことをします。`powershell.exe`の引数にPowershellスクリプトを流せば実行してくれます。以下のps1ファイルを適当な名前で作成します。

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

### clipboardの画像を貼り付け

powershellの`Get-Clipboard`を使えば実現可能です。

```bash
powershell.exe "(Get-Clipboard -Format Image).Save('image.png')"
```

## 参考

- [to-clipboard.ps1](https://gist.github.com/andytuba/13b9fe7ea7f3405c04d338f93b399ff8)
