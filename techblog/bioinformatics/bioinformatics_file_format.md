---
uuid: da91fbca-0240-45b9-b299-faddaae28346
title: Bioinformaticsで使うファイルフォーマットまとめ
description: バイオインフォマティクスをしていて、障壁になることの1つにファイルフォーマットが多すぎる、という問題があると思います。ツールを動かそうとするとこれとこれとこれが必要となって、どうやってこの形式のファイルを作ればいいんだ？ということはよくあります。備忘録を兼ねて、よく使うフォーマットと関連するツールについてまとめておきます。
lang: ja
category: techblog
tags:
  - bioinformatics
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-06-12T15:55:38+00:00"
---

## TL;DR

バイオインフォマティクスをしていて、障壁になることの1つにファイルフォーマットが多すぎる、という問題があります。ツールを動かそうとすると出現するフォーマットが多く、どうやってこの形式のファイルを作ればいいんだということはよくあります。備忘録を兼ねて、よく使うフォーマットと関連するツールについてまとめておきます。基本的なフォーマットは網羅してるはずですが、また新しいフォーマットとかに出会えば追記していきます。

## よく使うファイルフォーマット一覧

- fasta
- fastq
- sam/bam
- bed
- gtf/gff
- wig/bigwig
- vcf/gvcf

### fasta

