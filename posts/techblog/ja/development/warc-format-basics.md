---
uuid: fa046ad1-872c-48e3-8350-da50f0b88a9d
title: "WARC (Web ARChive) ファイルフォーマット入門"
description: "Webアーカイブの標準フォーマットであるWARC (ISO 28500) の構造とレコード型を解説し、wgetとwarcioを使った生成・読み取りの実例を紹介する。"
category: techblog
lang: ja
tags:
  - ai-generated
  - warc
  - web-archive
  - file-format
created_at: 2026-04-10
updated_at: 2026-04-10
---

Webアーカイブの標準ファイルフォーマットであるWARC (Web ARChive) の基礎を解説する。ISO 28500で規格化されたフォーマットの構造、レコード型、そして実際にWARCを生成・読み取るためのツールの使い方までを扱う。一方、大規模クローラーの設計やWARCを用いたリプレイシステムの実装は扱わない。

## TL;DR

- WARCは複数のHTTPリクエスト/レスポンスを1ファイルにまとめて保存するための標準フォーマットで、2009年にISO 28500として規格化されている
- ファイルは**レコードの連結**として構成され、各レコードはHTTPライクなヘッダーとコンテンツブロックを持つ。`warcinfo`/`request`/`response`/`revisit`など複数のレコード型を使い分ける
- Internet ArchiveやCommon Crawlといった主要なWebアーカイブプロジェクトが採用しており、`wget --warc-file`やPythonの`warcio`を使えば手元でも簡単に生成・解析できる

## 背景: なぜWebアーカイブに専用フォーマットが必要か

Webページを保存したいだけなら、単純にHTMLを`curl`でダウンロードしてディレクトリに並べればよさそうに見える。しかし実際のアーカイブには以下の要件がある。

- **リクエスト/レスポンスのペアを保持する** — あるコンテンツがどのURL・どのヘッダーで返されたかを後から検証できる必要がある
- **HTTPヘッダーを含める** — `Content-Type`や`Content-Encoding`、リダイレクトの`Location`など、再現には生のレスポンスヘッダーが必須
- **メタデータを記録する** — クロール日時、クローラーの識別子、ペイロードのハッシュ値といったアーカイブ固有の情報
- **大量のリソースを効率的に格納する** — 1クロールで数百万〜数十億のリソースが生成されるため、ファイルシステムに散らばらせると扱いきれない
- **重複排除** — 同一のリソースが繰り返し取得された場合、2回目以降は参照だけ記録したい

WARCはこれらの要件を満たすために設計されている。

### ARCフォーマットとの関係

WARCの直接の前身はInternet Archiveが1996年から使っていた **ARC形式** にあたる。ARCはURL、日時、Content-Length、そしてレスポンス本体を連結しただけの素朴なフォーマットで、クローラーのログ出力に近い。ARCはメタデータの種類が限定的で、リクエストヘッダーや重複排除情報を表現できなかった。

WARCはARCを一般化し、**任意の種類のレコードを同じファイルに混在させられる**ようにした点が最大の違い。ARCのレコードは実質的にレスポンスのみだが、WARCでは後述の通り複数のレコード型が定義されている。

## WARCファイルの全体像

WARCファイルは**レコードの連結**として構成される。1つのファイルには、しばしば数千〜数百万のレコードが順に詰め込まれる。

```text
+------------------+
| warcinfo record  |   ← ファイルの先頭。クローラーや設定の情報
+------------------+
| request record   |   ← 送信したHTTPリクエスト
+------------------+
| response record  |   ← 受信したHTTPレスポンス
+------------------+
| request record   |
+------------------+
| response record  |
+------------------+
|      ...         |
+------------------+
```

実運用ではファイル全体をgzipで圧縮して`.warc.gz`として配布するのが一般的。ここで重要なのは、gzipを**レコード単位**でかけるという点。ファイル全体を1つのgzipストリームにするのではなく、各レコードを個別に圧縮して連結する。gzip仕様はストリームの連結を許容しているため、通常のgzipデコーダで全体を展開できる。この仕組みのおかげで、ファイルの途中から特定のレコードだけを展開できる（ランダムアクセスが可能）。

### CDXインデックス

WARCそのものには目次がない。特定URLのレコードを高速に引くには、別途**CDXインデックス**を作成する。CDXはURL、タイムスタンプ、WARCファイル名、そしてレコードのバイトオフセットと長さを記録したテキストファイルで、Wayback Machineのようなリプレイシステムはこのインデックスを引いて該当レコードにシークする。CDX自体はWARC規格の外にあるが、事実上の標準となっている。

## レコードの構造

1つのレコードは3つの要素で構成される。

1. **バージョン行** — `WARC/1.1` のようにフォーマットのバージョンを宣言する
2. **WARCヘッダー** — HTTPヘッダーに似た`Key: Value`形式のメタデータ
3. **コンテンツブロック** — 実際のペイロード（HTTPリクエスト本体やレスポンス本体など）

