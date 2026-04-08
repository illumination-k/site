---
uuid: 198bf005-b169-4992-8ad5-667f594d84e0
title: Reading and Writing fastq/fastq.gz in Rust
description: Reading and writing fastq/fastq.gz files using rust-bio.
lang: en
category: techblog
tags:
  - bioinformatics
  - rust
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

When processing fastq files, Python can become painfully slow when dealing with large fastq file sets. While writing a fastq parser from scratch is not difficult, there is a crate called [rust-bio](https://github.com/rust-bio/rust-bio) that we can use instead.

The usage is straightforward if you read the [docs](https://docs.rs/bio/latest/bio/index.html), but since reading and writing gz format is not supported by rust-bio alone, I will cover that as well.

## dependencies

```toml title=Cargo.toml
bio = "*"
```

### A Note on rust-bio's `io::fastq`

rust-bio provides a fastq parser. Since its Record type holds Strings, it may not be ideal in terms of allocation amortization and performance. The error handling is worth referencing, though, so if you need to optimize for speed, you might be better off writing your own parser.

## Reading and Writing fastq

### Record

The Record definition, which corresponds to a single read in fastq, looks like this:

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

Each member can be accessed via a function with the same name (e.g., `id()`). However, the `seq()` function returns a byte slice. Honestly, if they were going to do that, I wish everything was read as `&[u8]` from the start...

### Reader

Here is a near-copy from the [docs](https://docs.rs/bio/latest/bio/io/fastq/index.html):

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

This example reads from standard input, but to read from a file (which is far more common), you can create a Reader with:

```rust
let mut reader = fastq::Reader::from_file(path).unwrap();
```

### Write

Again, here is a near-copy from the [docs](https://docs.rs/bio/latest/bio/io/fastq/index.html):

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

Just like with the Reader, to write to a file:

```rust
let mut wtr = fastq::Writer::to_file(path).unwrap()
```

## Reading and Writing fastq.gz

We use the flate2 crate for handling gz and zip compression. We also use the anyhow crate for error handling so we can use the `?` operator.

```toml title=Cargo.toml
bio = "*"
anyhow = "1.0"
flate2 = "0.2"
```

### Read

`fastq::Reader::new` requires the input to implement the `std::io::BufRead` trait.

We create a function that reads through a GzDecoder if the file extension is gz, and reads normally with BufRead otherwise. We use flate2's MultiGzDecoder as the decoder.

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

Now we are ready to read from gz files. You can create a Reader like this:

```rust
let path = "a.fastq.gz";
let mut rdr = fastq::Reader::new(open_with_gz(path).unwrap());
```

### Write

For the Writer, you can similarly create a BufWrite and pass it to `fastq::io::Writer::new()`. You could write a similar wrapper function, but since I cannot think of a case where you would not want to write as gz, and I have not actually written one, here is the code for directly passing a GzEncoder. I might write a proper wrapper eventually.

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

## Summary

Just read the docs.