いろんな場面で使いますが多分一番最初に見ること人が多いファイルフォーマットです。
`>`で始まるID行と、配列データそのものを保存する行に分かれています。配列行では改行が許されています。配列行ではIUB/IUPACで規定されている塩基配列コードとアミノ酸コードを使用できます。詳しくは[Wikipedia](https://ja.wikipedia.org/wiki/FASTA)とかを参照してください。

#### fasta sample

例としては、以下のようなフォーマットになります。

```fasta
>gi|5524211|gb|AAD44166.1| cytochrome b [Elephas maximus maximus]
LCLYTHIGRNIYYGSYLYSETWNTGIMLLLITMATAFMGYVLPWGQMSFWGATVITNLFSAIPYIGTNLV
EWIWGGFSVDKATLNRFFAFHFILPFTMVALAGVHLTFLHETGSNNPLGLTSDSDKIPFHPYYTIKDFLG
LLILILLLLLLALLSPDMLGDPDNHMPADPLNTPLHIKPEWYFLFAYAILRSVPNKLGGVLALFLSIVIL
GLMPFLHTSKHRSMMLRPLSQALFWTLTMDLLTLTWIGSQPVEYPYTIIGQMASILYFSIILAFLPIAGX
IENY
```

使い道としては、

- blastdbの作成
- マルチプルアラインメントの作成
- 系統解析
- bowtie2やSTARなどのmapping toolのインデックスの作成
- bedファイルなどから配列データへのアクセス

などが主な使い道でしょうか。

#### fastaフォーマットを扱うツール

| tool name                                              | description                                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| [seqkit](https://bioinf.shenwei.me/seqkit/)            | 基本的になんでもできる。golang で書かれていて、マルチスレッドにも対応しており高速 |
| [samtools](http://samtools.sourceforge.net)            | faidxの作成とか、sam/bamをfastaに変換したりなど                                   |
| [picard](https://broadinstitute.github.io/picard/)     | dictの作成                                                                        |
| [bedtools](https://bedtools.readthedocs.io/en/latest/) | bedの情報から配列を抜くときなどに使う                                             |

### fastq

NGS解析で一番最初に作成されるファイルフォーマット。厳密には画像データが一次データですが、多分シーケンサーを持っていてそこからデータを直接扱っていない限りはこれ以前のファイルは見ないんじゃないんでしょうか。

fastqファイルには、NGSで読まれたリードの名前を示す`@`から始まるヘッダ行、配列、配列のクオリティが記載されています。また、配列と配列クオリティを分けるために`+`から始まるヘッダ行が配列と配列クオリティの間に置かれています。fastaフォーマットとは違い、配列、配列クオリティ行内では改行が許されていません。

#### fastq sample

例えばNCBIのSRAに存在するfastqは以下のようなフォーマットになります。

```fastq
@SRR001666.1 071112_SLXA-EAS1_s_7:5:1:817:345 length=36
GGGTGATGGCCGCTGCCGATGGCGTCAAATCCCACC
+SRR001666.1 071112_SLXA-EAS1_s_7:5:1:817:345 length=36
IIIIIIIIIIIIIIIIIIIIIIIIIIIIII9IG9IC
```

配列には、`AGCTN`のみが許されており、配列クオリティには、Phredクオリティスコア（下の式）というものが使われています。基本的に高いほどシーケンサーのエラーである可能性が低いです。最近のバージョンではサンガーの式が使われていますが、[Wikipedia](https://ja.wikipedia.org/wiki/Fastq)によるとオッズ比などが使われていることもあるそうです。実際には数字ではなくASCIIコードで33から126の文字としてエンコーディングされます。このエンコーディングはSAM/BAMフォーマットでも共通のものです。

$$Q = -10log_{10}p$$

このファイルフォーマットはクオリティコントロール程度にしか使われず、基本的にはSAM/BAMに変換してから扱うことが多い印象です。最近ではRNA-seqなどにはSAM/BAMを介さずそのまま発現量測定などをすることもあります。

#### クオリティコントロールツール

クオリティコントロールには以下のようなツールがよくつかわれている気がします。他にもいろいろあります。

- [fastQC](https://www.bioinformatics.babraham.ac.uk/projects/fastqc/)
- [fastp](https://github.com/OpenGene/fastp)
- [Trimmomatic](http://www.usadellab.org/cms/?page=trimmomatic)

#### マッピング・定量ツール (fastq -> SAM/BAM)

SAM/BAMに変換する際には、以下のようなMapping Toolが使われていることが多いように思えます。RNA-seqの際にはイントロン等を考慮する必要があるので、DNAを読むときとは別に処理が必要になり、専用のMapping Toolを使う必要があります。Bisulfite SequenceなどはDNAですが、処理が特殊なので専用のMapping Toolが必要です。

##### bulk NGS sequence

| tool name                                                              | description                                                                                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [bwa](http://bio-bwa.sourceforge.net)                                  | Whole Genome Sequence, ChiP-Seq, ATAC-seq etc.,                                                                      |
| [bowtie2](http://bowtie-bio.sourceforge.net/bowtie2/index.shtml)       | Whole Genome Sequence, Chip-Seq, ATAC-seq etc.,                                                                      |
| [hisat2](http://daehwankimlab.github.io/hisat2/)                       | RNA-seq、STARと比べると省メモリ                                                                                      |
| [STAR](https://github.com/alexdobin/STAR)                              | RNA-seq、メモリが結構必要、gatkなどの変異検出の際には推奨されている。quantmodeが存在し、発現量の定量も行ってくれる。 |
| [Bismark](https://www.bioinformatics.babraham.ac.uk/projects/bismark/) | Bisulfite Sequence                                                                                                   |

その他にリードの分割やダウンサンプリングなどを行いたい場合にはfastaで紹介したような[seqkit](https://bioinf.shenwei.me/seqkit/)などが有用です。マージは`cat`とかでいいです。小ネタとして`gzip`形式のものでもcatでマージできます。

bulkのRNA-seqでは以下のようなツールでSAM/BAMを介さずそのまま発現量テーブルを作成でます。また、これらのツールのほうが精度は高いらしいです。

| tool name | description                                              |
| --------- | -------------------------------------------------------- |
| salmon    | 高精度、高速をウリにしています。個人的によく使ってます。 |
| kalisto   | Salmonと一緒です。いまいち違いは分かっていません。       |

この辺はCSVとかわかりやすい形式ではなく、よくわからない形式で出力されるのでR packageの[tximport](https://bioconductor.org/packages/release/bioc/html/tximport.html)などを使ってテーブル形式に変換します。変換の仕方などは[こちら](https://bi.biopapyrus.jp/rnaseq/analysis/de-analysis/tximport.html)が参考になります。

##### scRNA-seq

scRNA-seqを扱う場合には、それ専用のツールがまたいろいろありますが、代表的なものとしては以下のようなものがあります。

| tool name                                                                                                               | description                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [UMI-tools](https://github.com/CGATOxford/UMI-tools)                                                                    | もともとはUMIを扱うために作られたツール。正規表現でバーコードを扱うので、基本的になんでも扱える。MappingなどはSTARなど他のツールを使って行う必要がある。drop-seqとかsmart-seqとかのときに使えます。 |
| [kalisto](https://pachterlab.github.io/kallisto/singlecell.html)                                                        | bulkのRNA-seq解析でも使うツール。scRNA-seqも扱えるらしい                                                                                                                                            |
| [Alevin](https://salmon.readthedocs.io/en/latest/alevin.html)                                                           | Salmonの開発元が提供しているscRNA-seqのための発現量定量ツール。UMI-Toolsよりはこっちが推奨されている                                                                                                |
| [STAR-solo](https://f1000research.com/posters/8-1896)                                                                   | STARの開発元が提供しているscRNA-seqのためのMapping Tool。Cellrangerと同一のアルゴリズムを使っていてCellRangerよりかなり早いらしい。                                                                 |
| [cellranger](https://support.10xgenomics.com/single-cell-gene-expression/software/pipelines/latest/what-is-cell-ranger) | 10x Genomicsが提供しているツール。基本的に全部やってくれる。                                                                                                                                        |

##### miRNA-seq

miRNAの定量はイントロンとかないのでDNAと同じ感じでもいいのですが、isomirみたいな概念もあり、なんか色々ツールがあったりします。BAMとかじゃなくて独自形式に変換されていくものが多いです。独自形式を統一するための概念としてmirGFFというものが提案されていますが、かなり未成熟な印象があります。詳しくはmirGFF formatのところで書きます。

TCGAとかで扱われているmiRNA-seq解析はまた別の[パイプライン](https://github.com/bcgsc/mirna)が使われていたりします。

### SAM/BAM/CRAM

マッピングを行ったあと扱うようになるファイルフォーマットです。BAMはSAMをバイナリ化したものでフォーマットとしては同一です。CRAMはfasta情報を使って更に圧縮率を上げることができるフォーマットです。あまりSAMのまま扱うことはなく、BAM/CRAMに変換されることが多いです。リードのヘッダ、配列、クオリティ、マッピング位置などほぼすべての情報が格納されている。情報が膨大なので、フォーマットの詳細は[マニュアル](https://samtools.github.io/hts-specs/SAMv1.pdf)を読んでほしいです。マニュアル以外の有用そうなリンクをまとめておきます。

#### SAM sample

例としてはこんな感じです。`@`から始まるヘッダ行とリードの情報が格納されているボディ部分に分かれています。

```sam
@HD VN:1.6 SO:coordinate
@SQ SN:ref LN:45
r001 99 ref 7 30 8M2I4M1D3M = 37 39 TTAGATAAAGGATACTG *
r002 0 ref 9 30 3S6M1P1I4M * 0 0 AAAAGATAAGGATA *
r003 0 ref 9 30 5S6M * 0 0 GCCTAAGCTAA * SA:Z:ref,29,-,6H5M,17,0;
r004 0 ref 16 30 6M14N5M * 0 0 ATAGCTTCAGC *
r003 2064 ref 29 17 6H5M * 0 0 TAGGC * SA:Z:ref,9,+,5S6M,30,1;
r001 147 ref 37 30 9M = 7 -39 CAGCGGCAT * NM:i:1
```

#### マニュアル以外の有用そうなリンク

- [SAM Formatのcigar列の読み方(samtoolsとか)](https://linux-bio.com/sam_format_cigar/)
- [SamファイルのCIGAR string, MD tagから変異(mismatch&indels)を取得する](https://qiita.com/usuyama/items/2338cb7f75aa9407a1c2)
- [Explain SAM Flags - GitHub Pages](https://broadinstitute.github.io/picard/explain-flags.html)
- [Strand-specific アラインメントの分割](https://bi.biopapyrus.jp/rnaseq/expression/split-strand-specific-reads.html)

#### 基本操作

基本的には[samtools](http://www.htslib.org/doc/samtools.html)を使えばたいていのことはできます。[picard](https://broadinstitute.github.io/picard/)なども有用です。

#### 可視化

どんなふうにリードが貼りついているのか、などを確認するのはクオリティコントロールなどの観点から重要です。[IGV](http://software.broadinstitute.org/software/igv/)を使えば簡単に可視化できます。IGVは後述するGFF/GFTやbed、wig/bigwig、bedgraphなども可視化できるのでとりあえずインストールしておくべきツールです。

#### クオリティコントロール

duplicate readの除去や、マッピングクオリティによるフィルターなどを行うことがあります。基本的には先ほど上げたツールを使えば問題ないですが、少し複雑なフィルターがしたい時などには、`deeptools`の[alignmentSieveコマンド](https://deeptools.readthedocs.io/en/develop/content/tools/alignmentSieve.html)が便利です。フラグメントサイズによるフィルターやStrand Specificなリードの抽出などを行えます。あとは[bamUtils](https://github.com/statgen/bamUtil)を使えばリードのトリミングとかができます。

#### 発現量の定量 (bam -> csv etc.,)

RNA-seqを行った後に行う代表的な解析は、発現量の定量です。ツールとしては色々ありますが、代表的そうなものを紹介します。cuffdiffなんかは有名ですが使用は推奨されていないようです。

| tool name                                                                                         | description                                                                                                                                           |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [featureCount](http://subread.sourceforge.net)                                                    | GFF/GFTデータをもとにカウントしてくれます。最近kalistoの作者が推奨しないツイートをしたみたいなのを聞いたのですが、ソースがあれば教えてください        |
| [RSEM](https://github.com/deweylab/RSEM)                                                          | bowtie2とSTARを使ってカウントまでやってくれます。BAMも出力するのですが、入れるべき場所がわからなかったのでここで紹介しておきます。GFF/GTFが必要です。 |
| [salmon](https://salmon.readthedocs.io/en/latest/salmon.html#quantifying-in-alignment-based-mode) | alginment based modeを使えばbamからカウントもできます。fastaが必要です。                                                                              |

#### 遺伝子アノテーション (bam -> gff/gtf)

#### 変異の検出 (bam -> vcf)

SAM/BAMフォーマットからVariant Call Format(VCF)に変換するステップと考えてもいいです。基本的にはSNVの検出を想定しており、SVなどは考慮していません。よく使われていそうなツールは以下のようなものがあります。

| tool name                                                    | description                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| [bcftools](http://samtools.github.io/bcftools/bcftools.html) | mpileupコマンドでSNVの検出ができます。BAQ補正をすることでFPが出にくいらしいです |
| [freebayes](https://github.com/ekg/freebayes)                | 使ったことがないのですが、ベイズ推定してるはずです。GATKもそうですが...。       |
| [gatk](https://gatk.broadinstitute.org/hc/en-us)             | 多分一番有名なツールです。非常に処理が煩雑です                                  |

GATKに関する処理について、公式以外で役に立ちそうなリンクを貼っておきます。

※ samtools mpileupは推奨されていないようです。

#### ピークのコール (bam -> bed etc.,)

ChIP-seqなどではリードが集中した領域をピークとして扱うことが多いです。この時もBAMから何らかのフォーマットへの変換が行われます。たいていはbedに準ずる形式へと変換されます。代表的なツールは以下のようなものがあります。また、転写因子に関するChIPでは狭いピークが、ヒストン修飾などのChIPでは広いピークが見られます。これらは、検出方法が異なるので、ツールやオプションを使い分ける必要があります。たいていbedかそれに準ずる形式のファイルに変換されます。

| tool name                                      | description                                                                                                                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [MACS2](https://github.com/macs3-project/MACS) | 一番多く使われている気がします。narrowなピークの検出によく使います。最近はbroadにも対応しているらしいです。                                                                   |
| [Homer](http://homer.ucsd.edu/homer/)          | narrow、broad両方で使えます。そのあとのMotif enrichmentなどもできて便利です。pos形式という独自形式で出力されますが、`pos2bed.pl`みたいなbed形式の変換もサポートされています。 |
| [SICER2](https://zanglab.github.io/SICER2/)    | broadなピークの検出に使えます。                                                                                                                                               |

#### [htslib](https://github.com/samtools/htslib)

samtoolsの本体です。SAM/BAMフォーマットを扱う際のAPIを提供しています。凝ったことをしたくなると使います。もともとはCで書かれていて、いろんな言語でWrapperが作成されています。個人的に知っているのは以下です。GitHubへのリンクを貼ります。

- [pysam](https://github.com/pysam-developers/pysam)
- [rust-htslib](https://github.com/rust-bio/rust-htslib)
- [hts-nim](https://github.com/bio-nim/nim-htslib)

#### 各種変換

##### bam -> fasta

変換する用途があまり思い浮かびませんが、samtoolsを使えばできます。

```bash
samtools fasta input.bam > output.fasta
```

##### bam -> fastq

samtoolsとかbedtoolsを使えば変換できます。あまり使うことはない気がします。k-merとか使って機械学習したいときとかにマップされたリードだけ使う、などの用途が考えられます。

```bash
# samtools
samtools fastq input.bam > output_single.fastq
# bedtools
bedtools bamtofastq -i input.bam -fq output_single.fastq
```

##### bam -> bed

samtoolsとawkでできる気はしますが、bedtoolsを使うと簡単です。

```bash
bedtools bamtobed -i input.bam > output.bed
```

##### bam -> bedgraph

bedtoolsの[genomecov](https://bedtools.readthedocs.io/en/latest/content/tools/genomecov.html)かdeeptoolsの[bamCoverage](https://deeptools.readthedocs.io/en/develop/content/tools/bamCoverage.html)で変換できます。

```bash
# bedtools genomecov
bedtools genomecov -i input.bam -bg > output.bedgraph

# deeptools bamCoverage
bamCoverage -b input.bam -o output.bedgraph -of bedgraph
```

##### bam -> bigwig

deeptoolsの[bamCoverage](https://deeptools.readthedocs.io/en/develop/content/tools/bamCoverage.html)を使います。オプションとかは色々あって、ノーマライズなどもしてくれたりします。ChIPなどの解析の際にも、RPGC normalizeに対応しているので使えます。RNA-seqでもRPKMやCPMに対応しています。TPMにも対応してほしいです。

```bash
bamCoverage -b input.bam -o output.bw
```

### bed

[bedtools](https://bedtools.readthedocs.io/en/latest/)などで扱います。Pythonなどでは[pybedtools](https://daler.github.io/pybedtools/)のようなライブラリが提供されています。最初の三行(chrom, chromStart, chromEnd)が必須で、その他が自由なフォーマットです。一応ある程度は決まっていて、[UCSCのFAQ](https://genome.ucsc.edu/FAQ/FAQformat.html#format1)では、

1. chrom: 染色体名
2. chromStart: スタート位置(0-index)
3. chromEnd: 終了位置
4. name: 遺伝子名など
5. score: 任意のスコア(track上での色の濃淡とかに反映される)
6. strand: strand (+, -)
7. thickStart: CDSの開始位置
8. thickEnd: CDSの終了位置
9. itemRgb: track上でのRGBカラー
10. blockCount: exonのブロック数
11. blockSizes: ブロックサイズ
12. blockStarts: exonの転写開始位置から見たスタート位置

という風に決まっているそうです。7行目以降は可視化する際に使われるパラメーターです。最初の三行のみのBEDをBED3、6行目までのBEDをBED6、12行目までのBEDをBED12と呼んだりします。三行目までのデータがあればbedtoolsで扱うことができます。またフォーマットは微妙に異なるのですが、GFFとかVCFもbedtoolsで扱えます。そういう意味では非常に基本的なフォーマットです。

#### bed -> fasta

bedtoolsの[getfasta](https://bedtools.readthedocs.io/en/latest/content/tools/getfasta.html)を使うことで変換できます。興味のある領域のbedを作成した後、getfastaで配列を取得してMotif Enrichmentを行うなどの使用用途があります。

```bash
bedtools getfasta -fi genome.fasta -bed input.bed > output.fasta
```

#### bed -> bam

bedtoolsの[bedToBam](https://bedtools.readthedocs.io/en/latest/content/tools/bedtobam.html)で変換できます。ただmutation情報などは失われます。

```bash
bedToBam -i input.bam -g genome > output.bam
```

### bedgraph

Bedの亜種っぽい感じです。ProbabilityやTranscriptomeなど連続性のあるデータを表示させるために使われるフォーマットらしいです[[参考]](http://genomejack.net/download/gj31/ja/GenomeJackBrowserAppendix/browser_appendix_j/dataFileFormats/bedGraph.html)。あまり使ったことがありませんが、Bisulfite Sequenceの解析の際に[MethylDackel](https://github.com/dpryan79/MethylDackel)というツールを使うと出てきました。MACS2のinput/outputでも使われてます。

### gff/gtf

遺伝子のアノテーションなどは基本的にこのフォーマットでまとまっていることが多いです。GFFにはversion2とversion3があり、微妙にフォーマットが違います。また、GFF/GTFを扱うツールとしては以下のようなものがあります。

| tool name                                     | description                                        |
| --------------------------------------------- | -------------------------------------------------- |
| [gffread](https://github.com/gpertea/gffread) | GFF/GTFの相互変換、bedへの変換、配列の抜き出しなど |

#### GFF format

1. chrom: 染色体番号や、Scaffold番号など
2. source: 何をもとに作られたか、どこのデータかなど
3. feature: CDS, exon, gene, five_prime_utrなど
4. start: featureの開始位置
5. end: featureの終了位置
6. score: なにかのスコア
7. strand: (+, -, .)。`.`は方向が不明な際に使われる。
8. frame: coding exonの場合はどのフレームなのかが書かれている。
9. attribute: 他のデータがセミコロン区切りで入力されている。gene_idや、parent_idなど。

##### GFF3 sample

```gff3
X	Ensembl	Repeat	2419108	2419128	42	.	.	hid=trf; hstart=1; hend=21
X	Ensembl	Repeat	2419108	2419410	2502	-	.	hid=AluSx; hstart=1; hend=303
X	Ensembl	Repeat	2419108	2419128	0	.	.	hid=dust; hstart=2419108; hend=2419128
X	Ensembl	Pred.trans.	2416676	2418760	450.19	-	2	genscan=GENSCAN00000019335
X	Ensembl	Variation	2413425	2413425	.	+	.	
X	Ensembl	Variation	2413805	2413805	.	+	.
```

#### GTF format

基本的にGFFと同じですが、9行目が厳格に決められており、gene_idとtranscript_idを持たなければならない。また、`#`によるコメントが許されていなかったりする。

##### GTF sample

```gtf
chr1    hg19_rmsk       exon    16777161        16777470        2147.000000     +       .       gene_id "AluSp"; transcript_id "AluSp";

chr1    hg19_rmsk       exon    25165801        25166089        2626.000000     -       .       gene_id "AluY"; transcript_id "AluY";

chr1    hg19_rmsk       exon    33553607        33554646        626.000000      +       .       gene_id "L2b"; transcript_id "L2b";
```

#### gff/grf -> fasta

```bash
gffread input.gtf -g genome.fa -w output.fa
```

#### gff/gtf -> bed

```bash
gffread input.gtf -g genome.fa -E --bed -o output.bed
```

### wig/bigwig

bigwigはwigをバイナリ化したものです。UCSC genome browserで可視化するときに使用されている形式です。bigwigなどはbamとかと比べると本当に軽いので、可視化などが目的のときは最もおすすめできるフォーマットです。また、deeptoolsを使うことで、[ヒートマップ](https://deeptools.readthedocs.io/en/develop/content/tools/plotHeatmap.html)や[PCA](https://deeptools.readthedocs.io/en/develop/content/tools/plotPCA.html)、[相関解析](https://deeptools.readthedocs.io/en/develop/content/tools/plotCorrelation.html)などを行えます。deeptoolsは高機能なのでこれはこれで記事が書きたいです。あとオープンソースなので[Github](https://github.com/deeptools/deepTools)のコードを読むと勉強になります。Pythonで書かれています。

### vcf/gvcf

変異情報が格納されているフォーマットです。samtoolsと同じところがフォーマットを決定しており、現状はver4.2です。非常に情報量が多いフォーマットなので、詳細は[マニュアル](https://samtools.github.io/hts-specs/VCFv4.2.pdf)を参照してください。gvcfは変異がコールされていない、という情報を加えて含んでいます。gatkのワークフローで登場しますが、あまり解析には使わないイメージです。詳しくは[公式ページ](https://gatk.broadinstitute.org/hc/en-us/articles/360035531812-GVCF-Genomic-Variant-Call-Format)などを参照してください。また、vcfを扱うツールとしては以下のようなものが有名です。ただvcfに関してはプログラム組んで動かした方が早い気もします。

| tool name                                                    | description                                                                                                                                                     |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [bcftools](http://samtools.github.io/bcftools/bcftools.html) | mergeやsplit、intersectなどを行える。早い。                                                                                                                     |
| [vcftools](http://vcftools.sourceforge.net/)                 | mergeやsplit、intersectなどをおこなえる。bcftoolsより多機能。                                                                                                   |
| [snpshift](http://snpeff.sourceforge.net/SnpSift.html)       | 変異のフィルタリングなど。vcflibでも似たようなことができる。Javaで書かれているのでC++で書かれているvcflibのほうが早い気がするがベンチマークなどはとっていない。 |
| [vcflib](https://github.com/vcflib/vcflib)                   | 変異のフィルタリングなど。C++で書かれているので、高速そう。                                                                                                     |
| [snpeff](http://snpeff.sourceforge.net)                      | VCFにアノテーションを付け、各種集計を行う。                                                                                                                     |

プログラミング言語として扱えるパッケージはいろいろありますが、htslibのWrapper系列は大体対応しています。タブ区切りのファイルなので、Pythonなら`pandas`等でも扱えます。他には、

- [pyvcf](https://pyvcf.readthedocs.io/en/latest/)
- [vcfR](https://cran.r-project.org/web/packages/vcfR/vignettes/intro_to_vcfR.html)

などが候補です。

#### vcf sample

\#\#から始まるヘッダ行とそれ以外のボディ部分に分かれています。

```vcf
##fileformat=VCFv4.2
##fileDate=20090805
##source=myImputationProgramV3.1
##reference=file:///seq/references/1000GenomesPilot-NCBI36.fasta
##contig=<ID=20,length=62435964,assembly=B36,md5=f126cdf8a6e0c7f379d618ff66beb2da,species="Homo sapiens",taxonomy=x>
##phasing=partial
##INFO=<ID=NS,Number=1,Type=Integer,Description="Number of Samples With Data">
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##INFO=<ID=AF,Number=A,Type=Float,Description="Allele Frequency">
##INFO=<ID=AA,Number=1,Type=String,Description="Ancestral Allele">
##INFO=<ID=DB,Number=0,Type=Flag,Description="dbSNP membership, build 129">
##INFO=<ID=H2,Number=0,Type=Flag,Description="HapMap2 membership">
##FILTER=<ID=q10,Description="Quality below 10">
##FILTER=<ID=s50,Description="Less than 50% of samples have data">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##FORMAT=<ID=GQ,Number=1,Type=Integer,Description="Genotype Quality">
##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Read Depth">
##FORMAT=<ID=HQ,Number=2,Type=Integer,Description="Haplotype Quality">
#CHROM POS ID REF ALT QUAL FILTER INFO FORMAT NA00001 NA00002 NA00003
20 14370 rs6054257 G A 29 PASS NS=3;DP=14;AF=0.5;DB;H2 GT:GQ:DP:HQ 0|0:48:1:51,51 1|0:48:8:51,51 1/1:43:5:.,.
20 17330 . T A 3 q10 NS=3;DP=11;AF=0.017 GT:GQ:DP:HQ 0|0:49:3:58,50 0|1:3:5:65,3 0/0:41:3
20 1110696 rs6040355 A G,T 67 PASS NS=2;DP=10;AF=0.333,0.667;AA=T;DB GT:GQ:DP:HQ 1|2:21:6:23,27 2|1:2:0:18,2 2/2:35:4
20 1230237 . T . 47 PASS NS=3;DP=13;AA=T GT:GQ:DP:HQ 0|0:54:7:56,60 0|0:48:4:51,51 0/0:61:2
20 1234567 microsat1 GTC G,GTCT 50 PASS NS=3;DP=9;AA=G GT:GQ:DP 0/1:35:4 0/2:17:2 1/1:40:3
```

#### dbSNPs

よく知られているSNPsなどはデータベースとしてまとまっていて、これらは基本的にvcfフォーマットで配布されています。broadinstituteのgoogle cloud platformとかで配布されています。

## たまに使うファイルフォーマット

- twobit
- mirGFF

### twobit

deeptoolsを使ってGCBiasを補正するときに使いました。他に使ったことはないです。たぶんfastaをビット形式で扱っているので、効率がいいです。UCSCの[ツール群](http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/)にある`faToTwoBit`を使えば作成できます。もう少し詳しい使い方などは[こちらのサイト](http://rnakato.hatenablog.jp/entry/2017/06/05/112755)が詳しいです。

### mirGFF

GFFに準拠したようなフォーマットでmiRNA系のNGSデータを統一的に扱うために策定されたフォーマットです。昔見たときはbioaxivだったんですが、最近論文になっているようです([Desvignes et al., 2020 Bioinfomatics](https://academic.oup.com/bioinformatics/article/36/3/698/5556118))。様々な形式から相互変換ができるフォーマットで[mirtop](https://github.com/miRTop/mirtop)というパッケージを使って作成できます。miRNA-seqで使われているツールとしては以下のようなものがあります。なんか昔はエンコーディングが対応してなくて変換できない、とかだったんですが修正されているのでしょうか。

- [seqbuster](https://github.com/lpantano/seqbuster)
- [miRge2.0](https://github.com/luketerry/miRge-2.0)
- [isomiR-SEA](https://eda.polito.it/isomir-sea/)
- [sRNAbench](https://bioinfo2.ugr.es/ceUGR/srnabench/)
- [Prost!](https://prost.readthedocs.io/en/latest/)

これらのツールは独自形式のものを出力することが多いのですが、mirTopを通すことで、以下のようなフォーマットに変換できます。

- mirGFF3
- isomiRs
- VCF
- fasta
- count matrix

また、isomiRsというのはisomiRを考慮した解析する[isomiRs](https://www.bioconductor.org/packages/release/bioc/html/isomiRs.html)というR packageで用いられている形式になります。

## 最後に

思ったよりすごい分量になってしまいました。間違いなどがあればご指摘いただけると幸いです。