ヘッダーとコンテンツブロックは空行（`\r\n`）で区切られ、各レコードの末尾には`\r\n\r\n`が付く。以下は最も単純な`response`レコードの例。

```text title=example.warc
WARC/1.1
WARC-Type: response
WARC-Record-ID: <urn:uuid:c34a9a2e-6f1d-4b8b-9d5c-2b4c9e0f1a2b>
WARC-Date: 2026-04-10T12:00:00Z
WARC-Target-URI: https://example.com/
Content-Type: application/http;msgtype=response
Content-Length: 142

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 42

<!doctype html><title>Hello</title><p>ok</p>
```

ポイントは、レコードの`Content-Type`が`application/http;msgtype=response`となっていること。つまり**レコードのコンテンツブロックはHTTPメッセージそのもの**であり、ステータス行からレスポンスボディまで生の形で格納される。WARCはその上にもう1段ヘッダーを被せてメタデータを付けているだけ、と考えるとわかりやすい。

### 必須ヘッダー

仕様で全レコードに必須とされるヘッダーは以下の4つ。

| ヘッダー         | 内容                                                |
| ---------------- | --------------------------------------------------- |
| `WARC-Type`      | レコードの種類。`warcinfo`/`response`/`request`など |
| `WARC-Record-ID` | レコードを一意に識別するURI。通常は`<urn:uuid:...>` |
| `WARC-Date`      | レコード作成日時。ISO 8601のUTC                     |
| `Content-Length` | コンテンツブロックのバイト数                        |

加えて、レコード型に応じて以下のようなヘッダーが使われる。

- `WARC-Target-URI` — アーカイブ対象のURL（`request`/`response`など）
- `WARC-Payload-Digest` — ペイロード（HTTPボディ）のハッシュ値。重複排除の判定に使う
- `WARC-Block-Digest` — コンテンツブロック全体のハッシュ値
- `WARC-Concurrent-To` — 同じ取得イベントに属する別レコード（例えば`response`と対になる`request`）を指す
- `WARC-Refers-To` — 別のレコードを参照する（`revisit`で元のレコードを指す）

## 主要なレコード型

WARC/1.1では8種類のレコード型が定義されている。実務でよく目にするのは以下の通り。

### warcinfo

WARCファイル自身のメタデータを記述するレコード。通常はファイルの先頭に1つ置く。コンテンツブロックはプレーンテキストで、クローラー名、バージョン、設定ファイルの内容などを自由形式で書く。

```text
WARC/1.1
WARC-Type: warcinfo
WARC-Record-ID: <urn:uuid:...>
WARC-Date: 2026-04-10T12:00:00Z
Content-Type: application/warc-fields
Content-Length: 86

software: Heritrix/3.4.0
format: WARC/1.1
robots: classic
hostname: crawler01.example.org
```

### request / response

HTTPのリクエストとレスポンスをそのまま格納する。実際のクロールデータの大部分はこの2つで占められる。`WARC-Concurrent-To`で対応する`request`と`response`を結びつける。

### resource

HTTPレイヤーの情報が不要な、生のリソースだけを格納するレコード。例えばFTPから取得したファイルや、クローラーが生成した派生物（スクリーンショットなど）を`resource`として記録する。

### revisit

**重複排除のためのレコード**。同じペイロードがすでにアーカイブされている場合、レスポンス本体を再度保存する代わりに`revisit`を記録する。`WARC-Refers-To`や`WARC-Refers-To-Target-URI`で元のレコードを指し、ペイロードのハッシュ値（`WARC-Payload-Digest`）で同一性を保証する。

大規模クロールでは同じ画像やCSSが何度も取得されるため、`revisit`の有無でアーカイブサイズが大きく変わる。Common Crawlの統計では`revisit`レコードが全体の相当部分を占めている。

### metadata

関連付けたい補助情報を格納するレコード。例えば抽出したリンク一覧、文字コード検出結果、言語判定の結果など、クロール後の処理で生成した情報を元のレコードに紐づけて保存する用途で使う。

### conversion / continuation

- `conversion` — 元レコードを別の形式に変換した結果を格納する（例: HTMLからプレーンテキストへの変換結果）
- `continuation` — 大きなペイロードを複数のレコードに分割したい場合に使う。巨大ファイル向けだが、実運用ではあまり見ない

## 実例: wgetでWARCを作る

WARCを作る最も手軽な方法は`wget`の`--warc-file`オプションを使うこと。以下のコマンドは`https://example.com/`を取得し、`example.warc.gz`として保存する。

```bash
TARGET_URL="https://example.com/"
OUTPUT="example"

wget \
  --warc-file="${OUTPUT}" \
  --warc-cdx \
  --delete-after \
  "${TARGET_URL}"
```

