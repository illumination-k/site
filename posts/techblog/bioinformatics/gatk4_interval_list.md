---
uuid: 4b7129dc-69f0-4458-ba47-1c8e269c6dcb
title: GATK4をsplit intervalを使って高速化する
description: GATK4は実行に時間がかかるツールですが、マシンパワーさえあればsplit intervalを使って高速化できます。interval listについては日本語文献が見つからなかったのでまとめておきます。
lang: ja
category: techblog
tags:
  - bioinformatics
  - gatk
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

GATK4は実行に時間がかかるツールですが、マシンパワーさえあればsplit intervalを使って高速化できます。split intervalについては日本語文献が見つからなかったのでまとめておきます。Sparkを使った実装も進められているようでうが、まだ全てに対応しているわけではないようです(2020/09/28現在)。

## split intervalディレクトリの作成

まず[picard ScatterIntervalsByNs](https://gatk.broadinstitute.org/hc/en-us/articles/360037430591-ScatterIntervalsByNs-Picard-)を使ってinterval listを作成します。リファレンスゲノムのからインターバルリスト形式のファイルに変換します。ポジションとATGC、Nの数で構成されたファイルです。

```bash
picard ScatterIntervalsByNs REFERENCE=ref.fa OUTPUT_TYPE=ACGT OUTPUT=ref.interval_list
```

次にsplit intervalを作成します。インターバルリストの分割です。最終的にすべての分割されたインターバルは同一の塩基数を持ちます。[gatk4 SplitIntervals](https://gatk.broadinstitute.org/hc/en-us/articles/360036899592-SplitIntervals)を使います。この例では12個に分割しています。

```bash
gatk4 SplitIntervals -R ref.fa -L ref.interval_list --scatter-count 12 -O interval_list_12
```

## split intervalつきのGATK4の実行例

BQSR -> ApplyBQSR -> HaplotypeCallerくらいの実行例を載せておきます。基本的には、`-L`オプションでインターバルリストを指定する、forで分割されたものについて回す、という感じです。あとwaitでちゃんと処理終了を待つ必要があります。

最終的に分割されたvcfを[picard GatherVcfs](https://gatk.broadinstitute.org/hc/en-us/articles/360037422071-GatherVcfs-Picard-)で集めています。

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

## 参考

- [A guide to GATK4
  best practice pipeline
  performance and
  optimization on the IBM
  OpenPOWER system](https://www.ibm.com/downloads/cas/ZJQD0QAL)
