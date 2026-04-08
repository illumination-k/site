---
uuid: fb2efb0b-1ca6-48e5-983d-c425d5783598
title: Processing Salmon Output Files with tximport
description: Salmon's output file is quant.sf, and processing it can be quite complex with many possible approaches. This article summarizes the various output formats and use cases available through tximport.
lang: en
category: techblog
tags:
  - bioinformatics
  - r
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Tools like Salmon and Kallisto are fast and accurate expression quantification software. However, unlike simple count data, the processing and use cases for their output are diverse. This article summarizes Salmon's output file quant.sf and how to process it using tximport.

## quant.sf

`quant.sf` is a tab-separated file with the following five columns:

```
Name    Length  EffectiveLength TPM     NumReads
```

According to the [official docs (Ver 1.40)](https://salmon.readthedocs.io/en/latest/file_formats.html), these values are defined as follows:

| Name            | Definition                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Name            | The transcript name, taken from the FASTA header line                                                                 |
| Length          | The length of the transcript in bases                                                                                 |
| EffectiveLength | The `effective length` that accounts for fragment distribution, sequence-specific bias, and gc-fragment bias. Used in TPM calculation, etc. |
| TPM             | TPM in its proper sense. Using this value for downstream analysis is recommended                                      |
| NumReads        | The number of reads mapped to the transcript by Salmon                                                                |

## Reading Files with tximport

You can read `quant.sf` files with tximport.

Suppose the Salmon output is stored in directories with an `_exp` suffix:

```bash
ls
# SRRxxxxxx_exp
# DRRxxxxxx_exp
```

```r
library(tximport)

# Read files with the _exp suffix
salmon.files <- file.path(list.files(".", pattern = "_exp"), 'quant.sf')

# The column names would be SRR_exp/quant.sf by default, so replace them
sample_name <- c(gsub("_exp/quant.sf", "", salmon.files))
names(salmon.files) <- sample_name

# txOut=TRUE reads at the transcript level
tx.exp <- tximport(salmon.files, type = "salmon", txOut = TRUE)

# txOut=FALSE (default) reads at the gene level
# However, a data frame mapping transcript names to gene names is required.
# This needs to be adapted case by case. Here we assume TranscriptID = geneID.1 format.
tx2gene <- data.frame(
    TXNAME = rownames(tx.exp$counts),
    GENEID = sapply(strsplit(rownames(tx.exp$counts), '\\.'), '[', 1)
)

# Read directly at the gene level
gene.exp <- tximport(salmon.files, type = "salmon", tx2gene = tx2gene)

# Convert from transcript-level to gene-level
gene_from_tx.exp <- summarizeToGene(tx.exp, tx2gene)
```

## Exporting tximport Contents to CSV

Continuing from the workspace above.
While the data has been loaded, you need to extract the desired components.

You can check what is inside a tximport object with `names(tximportObject)`:

```r
names(tx.exp)
## [1] "abundance"           "counts"              "length"
## [4] "countsFromAbundance"
```

The contents are:

- abundance: TPM
- counts: NumReads
- length: EffectiveLength
- countsFromAbundance: `"no"`, `"scaledTPM"`, `"lengthScaledTPM"` or `"dtuScaledTPM"`

The default for `countsFromAbundance` is `"no"`.
To complicate matters, `scaledTPM`, `lengthScaledTPM`, and `dtuScaledTPM` are different from TPM. They are count-like values obtained as follows:

```r
gene.scaled <- summarizeToGene(tx.exp, tx2gene, countsFromAbundance = "scaledTPM")

scaledTPM <- gene.scaled$counts
```

Instead of counting from NumReads, these values are computed from the abundance (TPM in this case) and then scaled by library size. The `xxxxTPM` name indicates TPM-derived values, and treating them as actual TPM values is not appropriate.

For reference, the scaling methods are as follows. Also, for each sample, the sum of `tximportObject$counts` equals the total NumReads.

| Name              | Method                                                    |
| ----------------- | --------------------------------------------------------- |
| `no`              | simple sum                                                |
| `scaledTPM`       | scaled by library size                                    |
| `lengthScaledTPM` | scaled by library size adjusted for mean transcript length |
| `dtuScaledTPM`    | scaled by library size adjusted for median transcript length |

`dtuScaledTPM` is reportedly the best scaling method for Differential Transcript Usage (DTU) analysis. These scaled values, or the raw counts, are used for Differential Expression Gene (DEG) analysis and similar analyses.

To export as CSV:

```r
# count
write.csv(gene.exp$counts, file = "gene_count.csv", row.names = TRUE)

# tpm
write.csv(gene.exp$abundance, file = "gene_tpm.csv", row.names = TRUE)
```

## How to Handle DEG Analysis

For 3' tagged RNA-seq, incorporating transcript length would actually introduce an unwanted correction, so it is better to use the raw count values without countsFromAbundance.

However, for standard full-transcript-length RNA-seq, correcting for transcript length reportedly yields better results.

Below are slightly modified versions of code from the [official docs](https://bioconductor.org/packages/devel/bioc/vignettes/tximport/inst/doc/tximport.html#Do), kept here as a reference.

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

Looking at DESeq2's `DESeqDataSetFromTximport`:

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

So, if you use `countAbundance = "scaledTPM"`, it should be fine to export to CSV and then load it directly.

## Thoughts

The `scaledTPM` variants are confusing.

I have never used limma-voom -- I wonder what advantages it offers.

## Reference

- [tximport](https://bioconductor.org/packages/devel/bioc/vignettes/tximport/inst/doc/tximport.html#Do)
- [DESeq2](https://github.com/mikelove/DESeq2/blob/master/R/AllClasses.R)
- [dtuScaledTPM vs lengthScaledTPM in DTU analysis](https://support.bioconductor.org/p/119720/)
- [difference among tximport scaledTPM, lengthScaledTPM and the original TPM output by salmon/kallisto](https://support.bioconductor.org/p/84883/)
