---
uuid: 37b8d936-c016-4aa0-bca6-9fe1e44ee901
title: SRAからfastqをダウンロードする時の関連知識
description: SRAからfastqファイルをダウンロードする時の関連知識
lang: ja
category: techblog
tags:
  - bioinformatics
  - sra
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

SRAからfastqをダウンロードする技術の必要性は年々高まっている気がします。Cloud関連はお金がないのでわかりません。

## sra-tools

これを使えばダウンロードすることそのものは非常に簡単です。`prefetch`してから`fasterq-dump`をするとメモリエラーみたいなのが起きにくくなるのでお勧めです。

### examples (とりあえずfastqが欲しい場合)

```bash
id=SRRxxxxx
threads=8

mkdir -p prefetch_dir
prefetch -p -O ./prefetch_dir ${id}
fasterq-dump -p -e ${threads} --force ./prefetch_dir/${id}/${id}.sra
pigz -p ${threads} *.fastq
```

### Config

```
vdb-config -i
```

とすればConfig画面が立ち上がります。クラウドやProxyの設定、後述する`.sralite`を使うかどうかの設定などができます。移動方法は赤く光っている文字を押すことです。

### その他

- prefetchはoutput場所を指定しないと勝手に他の場所に置かれます。その場合は、`srapath ${id}`でダウンロード先を見れます。
- `fasterq-dump`はペアエンドかどうかは勝手に認識してくれます。
- `fasterq-dump`はgzip圧縮に対応していません。あとでgz圧縮しておくのがよいと思います。[pigz](https://zlib.net/pigz/)みたいなマルチスレッドで使えるものがおすすめです。
- アップロード時とは異なり、`ascp`を使った直接のダウンロードは推奨されていません。[Wiki](https://github.com/ncbi/sra-tools/wiki/HowTo:-Access-SRA-Data)にはprefetchはascpをサポートしていると書いていますが、[issue](https://github.com/ncbi/sra-tools/issues/255)を見る限りでは現在ではサポートされていないようです。

アップロードについてはこちらをご確認ください。

## SRAファイル

`prefetch`でとってくるファイルです。`.sra`と`.sralite`があります。

- `.sra`: 全ての情報が含まれているファイルです。基本的にこれを使えばいいです。

- `.sralite`: SRA Toolkitのv2.11.2からサポートされているフォーマットで、クオリティスコアが簡略化されています。具体的には、Pass(30)とreject (3)のみが保存されています。使い道はいまいちわかっていません。configを設定することで使えるようになります。

### Reference

- [sra-tools](https://github.com/ncbi/sra-tools)
- [Quick Toolkit Configuration](https://github.com/ncbi/sra-tools/wiki/03.-Quick-Toolkit-Configuration)
- [prefetch can not download file by fasp](https://github.com/ncbi/sra-tools/issues/255)
- [SRA Data Format](https://www.ncbi.nlm.nih.gov/sra/docs/sra-data-formats/)
