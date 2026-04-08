---
uuid: 081ab3f4-4203-4520-b5ad-4a91de58950f
title: Uploading Data to SRA Using Aspera
description: Uploading data to SRA via HTTP or FTP is far too slow, so let's use IBM's Aspera Connect for faster uploads.
lang: en
category: techblog
tags:
  - bioinformatics
  - sra
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Uploading data to SRA via HTTP or FTP is far too slow -- you will be waiting all day. The first time I tried uploading, the web interface never finished, and uploading files one by one via FTP was painful. Using Aspera made the experience much more comfortable. There is nothing complicated about it; it is essentially a faster version of scp.

In fact, looking at the [NCBI page](https://www.ncbi.nlm.nih.gov/sra/docs/submitfiles/), Aspera Connect is recommended:

> Aspera Connect Fast and Secure Protocol (FASP) uses User Datagram Protocol (UDP) that eliminates and overcomes many shortcomings of other FTP clients and we recommend it for all medium to large submissions and slow or unreliable connections (especially from abroad).

## Installing Aspera Connect

Aspera Connect can be downloaded from [IBM Aspera Connect](https://www.ibm.com/aspera/connect/). Below is an example for Linux. The version may be updated, so try to use the latest one.

```bash
wget https://d3gcli72yxqn2z.cloudfront.net/connect_latest/v4/bin/ibm-aspera-connect_4.0.2.38_linux.tar.gz

tar -zxvf ibm-aspera-connect_4.0.2.38_linux.tar.gz
bash ibm-aspera-connect_4.0.2.38_linux.sh

export PATH=$PATH:$HOME/.aspera/connect/bin
```

After adding it to your PATH, the `ascp` command becomes available. If needed, add it to `~/.profile` or similar.

## Uploading Files

An `RSA Private Key` will be displayed -- save it as `~/.aspera/keys/aspera_rsa`. The FASTQ files you want to upload must be gzip-compressed. The upload destination uses a specified path that starts with your registered email address.

```bash
your_submission_directory="<user@email.com_xxxxx"

ascp -i ~/.aspera/keys/aspera_rsa -QT -l 100m -k1 -d path/to/your_reads.fastq.gz subasp@upload.ncbi.nlm.nih.gov:uploads/${your_submission_directory}
```
