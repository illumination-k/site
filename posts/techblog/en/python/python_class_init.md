---
uuid: 9da1ffd1-a76f-410b-a2d9-a44bb98b1f88
title: A Summary of Python Class Creation
description: Python classes are quite complex, so I'm summarizing them for study purposes. Starting with class creation, focusing on __new__ and __init__.
lang: en
category: techblog
tags:
  - python
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2026-03-25T00:00:00+00:00"
---

## TL;DR

Python classes have many aspects and can be quite complex, so let me summarize them. First, let's cover class creation.

## Class Creation

- First, the `__new__` method is called, followed by the `__init__` method.
- In the `__new__` method, class variables are defined. In the `__init__` method, instance variables can be defined.
- Class variables are variables **accessible by all instances created from the class**, while instance variables are variables **accessible only from each individual instance**.
- Class variables can be used even without creating an instance, and methods that use class variables are marked with the `@classmethod` decorator.
- By convention, the created instance is named `self`, and the class itself is named `cls`.

### Verifying the Behavior of `__new__` and `__init__`

```python
# -*- coding: utf-8 -*-
class Name:
    class_name = None # Class variable

    def __new__(cls, name):
        print("new:", str(id(cls)))
        return super().__new__(cls)

    def __init__(self, name):
        print("==init==")
        print("id:", str(id(self)), "name:", name)
        self.name = name # Instance variable

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

We define a class as shown above. `@staticmethod` is a decorator for methods that do not take `cls` or `self` as arguments (i.e., methods that do not access class variables or instance variables). These methods can also be used without creating an instance.

As shown below, the parts defined with `@classmethod` and `@staticmethod` can be used without creating an instance.

```python
Name.print_class_name()
Name.set_class_name("A")
Name.print_class_name()
Name.print_hi()

# None
# A
# hi!
```

Next, let's look at the instance creation process.

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

Looking at the IDs after instance creation, we can see that the ID generated in `__new__` is the same, meaning the class itself is being created. The IDs generated in `__init__` are different, confirming that different instances are being created.

Let's also verify the behavior when changing class variables.

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

When the class variable is changed from either side, the class variable is updated for both instances.

## What is `__new__` Used For?

Use cases for `__new__` include:

1. Recording how many times a class has been called
   - [(python) Difference between \_\_new\_\_ and \_\_init\_\_: Examples and Explanation](https://babaye.hatenablog.com/entry/2019/07/13/180916)
   - [Python Class Constructors: \_\_new\_\_ and \_\_init\_\_](https://it-engineer-info.com/language/python/5686/)
2. Initializing immutable objects such as tuples
   - [What is \_\_new\_\_?](https://python.ms/new/)

3. Switching classes using metaclasses
   - [What are Metaclasses and Class Decorators?](https://python.ms/metaclass/)
   - [\_\_new\_\_, \_\_init\_\_, and Metaclasses](https://qiita.com/FGtatsuro/items/49f907a809e53b874b18)
   - [[python] Basics of Metaprogramming (\_\_init\_\_, \_\_new\_\_, \_\_metaclass\_\_)](https://dackdive.hateblo.jp/entry/2015/08/02/100000)

The official intended use cases appear to be 2 and 3 (Reference: [3. Data Model](https://docs.python.org/ja/3/reference/datamodel.html#basic-customization)).

> The primary purpose of `__new__()` is to allow subclasses of immutable types (like int, str, tuple) to customize instance creation. It is also commonly overridden in custom metaclasses to customize class creation.

## Dynamic Class Definition

When `type` takes a single argument of type `object`, it returns `object.__class__`. This allows you to identify a class as follows:

```python
>>> n = 1
>>> type(n)
<class 'int'>
>>> n.__class__
<class 'int'>
```

To create a class, `type` takes three arguments: `name, bases, dict`. These correspond to `__name__, __bases__, __dict__`. `__bases__` is for inheritance, where `()` or `(object,)` represents the most basic class. The correspondence with normal class creation is as follows:

```python
def __init__(self, name):
    self.name = name

A = type('A', (), dict(__init__=__init__, a='1'))

# Equivalent to the above
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

