---
uuid: 081ab3f4-4203-4520-b5ad-4a91de58950f
title: SRAにAsperaを使ってデータをアップロードする
description: httpやftpによるSRAへのデータアップロードは遅すぎるので、IBMのaspera connectを使ってデータをアップロードするやり方を使おう。
lang: ja
category: techblog
tags:
  - bioinformatics
  - sra
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

httpやftpによるSRAへのデータアップロードは遅すぎるので、IBMのAspera Connectを使ってデータをアップロードしないと日が暮れます。初めてアップロードした時は、Webからは終わらず、ftpで一つずつアップロードするのはしんどかったのですが、Asperaを使うと思ったより快適にアップロードできました。難しいことは何もなく、scpの高速版という感じでした。
実際、[NCBIのページ](https://www.ncbi.nlm.nih.gov/sra/docs/submitfiles/)を見ると、以下の様にAspera Connectを使うことが推奨されています。

> Aspera Connect Fast and Secure Protocol (FASP) uses User Datagram Protocol (UDP) that eliminates and overcomes many shortcomings of other FTP clients and we recommend it for all medium to large submissions and slow or unreliable connections (especially from abroad).

## Aspera Connectのインストール

Aspera Connectは[IBM Aspera Connect](https://www.ibm.com/aspera/connect/)からダウンロードできます。Linuxを使っている場合の例を以下に示します。versionは更新されることがあるので、できるだけ最新版を使いましょう。

```bash
wget https://d3gcli72yxqn2z.cloudfront.net/connect_latest/v4/bin/ibm-aspera-connect_4.0.2.38_linux.tar.gz

tar -zxvf ibm-aspera-connect_4.0.2.38_linux.tar.gz
bash ibm-aspera-connect_4.0.2.38_linux.sh
​
export PATH=$PATH:$HOME/.aspera/connect/bin
```

パスを通すと、`ascp`コマンドが使えるようになっています。必要なら`~/.profile`などに記入しておきます。

## Fileのアップロード

`RSA Private Key`が表示されるので、`~/.aspera/keys/aspera_rsa`として保存します。アップロードしたいfastqはgz圧縮されている必要があります。upload先は、登録したemailから始まる指定されたものを使います。

```bash
your_submission_directory="<user@email.com_xxxxx"

ascp -i ~/.aspera/keys/aspera_rsa -QT -l 100m -k1 -d path/to/your_reads.fastq.gz subasp@upload.ncbi.nlm.nih.gov:uploads/${your_submission_directory}
```
