---
uuid: fb2efb0b-1ca6-48e5-983d-c425d5783598
title: salmonの出力ファイルをtximportで加工する
description: salmonの出力ファイルquant.sfをtximportでRに読み込み、edgeRやDESeq2でDEG解析するまでの流れと、scaledTPM系統のカウント値の違いについてまとめます。
lang: ja
category: techblog
tags:
  - bioinformatics
  - r
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2026-04-11T00:00:00+00:00"
---

## TL;DR

- salmonの出力 `quant.sf` をRで扱うときは [tximport](https://bioconductor.org/packages/release/bioc/vignettes/tximport/inst/doc/tximport.html) を経由する
- `tximport` オブジェクトの `counts` と `length` をそのままedgeR/DESeq2に渡し、転写産物長をoffsetとして扱うのが下流DEG解析での標準的な方針
- `scaledTPM` / `lengthScaledTPM` / `dtuScaledTPM` は名前に "TPM" とつくがTPMとは別物で、ライブラリサイズ相当にスケールしたcount風の値
- 3'タグRNA-seqなど転写産物長が発現量に影響しないプロトコルでは、length補正を入れずに素のcountを使う

## 前提

- R 4.x、Bioconductor 3.16以降
- `tximport` / `DESeq2` / `edgeR` がインストール済み
- salmonの定量結果（`quant.sf`）が手元にある

記事内のコードはtximport 1.26.x、DESeq2 1.38.x、edgeR 3.40.xで動作確認したものがベースです。

## 背景

salmonやkallistoなどは、速く、正確な発現量の定量ソフトウェアです。しかし、単純なカウントデータと違って、その出力は転写産物単位の疑似カウント（estimated read count）であり、そのまま遺伝子レベルのDEG解析に流すには加工が必要です。tximportはその加工を担うR/Bioconductorパッケージで、salmonの `quant.sf` を読み込んで遺伝子レベルに集計したり、edgeR/DESeq2が期待する形に整えたりできます。

## quant.sf

`quant.sf`はタブ区切りのファイルで、以下の5列を持ちます。

```text
Name    Length  EffectiveLength TPM     NumReads
```

[salmonの公式ドキュメント](https://salmon.readthedocs.io/en/latest/file_formats.html)によると、これらの値は以下のように定義されています。

| 名称            | 定義                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Name            | 転写産物の名前。fastaのヘッダ行                                                                                       |
| Length          | 転写産物の塩基長                                                                                                      |
| EffectiveLength | fragment distributionやsequence-specific、gc-fragment biasなどを考慮した`effective length`。TPMの計算とかに使われる。 |
| TPM             | 正しい意味でのTPM。この値をこの後の解析に使うことが推奨されている                                                     |
| NumReads        | salmonによって転写産物にマップされたリード数                                                                          |

## tximportでファイルを読み込む

以下のように、末尾に `_exp` が付いたディレクトリにsalmonの出力が入っている状況を想定します。

```text
SRRxxxxxx_exp/quant.sf
DRRxxxxxx_exp/quant.sf
```

この場合、次のようにしてtximportに渡すファイルリストを組み立てます。

```r
library(tximport)

# _exp ディレクトリを探して quant.sf への相対パスを作る
salmon.files <- file.path(list.files(".", pattern = "_exp"), "quant.sf")

# このままだとcolnameが "SRR_exp/quant.sf" になるのでサンプル名に置換しておく
names(salmon.files) <- sub("_exp/quant.sf$", "", salmon.files)

# txOut = TRUE で転写産物レベルのまま読み込む
tx.exp <- tximport(salmon.files, type = "salmon", txOut = TRUE)
```

遺伝子レベルに集計するには、転写産物名と遺伝子名を対応させる `tx2gene` データフレームが必要です。本来はGTFや `biomaRt` から作るべきですが、転写産物IDが `ENSTxxxxxxx.1` のようにバージョンサフィックスが付いているだけの場合は、次のような簡易変換で済ませられることもあります。

```r
# 注意: この変換は "ENSTxxxxxxx.1 → ENSTxxxxxxx" のようにバージョンを落とすだけで、
# 本来の transcript → gene 対応ではない。本番解析ではGTFなどから作ること。
tx2gene <- data.frame(
    TXNAME = rownames(tx.exp$counts),
    GENEID = sub("\\..*$", "", rownames(tx.exp$counts))
)

# 遺伝子レベルで直接読み込む
gene.exp <- tximport(salmon.files, type = "salmon", tx2gene = tx2gene)

# すでに読み込んだ転写産物レベルのオブジェクトから集計する場合
gene_from_tx.exp <- summarizeToGene(tx.exp, tx2gene)
```

## tximportオブジェクトの中身とCSVへの書き出し

前節で作った `tx.exp` / `gene.exp` をそのまま使います。tximportオブジェクトの要素は `names()` で確認できます。

```r
names(tx.exp)
## [1] "abundance"           "counts"              "length"
## [4] "countsFromAbundance"
```

それぞれの中身は次のとおりです。

- `abundance`: TPM
- `counts`: 推定リード数（`countsFromAbundance = "no"` のときはsalmonの `NumReads` と一致）
- `length`: 転写産物の長さ。`txOut = TRUE` のときは `EffectiveLength` そのもの。`summarizeToGene()` 後は「サンプルごとの、abundanceで重み付けした平均の転写産物長」になる。DESeq2の `avgTxLength` offsetとして使われる値
- `countsFromAbundance`: `"no"`（デフォルト）/ `"scaledTPM"` / `"lengthScaledTPM"` / `"dtuScaledTPM"` のいずれか

ややこしいのが `scaledTPM` 系統で、名前に "TPM" と付いていますがTPMとは別物です。次のように取得できます。

```r
gene.scaled <- summarizeToGene(tx.exp, tx2gene, countsFromAbundance = "scaledTPM")
scaledTPM <- gene.scaled$counts
```

これは `NumReads` を使わず、abundance（TPM）をライブラリサイズ相当にスケーリングして得られるcount風の値です。単位はcountに近い一方、元がTPMなので通常のTPMとして扱うべきではありません。

それぞれのスケーリング方法は以下のとおりです。

| 名称              | 方法                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `no`              | salmonの `NumReads` をそのまま使う。サンプルごとの合計は元の推定リード数と一致する       |
| `scaledTPM`       | `(TPM / 1e6) × libSize` でライブラリサイズにスケーリング                                 |
| `lengthScaledTPM` | 平均の転写産物長でスケールした後、ライブラリサイズにスケーリング                         |
| `dtuScaledTPM`    | 中央値の転写産物長でスケールした後、ライブラリサイズにスケーリング                       |

`dtuScaledTPM` はDifferential Transcript Usage (DTU) 解析で推奨されるスケーリング方法です（参考: [Bioconductorのサポート投稿](https://support.bioconductor.org/p/119720/)）。これらのスケール済みの値、またはそのままのcountをDifferentially Expressed Gene (DEG) 解析などに用います。

CSVに書き出したい場合は次のようにします。

```r
# count
write.csv(gene.exp$counts, file = "gene_count.csv", row.names = TRUE)

# TPM
write.csv(gene.exp$abundance, file = "gene_tpm.csv", row.names = TRUE)
```

## DEG解析にどう渡すか

3'タグRNA-seqのように転写産物全長をシーケンスしないプロトコルでは、転写産物長に応じた補正がむしろ不適切になるため、`countsFromAbundance` を使わず素のcountをそのまま使います。

一方、通常のfull-length RNA-seqでは、転写産物長をoffsetとして与えた方が良い結果が得られるとされています。下流のDEGツール側もこれを期待しており、tximportの [公式vignette](https://bioconductor.org/packages/release/bioc/vignettes/tximport/inst/doc/tximport.html) にはedgeR/DESeq2/limma-voom向けの受け渡し例が載っています。ここではedgeRとDESeq2のパターンを抜粋します。

### edgeR

公式vignetteのコードをほぼそのまま使っています。`txi` には `tximport(..., countsFromAbundance = "no")` の結果が入っている前提です。

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

DESeq2は `DESeqDataSetFromTximport()` が用意されており、tximportオブジェクトをそのまま渡せます。

```r
library(DESeq2)

txi <- tximport(salmon.files, type = "salmon", tx2gene = tx2gene)

sampleTable <- data.frame(condition = factor(rep(c("A", "B"), each = 3)))
rownames(sampleTable) <- colnames(txi$counts)

dds <- DESeqDataSetFromTximport(txi, sampleTable, ~condition)
dds <- DESeq(dds)
res <- results(dds)
```

`DESeqDataSetFromTximport()` は内部でおおまかに次の処理を実行します（[DESeq2ソース](https://github.com/thelovelab/DESeq2/blob/master/R/AllClasses.R)）。

- `txi$counts` を整数に丸めて `DESeqDataSet` の `counts` にする
- `countsFromAbundance = "no"` の場合は `txi$length` を `avgTxLength` assayとして保持し、DESeq2が内部でsample-specificなoffsetとして使う
- `countsFromAbundance` が `scaledTPM` / `lengthScaledTPM` / `dtuScaledTPM` の場合は、lengthがすでにcountに織り込まれているとみなし、 `avgTxLength` は付けずにcountのみを使う

この挙動から、「CSVに書き出したcountを後からDESeq2に渡したい」場合は、あらかじめ `countsFromAbundance = "lengthScaledTPM"` などを指定してから書き出しておけば、`DESeqDataSetFromMatrix()` で読み込ませても整合が取れます。逆に `"no"` のcountをCSV経由で渡すと `avgTxLength` offsetが失われるため、できればtximportオブジェクトのまま流すのがおすすめです。

## 終わりに

`scaledTPM` 系統は名前に "TPM" と付くために混同しやすいですが、実体はcount風の値という理解でだいたい間違いません。full-length RNA-seqならtximportオブジェクトをそのままedgeR/DESeq2に渡してlengthをoffsetに使う、3'タグRNA-seqなら素のcountで流す、という2パターンを押さえておけば下流に困ることは少ないはずです。

## Reference

- [tximport vignette](https://bioconductor.org/packages/release/bioc/vignettes/tximport/inst/doc/tximport.html)
- [DESeq2 AllClasses.R](https://github.com/thelovelab/DESeq2/blob/master/R/AllClasses.R)
- [dtuScaledTPM vs lengthScaledTPM in DTU analysis](https://support.bioconductor.org/p/119720/)
- [difference among tximport scaledTPM, lengthScaledTPM and the original TPM output by salmon/kallisto](https://support.bioconductor.org/p/84883/)
