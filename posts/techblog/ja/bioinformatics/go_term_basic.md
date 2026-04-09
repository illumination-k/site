---
uuid: 8158f0c1-11fa-43d8-904f-f34bdf799bc9
title: GO Termに関する基礎
description: GO解析はよく使われる解析手法ですが、正確に理解するには、まずGOそのものに関する理解が必要になります。GO Termの基本についてまとめていきます。
lang: ja
category: techblog
tags:
  - bioinformatics
  - goterm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2026-04-09T00:00:00+00:00"
---

## TL;DR

GOに関連する解析は次世代シーケンサーやマイクロアレイの解析において、よく使われる解析手法です。解析の意味を正確に理解するには、まずGOそのものに関する理解が必要になります。ここでは、GO Termの基本についてまとめていきます。

## GO Termとは

[The Gene Ontology (GO)](http://geneontology.org/)は、[Gene Ontology Consortium](http://geneontology.org/docs/whoweare/)によって管理されている、遺伝子産物の機能を体系的に記述するための標準化されたアノテーション体系です。GO Termは人間の専門家によるキュレーションに基づいて定義されており、PFAMやKEGGなどの計算的手法に基づくデータベースと比べて主観性が入りやすいという指摘もあります。

しかし、生物学的な知見を体系的に構造化したアノテーションとしてGO Termは非常に広く利用されており、多くのContributorによるキュレーションにより信頼性は高くなっています。現在では、150,000を超える論文の実験データをもとにアノテーションがつけられており、実験的な裏付けのあるアノテーションは700,000を超えます([参考](http://geneontology.org/docs/introduction-to-go-resource/))。タンパク質の機能推定やパスウェイ解析など、多くのバイオインフォマティクスの解析でGO Termが正解データとして利用されています。

また、人によるキュレーションという性質上、GO Termそのものが更新されることも多いため、解析の際にはできるだけ最新のGO Termのリストを使うことが推奨されます。GO Consortiumは定期的にリリースを行っており、[公式サイトのダウンロードページ](http://geneontology.org/docs/download-ontology/)から最新版を取得できます。

### File format

GO Termのオントロジー定義は主に以下の形式で提供されています。

- **OBO format**: GO専用のテキストベースの形式で、人間にも読みやすい構造になっています。各GO Termのid、名前、定義、関係性などがプレーンテキストで記述されています。[goatools](https://github.com/tanghaibao/goatools)の`obo_parser`などを使用するとパースできます。
- **OWL (Web Ontology Language)**: W3C標準のオントロジー記述言語で、より厳密な論理的表現が可能です。OWLAPIやowlreadyなどのライブラリで扱えます。
- **JSON形式**: 後述するsubsetなどが提供されています。プログラムから扱いやすい形式です。

また、遺伝子産物へのアノテーション情報は**GAF (Gene Association File)** 形式や**GPAD (Gene Product Association Data)** 形式で提供されています。GAFはタブ区切りのテキストファイルで、遺伝子産物とGO Termの対応関係、Evidence Code、参考文献などが記録されています。

### Subset

GO Termには生物種や特定の用途に応じたSubset（スリムオントロジー）が用意されています。例えば、[GO Slim](http://geneontology.org/docs/go-subset-guide/)は上位の代表的なGO Termだけを集めたもので、大まかな機能分類の概要を把握するのに有用です。

生物種固有のSubsetも提供されており、例えば動物は光合成をしないため、植物固有のGO Termを除外した動物用のSubsetを使うことで、より適切な解析が可能になります。代表的なSubsetには`goslim_generic`、`goslim_plant`、`goslim_yeast`などがあります。

## GO Termの中身

### 基本要素

1つのGO Termは以下の要素を基本に構成されます。

| Name          | Description                                                  | Example                                       |
| ------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Gene Product  | アノテーションされている遺伝子産物                           | UniProtKB:Q920D2 (rat Dhfr)                   |
| GO Term       | IDと名前 (説明)                                              | GO:0004146 (dihydrofolate reductase activity) |
| Reference     | アノテーションの根拠を示す論文                               |                                               |
| Evidence Code | アノテーションの根拠の種類を示すコード（実験、系統解析など） | Inferred from Experiment (EXP)                |

### Evidence Code

各GO AnnotationにはEvidence Codeが付与されており、アノテーションの根拠がどのような種類のものかを示します。Evidence Codeは大きく以下のカテゴリに分類されます（[参考](http://geneontology.org/docs/guide-go-evidence-codes/)）。

| カテゴリ          | 代表的なコード                                        | 説明                                                                         |
| ----------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| Experimental      | EXP, IDA, IPI, IMP, IGI, IEP, HTP, HDA, HMP, HGI, HEP | 実験的手法に基づくアノテーション。最も信頼性が高い。                         |
| Phylogenetic      | IBA, IBD, IKR, IRD                                    | 系統解析に基づくアノテーション。                                             |
| Computational     | ISS, ISO, ISA, ISM, IGC, RCA                          | 配列類似性や計算的手法に基づくアノテーション。                               |
| Author Statement  | TAS, NAS                                              | 著者の記述に基づくアノテーション。                                           |
| Curator Statement | IC, ND                                                | キュレーターの判断に基づくアノテーション。NDは「データなし」を意味する。     |
| Electronic        | IEA                                                   | 自動的な電子的アノテーション。最も数が多いが、人手による検証はされていない。 |

GO解析を行う際には、Evidence Codeによるフィルタリングが重要です。例えば、IEA（電子的推論）を除外して実験的根拠のあるアノテーションのみを使用する場合があります。

### Extensions

基本要素以外にも、いくつかのアノテーションの拡張が行われています。拡張アノテーションは以下の2つに大別されます（[Huntley & Lovering 2017](https://link.springer.com/protocol/10.1007/978-1-4939-3743-1_17)）。

- 遺伝子や遺伝子産物、複合体、化学物質などの関係性を示す**Molecular relationships**
- 細胞種や解剖学、発達段階などとの関係性を示す**Contextual relationships**

#### Molecular relationships

| Name                  | Description                                    | Example                                                               |
| --------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| has_regulation_target | 制御対象となる遺伝子産物を示す                 | has_regulation_target (UniProtKB:P08151 zinc finger protein GLI1)     |
| has_input             | 反応やプロセスの入力となる分子を示す           | has_input (PomBase:SPAC26H5.0 pcf2)                                   |
| has_direct_input      | 直接的に作用する基質やリガンドなどの分子を示す | has_direct_input (UniProtKB:Q7LBE3 Solute carrier family 26 member 9) |

#### Contextual relationships

| Name           | Description                              | Example                                                         |
| -------------- | ---------------------------------------- | --------------------------------------------------------------- |
| part_of        | 特定の細胞や組織の一部であることを示す   | part_of (WBbt:0006804 body wall muscle cell)                    |
| occurs_in      | プロセスが起こる場所（細胞種など）を示す | occurs_in (CL:0000740 retinal ganglion cell)                    |
| happens_during | プロセスが起こるタイミングや条件を示す   | happens_during (GO:0071470 cellular response to osmotic stress) |

## GO Annotationの構造

GO Annotation全体はノードとしてGO Termを、エッジとして下で定義されるRelationを持つ有向非巡回グラフ(DAG)で表されており、階層構造を持ちます。階層構造の上に行くほど、広い意味をもつアノテーションになります。

階層構造における関係性を表すRelationは以下の通りです([参考](http://geneontology.org/docs/ontology-relations/))。

| Name      | Description                                                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| is a      | 基本構造です。A is a Bと示すとき、AはBのサブタイプです。                                                                                                                   |
| part of   | より強い制約です。B is part of Aでは、Bが存在するとき、それは必ずAの一部であり、Aの存在が約束されます。Extensionのpart ofはノード情報ですが、このpart ofはエッジ情報です。 |
| has part  | A has part Bのとき、BはAの一部です。Aが存在するとき、Bは存在する必要がありますが、Bが存在していても必ずしもAが存在する必要がありません。                                   |
| regulates | 制御関係を表します。例えば、他のパスウェイからの影響などががあります。                                                                                                     |

GO Termの一番上の階層として、以下の3つが割り当てられています。解析ツールなどでは、このノードを最上流ノードとして扱うことが多いです。

|                    | 略称 | 意味                                                                                       |
| ------------------ | ---- | ------------------------------------------------------------------------------------------ |
| Biological Process | BP   | 遺伝子産物が関与する生物学的なプロセスやパスウェイ（例: シグナル伝達、代謝、細胞分裂など） |
| Molecular Function | MF   | 遺伝子産物の分子レベルでの機能・活性（例: 酵素活性、受容体活性、転写因子活性など）         |
| Cellular Component | CC   | 遺伝子産物が活動する細胞内の場所や構造体（例: 核、ミトコンドリア、細胞膜など）             |

## Reference

- [The Gene Ontology resource](http://geneontology.org/)
- [Guide to GO evidence codes](http://geneontology.org/docs/guide-go-evidence-codes/)
- [Introduction to GO annotations](http://geneontology.org/docs/go-annotations/#annotation-extensions)
- [Relations in the Gene Ontology](http://geneontology.org/docs/ontology-relations/)
- [GO Subset Guide](http://geneontology.org/docs/go-subset-guide/)
- [Download the ontology](http://geneontology.org/docs/download-ontology/)
- Huntley R.P., Lovering R.C. (2017) Annotation Extensions. In: Dessimoz C., Škunca N. (eds) The Gene Ontology Handbook. Methods in Molecular Biology, vol 1446. Humana Press, New York, NY. https://doi.org/10.1007/978-1-4939-3743-1_17
