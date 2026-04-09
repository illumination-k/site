---
uuid: 9fa3f759-fdfa-45b6-8658-058a59be24e5
title: Trying Deep Learning-Based GO Term Annotation
description: Deep learning has achieved remarkable results in natural language processing. For predicting protein function through GO Term annotation from amino acid sequences, homology searches such as BLAST have traditionally been the dominant approach. Recently, several tools have begun performing function prediction using deep learning. In this post, we try out DeepGOPlus.
lang: en
category: techblog
tags:
  - bioinformatics
  - goterm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Deep learning has achieved remarkable results in natural language processing. For predicting protein function through GO Term annotation from amino acid sequences, homology searches such as BLAST have traditionally been the dominant approach. Recently, several tools have begun performing function prediction using deep learning. In this post, we try out DeepGOPlus. It appears to be CNN-based.

> Maxat Kulmanov, Robert Hoehndorf, DeepGOPlus: improved protein function prediction from sequence, Bioinformatics, Volume 36, Issue 2, 15 January 2020, Pages 422--429, https://doi.org/10.1093/bioinformatics/btz595

A [website](https://deepgo.cbrc.kaust.edu.sa/deepgo/) is also available, allowing you to easily try it out on the web. However, the website only supports analyzing 10 proteins at a time, so running a genome-wide analysis through it would be quite tedious.

Therefore, in this post we will use the model and Docker image provided by the authors to perform predictions. ([github](https://github.com/bio-ontology-research-group/deepgoplus))

## Preparing the Prerequisites

A Dockerfile is available on GitHub, so we can copy and use it. Based on the README, it does not appear to be hosted on Docker Hub. Inside, it installs deepgoplus via pip and also installs Diamond, which is used internally.

```docker
FROM python:3.6

RUN wget http://github.com/bbuchfink/diamond/releases/download/v2.0.2/diamond-linux64.tar.gz && tar xzf diamond-linux64.tar.gz
RUN mv diamond /usr/bin/

RUN pip install pip --upgrade
RUN pip install deepgoplus
```

Build the image.

```bash
docker build -t deepgoplus:latest .
```

Download the model.

```bash
wget http://deepgoplus.bio2vec.net/data/data.tar.gz
tar zxvf data.tar.gz
```

Since the goal here is simply to get it running, we will use the Arabidopsis thaliana FASTA file.

```bash
wget -O athaliana.fa https://www.arabidopsis.org/download_files/Proteins/TAIR10_protein_lists/TAIR10_pep_20101214
```

## Running the Tool

The required arguments are `--data-root` to specify the directory containing the model and other data, and `--in-file` for the FASTA file. We also specify the output filename and a threshold, which represents a confidence-like score. We set it to 0.3, matching the value used on the website.

```bash
docker run --rm -it -v $(pwd):/mnt \
    deepgoplus --data-root /mnt/data_root --in-file  /mnt/athaliana.fa --out-file /mnt/deepgoplus_result.tsv --threshold 0.3
```
