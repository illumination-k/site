---
uuid: 8158f0c1-11fa-43d8-904f-f34bdf799bc9
title: Basics of GO Terms
description: GO analysis is a widely used analytical method, but to understand it properly you first need to understand GO itself. This post covers the fundamentals of GO Terms.
lang: en
category: techblog
tags:
  - bioinformatics
  - goterm
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

GO-related analyses are commonly used in next-generation sequencing and microarray studies. To fully understand the meaning of these analyses, you first need to understand GO itself. This post covers the fundamentals of GO Terms.

## What Are GO Terms?

GO Terms are human-defined annotations specified by [The Gene Ontology Consortium](http://geneontology.org/docs/whoweare/). Because they are defined by humans, some have pointed out that they lack the objectivity of data sources like PFAM or KEGG.
That said, GO Terms are essentially the only annotations that incorporate biological knowledge, and thanks to the contributors their reliability has become quite high. As of 2021, annotations are based on experimental data from over 150,000 papers, and there are more than 700,000 experimentally supported annotations ([reference](http://geneontology.org/docs/introduction-to-go-resource/)). In practice, GO Terms are used as the ground truth in many analyses for predicting protein function.

Also, because GO Terms are manually curated, they are frequently updated. It is therefore recommended to use the most up-to-date GO Term list when performing analyses.

### File Format

GO Terms are written in OBO format and OWL format. You can parse OBO format using tools such as [goatools](https://github.com/tanghaibao/goatools)'s `obo_parser`. I am not very familiar with the file format details and would like to look into them further. Additionally, the subsets described below are also available in `json` format.

### Subsets

There are species-specific annotations available. For example, since animals do not perform photosynthesis, if you want to exclude photosynthesis-related GO Terms in advance, it would be appropriate to use these subsets.

## Contents of GO Terms

### Basic Elements

Each GO Term is composed of the following basic elements:

| Name          | Description                                                        | Example                                       |
| ------------- | ------------------------------------------------------------------ | --------------------------------------------- |
| Gene Product  | The annotated gene product                                         | UniProtKB:Q920D2 (rat Dhfr)                   |
| GO Term       | ID and name (description)                                          | GO:0004146 (dihydrofolate reductase activity) |
| Reference     | Paper providing evidence for the annotation                        |                                               |
| Evidence Code | Code indicating the type of evidence (experiment, phylogeny, etc.) | Inferred from Experiment (EXP)                |

### Extensions

Beyond the basic elements, several annotation extensions have been introduced. Extension annotations are broadly divided into two categories ([Huntley & Lovering 2017](https://link.springer.com/protocol/10.1007/978-1-4939-3743-1_17)):

- **Molecular relationships**, which describe relationships between genes, gene products, complexes, chemical compounds, etc.
- **Contextual relationships**, which describe relationships with cell types, anatomy, developmental stages, etc.

#### Molecular Relationships

| Name                  | Description | Example                                                               |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| has_regulation_target |             | has_regulation_target (UniProtKB:P08151 zinc finger protein GLI1)     |
| has_input             |             | has_input (PomBase:SPAC26H5.0 pcf2)                                   |
| has_direct_input      |             | has_direct_input (UniProtKB:Q7LBE3 Solute carrier family 26 member 9) |

#### Contextual Relationships

| Name           | Description | Example                                                         |
| -------------- | ----------- | --------------------------------------------------------------- |
| part_of        |             | part_of (WBbt:0006804 body wall muscle cell)                    |
| occurs_in      |             | occurs_in (CL:0000740 retinal ganglion cell)                    |
| happens_during |             | happens_during (GO:0071470 cellular response to osmotic stress) |

## Structure of GO Annotations

The overall GO Annotation is represented as a directed acyclic graph (DAG) where GO Terms are nodes and the relations defined below are edges, forming a hierarchical structure. The higher up in the hierarchy, the broader the meaning of the annotation.

The relations that express these hierarchical relationships are as follows ([reference](http://geneontology.org/docs/ontology-relations/)):

| Name      | Description                                                                                                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| is a      | The basic relation. When we say A is a B, A is a subtype of B.                                                                                                                                                               |
| part of   | A stronger constraint. When B is part of A, whenever B exists it is necessarily a part of A, guaranteeing that A exists. Note that this part_of is an edge relation, unlike the extension part_of which is node information. |
| has part  | When A has part B, B is a part of A. Whenever A exists, B must exist, but the existence of B does not necessarily imply that A exists.                                                                                       |
| regulates | Represents a regulatory relationship. For example, this includes influences from other pathways.                                                                                                                             |

The three top-level GO Term categories are listed below. Most analysis tools treat these nodes as the root nodes.

|                    | Abbreviation | Meaning                              |
| ------------------ | ------------ | ------------------------------------ |
| Biological Process | BP           | Biological processes                 |
| Molecular Function | MF           | Molecular functions of gene products |
| Cellular Component | CC           | Cellular components                  |

## References

- [Guide to GO evidence codes](http://geneontology.org/docs/guide-go-evidence-codes/)
- [Introduction to GO annotations](http://geneontology.org/docs/go-annotations/#annotation-extensions)
- [Relations in the Gene Ontology](http://geneontology.org/docs/ontology-relations/)
- Huntley R.P., Lovering R.C. (2017) Annotation Extensions. In: Dessimoz C., Skunca N. (eds) The Gene Ontology Handbook. Methods in Molecular Biology, vol 1446. Humana Press, New York, NY. https://doi.org/10.1007/978-1-4939-3743-1_17
