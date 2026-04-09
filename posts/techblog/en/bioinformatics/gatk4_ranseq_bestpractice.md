---
uuid: 27f1e7bc-f4ba-42ea-bac7-0a06c71362c7
title: GATK4 RNA-seq Best Practice
description: The RNA-seq variant calling pipeline differs slightly from the genomic sequence pipeline. This post documents how to run the best practice workflow in bash.
lang: en
category: techblog
tags:
  - bioinformatics
  - gatk
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

The RNA-seq variant calling pipeline differs slightly from the genomic sequence pipeline. The workflow is largely the same, but there are three key differences:

1. Use STAR two-pass mapping for alignment
2. Apply SplitNCigarReads
3. Skip VQSR processing

These steps are based on the [gatk4-rnaseq-germline-snps-indels](https://github.com/gatk-workflows/gatk4-rnaseq-germline-snps-indels) workflow. Let's walk through them step by step.

## Overall Workflow

The overall workflow is as follows:

1. Prepare required files
2. Map reads to the genome
3. Remove PCR duplicates
4. SplitNCigarReads
5. Calculate and apply BQSR
6. Call variants
7. Convert GVCF to VCF
8. Filter variants

## Environment

GATK provides an official Docker image, so we will use that ([reference](https://gatk.broadinstitute.org/hc/en-us/articles/360035889991--How-to-Run-GATK-in-a-Docker-container)).

```bash
docker pull broadinstitute/gatk:4.1.3.0
docker run --rm -it broadinstitute/gatk:4.1.3.0
```

### 1. Preparing Required Files

We will use hg38 as an example.

The required files are as follows:

- FASTA
- FASTA index (fasta.fai)
- FASTA dictionary (.dict)
- GTF/GFF file (optional)
- STAR index
- Known SNPs

You can download most of these from the Broad Institute's Google Cloud Platform, which provides resources for GATK ([reference](https://gatk.broadinstitute.org/hc/en-us/articles/360035890811-Resource-bundle)). The STAR index is the only one you need to build yourself.

Let's prepare everything.

#### Downloading Required Files

- Homo_sapiens_assembly38.fasta
- Homo_sapiens_assembly38.dict
- Homo_sapiens_assembly38.fasta.fai
- Homo_sapiens_assembly38.dbsnp138.vcf.gz
- Homo_sapiens_assembly38.known_indels.vcf.gz
- Mills_and_1000G_gold_standard.indels.hg38.vcf.gz

Make sure to also download the corresponding idx files for each vcf.gz file.

For the GTF/GFF file, you can download it from UCSC's [TableBrowser](http://genome.ucsc.edu/cgi-bin/hgTables?hgsid=702445431_Sfbmz6yeD2TAoJchOBdnJQOWBi7t&clade=mammal&org=Human&db=hg38&hgta_group=genes&hgta_track=refSeqComposite&hgta_table=0&hgta_regionType=genome&position=chr1%3A11102837-11267747&hgta_outputType=primaryTable&hgta_outFileName=UCSC.hg38.gtf.gz).

##### Creating the FAI File

```bash
samtools faidx genome.fa
```

##### Creating the Dict File

```bash
picard CreateSequenceDictionary R=genome.fa O=genome.dict
```

### 2. Mapping with STAR

#### Preparing the Index

```bash
STAR \
    --runMode genomeGenerate \
    --genomeDir hg38_index \
    --genomeFastaFiles Homo_sapiens_assembly38.fasta \
    --sjdbGTFfile UCSC.hg38.gtf \
```

Including a GFF file when building the index reportedly helps STAR handle intronic regions more effectively. It is not strictly required.

#### Two-Pass Mapping

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

Recent versions of STAR support two-pass mapping simply by setting `twopassMode` to `Basic`. Also, since GATK requires RG tags, we add them here with arbitrary values. The important one is `ID`, so make sure to change it for each sample. We also create an index while we are at it.

### 3. Removing PCR Duplicates

We remove PCR duplicates. Using `picard` is the standard approach. You can also use `samtools markdup`.

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

In CIGAR strings, N represents intronic regions. SplitNCigarReads splits reads at these regions. Adjust `java-options` according to your environment.

```bash
gatk \
    --java-options "-Xms32G -Xmx32G" \
    SplitNCigarReads \
    -R Homo_sapiens_assembly38.fasta \
    -I output_mdedup.bam \
    -O output_split.bam
```

### 5. Calculating and Applying BQSR

First, we recalibrate base quality scores based on known variant data. Then, we apply the recalibrated scores to update the BAM file.

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

### 6. Calling Variants

We use `HaplotypeCaller` to call variants. `HaplotypeCaller` detects variants through the following steps:

1. Identify active regions.
2. Perform local assembly of reads in the active regions using a de Bruijn graph, then detect potential variant sites through pairwise alignment using Smith-Waterman.
3. Finally, perform pairwise alignment of reads at each site using PairHMM to determine the final variant calls.

```bash
gatk --java-options "-Xmx4G" \
    HaplotypeCaller \
    -R Homo_sapiens_assembly38.fasta \
    -I output_recal.bam \
    -ERC GVCF \
    --dbsnp Homo_sapiens_assembly38.dbsnp138.vcf.gz \
    -O output.g.vcf
```

This pipeline outputs a GVCF file. A GVCF file is a variant of the VCF format that includes information about regions where no variants were detected. See [here](https://gatk.broadinstitute.org/hc/en-us/articles/360035531812-GVCF-Genomic-Variant-Call-Format) for details.

### 7. Converting GVCF to VCF

While GVCF files are useful, we typically only need the variant data, so we convert to VCF format.

```bash
gatk --java-options "-Xmx4G" \
    GenotypeGVCFs \
    -R Homo_sapiens_assembly38 \
    -V output.g.vcf \
    -O output.vcf
```

### 8. Filtering Variants

In genomic sequence analysis, variant scores are calculated based on known variant data, and VCF files are filtered using that information. However, for RNA-seq, such data does not exist, so that step is omitted. Instead, we perform hard filtering based solely on the VCF data generated in this pipeline.

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
