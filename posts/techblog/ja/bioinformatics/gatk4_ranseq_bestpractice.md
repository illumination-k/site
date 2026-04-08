---
uuid: 27f1e7bc-f4ba-42ea-bac7-0a06c71362c7
title: gatk4のRNA-seq bestpractice
description: genomic sequenceと少しRNA-seqのパイプラインは違うので、bestpracticeをbashで実行するメモ
lang: ja
category: techblog
tags:
  - bioinformatics
  - gatk
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

genomic sequenceと少しRNA-seqのパイプラインは違うので、メモを。基本的には一緒なのですが、

1. MappingにSTARのtwo pass Mappingを使用する
2. SplitNCigarReadsを適用する
3. VQSR処理をしない

の3点が異なっています。これらの処理は基本的に[gatk4-rnaseq-germline-snps-indels](https://github.com/gatk-workflows/gatk4-rnaseq-germline-snps-indels)を参考にしています。順番に見ていきます。

## 全体の流れ

全体の流れは以下の通りです。

1. 必要なファイルの準備
2. Genomeへのmapping
3. PCR duplicatesの除去
4. SplitNCigarReads
5. BQSRの計算、適用
6. 変異の検出
7. GVCFからVCFへの変換
8. 変異のフィルター

## 環境

GATKはDockerイメージを公式が配布しているので、それを使います[[参考](https://gatk.broadinstitute.org/hc/en-us/articles/360035889991--How-to-Run-GATK-in-a-Docker-container)]。

```bash
docker pull broadinstitute/gatk:4.1.3.0
docker run --rm -it broadinstitute/gatk:4.1.3.0
```

### 1. 必要なファイルの準備

とりあえずhg38を例に説明します。

必要なファイルは以下の通りです

- fasta
- fastaのインデックス(fasta.fai)
- fastaのdict(.dict)
- gtf/gffファイル(なくてもよい)
- STARのindex
- known SNPs

基本的にはGATKを提供している基本的にBroadInstituteのGoogle Cloud Platformからダウンロードすればいいと思います([参考](https://gatk.broadinstitute.org/hc/en-us/articles/360035890811-Resource-bundle))。STARのindexだけダウンロードできないので自力で作ります。

ということで準備しています。

#### 必要なファイルのダウンロード

- Homo_sapiens_assembly38.fasta
- Homo_sapiens_assembly38.dict
- Homo_sapiens_assembly38.fasta.fai
- Homo_sapiens_assembly38.dbsnp138.vcf.gz
- Homo_sapiens_assembly38.known_indels.vcf.gz
- Mills_and_1000G_gold_standard.indels.hg38.vcf.gz

それとvcf.gzに対応するidxファイルもダウンロードしておきましょう。

また、GTF/GFFファイルはUCSCの[TableBrowser](http://genome.ucsc.edu/cgi-bin/hgTables?hgsid=702445431_Sfbmz6yeD2TAoJchOBdnJQOWBi7t&clade=mammal&org=Human&db=hg38&hgta_group=genes&hgta_track=refSeqComposite&hgta_table=0&hgta_regionType=genome&position=chr1%3A11102837-11267747&hgta_outputType=primaryTable&hgta_outFileName=UCSC.hg38.gtf.gz)あたりからダウンロードしましょう。

##### faiの作成方法

```bash
samtools faidx genome.fa
```

##### dictファイルの作成方法

```bash
picard CreateSequenceDictionary R=genome.fa O=genome.dict
```

### 2. STARを使ったMapping

#### Indexの準備

```bash
STAR \
    --runMode genomeGenerate \
    --genomeDir hg38_index \
    --genomeFastaFiles Homo_sapiens_assembly38.fasta \
    --sjdbGTFfile UCSC.hg38.gtf \
```

indexを作るときにGFFも使うとイントロン領域とかを上手く処理してくれるらしいです。なくても大丈夫です。

#### two pass Mapping

```bash
STAR --twopassMode Basic \
    --genomeDir hg38_index \
    --readFilesCommand "gunzip -c" \
    --readFilesIn input.fastq.gz \
    --outSAMtype BAM SortedByCoordinate \
    --outSAMattrRGline ID:input LB:lib1 PL:illumina SM:input PU:unit3 \
    --outFileNamePrefix output_

samtools index output_Aligned.SortedByCoordinate.out.bam
```

最近のSTARはtwopassModeをBasicにすればtwopassMappingしてくれます。また、GATKを使うためにはRGタグが必要なので適当に付けてます。重要なのはIDだけなので、そこだけサンプルごとに変更しておきましょう。ついでにindexをつけておきます。

### 3. PCR duplicatesの除去

PCR duplicatesを除去します。`picard`を使うのが普通そうです。`samtools markdup`でもできます。

```bash
picard \
    MarkDuplicates \
    I=$output_Aligned.SortedByCoordinate.out.bam \
    O=output_mdedup.bam \
    CREATE_INDEX=true \
    VALIDATION_STRINGENCY=SILENT \
    M=output.metrics
```

### 4. SplitNCigarReads

CigarのNはイントロン領域を意味します。SplitNCigarReadsではその領域でリードを分割してくれます。`java-options`は環境に合わせて設定してください。

```bash
gatk \
    --java-options "-Xms32G -Xmx32G" \
    SplitNCigarReads \
    -R Homo_sapiens_assembly38.fasta \
    -I output_mdedup.bam \
    -O output_split.bam
```

### 5. BQSRの計算、適用

既知の変異データをもとに、塩基スコアの再計算を行います。その後、再計算したスコアをもとにBAMファイルを修正します。

```bash
gatk --java-options "-Xmx4G" \
    BaseRecalibrator \
    -R Homo_sapiens_assembly38.fasta \
    -I output_split.bam \
    --known-sites Homo_sapiens_assembly38.dbsnp138.vcf.gz \
    --known-sites Homo_sapiens_assembly38.known_indels.vcf.gz \
    --known-sites Mills_and_1000G_gold_standard.indels.hg38.vcf.gz
    -O output_recal.table
```

```bash
gatk --java-options "-Xmx4G" \
    ApplyBQSR \
    -R Homo_sapiens_assembly38.fasta \
    -I output_split.bam \
    -bqsr output_recal.table \
    -O output_recal.bam
```

### 6. 変異の検出

`HaplotypeCaller`を使って変異の検出を行います。`HaplotypeCaller`は以下の手順で変異を検出しています。

1. active regionの検出
2. active regionのリードをde Brujin graphでローカルアセンブリしたあと、Smith-Watermanを使用したペアワイズアラインメントで潜在的な変異の場所を検出します。
3. 最後に、PairHMMでそれぞれの場所のリードにペアワイズアラインメントを行い、最終的な変異の場所を決定します。

```bash
gatk --java-options "-Xmx4G" \
    HaplotypeCaller \
    -R Homo_sapiens_assembly38.fasta \
    -I output_recal.bam \
    -ERC GVCF \
    --dbsnp Homo_sapiens_assembly38.dbsnp138.vcf.gz \
    -O output.g.vcf
```

また、このパイプラインではGVCFファイルを出力します。GVCFファイルは変異が検出されなかった領域の情報を含んだVCFファイルの亜種です。詳しくは[こちら](https://gatk.broadinstitute.org/hc/en-us/articles/360035531812-GVCF-Genomic-Variant-Call-Format)を参照してください。

### 7. GVCFからVCFへの変換

GVCFファイルのままでもいいですが、基本的に欲しいのは変異のデータだけなのでVCFフォーマットに変換します。

```bash
gatk --java-options "-Xmx4G" \
    GenotypeGVCFs \
    -R Homo_sapiens_assembly38 \
    -V output.g.vcf \
    -O output.vcf
```

### 8. 変異のフィルタリング

genomic seqeuenceの解析を行う際には、既知変異データをもとに変異スコアを算出し、そのデータを使ってVCFファイルのフィルターを行います。しかし、RNA-seqに関してはそのデータが存在しないのでそのステップが存在しません。単純に今回算出したVCFのデータのみに基づいて、ハードフィルタリングを行います。

```bash
gatk --java-options "-Xmx4G" \
    VariantFiltration \
    -R Homo_sapiens_assembly38.fasta \
    -V output.vcf \
    --window 35 \
    --cluster 3 \
    --filter-name "FS" --filter "FS > 30.0" \
    --filter-name "QD" --filter "QD < 2.0" \
    -O output_filtered.vcf
```