In other words, normal class creation involves instantiating `type` within `__new__`. The important thing here is that `type` is a `class` (Reference: [Built-in Functions](https://docs.python.org/ja/3/library/functions.html#type)). The relationships around this are well explained in [A Visual Guide to Python's Objects and Classes -- Everything is an Object](https://postd.cc/pythons-objects-and-classes-a-visual-guide/).

So, by using a class that inherits from `type` and calling that class within `__new__`, you can dynamically customize class creation. This concept is the metaclass.

## Practical Examples of Metaclasses

A metaclass is a "class of a class." Just as a regular class defines the behavior of instances, a metaclass controls the creation process of the class itself. You can define a custom metaclass by inheriting from `type` and overriding `__new__`.

### Basic Metaclass -- Automatic Attribute Addition

As the simplest example, let's define a metaclass that automatically adds attributes during class creation.

```python
class AutoAttrMeta(type):
    def __new__(mcs, name, bases, namespace):
        # Automatically add attributes during class creation
        namespace["created_by"] = "AutoAttrMeta"
        namespace["class_info"] = f"Class '{name}' was created by AutoAttrMeta"
        cls = super().__new__(mcs, name, bases, namespace)
        return cls

class MyClass(metaclass=AutoAttrMeta):
    pass

class AnotherClass(metaclass=AutoAttrMeta):
    value = 42

print(MyClass.created_by)
# AutoAttrMeta

print(MyClass.class_info)
# Class 'MyClass' was created by AutoAttrMeta

print(AnotherClass.created_by)
# AutoAttrMeta

print(AnotherClass.value)
# 42
```

By specifying `metaclass=AutoAttrMeta`, `AutoAttrMeta.__new__` is called instead of `type.__new__` when the `class` statement is executed. The argument `mcs` is the metaclass itself (`AutoAttrMeta`), `name` is the class name, `bases` is a tuple of base classes, and `namespace` is a dictionary of attributes defined in the class body.

### Registry Pattern -- Automatic Class Registration

One of the most commonly used metaclass patterns in practice is automatic class registration (Registry). Simply defining a subclass automatically registers it in a dictionary, which can be used for plugin systems or serialization mechanisms.

```python
class RegistryMeta(type):
    _registry = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        # Don't register the base class itself
        if bases:
            mcs._registry[name] = cls
        return cls

    @classmethod
    def get_registry(mcs):
        return dict(mcs._registry)

class Serializer(metaclass=RegistryMeta):
    """Base class. This itself is not registered."""
    def serialize(self, data):
        raise NotImplementedError

class JSONSerializer(Serializer):
    def serialize(self, data):
        return f"JSON: {data}"

class XMLSerializer(Serializer):
    def serialize(self, data):
        return f"XML: {data}"

class CSVSerializer(Serializer):
    def serialize(self, data):
        return f"CSV: {data}"

# Subclasses are automatically registered just by defining them
print(RegistryMeta.get_registry())
# {'JSONSerializer': <class '__main__.JSONSerializer'>, 'XMLSerializer': <class '__main__.XMLSerializer'>, 'CSVSerializer': <class '__main__.CSVSerializer'>}

# Retrieve a class by name and instantiate it
serializer_name = "JSONSerializer"
serializer = RegistryMeta.get_registry()[serializer_name]()
print(serializer.serialize({"key": "value"}))
# JSON: {'key': 'value'}
```

In this pattern, defining a new subclass automatically registers it, preventing missed registrations. It is powerful in designs that require extensibility, such as plugin systems and command dispatching.

### Singleton Pattern -- Controlling Instance Creation

By overriding `__call__` in a metaclass, you can control the instance creation process. While `__new__` controls class creation, `__call__` controls behavior when that class is called (i.e., when an instance is created).

```python
class SingletonMeta(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            # Create an instance only on the first call
            instance = super().__call__(*args, **kwargs)
            cls._instances[cls] = instance
        return cls._instances[cls]

class Database(metaclass=SingletonMeta):
    def __init__(self, host="localhost"):
        self.host = host
        print(f"Database initialized: {host}")

class Logger(metaclass=SingletonMeta):
    def __init__(self, name="default"):
        self.name = name
        print(f"Logger initialized: {name}")

db1 = Database("production-server")
# Database initialized: production-server

db2 = Database("another-server")
# (No output. __init__ is not executed on the second call either)

print(db1 is db2)
# True

print(db1.host)
# production-server

# Different classes are singletons independently
logger = Logger("app")
# Logger initialized: app

print(db1 is logger)
# False
```

The important distinction here is the difference in roles between `__new__` and `__call__` in metaclasses:

- **`__new__`**: Called when the `class` statement is executed. Creates **the class object itself**.
- **`__call__`**: Called when a created class is invoked as `MyClass()`. Controls **instance** creation.

This distinction is analogous to the relationship between `__new__` (instance creation) and `__init__` (instance initialization) in regular classes, as explained at the beginning of this article. In metaclasses, the same kind of control happens one level higher.

## Summary

Metaclasses are a very powerful feature, but they are rarely needed in everyday Python programming. Since Python 3.6, `__init_subclass__` can be used to achieve use cases like the Registry pattern without metaclasses.

```python
class Serializer:
    _registry = {}

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Serializer._registry[cls.__name__] = cls

class JSONSerializer(Serializer):
    pass

print(Serializer._registry)
# {'JSONSerializer': <class '__main__.JSONSerializer'>}
```

Before using metaclasses, it is a good idea to first consider whether your goal can be achieved with decorators or `__init_subclass__`. If those are not sufficient, then it is time for metaclasses.
