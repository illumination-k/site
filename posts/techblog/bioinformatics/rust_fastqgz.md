---
uuid: 198bf005-b169-4992-8ad5-667f594d84e0
title: Rustでfastq/fastq.gzを読み書きする
description: rust-bioを使ってfastq/fastq.gzを読み書きします。
lang: ja
category: techblog
tags:
  - bioinformatics
  - rust
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

fastqとかのファイルを処理するときに、Pythonだとサイズが大きめのfastqファイル群を扱ってると時間がかかりすぎて辛い気分になります。fastqをパースするくらいなら自前で書いてもいいんですが、[rust-bio](https://github.com/rust-bio/rust-bio)なるcrateがあるのでそれを使います。

使い方は[docs](https://docs.rs/bio/latest/bio/index.html)読めばわかるんですが、gz形式で読み書きするのがrust-bio単独では使えなかったので、そのあたりもフォローしておきます。

## dependencies

```toml title=Cargo.toml
bio = "*"
```

### rust-bioの`io::fastq`に関する注意

rust-bioにはfastqパーサーがおいてあります。RecordがStringとかを持つ仕様なので、アロケーションの償却とかそういう意味だとちょっと速度は微妙な可能性があります。Errorハンドリングとかは参考になるので、高速化したいなら自分で書いたほうがいいかもしれません。

## fastqの読み書き

### Record

fastqの1 readに相当するRecordの定義は以下のようになっています。

```rust
// from https://docs.rs/crate/bio/0.32.0/source/src/io/fastq.rs

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct Record {
    id: String,
    desc: Option<String>,
    seq: String,
    qual: String,
}
```

それぞれのメンバは同名の関数（`ex id()`）などでアクセスできます。ただ、`seq()`関数だけByteのスライスを返してきます。もうそれなら最初から全部`&[u8]`で読み込んでほしい...。

### Reader

[docs](https://docs.rs/bio/latest/bio/io/fastq/index.html)のほぼコピペを貼ります。

```rust
use bio::io::fastq;
use std::io;

fn main() {
    let mut reader = fastq::Reader::new(io::stdin());

    let mut nb_reads = 0;
    let mut nb_bases = 0;

    for result in reader.records() {
        let record = result.expect("Error during fastq record parsing");

        nb_reads += 1;
        nb_bases += record.seq().len();
    }

    println!("Number of reads: {}", nb_reads);
    println!("Number of bases: {}", nb_bases);
}
```

この場合、標準入力から読み出していますが、圧倒的多数であろうファイルから読み込みたい場合は、

```rust
let mut reader = fastq::Reader::from_file(path).unwrap();
```

でReaderを作成できます。

### Write

[docs](https://docs.rs/bio/latest/bio/io/fastq/index.html)のほぼコピペを再び貼ります。

```rust
use bio::io::fastq;
use std::io;

fn main() {
    let mut seed = 42;

    let nucleotides = [b'A', b'C', b'G', b'T'];

    let mut writer = fastq::Writer::new(io::stdout());

    for _ in 0..10 {
        let seq = (0..100)
            .map(|_| {
                seed = ((seed ^ seed << 13) ^ seed >> 7) ^ seed << 17; // don't use this random generator
                nucleotides[seed % 4]
            })
            .collect::<Vec<u8>>();

        let qual = (0..100).map(|_| b'!').collect::<Vec<u8>>();

        writer.write("random", None, seq.as_slice(), qual.as_slice());
    }
}
```

Readerと同じで、ファイルに書き込みたい場合は、

```rust
let mut wtr = fastq::Writer::to_file(path).unwrap()
```

を使います。

## fastq.gzの読み書き

flate2というgzとかzipとかの圧縮を扱えるcrateを使います。`?`を使いたいので、anyhowというエラーハンドリングクレートを使用しています。

```toml title=Cargo.toml
bio = "*"
anyhow = "1.0"
flate2 = "0.2"
```

### Read

`fastq::Reader::new`はtraitとして`std::io::BufRead`を持っている必要があります。

gzが拡張子についていれば、gzdecoderで読み込んで、そうでなければ普通にBufreadで読み込む関数を作成しておきます。decoderにはflate2のMultiGzDecoderを使用します。

```rust
use anyhow::Result;
use flate2::read::MultiGzDecoder;
use std::io::{BufRead, BufReader};
use std::path::Path;

pub fn open_with_gz<P: AsRef<Path>>(p: P) -> Result<Box<dyn BufRead>> {
    let r = std::fs::File::open(p.as_ref())?;
    let ext = p.as_ref().extension();

    if ext == Some(std::ffi::OsStr::new("gz")) {
        let gz = MultiGzDecoder::new(r)?;
        let buf_reader = BufReader::new(gz);
        Ok(Box::new(buf_reader))
    } else {
        let buf_reader = BufReader::new(r);
        Ok(Box::new(buf_reader))
    }
}
```

これでgzからの読み込みの準備は整いました。あとは

```rust
let path = "a.fastq.gz";
let mut rdr = fastq::Reader::new(open_with_gz(path).unwrap());
```

のような形でReaderを生成できます。

### Write

WriterもReaderと同じような感じでBufWriteを生成して、`fastq::io::Writer::new()`すればいいです。同じ用にラッパー関数を作ればよいですが、ちょっとこっちはgzで書き出さないメリットが思い浮かばないので、作ったことがないので、直接gzencoderを入れるコードをおいておきます。そのうち書くかもしれません。

```rust
use anyhow::Result;
use std::path::Path;

use flate2::write::GzEncoder;
use flate2::Compression;

use bio::io::fastq;

pub fn write_with_gz<P: AsRef<Path>>(p: P) -> Result<fastq::io::Writer> {
    let mut f = std::fs::File::crate(p)?;
    let buf = BufWriter::new(f);

    let gz = GzEncoder::new(buf, Compression::Default);
    Ok(fastq::io::Writer::new(gz))
}

fn main() -> Result<()> {
    let path = "b.fastq.gz";
    let mut wtr = write_with_gz(path)?;
    Ok(())
}
```

## まとめ

docsを読めばいいと思います。
