---
uuid: fb2efb0b-1ca6-48e5-983d-c425d5783598
title: Processing Salmon Output Files with tximport
description: Load Salmon's quant.sf into R via tximport, feed it to edgeR or DESeq2 for DEG analysis, and see how scaledTPM-family values differ from TPM.
lang: en
category: techblog
tags:
  - bioinformatics
  - r
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2026-04-11T00:00:00+00:00"
---

## TL;DR

- Use [tximport](https://bioconductor.org/packages/release/bioc/vignettes/tximport/inst/doc/tximport.html) to load Salmon's `quant.sf` into R
- For downstream DEG analysis, hand the tximport object straight to edgeR/DESeq2 and let transcript length act as an offset — that is the standard path
- `scaledTPM` / `lengthScaledTPM` / `dtuScaledTPM` sound like TPM variants, but they are count-like values scaled to library size; do not treat them as TPM
- For 3'-tagged RNA-seq and similar protocols where transcript length does not track expression, skip the length correction and use the raw counts

## Prerequisites

- R 4.x and Bioconductor 3.16 or later
- `tximport`, `DESeq2`, and `edgeR` installed
- Salmon quantification output (`quant.sf`) on disk

The snippets below were verified against tximport 1.26.x, DESeq2 1.38.x, and edgeR 3.40.x.

## Background

Salmon and kallisto are fast, accurate expression quantifiers. Their output is per-transcript estimated read counts, which need post-processing before gene-level DEG analysis. tximport is the R/Bioconductor package for that step. It reads Salmon's `quant.sf`, aggregates to the gene level, and reshapes the data for edgeR or DESeq2.

## quant.sf

`quant.sf` is a tab-separated file with the following five columns:

```text
Name    Length  EffectiveLength TPM     NumReads
```

According to the [official Salmon docs](https://salmon.readthedocs.io/en/latest/file_formats.html), these values are defined as follows:

| Name            | Definition                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Name            | The transcript name, taken from the FASTA header line                                                                                       |
| Length          | The length of the transcript in bases                                                                                                       |
| EffectiveLength | The `effective length` that accounts for fragment distribution, sequence-specific bias, and gc-fragment bias. Used in TPM calculation, etc. |
| TPM             | TPM in its proper sense. Using this value for downstream analysis is recommended                                                            |
| NumReads        | The number of reads mapped to the transcript by Salmon                                                                                      |

## Reading Files with tximport

Assume Salmon output lives in directories with an `_exp` suffix:

```text
SRRxxxxxx_exp/quant.sf
DRRxxxxxx_exp/quant.sf
```

Build a named file list and pass it to `tximport()`:

```r
library(tximport)

# Find _exp directories and build relative paths to quant.sf
salmon.files <- file.path(list.files(".", pattern = "_exp"), "quant.sf")

# Column names would otherwise be "SRR_exp/quant.sf"; replace with sample names
names(salmon.files) <- sub("_exp/quant.sf$", "", salmon.files)

# txOut = TRUE keeps the data at the transcript level
tx.exp <- tximport(salmon.files, type = "salmon", txOut = TRUE)
```

To aggregate to the gene level you need a `tx2gene` data frame that maps transcript IDs to gene IDs. The proper way is to derive it from a GTF or via `biomaRt`. If your transcript IDs are only decorated with a version suffix such as `ENSTxxxxxxx.1`, the following shortcut sometimes works:

```r
# NOTE: this only strips the "ENSTxxxxxxx.1 -> ENSTxxxxxxx" version suffix —
# it is NOT an actual transcript-to-gene mapping. For real analyses, build
# tx2gene from a GTF.
tx2gene <- data.frame(
    TXNAME = rownames(tx.exp$counts),
    GENEID = sub("\\..*$", "", rownames(tx.exp$counts))
)

# Read directly at the gene level
gene.exp <- tximport(salmon.files, type = "salmon", tx2gene = tx2gene)

# Or aggregate from an already-loaded transcript-level object
gene_from_tx.exp <- summarizeToGene(tx.exp, tx2gene)
```

## Inspecting the tximport Object and Exporting to CSV

We continue with `tx.exp` / `gene.exp` from the previous section. The elements of a tximport object are accessible via `names()`:

```r
names(tx.exp)
## [1] "abundance"           "counts"              "length"
## [4] "countsFromAbundance"
```

The contents are:

- `abundance`: TPM
- `counts`: estimated read counts (equal to Salmon's `NumReads` when `countsFromAbundance = "no"`)
- `length`: transcript length. At `txOut = TRUE` this is the raw `EffectiveLength`. After `summarizeToGene()` it becomes the "per-sample abundance-weighted mean transcript length", which DESeq2 later consumes as the `avgTxLength` offset
- `countsFromAbundance`: one of `"no"` (default), `"scaledTPM"`, `"lengthScaledTPM"`, or `"dtuScaledTPM"`

The `scaledTPM` family is easy to misread. Despite the name, these are not TPM values — they are count-like values:

```r
gene.scaled <- summarizeToGene(tx.exp, tx2gene, countsFromAbundance = "scaledTPM")
scaledTPM <- gene.scaled$counts
```

They are derived from abundance (TPM), not from `NumReads`, and then scaled to library size. The name includes "TPM" because they come from TPM, but they should not be treated as actual TPM values.

The scaling methods are summarized below.

| Name              | Method                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `no`              | Use Salmon's `NumReads` as-is. Per-sample totals match the original estimated read counts |
| `scaledTPM`       | `(TPM / 1e6) × libSize`, i.e. scale TPM to library size                                   |
| `lengthScaledTPM` | Scale by mean transcript length first, then scale to library size                         |
| `dtuScaledTPM`    | Scale by the median transcript length, then scale to library size                         |

`dtuScaledTPM` is the recommended scaling for Differential Transcript Usage (DTU) analysis (see [this Bioconductor support thread](https://support.bioconductor.org/p/119720/)). Either the scaled values or the raw counts feed into Differentially Expressed Gene (DEG) analysis.

To export to CSV:

```r
# count
write.csv(gene.exp$counts, file = "gene_count.csv", row.names = TRUE)

# tpm
write.csv(gene.exp$abundance, file = "gene_tpm.csv", row.names = TRUE)
```

## Handing Off to DEG Analysis

For 3'-tagged RNA-seq and similar protocols that do not cover full transcripts, correcting for transcript length is actively harmful. Use the raw counts and skip `countsFromAbundance`.

For standard full-length RNA-seq, on the other hand, incorporating transcript length as an offset produces better results. The downstream DEG tools expect this, and tximport's [official vignette](https://bioconductor.org/packages/release/bioc/vignettes/tximport/inst/doc/tximport.html) includes example code for edgeR, DESeq2, and limma-voom. The edgeR and DESeq2 patterns are excerpted below.

### edgeR

Almost verbatim from the official vignette. We assume `txi` holds the result of `tximport(..., countsFromAbundance = "no")`.

```r
library(tximport)
library(edgeR)

txi <- tximport(salmon.files, type = "salmon", tx2gene = tx2gene)

cts <- txi$counts
normMat <- txi$length

# Obtaining per-observation scaling factors for length, adjusted to avoid
# changing the magnitude of the counts.
normMat <- normMat / exp(rowMeans(log(normMat)))
normCts <- cts / normMat

# Computing effective library sizes from scaled counts, to account for
# composition biases between samples.
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

DESeq2 ships `DESeqDataSetFromTximport()` so you can hand the tximport object in directly.

```r
library(DESeq2)

txi <- tximport(salmon.files, type = "salmon", tx2gene = tx2gene)

sampleTable <- data.frame(condition = factor(rep(c("A", "B"), each = 3)))
rownames(sampleTable) <- colnames(txi$counts)

dds <- DESeqDataSetFromTximport(txi, sampleTable, ~condition)
dds <- DESeq(dds)
res <- results(dds)
```

Internally, `DESeqDataSetFromTximport()` does roughly the following. The implementation lives in `thelovelab/DESeq2` at `R/AllClasses.R`.

::gh[https://github.com/thelovelab/DESeq2/blob/master/R/AllClasses.R#L408-L425]

- Round `txi$counts` to integers and use them as the `counts` slot of the `DESeqDataSet`
- When `countsFromAbundance = "no"`, store `txi$length` as the `avgTxLength` assay. DESeq2 uses it internally as a sample-specific offset
- When `countsFromAbundance` is `scaledTPM` or `lengthScaledTPM`, the length correction is already baked into the counts. `avgTxLength` is skipped and only the counts are used
- `dtuScaledTPM` is not accepted here. DTU analysis is expected to run through DEXSeq or DRIMSeq instead, so when feeding DESeq2, stop at `lengthScaledTPM`

This has a practical consequence. Say you want to round-trip counts through CSV and feed them into DESeq2 later. Set `countsFromAbundance = "lengthScaledTPM"` (or similar) before writing the CSV. Then `DESeqDataSetFromMatrix()` gives consistent results. Raw `"no"` counts written to CSV lose the `avgTxLength` offset. Keep the tximport object and hand it to DESeq2 directly when possible.

## Wrap-up

The `scaledTPM` family is easy to confuse with real TPM. Treating them as count-like values gets you most of the way there. Remember two patterns. For full-length RNA-seq, pass the tximport object to edgeR or DESeq2 and let transcript length act as an offset. For 3'-tagged RNA-seq, use the raw counts. That is usually enough to stay out of trouble downstream.

## Reference

- [tximport vignette](https://bioconductor.org/packages/release/bioc/vignettes/tximport/inst/doc/tximport.html)
- [DESeq2 AllClasses.R](https://github.com/thelovelab/DESeq2/blob/master/R/AllClasses.R)
- [dtuScaledTPM vs lengthScaledTPM in DTU analysis](https://support.bioconductor.org/p/119720/)
- [difference among tximport scaledTPM, lengthScaledTPM and the original TPM output by salmon/kallisto](https://support.bioconductor.org/p/84883/)
