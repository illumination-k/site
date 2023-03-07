---
uuid: 9da1ffd1-a76f-410b-a2d9-a44bb98b1f88
title: PythonのClassの生成に関してまとめてみた
description: PythonのClassは色々難しいので、勉強のためにまとめておきます。まずはClassの生成に関してです。__new__と__init__を中心にまとめています。
lang: ja
category: techblog
tags:
  - python
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

Pythonのクラス、色々ありすぎて難しいのでまとめます。まずはClassの生成についてです。

## Classの生成

- まず、`__new__`メソッドが呼ばれ、その後`__init__`メソッドが呼ばれる。
- `__new__`メソッド内では、クラス変数の定義などが行われる。`__init__`メソッド内では、インスタンス変数が定義できる。
- クラス変数は、**クラスから作成されたインスタンス全てが利用できる**変数で、インスタンス変数は**それぞれのインスタンスからのみ利用できる**変数。
- クラス変数はインスタンスが生成されていなくても使えて、クラス変数を利用するメソッドには`@classmethod`のデコレータを付けて明示する。
- 生成されたインスタンスは`self`、クラスそのものは`cls`と慣用的に命名される。

### `__new__`と`__init__`の挙動確認

```python
# -*- coding: utf-8 -*-
class Name:
    class_name = None # クラス変数

    def __new__(cls, name):
        print("new:", str(id(cls)))
        return super().__new__(cls)

    def __init__(self, name):
        print("==init==")
        print("id:", str(id(self)), "name:", name)
        self.name = name # インスタンス変数

    @classmethod
    def set_class_name(cls, class_name):
        cls.class_name = class_name

    @classmethod
    def print_class_name(cls):
        print(cls.class_name)

    @staticmethod
    def print_hi():
        print("hi!")
```

のようにクラスを定義します。`@staticmethod`はクラス変数にも生成されたインスタンス(`cls`, `self`を引数に取らない)メソッドのデコレータで、このメソッドもインスタンスが生成されてなくても使えます。

以下の様に、`@classmethod`や`@staticmethod`で定義されている部分については、インスタンスを生成しなくても使えていることがわかります。

```python
Name.print_class_name()
Name.set_class_name("A")
Name.print_class_name()
Name.print_hi()

# None
# A
# hi!
```

次にインスタンスの生成過程を見てみます。

```python
john = Name("John")
mike = Name("mike")

# new: 25652888
# ==init==
# id: 140347266309760 name: John

# new: 25652888
# ==init==
# id: 140347266309816 name: mike
```

インスタンスが生成された後のIDを見ると、`__new__`で生成されているIDは同じでクラス自身が生成されています。また、`__init__`で生成されているIDは異なっていて、違うインスタンスが生成されていることがわかります。

さらに、クラス変数を変更した場合の挙動を確認します。

```python
print("classname:", john.class_name, "name:", john.name)
print("classname:", mike.class_name, "name:", mike.name)
print("-" * 10)
mike.set_class_name("B")
print("classname:", john.class_name, "name:", john.name)
print("classname:", mike.class_name, "name:", mike.name)

# classname: A name: John
# classname: A name: mike
# ----------
# classname: B name: John
# classname: B name: mike
```

どちらかの側でクラス変数を変更すると、両方のインスタンスでクラス変数が変更されていることがわかります。

## `__new__`は何に使うのか

`__new__`の使用例としては、

1. そのクラスが何回呼び出されたのかを記録する
   - [(python) \_\_new\_\_と\_\_init\_\_の違いについて：具体例と解説](https://babaye.hatenablog.com/entry/2019/07/13/180916)
   - [Pythonのクラスコンストラクター。\_\_new\_\_と\_\_init\_\_](https://it-engineer-info.com/language/python/5686/)
2. tupleなどのimmutableなオブジェクトの初期化
   - [\_\_new\_\_ ってなに？](https://python.ms/new/)

3. メタクラスを利用してクラスを切り替える
   - [メタクラスとクラスデコレータってなに？](https://python.ms/metaclass/)
   - [\_\_new\_\_と\_\_init\_\とメタクラスと](https://qiita.com/FGtatsuro/items/49f907a809e53b874b18)
   - [[python]メタプログラミングの基礎(\_\_init\_\_, \_\_new\_\_, \_\_metaclass\_\_)](https://dackdive.hateblo.jp/entry/2015/08/02/100000)

などが挙げられます。公式的には、2，3が想定用途っぽいです (参考: [3. データモデル](https://docs.python.org/ja/3/reference/datamodel.html#basic-customization))。

> `__new__()` の主な目的は、変更不能な型 (int, str, tuple など) のサブクラスでインスタンス生成をカスタマイズすることにあります。また、クラス生成をカスタマイズするために、カスタムのメタクラスでよくオーバーライドされます。

## 動的なクラス定義

`type`が`object`の引数1つを取った場合、`object.__class__`を返します。これによって、以下のようにクラスを判別することができます。

```python
>>> n = 1
>>> type(n)
<class 'int'>
>>> n.__class__
<class 'int'>
```

クラスの生成のためには、`name, bases, dict`の3つの引数を取ります。これらの値は`__name__, __bases__, __dict__`に対応しています。`__bases__`は継承で、`()` or `(object,)`が最も基本的なクラスです。通常のクラス生成との対応は以下です。

```python
def __init__(self, name):
    self.name = name

A = type('A', (), dict(__init__=__init__, a='1'))

# 上と同義
class A:
    a = '1'
    def __init__(self, name):
        self.name = name

print(A)
# <class '__main__.A'>

print(A("NAME").name)
# "NAME"

type(A)
# <class 'type'>
```

つまり、通常のクラス生成は`__new__`内で`type`のインスタンス化が行われていた、ということです。ここで重要なのは、`type`は`class`です(参考: [組み込み関数](https://docs.python.org/ja/3/library/functions.html#type))。この辺りの関係性は[Pythonのオブジェクトとクラスのビジュアルガイド – 全てがオブジェクトであるということ](https://postd.cc/pythons-objects-and-classes-a-visual-guide/)などが参考になります。

なので、`type`を継承したクラスを使って`__new__`内でそのクラスを呼び出せば、クラスの生成を動的にカスタマイズできます。この概念がメタクラスです。
