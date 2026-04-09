---
uuid: 4b7129dc-69f0-4458-ba47-1c8e269c6dcb
title: Speeding Up GATK4 with Split Intervals
description: GATK4 is a time-consuming tool, but with enough compute power you can speed it up using split intervals. This post summarizes how to work with interval lists.
lang: en
category: techblog
tags:
  - bioinformatics
  - gatk
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

GATK4 is a time-consuming tool, but with enough compute power you can speed it up using split intervals. This post summarizes how to create and use split intervals. A Spark-based implementation is also under development, but it does not yet cover all tools (as of 2020/09/28).

## Creating a Split Interval Directory

First, use [picard ScatterIntervalsByNs](https://gatk.broadinstitute.org/hc/en-us/articles/360037430591-ScatterIntervalsByNs-Picard-) to create an interval list. This converts a reference genome into an interval list file consisting of positions and counts of ATGC and N bases.

```bash
picard ScatterIntervalsByNs REFERENCE=ref.fa OUTPUT_TYPE=ACGT OUTPUT=ref.interval_list
```

Next, create the split intervals. This splits the interval list so that each resulting interval ultimately contains the same number of bases. Use [gatk4 SplitIntervals](https://gatk.broadinstitute.org/hc/en-us/articles/360036899592-SplitIntervals) for this. In the example below, we split into 12 intervals.

```bash
gatk4 SplitIntervals -R ref.fa -L ref.interval_list --scatter-count 12 -O interval_list_12
```

## Running GATK4 with Split Intervals

Here is an example workflow covering BQSR -> ApplyBQSR -> HaplotypeCaller. The basic idea is to specify the interval list with the `-L` option and loop over the split intervals using a `for` loop. You also need to use `wait` to ensure all background processes finish before proceeding.

Finally, the split VCFs are gathered using [picard GatherVcfs](https://gatk.broadinstitute.org/hc/en-us/articles/360037422071-GatherVcfs-Picard-).

```bash
ref=/path/to/fasta
ref_dir=/path/to/interval_list_12
basename=your_file_basename

for i in `seq -f '%04g' 0 11`; do
    outfile=${basename}_recal_data_$i.table
    gatk --java-options "-Xmx4G" \
        BaseRecalibrator \
        -L $ref_dir/interval_list_12/${i}-scattered.interval_list \
        -R $ref \
        -I ${basename}.bam \
        --known-sites /path/to/known.vcf \
        -O $outfile &
done
wait

for i in `seq -f '%04g' 0 11`; do
    bqfile=${basename}_recal_data_$i.table
    output=${basename}_recal_$i.bam
    gatk --java-options "-Xmx4G" \
        ApplyBQSR \
        -L $ref_dir/interval_list_12/${i}-scattered.interval_list \
        -R $ref \
        -I ${basename}.bam \
        -bqsr $bqfile \
        -O $output &
done
wait

for i in `seq -f '%04g' 0 11`; do
    infile=${basename}_recal_$i.bam
    outfile=${basename}_$i.g.vcf
    gatk --java-options "-Xmx4G" \
        HaplotypeCaller \
        -L $ref_dir/interval_list_12/${i}-scattered.interval_list \
        -R $ref \
        -I $infile \
        -ERC GVCF \
        -O $outfile &
done
wait

for i in `seq -f '%04g' 0 11`; do
    infile=${basename}_$i.g.vcf
    gatk --java-options "-Xmx4G" \
        GenotypeGVCFs \
        -L $ref_dir/interval_list_12/${i}-scattered.interval_list \
        -R $ref \
        -V $infile \
        -O ${basename}_$i.vcf &
done
wait

in_vcfs=`echo $(ls ${basename}_00*.vcf | grep -v ".g.vcf") | sed -e 's/ / I=/g'`

picard \
    GatherVcfs \
    R=$ref \
    I=$in_vcfs \
    O=$basename.vcf
```

## References

- [A guide to GATK4
  best practice pipeline
  performance and
  optimization on the IBM
  OpenPOWER system](https://www.ibm.com/downloads/cas/ZJQD0QAL)
