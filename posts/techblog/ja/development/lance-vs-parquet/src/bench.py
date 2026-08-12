"""Lance vs Parquet: read amplification and latency micro-benchmark.

Writes the same table in three layouts and measures, for each:

  * on-disk size
  * full scan of a single column
  * single-row random lookups

The headline metric is not wall time but ``rchar`` from ``/proc/self/io``:
the number of bytes the process pulled through read() syscalls. It is counted
even when the page cache serves the read, so it measures read amplification --
a property of the file layout -- rather than the speed of this particular disk.
"""

import os
import random
import shutil
import time

import lance
import numpy as np
import pyarrow as pa
import pyarrow.feather as feather
import pyarrow.ipc as ipc
import pyarrow.parquet as pq

N_ROWS = 200_000
DIM = 128
SEED = 42
OUT = "bench-data"

WORDS = [
    "columnar", "format", "random", "access", "vector", "embedding", "page",
    "row", "group", "encoding", "compression", "metadata", "index", "scan",
]

# Formats that read a large block per lookup get fewer probes; every number
# below is reported per row, so the counts stay comparable.
PROBES = {
    "parquet(default)": 50,
    "parquet(tuned)": 500,
    "arrow-ipc": 20,
    "lance": 500,
}


def rchar() -> int:
    """Bytes read through read()-family syscalls, page-cache hits included."""
    with open("/proc/self/io") as f:
        for line in f:
            if line.startswith("rchar:"):
                return int(line.split()[1])
    raise RuntimeError("rchar not found in /proc/self/io")


def make_table() -> pa.Table:
    rng = np.random.default_rng(SEED)
    pyrng = random.Random(SEED)
    ids = np.arange(N_ROWS, dtype=np.int64)
    texts = [" ".join(pyrng.choices(WORDS, k=16)) for _ in range(N_ROWS)]
    vectors = rng.standard_normal((N_ROWS, DIM), dtype=np.float32)
    emb = pa.FixedSizeListArray.from_arrays(pa.array(vectors.reshape(-1)), DIM)
    return pa.table({"id": ids, "text": pa.array(texts), "embedding": emb})


def dir_size(path: str) -> int:
    if os.path.isfile(path):
        return os.path.getsize(path)
    return sum(
        os.path.getsize(os.path.join(root, f))
        for root, _, files in os.walk(path)
        for f in files
    )


def measure(fn, repeat: int = 1):
    """Return (last result, best wall time, bytes read per run)."""
    start = rchar()
    best = float("inf")
    out = None
    for _ in range(repeat):
        t0 = time.perf_counter()
        out = fn()
        best = min(best, time.perf_counter() - t0)
    return out, best, (rchar() - start) // repeat


def block_bounds(sizes: list[int]) -> list[tuple[int, int, int]]:
    """Turn per-block row counts into (start, end, block_index) triples."""
    bounds, acc = [], 0
    for i, n in enumerate(sizes):
        bounds.append((acc, acc + n, i))
        acc += n
    return bounds


def row_group_bounds(pf: pq.ParquetFile) -> list[tuple[int, int, int]]:
    return block_bounds(
        [pf.metadata.row_group(i).num_rows for i in range(pf.metadata.num_row_groups)]
    )


def write_all(tbl: pa.Table) -> dict[str, str]:
    paths = {
        "parquet(default)": f"{OUT}/default.parquet",
        "parquet(tuned)": f"{OUT}/tuned.parquet",
        "arrow-ipc": f"{OUT}/data.arrow",
        "lance": f"{OUT}/data.lance",
    }
    pq.write_table(tbl, paths["parquet(default)"])
    pq.write_table(
        tbl,
        paths["parquet(tuned)"],
        row_group_size=8192,
        data_page_size=8 * 1024,
        write_page_index=True,
    )
    # Feather v2 is the Arrow IPC file format. Defaults: LZ4 compression,
    # 64K-row record batches.
    feather.write_feather(tbl, paths["arrow-ipc"])
    lance.write_dataset(tbl, paths["lance"], mode="overwrite")
    return paths


def report_sizes(paths: dict[str, str]) -> None:
    print("\n== file size ==")
    for name, p in paths.items():
        print(f"{name:18s} {dir_size(p) / 1e6:8.1f} MB")
    for name in ("parquet(default)", "parquet(tuned)"):
        n = pq.ParquetFile(paths[name]).metadata.num_row_groups
        print(f"  {name} row groups: {n}")
    with ipc.open_file(pa.OSFile(paths["arrow-ipc"], "rb")) as reader:
        print(f"  arrow-ipc record batches: {reader.num_record_batches}")


def report_scan(paths: dict[str, str]) -> None:
    print("\n== full scan (best of 3) ==")
    for col in ("text", "embedding"):
        for name, p in paths.items():
            if name.startswith("parquet"):
                fn = lambda p=p, col=col: pq.read_table(p, columns=[col])
            elif name == "arrow-ipc":
                fn = lambda p=p, col=col: feather.read_table(p, columns=[col])
            else:
                fn = lambda p=p, col=col: lance.dataset(p).to_table(columns=[col])
            fn()  # warm the page cache so we compare decode, not first-touch I/O
            out, elapsed, read = measure(fn, repeat=3)
            print(
                f"{col:10s} {name:18s} {elapsed * 1000:8.1f} ms  "
                f"read {read / 1e6:8.1f} MB  rows={out.num_rows}"
            )


def report_random_access(paths: dict[str, str]) -> None:
    for col in ("text", "embedding"):
        print(f"\n== random access, single-row lookups ({col}) ==")
        for name, p in paths.items():
            n_probe = PROBES[name]
            rows = random.Random(SEED).sample(range(N_ROWS), n_probe)

            if name.startswith("parquet"):
                pf = pq.ParquetFile(p)
                bounds = row_group_bounds(pf)

                def fn(pf=pf, bounds=bounds, col=col, rows=rows):
                    for r in rows:
                        for start, end, rg in bounds:
                            if start <= r < end:
                                pf.read_row_group(rg, columns=[col]).slice(r - start, 1)
                                break
            elif name == "arrow-ipc":
                # The IPC reader has no column projection: get_batch pulls every
                # column of the batch, so the whole batch body is read.
                reader = ipc.open_file(pa.OSFile(p, "rb"))
                bounds = block_bounds(
                    [
                        reader.get_batch(i).num_rows
                        for i in range(reader.num_record_batches)
                    ]
                )

                def fn(reader=reader, bounds=bounds, col=col, rows=rows):
                    for r in rows:
                        for start, end, b in bounds:
                            if start <= r < end:
                                reader.get_batch(b).column(col).slice(r - start, 1)
                                break
            else:
                ds = lance.dataset(p)

                def fn(ds=ds, col=col, rows=rows):
                    for r in rows:
                        ds.take([r], columns=[col])

            _, elapsed, read = measure(fn)
            print(
                f"{name:18s} n={n_probe:4d}  {elapsed / n_probe * 1e6:9.1f} us/row  "
                f"read {read / n_probe / 1024:10.1f} KiB/row"
            )


def main() -> None:
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)

    print(f"lance {lance.__version__} / pyarrow {pa.__version__} / rows={N_ROWS}")
    paths = write_all(make_table())

    report_sizes(paths)
    report_scan(paths)
    report_random_access(paths)


if __name__ == "__main__":
    main()
