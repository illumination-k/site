---
uuid: 2765c476-939f-4f14-8520-83dd3dd2ada2
title: Comparing Polars, a Rust DataFrame Crate, with pandas
description: I discovered that Rust actually has a pandas-like crate, so I put together a comparison of corresponding operations. No guarantees these are optimal solutions.
lang: en
category: techblog
tags:
  - rust
  - python
  - polars
created_at: "2022-05-20T18:42:50+00:00"
updated_at: "2022-05-20T18:42:50+00:00"
---

## TL;DR

I discovered that Rust actually has a pandas-like crate, so I put together a comparison of corresponding operations between polars and pandas. No guarantees these are optimal solutions. Also note that there are fairly frequent breaking changes between versions, so be careful about the version you use.

Using this crate, you can potentially process large files much faster, but since it is Rust after all, it does not feel quite as lightweight as Python.

You can run it on Jupyter using [excvr](https://github.com/google/evcxr). Using Jupyter Lab made it very convenient to compare Python and Rust side by side.

![jupyter-image](../../public/polars_pandas/jupyter_image.png)

However, I found it a bit inconvenient that there is no code completion or type inference. I also tried setting up `rust-analyzer` support. Completion started working, but it still felt lacking compared to VSCode.\
Here is a sample notebook. You can launch it with docker-compose.

::gh-card[illumination-k/polars-pandas]

## polars

A DataFrame library based on [Apache Arrow](https://arrow.apache.org). There is also something called py-polars, which is supposedly faster than pandas. The [polars GitHub repo](https://github.com/ritchie46/polars) README includes benchmark tests. In terms of usability, I feel it is more similar to R's tidyverse than to pandas.

### ChunkedArray

One distinctive feature is the `ChunkedArray` struct, which can be converted from a `Series`. Since `ChunkedArray` is typed, it supports a variety of operations. Also, when selecting rows based on conditions, you need to use `ChunkedArray<BooleanType>`.

## Install

By choosing features, you can enable date conversion, ndarray conversion, random sampling, and more. This time we will try ndarray and random sampling. We will also add anyhow for error handling.

```toml title=Cargo.toml
[dependencies]
anyhow = "1.0"
polars = { version = "0.18.0", features = ["ndarray", "random"] }
```

When using Jupyter:

```
:dep polars = { version = "0.18.0", features = ["ndarray", "random"]}
```

Rust version 1.52 or higher is required.

Install pandas using your preferred package manager.

The Rust side shows code corresponding to the `todo!()` section below.

```rust
use anyhow::Result;
use polars::prelude::*;

fn main() -> Result<()> {
    todo!();
    Ok(())
}
```

The Python side assumes the following import has been done.

```python
import pandas as pd
print(pd.__version__)
# 1.3.4
```

## Operations on Series, DataFrame, and ChunkedArray

This section is quite long, so it is collapsed. ChunkedArray supports most arithmetic operations. It is worth reviewing the Series comparison section, as it is needed for conditional row selection.

:::details[number and Series]

| Operation | vs number |
| --------- | --------- |
| `add`     | `s + 1`   |
| `sub`     | `s - 1`   |
| `div`     | `s / 1`   |
| `mul`     | `s * 1`   |

:::

:::details[Series and Series]

| Operation | Syntax                |
| --------- | --------------------- |
| `add`     | `&s1 + &s2`           |
| `sub`     | `&s1 - &s2`           |
| `div`     | `&s1 / &s2`           |
| `mul`     | `&s1 * &s2`           |
| `mod`     | `&s1 % &s2`           |
| `eq`      | `s1.series_equal(s2)` |

:::

:::details[DataFrame and Series]

| Operation | Syntax     |
| --------- | ---------- |
| `add`     | `&df + &s` |
| `sub`     | `&df - &s` |
| `div`     | `&df / &s` |
| `mul`     | `&df * &s` |
| `mod`     | `&df % &s` |

:::

:::details[Series operations]

| Operation | Syntax        |
| --------- | ------------- |
| sum       | `s.sum<T>()`  |
| max       | `s.max<T>()`  |
| min       | `s.min<T>()`  |
| mean      | `s.mean<T>()` |

:::

:::details[Series comparisons]

You can compare Series with other Series or with numbers.

| Operation | vs Series          | vs number         |
| --------- | ------------------ | ----------------- |
| `=`       | `s1.equal(s2)`     | `s1.equal(1)`     |
| `!=`      | `s1.not_equal(s2)` | `s1.not_equal(1)` |
| `>`       | `s1.gt(s2)`        | `s1.gt(1)`        |
| `=>`      | `s1.gt_eq(s2)`     | `s1.gt_eq(1)`     |
| `<`       | `s1.lt(s2)`        | `s1.lt(1)`        |
| `<=`      | `s1.lt_eq(s2)`     | `s1.lt_eq(1)`     |

:::

:::details[DataFrame operations]

| Operation | Syntax        |
| --------- | ------------- |
| sum       | `df.sum()`    |
| max       | `df.max()`    |
| min       | `df.min()`    |
| median    | `df.median()` |
| mean      | `df.mean()`   |
| var       | `df.var()`    |
| std       | `df.std()`    |

:::

:::details[ChunkedArray operations]

ChunkedArray supports most arithmetic operations. The available operators are:

- \+
- \-
- /
- \*
- %
- pow

Additionally, `ChunkedArray<BooleanType>` supports `&` and `|` bitwise operations.

Comparisons work the same way as with Series.

```rust
c1.lt(c2);
```

You can also use Iterator- and Vector-style operations such as:

- map
- fold
- is_empty
- contains
- len

among others.

Furthermore, `ChunkedArray<Utf8Type>` supports `to_lowercase`, `to_upper_case`, `replace`, and similar string methods.

With the default `temporal` feature, you can also parse dates and times.

:::

## Creating a Series

The name is optional.

```python
s = pd.Series([1, 2, 3], name="s")
```

When using `new`, the name is required. When using `collect`, the name defaults to an empty string.

```rust
let s = Series::new("s", [1, 2, 3]);
let t: Series = [1, 2, 3].iter().collect();
```

## Creating a DataFrame

```python
df = pd.DataFrame({
    "A": ["a", "b", "a"],
    "B": [1, 3, 5],
    "C": [10, 11, 12],
    "D": [2, 4, 6]
})
```

The macro is convenient.

```rust
let s =
let mut df = df!("A" => &["a", "b", "a"],
             "B" => &[1, 3, 5],
             "C" => &[10, 11, 12],
             "D" => &[2, 4, 6]
    )?;
```

## Column Selection

```python
df["A"]
df[["A", "B"]]
```

Using `select` returns a `Result<DataFrame>`.

```rust
df.select("A")?;
df.select(("A", "B"))?;
df.select(vec!["A", "B", "C"])?;
```

Using `column` returns a `Result<Series>`.

```rust
df.column("A")?;
```

## Conditional Column Selection

In both cases, you retrieve the columns and apply filtering. I personally prefer the pandas approach using str methods.\
In Rust, you can get the columns with `get_columns`. I wish there were a more elegant way to do this...

```python
df.loc[:, [c.startswith("A") for c in df.columns]]
df.loc[:, df.columns.str.startswith("A")]
```

```rust
df.select(&df.get_column_names()
            .iter()
            .filter(|x| x.starts_with("A"))
            .map(|&x| x)
            .collect::<Vec<&str>>()
        )?;
```

## Reordering Columns

```python
df[["B", "A"]]
```

```rust
df.select(("B", "A"))?;
```

## Adding Columns

```python
df["E"] = df["B"] * 2
df["F"] = df["B"].map(lambda x: x * 2)
df = df.assign(G = lambda df: df.B * 2)
```

In polars, you can add columns using the `with_column` or `replace_or_add` functions.\
I could not find a convenient function like `assign`. For basic arithmetic and simple operations, you can convert to Series and compute. I feel like the two `to_owned()` calls could be eliminated, but I was not able to figure out how.\
When you want to use a closure, first convert to a `ChunkedArray` and then use `apply` or `map`. `Series` is untyped, but `ChunkedArray` is typed, enabling arithmetic operations.\
The `DataFrame` struct has an `apply` method, but since it takes `&mut self`, it modifies the original. So you need to either use `select` or `clone` first -- I wonder which one is faster.

```rust
df.with_column(df.column("B").unwrap()
                .i32().unwrap()
                .apply(|x| x * 2)
                .into_series()
                .rename("E")
                .to_owned());
df.with_column(Series::new("F", &[2, 6, 10]));
df.with_column(df.select("B").unwrap()
                 .rename("B", "G").unwrap()
                 .apply("G", |x| x * 2).unwrap()
                 .column("G").unwrap()
                 .to_owned());

df.with_column(df.column("B").unwrap().to_owned().rename("H").to_owned() * 2);
df.replace_or_add("I", Series::new("I", &[2, 6, 10])).unwrap();
```

## Conditional Row Selection

### Single Condition

```python
df.loc[df["B"] <= 4]
df.query("B <= 4")
```

```rust
df.filter(&df.column("B")?.lt_eq(4))?;
```

### Multiple Conditions

```python
df.loc[(df["B"] == 1) | (df["C"] == 12)]
df.query("B == 1 | C == 12")
```

ChunkedArray supports bitwise operations.

```rust
df.filter(&(
    df.column("B")?.eq(1)? | df.column("C").eq(12)?
))
```

### Membership Testing

```python
l = [1, 3]
df.query("B in @l")
```

I could only find a way to do this by converting to a ChunkedArray. Since `apply` returns Self, you cannot convert from `ChunkedArray<Int32Type>` to `ChunkedArray<BooleanType>`. Therefore, you need to use `map` followed by `collect`.

```rust
let v: Vec<i32> = vec![1, 2];
let mask: ChunkedArray<BooleanType> = df.column("B").unwrap().i32()
            .unwrap().into_iter().map(|x| v.contains(&x.unwrap())).collect();
df.filter(&mask)
```

## GroupBy

Prepare a DataFrame for GroupBy operations.

```python
dates = [
"2020-08-21",
"2020-08-21",
"2020-08-22",
"2020-08-23",
"2020-08-22",
]

temp = [20, 10, 7, 9, 1]
rain = [0.2, 0.1, 0.3, 0.1, 0.01]

d = dict(
    date=dates,
    temp=temp,
    rain=rain
)

df = pd.DataFrame.from_dict(d)
```

```rust
// docs example

let dates = &[
"2020-08-21",
"2020-08-21",
"2020-08-22",
"2020-08-23",
"2020-08-22",
];
// date format
let fmt = "%Y-%m-%d";
// create date series
let s0 = DateChunked::parse_from_str_slice("date", dates, fmt)
        .into_series();
// create temperature series
let s1 = Series::new("temp", [20, 10, 7, 9, 1].as_ref());
// create rain series
let s2 = Series::new("rain", [0.2, 0.1, 0.3, 0.1, 0.01].as_ref());
// create a new DataFrame
let df = DataFrame::new(vec![s0, s1, s2]).unwrap();
println!("{:?}", df);

// shape: (5, 3)
// +--------------+------+------+
// | date         | temp | rain |
// | ---          | ---  | ---  |
// | date32(days) | i32  | f64  |
// +==============+======+======+
// | 2020-08-21   | 20   | 0.2  |
// +--------------+------+------+
// | 2020-08-21   | 10   | 0.1  |
// +--------------+------+------+
// | 2020-08-22   | 7    | 0.3  |
// +--------------+------+------+
// | 2020-08-23   | 9    | 0.1  |
// +--------------+------+------+
// | 2020-08-22   | 1    | 0.01 |
// +--------------+------+------+
```

### Built-in Operations

polars supports the following built-in aggregation operations:

- count
- first
- last
- sum
- min
- max
- mean
- median
- var
- std
- count
- quantile
- n_unique

The usage pattern is:

1. GroupBy on a specific column
2. Select the columns to aggregate (all columns if unspecified)
3. Apply the aggregation

#### Single Aggregation

```python
df.groupby("date").var()
df.groupby("date")[["temp"]].sum()
```

```rust
df.groupby("date").unwrap().var();
df.groupby("date").unwrap().select("temp").sum();
```

#### Multiple Aggregations

```python
import numpy as np
df.groupby("date").agg({"temp": [np.mean, np.var], "rain": [np.std]})
```

```rust
df.groupby("date").unwrap()
    .agg(&[("temp", &["sum", "min"]), ("rain", &["count", "first"])])
```

### Custom Aggregations

```python
df.groupby("date").apply(lambda x: print(x))
```

The return value of `apply` must be `Result<DataFrame>`.

```rust
df.groupby("date").unwrap()
    .apply(|x| { println!("{:?}", x); Ok(x)});
```

## hstack, vstack (concat)

These correspond to pandas' `concat`. Note that these are different from pandas' `stack`. pandas fills mismatched rows with NaN, whereas polars raises an error.

Prepare the DataFrames.

```python
df1 = pd.DataFrame({"A": [1, 2, 3], "B": [2, 3, 4]})
df1_t = pd.DataFrame({"A": [4, 5, 6], "B": [5, 6, 7]})
df2 = pd.DataFrame({"C": ["a", "b", "c"], "D": [0.1, 0.2, 0.3]})
s1 = pd.Series([10, 11, 12], name="s1")
s2 = pd.Series(["ABC", "NMK", "XYZ"], name="s2")
```

```rust
let df1 = df!(
    "A" => &[1, 2, 3],
    "B" => &[2, 3, 4]
).unwrap();

let df1_t = df!(
    "A" => &[4, 5, 6],
    "B" => &[5, 6, 7]
).unwrap();


let df2 = df!(
    "C" => &["a", "b", "c"],
    "D" => &[0.1, 0.2, 0.3]
).unwrap();

let s1 = Series::new("S1", [10, 11, 12]);
let s2 = Series::new("S2", ["ABC", "NMK", "XYZ"]);
```

### hstack

```python
pd.concat([df1, s1, s2], axis=1)
pd.concat([df1, df2], axis=1)
```

```rust
df1.hstack(&[s1, s2])
// If you want to force horizontal stacking of two DataFrames, you can do it like this.
let s_vec: Vec<Series> = df2.iter().map(|s| s.clone()).collect();
df1.hstack(&s_vec)
```

### vstack

```python
pd.concat([df1, df2]) # Mismatched column names are filled with NaN.
pd.concat([df1, df1_t])
```

```rust
df1.vstack(&df2) // error
df1.vstack(&df1_t)
```

## Join

While pandas has a DataFrame `join` method, I use `merge` more often, so I will use that here.

```python
df1 = pd.DataFrame({
    "Fruit": ["Apple", "Banana", "Pear"],
    "Origin": ["America", "Hawai", "Italy"],
    "Phosphorus (mg/100g)": [11, 22, 12]
})

df2 = pd.DataFrame({
    "Name": ["Apple", "Banana", "Pear"],
    "Origin": ["France", "Hawai", "Italy"],
    "Potassium (mg/100g)": [107, 358, 115]})

pd.merge(
    df1, df2,
    left_on="Fruit", right_on="Name",
how="inner")

pd.merge(
    df1, df2,
    left_on=["Fruit", "Origin"], right_on=["Name", "Origin"],
    how="outer"
)

pd.merge(
    df1, df2,
    left_on="Origin", right_on="Origin",
    how="left"
)
```

In polars, you can use the DataFrame's `join` method. `inner_join`, `left_join`, and `outer_join` are wrappers around `join`.
The argument `S: Selection` accepts `&str`, `&[&str]`, `Vec<&str>`, and similar types.

```rust
let df1: DataFrame = df!("Fruit" => &["Apple", "Banana", "Pear"],
                         "Origin" => &["America", "Hawai", "Italy"],
                         "Phosphorus (mg/100g)" => &[11, 22, 12]).unwrap();
let df2: DataFrame = df!("Name" => &["Apple", "Banana", "Pear"],
                         "Origin" => &["France", "Hawai", "Italy"],
                         "Potassium (mg/100g)" => &[107, 358, 115]).unwrap();

// df1.inner_join(&df2, "Fruit", "Name")
df1.join(&df2, "Fruit", "Name", JoinType::Inner, None)

// df1.outer_join(&df2, &["Fruit", "Origin"], &["Name", "Origin"])
df1.join(&df2, &["Fruit", "Origin"], &["Name", "Origin"], JoinType::Outer, None)

// df1.left_join(&df2, "Origin", "Origin")
df1.join(&df2, "Origin", "Origin", JoinType::Left, None)
```

### Important Note

One difference between pandas and polars is how columns with identical values are handled.
In polars, even if the column names differ, the columns are merged under the left-side column name. In pandas' merge, if the column names are different, the columns are not merged even if the values are identical.

## Extracting Duplicate Rows

```python
df.loc[df.duplicated()]
```

```rust
df.filter(&df.is_duplicated()?)?;
```

## Removing Duplicate Rows

In both, you can specify a subset to remove duplicates based on specific columns.

```python
df.drop_duplicates()
```

```rust
df.drop_duplicates(true, None)? // maintain_order, subset;
```

## Conversion to numpy / ndarray

```python
df.values
```

You need to specify the type.

```rust
df.to_ndarray<T>()?;
```

## I/O

CSV can be read with the default features. By enabling additional features, you can also read `json`, `parquet`, `ipc`, and other formats.

### read csv

For non-CSV formats, use `sep = "\t"` or similar.

```python
df = pd.read_csv(path)
```

For non-CSV formats, change the `with_delimiter` argument as needed. It works without it as well.

Also, if the `parallel` feature is enabled, it reads using the maximum number of CPU cores, similar to dask. If you do not want this, use something like `.with_n_threads(Some(2))`. Note that `with_n_threads` is only available when you create the `CsvReader` using `from_path`.

```rust
let df = CsvReader::from_path(path)?
        .infer_schema(None)
        .with_delimiter(b',')
        .has_header(true)
        .finish()?
```

### write csv

Same idea as reading.

```python
df.to_csv(path)
```

```rust
let mut f = std::fs::File::create(path)?;
CsvWriter::new(&mut f)
    .has_headers(true)
    .with_delimiter(b',')
    .finish(df)?;
```

## TODO

- [ ] pivot
- [ ] melt
- [ ] fillna-related operations
- [ ] sample_n
- [ ] I/O-related operations

I will fill these in over time.

## Conclusion

It seems like polars can do a lot. While it does not feel suited for the kind of flexible, ad-hoc processing that pandas excels at, for well-defined processing pipelines, writing them in polars could potentially improve performance significantly.
