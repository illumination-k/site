---
uuid: dbb49f31-2bca-4a97-857e-a1d7a95b645d
title: Basics of Library Preparation and Sequencing
description: With the advancement of next-generation sequencing (NGS) technologies, sequencing has become relatively affordable. This article summarizes the principles of library preparation, which is essential for NGS analysis, and the behavior of sequencers.
lang: en
category: biology
tags:
  - biology
  - ngs
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

With the advancement of next-generation sequencing (NGS) technologies, sequencing has become relatively affordable. This article summarizes the principles of library preparation, which is essential for NGS analysis, and the behavior of sequencers.

## Library Preparation

Illumina's NGS technology uses a method called `sequence by synthesis (SBS)`. To use `SBS`, recognition sequences called adapters are required.
Library preparation is the process of attaching adapters to both ends of the DNA you want to read, using various reactions. There are several types of adapter sequences used, but as of 2021, the most commonly used are the Truseq adapter and the Nextera adapter. For other adapters, please refer to the [Illumina adapter sequences document](https://teichlab.github.io/scg_lib_structs/data/illumina-adapter-sequences-1000000002694-14.pdf).

For commonly used reactions, please refer to [this blog post](./library_construction_reaction.md).

### Library Structure

A library is basically composed of the following elements. The names used here are not official terms, but are used for convenience throughout this article.

|                            | Description                                            | Common Examples                    |
| -------------------------- | ------------------------------------------------------ | ---------------------------------- |
| Flow cell binding sequence | Sequence required for hybridization with the flow cell | `P5`, `P7` etc.                    |
| Index sequence             | Sequence used when handling multiple samples           | `i5`, `i7` etc.                    |
| Adapter sequence           | Sequence where the sequencing primer binds             | `Truseq Read`, `Nextera Read` etc. |
| Insert DNA                 | The sequence that is actually analyzed                 |                                    |

When you look at the actual library structure, you can see that all of these elements are included.

### Truseq Single Index

<Seq
fchain={<><P5>AATGATACGGCGACCACCGAGATCTACAC</P5><S5>TCTTTCCCTACACGACGCTCTTCCGATCT</S5>-insert-<S7>AGATCGGAAGAGCACACGTCTGAACTCCAGTCAC</S7><T7>NNNNNNNN</T7><P7>ATCTCGTATGCCGTCTTCTGCTTG</P7></>}
rchain={<><P5>TTACTATGCCGCTGGTGGCTCTAGATGTG</P5><S5>AGAAAGGGATGTGCTGCGAGAAGGCTAGA</S5>-insert-<S7>TCTAGCCTTCTCGTGTGCAGACTTGAGGTCAGTG</S7><T7>NNNNNNNN</T7><P7>TAGAGCATACGGCAGAAGACGAAC</P7></>}
annotation={<> <P5>Illumina P5</P5> <S5>Truseq Read 1</S5> <S7>Truseq Read 2</S7> <T7>i7</T7> <P7>Illumina P7</P7></>}
/>

### Truseq Dual Index

<Seq
fchain={<><P5>AATGATACGGCGACCACCGAGATCTACAC</P5><T7>NNNNNNNN</T7><S5>ACACTCTTTCCCTACACGACGCTCTTCCGATCT</S5>-insert-<S7>AGATCGGAAGAGCACACGTCTGAACTCCAGTCAC</S7><T7>NNNNNNNN</T7><P7>ATCTCGTATGCCGTCTTCTGCTTG</P7></>}
rchain={<><P5>TTACTATGCCGCTGGTGGCTCTAGATGTG</P5><T7>NNNNNNNN</T7><S5>TGTGAGAAAGGGATGTGCTGCGAGAAGGCTAGA</S5>-insert-<S7>TCTAGCCTTCTCGTGTGCAGACTTGAGGTCAGTG</S7><T7>NNNNNNNN</T7><P7>TAGAGCATACGGCAGAAGACGAAC</P7></>}
annotation={<> <P5>Illumina P5</P5> <T7>i5</T7> <S5>Truseq Read 1</S5> <S7>Truseq Read 2</S7> <T7>i7</T7> <P7>Illumina P7</P7></>}
/>

### Nextera Dual Index

<Seq
fchain={<><P5>AATGATACGGCGACCACCGAGATCTACAC</P5><T7>NNNNNNNN</T7><S5>TCGTCGGCAGCGTC</S5><Me>AGATGTGTATAAGAGACAG</Me>-insert-<Me>CTGTCTCTTATACACATCT</Me><S7>CCGAGCCCACGAGAC</S7><T7>NNNNNNNN</T7><P7>ATCTCGTATGCCGTCTTCTGCTTG</P7></>}
rchain={<><P5>TTACTATGCCGCTGGTGGCTCTAGATGTG</P5><T7>NNNNNNNN</T7><S5>AGCAGCCGTCGCAG</S5><Me>TCTACACATATTCTCTGTC</Me>-insert-<Me>GACAGAGAATATGTGTAGA</Me><S7>GGCTCGGGTGCTCTG</S7><T7>NNNNNNNN</T7><P7>TAGAGCATACGGCAGAAGACGAAC</P7></>}
annotation={<> <P5>Illumina P5</P5> <T7>i5</T7> <S5>Next</S5><Me>era Read 1</Me> <Me>Next</Me><S7>era Read 2</S7> <T7>i7</T7> <P7>Illumina P7</P7></>}
/>

## Library Preparation Methods

Let's walk through how these libraries are actually constructed. The basic workflow of library preparation is:

1. Create double-stranded DNA fragments of approximately several hundred base pairs
2. Add the sequences required for SBS to these DNA fragments using various methods
3. Purify with beads or gel, and perform PCR amplification

This is the general workflow. Here we will focus on library preparation for DNA, which is the most fundamental.

### Truseq[^1]

1. Fragment 100-200 ng of genomic DNA using ultrasonic shearing with a device such as [Covaris](https://www.technosaurus.co.jp/categories/view/488).
2. Blunt-end and phosphorylate the DNA fragment ends using T4 DNA polymerase or Klenow fragment.
3. Use beads to selectively collect DNA of a specific size range.
4. Add A-tails to the blunt-ended DNA fragments using Klenow Fragment ([reference 1](https://international.neb.com/protocols/2013/11/06/a-tailing-with-klenow-fragment-3-5-exo), [reference 2](https://academic.oup.com/nar/article/45/10/e79/2948436)).
5. Ligate adapters using T4 DNA ligase.
6. Amplify by PCR.
7. Proceed to sequencing.

![truseq](../../public/seq_summary/truseq.PNG)

> [Next-Generation Sequencer Library Preparation Reagents](https://www.nebj.jp/jp/Flyer/NEBNEXT.pdf)

### Nextera

1. Fragment genomic DNA to approximately 300 bp using Transposase, while simultaneously adding the required indices.
2. Use primers that target the added sequences as templates to attach the remaining adapters via PCR.
3. Proceed to sequencing.

![nextera](../../public/seq_summary/nextera.PNG)

> [Next-Generation Sequencer Library Preparation Reagents](https://www.nebj.jp/jp/Flyer/NEBNEXT.pdf)

## How Sequencing Actually Reads the Data

First, as terminology: a library with one index sequence is called a single index, and a library with two index sequences is called a dual index. [This slide deck](https://www.adres.ehime-u.ac.jp/news/NGS1.pdf) provides very detailed information.

### Multiplexing

When loading libraries into the sequencer, multiple libraries are loaded simultaneously rather than just one. The index sequence is used to determine which library each read originates from. In other words, by assigning a unique ID in the form of a sequence to each library, multiple samples can be analyzed in a single sequencing run and distinguished afterward. With dual indexing, there are two index sequences, so the combination of index sequences serves as the unique ID.

![multiplex](../../public/seq_summary/multiplex.PNG)

> [NGS Introduction](https://www.adres.ehime-u.ac.jp/news/NGS1.pdf)

### Single Index with Paired-End Sequencing

1. Sequence the insert DNA from the Read 1 side **(a)** (e.g., Truseq Read 1, Nextera Read 1).
2. Read the index sequence from the Read 2 side **(b)** (e.g., Truseq Read 2, Nextera Read 2).
3. Bridge amplification.
4. Sequence the insert DNA from the Read 2 side **(c)**.

![single_index_pair](../../public/seq_summary/single_index_pair.PNG)

> [NGS Introduction](https://www.adres.ehime-u.ac.jp/news/NGS1.pdf)

### Dual Index with Paired-End Sequencing

1. Sequence the insert DNA from the Read 1 side (e.g., Truseq Read 1, Nextera Read 1).
2. Read the index sequence from the Read 2 side (e.g., Truseq Read 2, Nextera Read 2).
3. After bridge amplification, read index sequence 2 from the P5 side.
4. Sequence the insert DNA from the Read 2 side.

![dual_index_pair](../../public/seq_summary/dual_index_pair.PNG)

> [NGS Introduction](https://www.adres.ehime-u.ac.jp/news/NGS1.pdf)

## References

- [Library sequencing](https://teichlab.github.io/scg_lib_structs/methods_html/Illumina.html)
- [Next-Generation Sequencer Library Preparation Kits](https://jp.illumina.com/content/dam/illumina-marketing/apac/japan/documents/pdf/brochure_libraryprep_dna.pdf)
- [Next-Generation Sequencer Library Preparation Reagents](https://www.nebj.jp/jp/Flyer/NEBNEXT.pdf)
- [A-Tailing with Klenow Fragment (3'-->5' exo-)](https://international.neb.com/protocols/2013/11/06/a-tailing-with-klenow-fragment-3-5-exo)
- [Marie-Theres Gansauge, Tobias Gerber, Isabelle Glocke, Petra Korlević, Laurin Lippik, Sarah Nagel, Lara Maria Riehl, Anna Schmidt, Matthias Meyer, Single-stranded DNA library preparation from highly degraded DNA using T4 DNA ligase, Nucleic Acids Research, Volume 45, Issue 10, 2 June 2017, Page e79, https://doi.org/10.1093/nar/gkx033](https://academic.oup.com/nar/article/45/10/e79/2948436)
- [NGS Introduction](https://www.adres.ehime-u.ac.jp/news/NGS1.pdf)

## Reference Videos

::youtube[fCd6B5HRaZ8]

[^1]: This is more accurately described as NEBNext rather than Truseq, but Nextera uses tagmentation, making it a distinctly different library preparation method.
