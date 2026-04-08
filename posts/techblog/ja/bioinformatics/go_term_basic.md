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
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

GOに関連する解析は次世代シーケンサーやマイクロアレイの解析において、よく使われる解析手法です。解析の意味を正確に理解するには、まずGOそのものに関する理解が必要になります。ここでは、GO Termの基本についてまとめていきます。

## GO Termとは

[The Gene Ontology Consortium](http://geneontology.org/docs/whoweare/)という団体が規定している、人によって定義されたアノテーションです。人によって定義されていることから、PFAMやKEGGなどといったデータと比べ客観性に欠ける、などといった指摘も見られます。
とはいえ、生物学的な知見を含んだアノテーションはGO Termくらいですし、Contributorの方々のおかげで信頼性は高くなっています。2021年現在では、150,000を超える論文の実験データをもとにアノテーションがつけられており、実験的な裏付けのあるアノテーションは700,000を超えます([参考](http://geneontology.org/docs/introduction-to-go-resource/))。実際、タンパク質の機能推定を行うような手法では、正解データとして多くの解析でGO Termが使われています。

また、人によって付けられるという性質上、GO Termそのものが更新されることも多いため、解析の際にはできるだけ最新のGO Termのリストを使うことが推奨されます。

### File format

Go TermはOBO-formatとowl形式で書かれています。[goatools](https://github.com/tanghaibao/goatools)の`obo_parser`などを使用するとobo formatをパースすることができます。あまりファイル形式については詳しくないので、そのうち調べたいです。また、後述するsubsetについては、`json`形式でも提供されています。

### Subset

生物種ごとのアノテーションがあります。例えば動物は光合成をしないので、光合成のGo Termなどを予め除いておきたい場合はこういったSubsetを使用するのが適していると考えられます。

## GO Termの中身

### 基本要素

1つのGO Termは以下の要素を基本に構成されます。

| Name          | Description                                                  | Example                                       |
| ------------- | ------------------------------------------------------------ | --------------------------------------------- |
| Gene Product  | アノテーションされている遺伝子産物                           | UniProtKB:Q920D2 (rat Dhfr)                   |
| GO Term       | IDと名前 (説明)                                              | GO:0004146 (dihydrofolate reductase activity) |
| Reference     | アノテーションの根拠を示す論文                               |                                               |
| Evidence Code | アノテーションの根拠の種類を示すコード(実験、系統解析 etc.,) | Inferred from Experiment (EXP)                |

### extensions

基本要素以外にも、いくつかのアノテーションの拡張が行われています。拡張アノテーションは以下の2つに大別されます([Huntley & Lovering 2017](https://link.springer.com/protocol/10.1007/978-1-4939-3743-1_17))。

- 遺伝子や遺伝子産物、複合体、化学物質などの関係性を示す**Molecular reationships**
- 細胞種や解剖学、発達段階などとの関係性を示す**Contextual relationships**に大別されます。

#### Molecular reationships

| Name                  | Description | Example                                                               |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| has_regulation_target |             | has_regulation_target (UniProtKB:P08151 zinc finger protein GLI1)     |
| has_input             |             | has_input (PomBase:SPAC26H5.0 pcf2)                                   |
| has_direct_input      |             | has_direct_input (UniProtKB:Q7LBE3 Solute carrier family 26 member 9) |

#### Contextual relationships

| Name           | Description | Example                                                         |
| -------------- | ----------- | --------------------------------------------------------------- |
| part_of        |             | part_of (WBbt:0006804 body wall muscle cell)                    |
| occurs_in      |             | occurs_in (CL:0000740 retinal ganglion cell)                    |
| happens_during |             | happens_during (GO:0071470 cellular response to osmotic stress) |

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

|                    | 略称 | 意味                   |
| ------------------ | ---- | ---------------------- |
| Biological Process | BP   | 生物学的なプロセス     |
| Molecular Function | MP   | 遺伝子産物の分子的機能 |
| Cellular Component | CC   | 細胞の構成要素         |

## Reference

- [Guide to GO evidence codes](http://geneontology.org/docs/guide-go-evidence-codes/)
- [Introduction to GO annotations](http://geneontology.org/docs/go-annotations/#annotation-extensions)
- [Relations in the Gene Ontology](http://geneontology.org/docs/ontology-relations/)
- Huntley R.P., Lovering R.C. (2017) Annotation Extensions. In: Dessimoz C., Škunca N. (eds) The Gene Ontology Handbook. Methods in Molecular Biology, vol 1446. Humana Press, New York, NY. https://doi.org/10.1007/978-1-4939-3743-1_17
