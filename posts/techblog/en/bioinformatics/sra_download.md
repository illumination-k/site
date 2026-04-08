---
uuid: 37b8d936-c016-4aa0-bca6-9fe1e44ee901
title: Tips for Downloading FASTQ Files from SRA
description: Tips and related knowledge for downloading FASTQ files from SRA
lang: en
category: techblog
tags:
  - bioinformatics
  - sra
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

The need for downloading FASTQ files from SRA seems to be growing every year. I cannot speak to the cloud-related options as I have no budget for them.

## sra-tools

With sra-tools, the download itself is very straightforward. Running `prefetch` before `fasterq-dump` helps avoid memory errors and is recommended.

### Examples (when you just need the FASTQ files)

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

This launches the configuration screen. You can configure cloud and proxy settings, as well as whether to use `.sralite` files (described later). Navigate by pressing the highlighted (red) characters.

### Other Notes

- If you do not specify an output location for prefetch, the file will be placed in a default location. In that case, you can find the download path with `srapath ${id}`.
- `fasterq-dump` automatically detects whether the data is paired-end.
- `fasterq-dump` does not support gzip compression. It is recommended to compress the files afterward. A multi-threaded tool like [pigz](https://zlib.net/pigz/) is recommended.
- Unlike uploading, direct downloading via `ascp` is not recommended. While the [Wiki](https://github.com/ncbi/sra-tools/wiki/HowTo:-Access-SRA-Data) states that prefetch supports ascp, the [issue tracker](https://github.com/ncbi/sra-tools/issues/255) suggests this is no longer the case.

For information on uploading, please see the related article.

## SRA File Formats

These are the files fetched by `prefetch`. There are two formats: `.sra` and `.sralite`.

- `.sra`: Contains all information. This is generally what you should use.

- `.sralite`: A format supported since SRA Toolkit v2.11.2, with simplified quality scores. Specifically, only Pass (30) and Reject (3) are stored. The use cases for this format are not entirely clear. It can be enabled through the configuration settings.

### Reference

- [sra-tools](https://github.com/ncbi/sra-tools)
- [Quick Toolkit Configuration](https://github.com/ncbi/sra-tools/wiki/03.-Quick-Toolkit-Configuration)
- [prefetch can not download file by fasp](https://github.com/ncbi/sra-tools/issues/255)
- [SRA Data Format](https://www.ncbi.nlm.nih.gov/sra/docs/sra-data-formats/)
