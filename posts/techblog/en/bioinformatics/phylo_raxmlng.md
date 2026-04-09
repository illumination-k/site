---
uuid: be2a3bba-070f-48fc-bcf2-38331e6a633a
title: Phylogenetic Analysis Using Maximum Likelihood with MUSCLE + trimAl + RAxML-ng-mpi
description: Protein-based phylogenetic analysis is a well-known and important method for studying gene function and evolution. In this post, we create a multiple alignment using MUSCLE, remove non-conserved regions with trimAl, and then perform phylogenetic analysis using the maximum likelihood method with RAxML.
lang: en
category: techblog
tags:
  - bioinformatics
  - phylogeny
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Protein-based phylogenetic analysis is a well-known and important method for studying gene function and evolution. A commonly used workflow for constructing phylogenetic trees is as follows:

1. Multiple Alignment
2. Removal of non-conserved sequences (optional)
3. Phylogenetic tree construction

Common methods for constructing phylogenetic trees include maximum parsimony, distance matrix methods, maximum likelihood, Bayesian methods, and more recently, the Graph Splitting method. The most widely used methods are maximum likelihood and Bayesian inference. Well-known software includes PhyML and RAxML for maximum likelihood, and MrBayes for Bayesian methods. In this post, we will use RAxML to perform phylogenetic analysis using the maximum likelihood method.

## Workflow

### 1. Multiple Alignment by MUSCLE

Download the binary from the [official website](https://drive5.com/muscle/downloads.htm) and use it. Since the default settings reportedly provide the best accuracy ([reference](https://drive5.com/muscle/manual/accurate.html)), we created the alignment with default parameters. The `.afa` extension stands for "alignment FASTA" and was adopted because it is used on the MUSCLE website.

`muscle -in seqs.fa -out seqs.afa`

### 2. Removal of Non-conserved Sequences (trimAl)

Clone from [GitHub](https://github.com/scapella/trimal) and build with make.
A Dockerfile was created as follows:

```docker
FROM debian

RUN apt-get update && \
    apt-get install -y git build-essential pkg-config make && \
    apt-get -qq -y autoremove && \
    apt-get autoclean && \
    rm -rf /var/lib/apt/lists/* /var/log/dpkg.log && \
    mkdir -p /workspace /local_volume

WORKDIR /workspace

RUN git clone https://github.com/scapella/trimal.git

WORKDIR /workspace/trimal/source

RUN make

WORKDIR /local_volume

ENV PATH=/workspace/trimal/source:$PATH
```

According to the [manual](http://trimal.cgenomics.org/use_of_the_command_line_trimal_v1.2), using `trimal -in seqs.afa -out seqs_trim.afa -automated1` is recommended for maximum likelihood analysis.

### 3. Phylogenetic Analysis with RAxML-ng

A newer version of RAxML called RAxML-ng has been recently released, so we used it. The Dockerfile was created as follows. Since we wanted to use MPI, we downloaded and used raxml-ng-mpi. It can be found around the README on [GitHub](https://github.com/amkozlov/raxml-ng).

```docker
FROM debian

RUN apt-get update && \
    apt-get install -y wget unzip build-essential pkg-config make gcc cmake openmpi-doc openmpi-bin libopenmpi-dev && \
    apt-get -qq -y autoremove && \
    apt-get autoclean && \
    rm -rf /var/lib/apt/lists/* /var/log/dpkg.log && \
    mkdir -p /workspace

WORKDIR /workspace

RUN wget https://github.com/amkozlov/raxml-ng/releases/download/0.9.0/raxml-ng_v0.9.0_linux_x86_64_MPI.zip && \
    unzip raxml-ng_v0.9.0_linux_x86_64_MPI.zip

RUN bash install.sh

ENV PATH=/workspace/bin:$PATH

RUN mkdir -p /local_volume
WORKDIR /local_volume
```

`raxml-ng-mpi --msa seqs_trim.afa --all --model LG+G+I --bs-trees 100 --threads 8`

- --msa: alignment file
- --all: ML search + bootstrapping
- --model: there are many options in the manual, but LG was chosen for this analysis.
  - +G (discrete GAMMA with 4 categories, mean category rates, ML estimate of alpha)
  - +I (ML estimate)
- --bs-trees: number of bootstrap replicates

The best tree with bootstrap support values is saved in the file with the `.support` extension (in this case, `seqs_trim.afa.support`).

## Reference

Edgar, R.C. (2004) MUSCLE: multiple sequence alignment with high accuracy and high throughput Nucleic Acids Res. 32(5):1792-1797

trimAl: a tool for automated alignment trimming in large-scale phylogenetic analyses Salvador Capella-Gutiérrez, José M. Silla-Martínez and Toni Gabaldón∗ Bioinformatics. 2009 Aug 1;25(15):1972-3.

Alexey M. Kozlov, Diego Darriba, Tomáš Flouri, Benoit Morel, and Alexandros Stamatakis (2019) RAxML-NG: A fast, scalable, and user-friendly tool for maximum likelihood phylogenetic inference. Bioinformatics, btz305 doi:10.1093/bioinformatics/btz305
