---
uuid: 1f8bac44-be7d-421e-9987-1b91b438eb04
title: A Summary of Phylogenetic Analysis
description: "A summary of information and tools related to each step of phylogenetic analysis: Alignment, Trimming, Model Selection, and Tree Construction"
lang: en
category: techblog
tags:
  - bioinformatics
  - phylogeny
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-06-12T15:55:39+00:00"
---

## TL;DR

This article summarizes information and tools related to each step of phylogenetic analysis: Alignment, Trimming, Model Selection, and Tree Construction.

There is an excellent Japanese-language review that is very well organized, so I recommend reading it as well.

> [Frontiers of Molecular Phylogenetic Analysis](https://www.jstage.jst.go.jp/article/jsbibr/2/1/2_jsbibr.2021.7/_pdf)

## Alignment

This step involves computing a Multiple Sequence Alignment (MSA) for the sequences of interest.

Benchmarks for various tools are available in [Mohamed et al., 2018](https://www.mecs-press.org/ijitcs/ijitcs-v10-n8/IJITCS-V10-N8-4.pdf). The datasets used are [BALIBASE](), with [SPscore]() and [TCscore]() as scoring metrics.

The general conclusions can be summarized as follows. Refer to the paper for detailed scores.

| Tool Name     | Method                                                                     | Seq type          | Accuracy                                          | Time                                         |
| ------------- | -------------------------------------------------------------------------- | ----------------- | ------------------------------------------------- | -------------------------------------------- |
| CLUSTAL-OMEGA | global/ Progressive                                                        | Protein, DNA, RNA | Less accuracy                                     | Less time                                    |
| MAFFT         | global/ Iterative                                                          | Protein, DNA, RNA | High alignment quality                            | Higher than KALIGN                           |
| KALIGN        | Progressive                                                                | Protein, DNA, RNA | Less accuracy as compared with PROBCONS and MAFFT | Lowest                                       |
| MUSCLE        | Progressive Step1 and Step2 iterative Step 3                               | Protein           | More accurate than CLUSTAL-OMEGA                  | Less time with a minimum number of iteration |
| RETALING      | Progressive Cornercutting Multiple Sequence Alignment                      | Protein           | More accurate than CLUSTAL-OMEGA                  | Higher than KALIGN                           |
| PROBCONS      | Probabilistic Consistency-based Multiple Alignment of Amino Acid Sequences | Protein           | The highest alignment accuracy                    | Highest                                      |

> Modified from Mohamed et al., 2018 Table 1 and Table 5

My takeaways from reading the paper are as follows. Since `MUSCLE` and `MAFFT` are the tools most commonly seen in publications, none of these findings are groundbreaking, but they are worth considering when alignments are not working well.

- `PROBCONS` is highly accurate for protein alignment, but slow.
- For DNA/RNA alignment, `MAFFT` is the way to go.
- `KALIGN` is fast and achieves accuracy close to MAFFT.

Many of these tools have a long history, with some dating back to the 1990s and still in active use. Be aware that when building from source with `make`, they may assume older compilers like `g++ (4.3)`.

### m-coffee

After computing MSAs with the tools listed above, m-coffee creates an improved MSA by taking their consensus. It is used in the [PhylomeDB](https://academic.oup.com/nar/advance-article/doi/10.1093/nar/gkab966/6414570) pipeline. When I tried it out, it even distributes binaries for the tools mentioned above, which is very convenient.

## Trimming

This step removes subsequences with low homology.

### Software List

1. ClipKIT [Steenwyk et al., 2020](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3001007)
2. BMGE [Criscuolo A et al., 2010](https://doi.org/10.1186/1471-2148-10-210)
3. Gblocks [Talavera G et al., 2007](https://doi.org/10.1080/10635150701472164)
4. Noisy [Dress AW et al., 2008](https://doi.org/10.1186/1748-7188-3-7)
5. trimAl [Capella-Gutierrez S et al., 2009](https://doi.org/10.1093/bioinformatics/btp348)
6. Aliscore [Kuck et al., 2010](http://dx.doi.org/10.1186/1742-9994-7-10)
7. Zorro [Wu et al., 2012](http://dx.doi.org/10.1371/journal.pone.0030288)
8. Guidance [Penn et al., 2010](http://dx.doi.org/10.1093/nar/gkq443)

According to the ClipKIT paper, ClipKIT performs the best among tools 1-5 (which is expected, given it is their own paper).
However, as also mentioned in the ClipKIT paper, [Ge Tan et al., 2015](https://academic.oup.com/sysbio/article/64/5/778/1685763) reports that trimming can actually worsen results on real datasets, and the factors contributing to this are not yet well understood.

Therefore, the option of **not trimming** should also be considered.

## Model Selection

This step involves selecting an evolutionary model. It is required when using maximum likelihood or Bayesian methods.

There is an argument that simply choosing the parameter-rich `GTR + I + G` model is sufficient. However, appropriate model selection can yield better branch-length estimates than `GTR + I + G` ([Shiran Abadi et al., 2019](https://www.nature.com/articles/s41467-019-08822-w)). Since this step is not time-consuming, it is generally worth doing.

### Software List

- [modeltest-ng](https://github.com/ddarriba/modeltest) [Diego Darriba et al., 2019](https://academic.oup.com/mbe/article/37/1/291/5552155)
- [modelteller](https://github.com/shiranab/ModelTeller/) [Shiran Abadi et al., 2020](https://academic.oup.com/mbe/article/37/11/3338/5862639)

modeltest-ng performs model selection using the traditional LRT (Likelihood Ratio Test). In contrast, modelteller uses Random Forest for selection. modelteller focuses on optimizing branch-length estimation.

The modelteller website does not use HTTPS (which is why I have not linked it here), but it reportedly offers a web-based interface as well.

## Tree Construction

While distance matrix methods and maximum parsimony methods exist, maximum likelihood and Bayesian methods are generally recommended. Since maximum likelihood and Bayesian methods can sometimes produce different results, comparison may be necessary. The most widely used tools are probably `iqtree`, `raxml`, and `mrbayes`. For special cases, when evolutionary distances are very large, the Graph Splitting method ([gs2](https://github.com/MotomuMatsui/gs)) can be used, and when domain shuffling has occurred, constructing a phylogenetic network using [SplitsTree](https://github.com/husonlab/splitstree5) is recommended.

### Software List

#### Maximum Likelihood

- [raxml-ng](https://github.com/amkozlov/raxml-ng)
- [iqtree](http://www.iqtree.org)
- [phyml](http://www.atgc-montpellier.fr/phyml/download.php)
- [paup](https://paup.phylosolutions.com)

#### Bayesian Methods

- [mrbayes](https://nbisweden.github.io/MrBayes/download.html)
- [beast](https://beast.community)

[A tutorial on implementing Bayesian methods](https://github.com/thednainus/Bayesian_tutorial) can also be a useful reference.

### Evolutionary Models

On the maximum likelihood side, model selection tools generally output models in the format expected by the tree-building software, so there is usually little difficulty. However, when using MrBayes, the format is quite different, so caution is needed. See the [Manual](http://mrbayes.sourceforge.net/mb3.2_manual.pdf) for details. MrBayes supports a somewhat smaller set of evolutionary models, but according to the manual, using `lset nst=mixed` to let MCMC sampling determine the model is the more Bayesian approach.

## Visualization

The tools I personally use most often are the following two, and they have covered most of my needs. iTOL becomes more comfortable to use with a paid subscription.

- [iTOL](https://itol.embl.de)
- [FigTree](https://github.com/rambaut/figtree/)

For programmatic visualization, [ETE3 (Python)](https://github.com/etetoolkit/ete) and [ggtree (R)](https://github.com/YuLab-SMU/ggtree) are strong options.