オプションの意味は以下の通り。

- `--warc-file=NAME` — `NAME.warc.gz`を出力する（拡張子は自動で付く）。gzip圧縮はデフォルトで有効。無効化したい場合は`--no-warc-compression`を追加する
- `--warc-cdx` — 同時にCDXインデックスも作成する
- `--delete-after` — 取得したファイル本体は残さず、WARCだけを残す

実行すると`example.warc.gz`と`example.cdx`が生成される。未確認だが、Heritrixのような本格的なクローラーを使う場合も出力フォーマットはWARCなので、wgetで作ったファイルとそのまま同じツールで扱える。

## 実例: warcioで読む

Pythonの[warcio](https://github.com/webrecorder/warcio)は、WARCの読み書きにもっとも広く使われているライブラリ。以下のスクリプトは先ほど生成した`example.warc.gz`を読み、`response`レコードだけを取り出してURLとステータスコードを表示する。

```python title=read_warc.py
from warcio.archiveiterator import ArchiveIterator

def main(path: str) -> None:
    with open(path, "rb") as f:
        for record in ArchiveIterator(f):
            if record.rec_type != "response":
                continue

            url = record.rec_headers.get_header("WARC-Target-URI")
            status = record.http_headers.get_statuscode()
            content_type = record.http_headers.get_header("Content-Type")

            print(f"{status} {content_type} {url}")

if __name__ == "__main__":
    main("example.warc.gz")
```

インストールと実行は以下の通り。

```bash
pip install warcio
python read_warc.py
```

出力例:

```text
200 text/html; charset=UTF-8 https://example.com/
```

`ArchiveIterator`はgzipストリームを透過的に扱い、レコード単位で反復する。各`record`オブジェクトは2種類のヘッダーを持つ点に注意したい。

- `record.rec_headers` — WARCレコードのヘッダー（`WARC-Target-URI`など）
- `record.http_headers` — コンテンツブロック内のHTTPヘッダー（`Content-Type`など）

先の「レコードはHTTPメッセージをラップしている」という構造が、そのままAPIに反映されている。

### ペイロードを取り出す

レスポンスボディを取得するには`record.content_stream()`を使う。これはgzipなど`Content-Encoding`を自動でデコードしてくれる。

```python
body = record.content_stream().read()
print(body[:200].decode("utf-8", errors="replace"))
```

生のバイト列（デコード前）が欲しい場合は`record.raw_stream`を使う。

## 周辺ツールとエコシステム

WARCを扱うツールは用途別にいくつかの層に分かれる。

- **クローラー** — [Heritrix](https://github.com/internetarchive/heritrix3) (Internet Archive)、[Browsertrix Crawler](https://github.com/webrecorder/browsertrix-crawler) (Webrecorder、PlaywrightベースでJavaScriptレンダリングに対応)、wget
- **読み書きライブラリ** — Pythonの`warcio`、Javaの`jwarc`、Rustの`warc`クレート
- **リプレイ（再生）** — [pywb](https://github.com/webrecorder/pywb) — CDXインデックスを引いてWARCから該当レコードを返し、ブラウザ上で過去のWebサイトを閲覧できるようにする。Wayback Machineのオープンソース実装と位置付けられる
- **大規模データセット** — [Common Crawl](https://commoncrawl.org/)は月次で数十億ページのクロールをWARC形式で公開している。S3上にファイルが置かれており、CDXインデックス経由で必要なレコードだけをダウンロードできる

実務でWARCに触れる場面としては、(1) 自分でクロールしてアーカイブを作る、(2) Common Crawlのような既存アーカイブを解析する、の2つが主。どちらも`warcio`のような読み取りライブラリが出発点になる。

## まとめ

WARCはWebアーカイブのための地味だが実用的なフォーマットで、**HTTPメッセージにもう1段メタデータを被せて連結しただけ**と理解すると全体像がつかみやすい。レコード単位のgzipとCDXインデックスの組み合わせでランダムアクセスを実現している点、そして`revisit`による重複排除で大規模クロールの現実的な運用を成り立たせている点が、フォーマットとしての巧さだと思う。

手元で試すには`wget --warc-file`と`warcio`の組み合わせが最短ルート。大規模データが欲しければCommon Crawlを引いてみると、同じフォーマットでTB単位のアーカイブがどう構成されているかを直接観察できる。

### 参考資料

- [ISO 28500:2017 — WARC file format](https://www.iso.org/standard/68004.html)
- [WARC 1.1 specification (IIPC)](https://iipc.github.io/warc-specifications/specifications/warc-format/warc-1.1/)
- [warcio — Python library](https://github.com/webrecorder/warcio)
- [Common Crawl — Get Started](https://commoncrawl.org/get-started)
