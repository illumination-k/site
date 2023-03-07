---
uuid: fb2efb0b-1ca6-48e5-983d-c425d5783598
title: salmonの出力ファイルをtximportで加工する
description: salmonの出力ファイルはquant.sfですが、その加工は非常に多岐に渡り、結構難しいです。tximportで加工できる先と用途についてまとめていきたいと思います。
lang: ja
category: techblog
tags:
  - bioinformatics
  - r
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

salmonやkalstoなどは、速く、正確な発現量の定量ソフトウェアです。しかし、単純なカウントデータと違って、その加工と用途は様々です。そこで、salmonの出力ファイルであるquant.sfとその加工ができるtximportについてまとめておきたいと思います。

## quant.sf

`quant.sf`はタブ区切りのファイルです。

```
Name    Length  EffectiveLength TPM     NumReads
```

上の5つの値を持っています。[公式Docs Ver1.40](https://salmon.readthedocs.io/en/latest/file_formats.html)を読むと、これらの値は以下のように定義されています。

| 名称            | 定義                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Name            | 転写産物の名前。fastaのヘッダ行                                                                                       |
| Length          | 転写産物の塩基長                                                                                                      |
| EffectiveLength | fragment distributionやsequence-specific、gc-fragment biasなどを考慮した`effective length`。TPMの計算とかに使われる。 |
| TPM             | 正しい意味でのTPM。この値をこの後の解析に使うことが推奨されている                                                     |
| NumReads        | salmonによって転写産物にマップされたリード数                                                                          |

## tximportでファイルを読み込む

`quant.sf`ファイルを読み込めます。

```bash
ls
# SRRxxxxxx_exp
# DRRxxxxxx_exp
```

のような末尾にexpがついたディレクトリにsalmonの出力が入っているとします。

```r
library(tximport)

# expがついたファイルの読み込み
salmon.files <- file.path(list.files(".", pattern = "_exp"), 'quant.sf')

# このままだとcolnameがSRR_exp/quant.sfになるので置換しておく。
sample_name <- c(gsub("_exp/quant.sf", "", salmon.files))
names(salmon.files) <- sample_name

# txOut=TRUEでTranscriptsレベルで読み込む
tx.exp <- tximport(salmon.files, type = "salmon", txOut = TRUE)

# txOut=FALSE (default) の場合はgeneレベルで読み込まれる
# ただし、転写産物名と遺伝子名を対応させるデータフレームが必要。
# このあたりは臨機応変にする必要がある。TranscriptID = geneID.1みたいな場合を想定。
tx2gene <- data.frame(
    TXNAME = rownames(tx.exp$counts),
    GENEID = sapply(strsplit(rownames(tx.exp$counts), '\\.'), '[', 1)
)

# 直接読み込む
gene.exp <- tximport(salmon.files, type = "salmon", tx2gene = tx2gene)

# Transcripts単位からGene単位にする
gene_from_tx.exp <- summarizeToGene(tx.exp, tx2gene)
```

## tximportされたものの中身をcsv形式で書き出す

workspaceは続いている感じです。
読み込みはできたんですが、目的のものを取り出す操作が必要です。

tximportに何が入っているかは`names(tximportObject)`で確認できます。

```r
names(tx.exp)
## [1] "abundance"           "counts"              "length"
## [4] "countsFromAbundance"
```

中身は

- abundance: TPM
- counts: NumReads
- length: EffectiveLength
- countsFromAbundance: `"no"`, `"scaledTPM"`, `"lengthScaledTPM"` or `"dtuScaledTPM"`

です。`countsFromAbundance`のdefaultは`"no"`です。
面倒な話なのですが、`scaledTPM`、`lengthScaledTPM`、`dtuScaledTPM`はTPMとは別物で、

```r
gene.scaled <- summarizeToGene(tx.exp, tx2gene, countsFromAbundance = "scaledTPM")

scaledTPM <- gene.scaled$counts
```

などのようにして得られるカウント値のようなものです。NumReadsからカウントするのではなく、abundance(この場合はTPM)からカウントして、それをライブラリサイズによってスケーリングしたものです。この場合の`xxxxTPM`はTPM由来ということで、TPMのように扱うのは好ましくないです。

ちなみにですが、それぞれのscale方法は以下です。また、`tximportObject$counts`で得られるものは、サンプルごとにsumをとるとすべてNumReadsの総数と等しくなります。

| 名称              | 方法                                               |
| ----------------- | -------------------------------------------------- |
| `no`              | simplesum                                          |
| `scaledTPM`       | ライブラリサイズに補正                             |
| `lengthScaledTPM` | 転写産物の平均長を補正したライブラリサイズに補正   |
| `dtuScaledTPM`    | 転写産物の中央値長で補正したライブラリサイズに補正 |

また`dtuScaledTPM`はDifferential Transcripts Usage (DTU) 解析のときに最も優れた補正方法らしいです。これらのscaleした値、もしくはそのままのカウントをDifferential Expression Gene (DEG) 解析などには用います。

csvなどで書き出したければ以下のようにすれば良いと思います。

```r
# count
write.csv(gene.exp$counts, file = "gene_count.csv", row.names = TRUE)

# tpm
write.csv(gene.exp$abundance, file = "gene_tpm.csv", row.names = TRUE)
```

## DEG解析の際にどうすればいいのか

3' tagged RNAseqのようなものの場合は、length長を入れるとむしろ補正がかかってよくないので、countFromAbundanceを使わずに、そのままのcount値を入れたほうがいいです。

しかし、普通のfull-transcripts-lengthなRNA-seqでは転写産物の長さを補正したほうがいい結果が得られるらしいです。

ここからは[公式doc](https://bioconductor.org/packages/devel/bioc/vignettes/tximport/inst/doc/tximport.html#Do)のコードを少しだけ改変したものをメモ用に貼っておきます。

### edgeR

```r
cts <- txi$counts
normMat <- txi$length

# Obtaining per-observation scaling factors for length, adjusted to avoid
# changing the magnitude of the counts.
normMat <- normMat/exp(rowMeans(log(normMat)))
normCts <- cts/normMat

# Computing effective library sizes from scaled counts, to account for
# composition biases between samples.
library(edgeR)
eff.lib <- calcNormFactors(normCts) * colSums(normCts)

# Combining effective library sizes with the length factors, and calculating
# offsets for a log-link GLM.
normMat <- sweep(normMat, 2, eff.lib, "*")
normMat <- log(normMat)

# Creating a DGEList object for use in edgeR.
y <- DGEList(cts)
y <- scaleOffset(y, normMat)
# filtering
keep <- filterByExpr(y)
```

### DESeq2

```r
library(DESeq2)

sampleTable <- data.frame(condition = factor(rep(c("A", "B"), each = 3)))
rownames(sampleTable) <- colnames(txi$counts)

dds <- DESeqDataSetFromTximport(txi, sampleTable, ~condition)
dds <- DESeq(dds)
res <- results(dds)
```

DESeq2の`DESeqDataSetFromTximport`を読むと

```r
DESeqDataSetFromTximport <- function(txi, colData, design, ...) 
{
  stopifnot(is(txi, "list"))
  counts <- round(txi$counts)
  mode(counts) <- "integer"
  object <- DESeqDataSetFromMatrix(countData=counts, colData=colData, design=design, ...)
  stopifnot(txi$countsFromAbundance %in% c("no","scaledTPM","lengthScaledTPM"))
  if (txi$countsFromAbundance %in% c("scaledTPM","lengthScaledTPM")) {
    message("using just counts from tximport")
  } else {
    message("using counts and average transcript lengths from tximport")
    lengths <- txi$length
    stopifnot(all(lengths > 0))
    dimnames(lengths) <- dimnames(object)
    assays(object)[["avgTxLength"]] <- lengths
  }
  return(object)
}
```

なので、`countAbundance = "scaledTPM"`とかならcsvとかにした後そのまま読み込ませても良さそう。

## 感想

`scaledTPM`系列ががややこしい。

limma-voomって使ったことないんですけどどういうメリットがあるんですかね。

## Reference

- [tximport](https://bioconductor.org/packages/devel/bioc/vignettes/tximport/inst/doc/tximport.html#Do)
- [DESeq2](https://github.com/mikelove/DESeq2/blob/master/R/AllClasses.R)
- [dtuScaledTPM vs lengthScaledTPM in DTU analysis](https://support.bioconductor.org/p/119720/)
- [difference among tximport scaledTPM, lengthScaledTPM and the original TPM output by salmon/kallisto](https://support.bioconductor.org/p/84883/)
