---
uuid: 1f8bac44-be7d-421e-9987-1b91b438eb04
title: Phylogenetic Analysisに関するまとめ
description: "Phylogenetic Analysis各種ステップのAlignment, Trim, Model選択, Tree Constructionに関する情報、ツールに関してまとめ"
lang: ja
category: techblog
tags:
  - bioinformatics
  - phylogeny
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-06-12T15:55:39+00:00"
---

## TL;DR

Phylogenetic Analysis各種ステップのAlignment, Trim, Model selection, Tree Constructionに関する情報、ツールに関してまとめる。

すごくまとまってる日本語の総説があったので、そちらを読むことをおすすめします。

> [分子系統解析の最前線](https://www.jstage.jst.go.jp/article/jsbibr/2/1/2_jsbibr.2021.7/_pdf)

## Alignment

各種配列のMSAを取るステップ。

[Mohamed et al., 2018](https://www.mecs-press.org/ijitcs/ijitcs-v10-n8/IJITCS-V10-N8-4.pdf)で各種ツールのベンチマークがとられている。データセットとして、[BALIBASE]()、スコアとして、[SPscore]()と[TCscore]()が使われている。

大体まとめると以下のような結論になっている。詳細なスコアを知りたい場合は、論文を参照。

| Tool Name     | Method                                                                     | Seq type          | Accuracy                                          | Time                                         |
| ------------- | -------------------------------------------------------------------------- | ----------------- | ------------------------------------------------- | -------------------------------------------- |
| CLUSTAL-OMEGA | global/ Progressive                                                        | Protein, DNA, RNA | Less accuracy                                     | Less time                                    |
| MAFFT         | global/ Iterative                                                          | Protein, DNA, RNA | High alignment quality                            | Higher than KALIGN                           |
| KALIGN        | Progressive                                                                | Protein, DNA, RNA | Less accuracy as compared with PROBCONS and MAFFT | Lowest                                       |
| MUSCLE        | Progressive Step1 and Step2 iterative Step 3                               | Protein           | More accurate than CLUSTAL-OMEGA                  | Less time with a minimum number of iteration |
| RETALING      | Progressive Cornercutting Multiple Sequence Alignment                      | Protein           | More accurate than CLUSTAL-OMEGA                  | Higher than KALIGN                           |
| PROBCONS      | Probabilistic Consistency-based Multiple Alignment of Amino Acid Sequences | Protein           | The highest alignment accuracy                    | Highest                                      |

> Modified from Mohamed et al., 2018 Table 1 and Table 5

読んだ感想としては、以下。論文とかでよく見るのは、`MUSCLE`、`MAFFT`あたりが多い気がするので、クリティカルな印象はないが、上手くいかない場合は検討してみる価値はありそう。

- `PROBCONS`がタンパク質のアラインメントを取る分には非常に正確、ただし遅い。
- DNA/RNAはアラインメントの際は`MAFFT`
- `KALIGN`は速くてMAFFTに近い正確性

この辺のツールは結構歴史が古いので、1900年代のツールが現役で使われる。`make`するときなどに、`g++ (4.3)`とかが想定されてたりするので注意が必要。

### m-coffee

上で挙げたようなツールでMSAをとったあと、それらのコンセンサスをうまく取ることでより良いMSAを作成するツール。[PhylomeDB](https://academic.oup.com/nar/advance-article/doi/10.1093/nar/gkab966/6414570)のパイプラインで使われている。試した見たところ、上で挙げたツールのバイナリを配布していたりしてすごく親切。

## Trim

相同性の低い部分配列を削除するステップ。

### Software一覧

1. ClipKIT [Steenwyk et al., 2020](https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.3001007)
2. BMGE [Criscuolo A et al., 2010](https://doi.org/10.1186/1471-2148-10-210)
3. Gblocks [Talavera G et al., 2007](https://doi.org/10.1080/10635150701472164)
4. Noisy [Dress AW et al., 2008](https://doi.org/10.1186/1748-7188-3-7)
5. trimAl [Capella-Gutierrez S et al., 2009](https://doi.org/10.1093/bioinformatics/btp348)
6. Aliscore [Kück et al., 2010](http://dx.doi.org/10.1186/1742-9994-7-10)
7. Zorro [Wu et al., 2012](http://dx.doi.org/10.1371/journal.pone.0030288)
8. Guidance [Penn et al., 2010](http://dx.doi.org/10.1093/nar/gkq443)

一応ClipKITの論文を読むと、1-5の中でClipKITが一番いいって書いてある（それはそう）。
ただ、ClipKITの論文でも触れられているが、[Ge Tan et al., 2015](https://academic.oup.com/sysbio/article/64/5/778/1685763)とかでは、実際のデータセットではTrimをすることで結果が悪くなることも多い、ということが報告されている。また、どういった部分がそれに影響しているのかはいまいちよくわかってないらしい。

そのため、Trimを**行わない**選択も検討する必要がある。

## Model選択

進化モデルを選択する。最尤法・ベイズ法の場合に必要なステップ。

進化モデルの選択は、パラメータが多い`GTR + I + G`選んどけばいいという説もある。ただ、`branch-length`の推定に関しては適切なモデル選択をすると`GTR + I + G`より良くなる([Shiran Abadi et al., 2019](https://www.nature.com/articles/s41467-019-08822-w))。時間のかかるステップでもないので、やっておいて損はないとは思う。

### Software一覧

- [modeltest-ng](https://github.com/ddarriba/modeltest) [Diego Darriba et al., 2019](https://academic.oup.com/mbe/article/37/1/291/5552155)
- [modelteller](https://github.com/shiranab/ModelTeller/) [Shiran Abadi et al., 2020](https://academic.oup.com/mbe/article/37/11/3338/5862639)

modeltest-ngは伝統的なLRTを使ってモデル選択を行う。一方、modeltellerはRandom Forestで選択している。modeltellerではbranch-lengthの最適化に焦点が置かれている。

modeltellerのweb siteはhttpsじゃなくて怖かったため貼ってないが、Web上でも試せるらしい。

## Tree Construction

距離行列法や、最節約法などがあるが、基本的には最尤法・ベイズ法を使うのがよいと思われる。最尤法・ベイズ法は結果が割れることがあるので、比較が必要になる場合もある。多分最もよく使われているのは、`iqtree`, `raxml`, `mrbayes`あたりだと思う。あとは特殊ケースとして進化距離が大きすぎる場合はGraph Splitting法([gs2](https://github.com/MotomuMatsui/gs))、ドメインシャッフリングが起こっている場合は系統ネットワークを構築する方法([SplitsTree](https://github.com/husonlab/splitstree5))を利用するといいらしい。

### Software一覧

#### 最尤法

- [raxml-ng](https://github.com/amkozlov/raxml-ng)
- [iqtree](http://www.iqtree.org)
- [phyml](http://www.atgc-montpellier.fr/phyml/download.php)
- [paup](https://paup.phylosolutions.com)

#### ベイズ法

- [mrbayes](https://nbisweden.github.io/MrBayes/download.html)
- [beast](https://beast.community)

[bayes法の実装のチュートリアル](https://github.com/thednainus/Bayesian_tutorial)とかも参考になる。

### 進化モデル

基本的に、最尤法側ではモデル選択ツールが出してくれる形態で書いてあるのでそれほど困ることはない。MrBayesを使用する場合は、結構違うので注意が必要。詳細は[Manual](http://mrbayes.sourceforge.net/mb3.2_manual.pdf)を参照。Mrbayesでは使用できる進化モデルが少し少ないが、Manual的には、`lset nst=mixed`あたりを使ってMCMC samplingで決めるのがベイズ的って書いてる。

## Visualization

個人的によく使うのは以下で、この2つであまり困ってない。iTOLは課金すると快適になる。

- [iTOL](https://itol.embl.de)
- [FigTree](https://github.com/rambaut/figtree/)

ライブラリとしては、[ETE3 (Python)](https://github.com/etetoolkit/ete)や[ggtree (R)](https://github.com/YuLab-SMU/ggtree)あたりが有力。
