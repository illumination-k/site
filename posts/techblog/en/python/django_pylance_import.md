---
uuid: e3ab21c6-87bd-48cd-a011-c925b423164f
title: Fixing Pylance Import Resolution Issues in Django
description: Pylance is an excellent coding assistance extension, but it often fails to resolve imports. While this is tolerable for small-scale development, it becomes quite troublesome with Django. Here's how to fix it.
lang: en
category: techblog
tags:
  - python
  - django
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL; DR

Pylance is an excellent coding assistance extension, but it often fails to resolve imports. While this is tolerable for small-scale development, it becomes quite troublesome with something like Django. I looked into it and found a solution, so I'm documenting it here.

## The Situation

### Directory Structure

As the number of apps grows, you want to split them up. A common structure looks like this:

```
app
├── app1
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── migrations
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
├── app2
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── migrations
│   ├── models.py
│   ├── tests.py
│   ├── urls.py
│   └── views.py
├── config
│   ├── __init__.py
|   ...
└── manage.py
```

### The Problem

It is common to want to use a model defined in `app1` within `app2`.

For example, suppose you want to use a model from `app1` in `app2`'s `view.py`.

The straightforward approach is:

```python
from app1 import models
```

However, Pylance's autocompletion does not work and it shows the warning `Import "app1" could not be resolved`.

So you might think using a relative import would fix it:

```python
from ..app1 import models
```

Pylance stops showing the warning and autocompletion works.

However, when you actually try to start Django, you get `ValueError: attempted relative import beyond top-level package`.

There is also the `sys.path` approach, but writing it every time is tedious.

## The Solution

I could not find a way to solve this on the code side. So I took a forceful approach by adjusting Pylance's settings. Reading the [Pylance troubleshooting guide](https://github.com/microsoft/pylance-release/blob/main/TROUBLESHOOTING.md#unresolved-import-warnings), there is a section on **Unresolved import warnings**.

According to this, you should set `python.analysis.extraPaths` in `.vscode/settings.json`.

Create the following configuration:

```json title=".vscode/settings.json"
{
    "python.analysis.extraPaths": ["./app"]
}
```

Now try again:

```python
from app1 import models
```

This time, no warning is displayed and autocompletion works as well.
