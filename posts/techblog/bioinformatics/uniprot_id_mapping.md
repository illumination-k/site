---
uuid: 70eed700-3462-4870-b781-8ea552d35703
title: "UniprotのID mapping APIを利用した遺伝子IDの変換"
description: "遺伝子やタンパク質に関連する多様なデータベース間でのID変換方法を解説します。特に、UniprotのID Mappingサービスを使えば、Uniprot IDからEnsembl ID、NCBIのEntrez IDなど、主要なデータベース間での変換が簡単に行えます。APIも提供されているため、スクリプトやプログラムでの自動化も可能です。さらに、APIの利用方法や実際のコマンド例についても触れています。

このページでは、IDマッピングの手順を詳しく説明し、実際のコマンド例を含めた具体的な手順を紹介しています。APIを用いたプロセスをステップごとに説明しており、UniprotKBからUniRefへの変換、Ensemblへの変換例を取り上げています。"
category: "techblog"
lang: ja
tags: ["bioinformatics"]
created_at: 2024-09-28
updated_at: 2024-09-28
---

## TL;DR

bioinformaticsをやっていると、遺伝子のIDが星の数ほどあります。

このID同士の変換は結構めんどくさいですが、有名なものであれば、uniprotの[id mapping](https://www.uniprot.org/id-mapping/)を利用することで変換できます。
例えば、Uniprot IDからEnsembl IDやNCBIのentrez IDへの変換などができます。
uniprotのid mappingはAPIにも対応しているので、Python等から実行することも可能です。

[API Document](https://www.uniprot.org/help/id_mapping)もあるので、これを読めば簡単に実行できます。

## 変換できるIDの確認

以下のコマンドで確認できます。

```bash
curl https://rest.uniprot.org/configure/idmapping/fields
```

基本的にはそれぞれのgroupがあって、その中にどういうデータベースが存在して、名前が何なのか、というのが記述されています。listを表示するとだいたい以下のような感じです。

```bash
curl https://rest.uniprot.org/configure/idmapping/fields | jq '.groups[].groupName'
```

```
"UniProt"
"Sequence databases"
"3D structure databases"
"Protein-protein interaction databases"
"Chemistry"
"Protein family/group databases"
"PTM databases"
"Genetic variation databases"
"Proteomic databases"
"Protocols and materials databases"
"Genome annotation databases"
"Organism-specific databases"
"Phylogenomic databases"
"Enzyme and pathway databases"
"Miscellaneous"
"Gene expression databases"
"Family and domain databases"
```

Genome Annotation Databaseにどういうものがあるのかを見てます。Ensemblなんかはここです。

```bash
curl https://rest.uniprot.org/configure/idmapping/fields | \
    jq '.groups[] | select(.groupName == "Genome annotation databases")'
```

```json
{
  "groupName": "Genome annotation databases",
  "items": [
    {
      "displayName": "Ensembl",
      "name": "Ensembl",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://www.ensembl.org/id/%id"
    },
    {
      "displayName": "Ensembl Genomes",
      "name": "Ensembl_Genomes",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "http://www.ensemblgenomes.org/id/%id"
    },
    {
      "displayName": "Ensembl Genomes Protein",
      "name": "Ensembl_Genomes_Protein",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "http://www.ensemblgenomes.org/id/%id"
    },
    {
      "displayName": "Ensembl Genomes Transcript",
      "name": "Ensembl_Genomes_Transcript",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "http://www.ensemblgenomes.org/id/%id"
    },
    {
      "displayName": "Ensembl Protein",
      "name": "Ensembl_Protein",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://www.ensembl.org/id/%id"
    },
    {
      "displayName": "Ensembl Transcript",
      "name": "Ensembl_Transcript",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://www.ensembl.org/id/%id"
    },
    {
      "displayName": "GeneID",
      "name": "GeneID",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://www.ncbi.nlm.nih.gov/gene/%id"
    },
    {
      "displayName": "KEGG",
      "name": "KEGG",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://www.genome.jp/dbget-bin/www_bget?%id"
    },
    {
      "displayName": "PATRIC",
      "name": "PATRIC",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://www.patricbrc.org/view/Feature/%id"
    },
    {
      "displayName": "UCSC",
      "name": "UCSC",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://genome.ucsc.edu/cgi-bin/hgLinkIn?resource=uniprot&id=%primaryAccession"
    },
    {
      "displayName": "WBParaSite",
      "name": "WBParaSite",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://parasite.wormbase.org/id/%id"
    },
    {
      "displayName": "WBParaSite Transcript/Protein",
      "name": "WBParaSite_Transcript-Protein",
      "from": true,
      "to": true,
      "ruleId": 7,
      "uriLink": "https://parasite.wormbase.org/id/%id"
    }
  ]
}
```

## 流れ

APIをいくつか経由する必要があります。以下の3ステップです。

1. Submitting a job
2. Polling the status of a job
3. Fetching the result of a job

## bashでやってみる

公式の例にそって逐次処理を試します。

### 逐次処理

1. ジョブを投げます。UniprotKBからUniRefへの変換です。

```bash
curl --request POST 'https://rest.uniprot.org/idmapping/run' --form 'ids="P21802,P12345"' --form 'from="UniProtKB_AC-ID"' --form 'to="UniRef90"'
```

json形式でjob idがもらえます。

```json
{ "jobId": "6387ece4eb3305097b61ffb3601c18f4b7d92242" }
```

2. jobの結果を見ます。redirectでジョブの結果が見れるようになっているので、HeaderのLocationを確認します。

```bash
curl -i 'https://rest.uniprot.org/idmapping/status/6387ece4eb3305097b61ffb3601c18f4b7d92242'
```

```
HTTP/2 303 
vary: accept,accept-encoding,x-uniprot-release,x-api-deployment-date
vary: User-Agent
cache-control: no-cache
content-type: application/json
access-control-allow-credentials: true
access-control-expose-headers: Link, X-Total-Results, X-UniProt-Release, X-UniProt-Release-Date, X-API-Deployment-Date
x-api-deployment-date: 24-July-2024
strict-transport-security: max-age=31536000; includeSubDomains
date: Sat, 28 Sep 2024 09:52:30 GMT
access-control-max-age: 1728000
x-uniprot-release: 2024_04
location: https://rest.uniprot.org/idmapping/uniref/results/6387ece4eb3305097b61ffb3601c18f4b7d92242
access-control-allow-origin: *
access-control-allow-methods: GET, PUT, POST, DELETE, PATCH, OPTIONS
access-control-allow-headers: DNT,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization
x-uniprot-release-date: 24-July-2024

{"jobStatus":"FINISHED"}
```

3. 結果を確認する

`location: https://rest.uniprot.org/idmapping/uniref/results/6387ece4eb3305097b61ffb3601c18f4b7d92242`みたいなのが出てきます。これを叩くと結果が確認できます。
結果は長いので畳んでいます。

:::details[結果]

```json
{
  "results": [
    {
      "from": "P21802",
      "to": {
        "id": "UniRef90_P21802",
        "name": "Cluster: Fibroblast growth factor receptor 2",
        "updated": "2024-07-24",
        "entryType": "UniRef90",
        "commonTaxon": { "scientificName": "Amniota", "taxonId": 32524 },
        "memberCount": 132,
        "organismCount": 77,
        "representativeMember": {
          "memberIdType": "UniProtKB ID",
          "memberId": "FGFR2_HUMAN",
          "organismName": "Homo sapiens (Human)",
          "organismTaxId": 9606,
          "sequenceLength": 821,
          "proteinName": "Fibroblast growth factor receptor 2",
          "accessions": [
            "P21802",
            "B4DFC2",
            "E7EVR6",
            "E9PCR0",
            "P18443",
            "Q01742",
            "Q12922",
            "Q14300",
            "Q14301",
            "Q14302",
            "Q14303",
            "Q14304",
            "Q14305",
            "Q14672",
            "Q14718",
            "Q14719",
            "Q1KHY5",
            "Q86YI4",
            "Q8IXC7",
            "Q96KL9",
            "Q96KM0",
            "Q96KM1",
            "Q96KM2",
            "Q9NZU2",
            "Q9NZU3",
            "Q9UD01",
            "Q9UD02",
            "Q9UIH3",
            "Q9UIH4",
            "Q9UIH5",
            "Q9UIH6",
            "Q9UIH7",
            "Q9UIH8",
            "Q9UM87",
            "Q9UMC6",
            "Q9UNS7",
            "Q9UQH7",
            "Q9UQH8",
            "Q9UQH9",
            "Q9UQI0"
          ],
          "uniref50Id": "UniRef50_P21802",
          "uniref100Id": "UniRef100_P21802",
          "uniparcId": "UPI000012A72A",
          "sequence": {
            "value": "MVSWGRFICLVVVTMATLSLARPSFSLVEDTTLEPEEPPTKYQISQPEVYVAAPGESLEVRCLLKDAAVISWTKDGVHLGPNNRTVLIGEYLQIKGATPRDSGLYACTASRTVDSETWYFMVNVTDAISSGDDEDDTDGAEDFVSENSNNKRAPYWTNTEKMEKRLHAVPAANTVKFRCPAGGNPMPTMRWLKNGKEFKQEHRIGGYKVRNQHWSLIMESVVPSDKGNYTCVVENEYGSINHTYHLDVVERSPHRPILQAGLPANASTVVGGDVEFVCKVYSDAQPHIQWIKHVEKNGSKYGPDGLPYLKVLKAAGVNTTDKEIEVLYIRNVTFEDAGEYTCLAGNSIGISFHSAWLTVLPAPGREKEITASPDYLEIAIYCIGVFLIACMVVTVILCRMKNTTKKPDFSSQPAVHKLTKRIPLRRQVTVSAESSSSMNSNTPLVRITTRLSSTADTPMLAGVSEYELPEDPKWEFPRDKLTLGKPLGEGCFGQVVMAEAVGIDKDKPKEAVTVAVKMLKDDATEKDLSDLVSEMEMMKMIGKHKNIINLLGACTQDGPLYVIVEYASKGNLREYLRARRPPGMEYSYDINRVPEEQMTFKDLVSCTYQLARGMEYLASQKCIHRDLAARNVLVTENNVMKIADFGLARDINNIDYYKKTTNGRLPVKWMAPEALFDRVYTHQSDVWSFGVLMWEIFTLGGSPYPGIPVEELFKLLKEGHRMDKPANCTNELYMMMRDCWHAVPSQRPTFKQLVEDLDRILTLTTNEEYLDLSQPLEQYSPSYPDTRSSCSSGDDSVFSPDPMPYEPCLPQYPHINGSVKT",
            "length": 821,
            "molWeight": 92025,
            "crc64": "6CD5001C960ED82F",
            "md5": "8278583234A3EDA2A192D8BB50E1FAB8"
          }
        },
        "seedId": "A0A6J2D1E3",
        "memberIdTypes": [
          "UniProtKB Unreviewed (TrEMBL)",
          "UniProtKB Reviewed (Swiss-Prot)",
          "UniParc"
        ],
        "members": [
          "P21802",
          "P21803",
          "A0A6J2D1E3",
          "A0A8C7ANU4",
          "A0A8U0SV68",
          "A0A673SQ31",
          "A0A2J8PBY1",
          "A1YYN9",
          "A0A8C0AIU6",
          "A0A8C6GPM7"
        ],
        "organisms": [
          {
            "scientificName": "Homo sapiens",
            "commonName": "Human",
            "taxonId": 9606
          },
          {
            "scientificName": "Mus musculus",
            "commonName": "Mouse",
            "taxonId": 10090
          },
          {
            "scientificName": "Zalophus californianus",
            "commonName": "California sealion",
            "taxonId": 9704
          },
          {
            "scientificName": "Neovison vison",
            "commonName": "American mink",
            "taxonId": 452646
          },
          {
            "scientificName": "Mustela putorius furo",
            "commonName": "European domestic ferret",
            "taxonId": 9669
          },
          {
            "scientificName": "Suricata suricatta",
            "commonName": "Meerkat",
            "taxonId": 37032
          },
          {
            "scientificName": "Pan troglodytes",
            "commonName": "Chimpanzee",
            "taxonId": 9598
          },
          {
            "scientificName": "Bos mutus grunniens",
            "commonName": "Wild yak",
            "taxonId": 30521
          },
          {
            "scientificName": "Mus spicilegus",
            "commonName": "Steppe mouse",
            "taxonId": 10103
          },
          {
            "scientificName": "Bos indicus x Bos taurus",
            "commonName": "Hybrid cattle",
            "taxonId": 30522
          }
        ],
        "goTerms": [
          { "goId": "GO:0005007", "aspect": "GO Molecular Function" },
          { "goId": "GO:0005524", "aspect": "GO Molecular Function" },
          { "goId": "GO:0005794", "aspect": "GO Cellular Component" },
          { "goId": "GO:0005886", "aspect": "GO Cellular Component" },
          { "goId": "GO:0008284", "aspect": "GO Biological Process" }
        ]
      }
    },
    {
      "from": "P12345",
      "to": {
        "id": "UniRef90_P12345",
        "name": "Cluster: Aspartate aminotransferase, mitochondrial",
        "updated": "2024-07-24",
        "entryType": "UniRef90",
        "commonTaxon": { "scientificName": "Eutheria", "taxonId": 9347 },
        "memberCount": 26,
        "organismCount": 22,
        "representativeMember": {
          "memberIdType": "UniProtKB ID",
          "memberId": "AATM_RABIT",
          "organismName": "Oryctolagus cuniculus (Rabbit)",
          "organismTaxId": 9986,
          "sequenceLength": 430,
          "proteinName": "Aspartate aminotransferase, mitochondrial",
          "accessions": ["P12345", "G1SKL2"],
          "uniref50Id": "UniRef50_P00507",
          "uniref100Id": "UniRef100_P12345",
          "uniparcId": "UPI0001C61C61",
          "sequence": {
            "value": "MALLHSARVLSGVASAFHPGLAAAASARASSWWAHVEMGPPDPILGVTEAYKRDTNSKKMNLGVGAYRDDNGKPYVLPSVRKAEAQIAAKGLDKEYLPIGGLAEFCRASAELALGENSEVVKSGRFVTVQTISGTGALRIGASFLQRFFKFSRDVFLPKPSWGNHTPIFRDAGMQLQSYRYYDPKTCGFDFTGALEDISKIPEQSVLLLHACAHNPTGVDPRPEQWKEIATVVKKRNLFAFFDMAYQGFASGDGDKDAWAVRHFIEQGINVCLCQSYAKNMGLYGERVGAFTVICKDADEAKRVESQLKILIRPMYSNPPIHGARIASTILTSPDLRKQWLQEVKGMADRIIGMRTQLVSNLKKEGSTHSWQHITDQIGMFCFTGLKPEQVERLTKEFSIYMTKDGRISVAGVTSGNVGYLAHAIHQVTK",
            "length": 430,
            "molWeight": 47409,
            "crc64": "12F54284974D27A5",
            "md5": "CF84DAC1BDDD05632A89E4C1F186D0D3"
          }
        },
        "seedId": "UPI001E1B1319",
        "memberIdTypes": [
          "UniProtKB Unreviewed (TrEMBL)",
          "UniProtKB Reviewed (Swiss-Prot)",
          "UniParc"
        ],
        "members": [
          "P12345",
          "A0A5F9DR01",
          "A0A5S8H2S7",
          "A0A091ELC8",
          "A0A250YHV8",
          "A0A1U7UNG8",
          "A0A9B0WQM0",
          "A0A1S3EVA8",
          "A0A8L2Q7Q0",
          "A0A2K5JB63"
        ],
        "organisms": [
          {
            "scientificName": "Oryctolagus cuniculus",
            "commonName": "Rabbit",
            "taxonId": 9986
          },
          {
            "scientificName": "Fukomys damarensis",
            "commonName": "Damaraland mole rat",
            "taxonId": 885580
          },
          {
            "scientificName": "Castor canadensis",
            "commonName": "American beaver",
            "taxonId": 51338
          },
          {
            "scientificName": "Carlito syrichta",
            "commonName": "Philippine tarsier",
            "taxonId": 1868482
          },
          {
            "scientificName": "Chrysochloris asiatica",
            "commonName": "Cape golden mole",
            "taxonId": 185453
          },
          {
            "scientificName": "Dipodomys ordii",
            "commonName": "Ord's kangaroo rat",
            "taxonId": 10020
          },
          {
            "scientificName": "Rattus norvegicus",
            "commonName": "Rat",
            "taxonId": 10116
          },
          {
            "scientificName": "Colobus angolensis palliatus",
            "commonName": "Peters' Angolan colobus",
            "taxonId": 336983
          },
          {
            "scientificName": "Rhinopithecus roxellana",
            "commonName": "Golden snub-nosed monkey",
            "taxonId": 61622
          },
          {
            "scientificName": "Muntiacus muntjak",
            "commonName": "Barking deer",
            "taxonId": 9888
          }
        ],
        "goTerms": [
          { "goId": "GO:0030170", "aspect": "GO Molecular Function" },
          { "goId": "GO:0005829", "aspect": "GO Cellular Component" },
          { "goId": "GO:0009058", "aspect": "GO Biological Process" },
          { "goId": "GO:0006520", "aspect": "GO Biological Process" }
        ]
      }
    }
  ]
}
```

:::

### 適当にScript化する

jobIdをjqで取得し、それがredirectされるまでstatusを確認します。
redirectできることがわかればredirectするようにcurlしmす。

```bash title=uniprot-id-mapping.sh
#!/bin/bash

from=$1
to=$2
ids=$3

# submit job
jobId=$(curl --request POST 'https://rest.uniprot.org/idmapping/run' --form "ids=${ids}" --form "from=${from}" --form "to=${to}" | jq .jobId -r)
echo "jobId: $jobId"

# redirect responseが帰ってくるまでpollingする

pollingUrl=https://rest.uniprot.org/idmapping/status/$jobId
echo "pollingUrl: $pollingUrl"

for i in $(seq 5); do
    responseCode=$(curl -s -o /dev/null -w "%{http_code}" $pollingUrl)
    echo "trial ${i}: $responseCode"
    if [ $responseCode -eq 303 ]; then
        break
    fi
    sleep 3
done

# output result

curl -L "https://rest.uniprot.org/idmapping/status/${jobId}/"
```

例えばuniprotをensemblに変えたければ以下のように変換可能です。

```bash
bash uniprot-id-mapping.sh UniProtKB_AC-ID Ensembl "P21802,P12345"
```

```
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   433    0    52  100   381     53    390 --:--:-- --:--:-- --:--:--   443
jobId: 14e388f2fc341e38b8c7b164d501c0f31212e732
pollingUrl: https://rest.uniprot.org/idmapping/status/14e388f2fc341e38b8c7b164d501c0f31212e732
trial 1: 303
{"results":[{"from":"P21802","to":"ENSG00000066468.24"}],"failedIds":["P12345"]}
```

## その他

requestを投げるだけなので、他の言語等でも簡単に扱えます。
[公式Docs](https://www.uniprot.org/help/id_mapping)にはPythonで書かれたExampleがあります。
