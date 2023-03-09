---
uuid: be2a3bba-070f-48fc-bcf2-38331e6a633a
title: MUSCLE + trimal + RAxML-ng-mpiを使って最尤法で系統解析
description: 遺伝子の機能や、進化を考察する上でタンパク質を用いた系統解析は重要な解析手法の一つとして知られている。今回は、MUSCLEを用いてマルチプルアラインメントを作成し、非保存領域をTrimAlで除去したあと、RAxMLを用いて最尤法によって系統解析を行う。
lang: ja
category: techblog
tags:
  - bioinformatics
  - phylogeny
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

遺伝子の機能や、進化を考察する上でタンパク質を用いた系統解析は重要な解析手法の一つとして知られている。系統樹を作成する上でよく行われるワークフローは以下のようなものである。

1. Multiple Alignment
2. 保存されていない配列の除去（任意）
3. 系統樹作成

また、よく使われる系統樹の作成方法としては、最節約法、距離行列法、最尤法やベイズ法、最近だとGraph Splitting法などが挙げられる。最も使われているのは最尤法かベイズ法であり、ソフトウェアとしては最尤法ではPhyMLやRAxML、ベイズ法ではMrbayesなどが有名である。今回は、RAxMLを用いて最尤法によって系統解析を行う。

## Workflow

### 1. Multiple Alignment by MUSCLE

[公式サイト](https://drive5.com/muscle/downloads.htm)からバイナリをダウンロードして使用する。デフォルトが一番精度がいいらしいので([参考](https://drive5.com/muscle/manual/accurate.html))、デフォルトパラメーターでアラインメントを作成した。afaという拡張子はalignment fastaの略でMUSCLEのサイトで使われていたので採用した。

`muscle -in seqs.fa -out seqs.afa`

### 2. 保存されていない配列の除去（trimal)

[github](https://github.com/scapella/trimal)からcloneしてmakeする。
Dockerfileを作成した。

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

[マニュアル](http://trimal.cgenomics.org/use_of_the_command_line_trimal_v1.2)によると、`trimal -in seqs.afa -out seqs_trim.afa -automated1`を使うのが最尤法に良いらしい。

### 3. RAxML-ngによる系統解析

RAxMLは最近新しくRAxML-ngというversionが公開されているので、これを使った。Dockerfileを以下のように作成した。mpiを使いたかったので、raxml-ng-mpiをダウンロードして使用している。[github](https://github.com/amkozlov/raxml-ng)のREADMEあたりにある。

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

- --msa alignmentファイル
- --all ML search + bootstrapping
- --model マニュアルを見ると色々あるが今回はLGを選択。
  - +G (discrete GAMMA with 4 categories, mean category rates, ML estimate of alpha)
  - +I (ML estimate)
- --bs-tree Bootstapping num

Bootstrap付きのBestTreeはsupport拡張子のファイル（今回なら`seqs_trim.afa.support`）に保存されています。

## Reference

Edgar, R.C. (2004) MUSCLE: multiple sequence alignment with high accuracy and high throughput Nucleic Acids Res. 32(5):1792-1797

trimAl: a tool for automated alignment trimming in large-scale phylogenetic analyses Salvador Capella-Gutiérrez, José M. Silla-Martínez and Toni Gabaldón∗ Bioinformatics. 2009 Aug 1;25(15):1972-3.

Alexey M. Kozlov, Diego Darriba, Tomáš Flouri, Benoit Morel, and Alexandros Stamatakis (2019) RAxML-NG: A fast, scalable, and user-friendly tool for maximum likelihood phylogenetic inference. Bioinformatics, btz305 doi:10.1093/bioinformatics/btz305
