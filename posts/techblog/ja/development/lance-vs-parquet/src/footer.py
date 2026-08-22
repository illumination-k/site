"""Read the fixed-size footer of a .lance data file with nothing but struct."""

import os
import struct
import sys

FOOTER_SIZE = 40
FIELDS = (
    "column_metadata_start",
    "column_metadata_offsets_start",
    "global_buffer_offsets_start",
    "num_global_buffers",
    "num_columns",
    "major_version",
    "minor_version",
    "magic",
)


def read_footer(path: str) -> dict[str, object]:
    with open(path, "rb") as f:
        f.seek(-FOOTER_SIZE, os.SEEK_END)
        # u64 x3, u32 x2, u16 x2, 4-byte magic — all little-endian.
        values = struct.unpack("<QQQIIHH4s", f.read(FOOTER_SIZE))
    return dict(zip(FIELDS, values))


def main() -> None:
    path = sys.argv[1]
    footer = read_footer(path)
    if footer["magic"] != b"LANC":
        raise SystemExit(f"not a lance file: {path}")

    print(f"{path} ({os.path.getsize(path):,} bytes)")
    for key in FIELDS:
        print(f"  {key:30s} {footer[key]!r}")

    # Everything before column_metadata_start is column data; the metadata that
    # describes it sits at the tail, so a reader can locate any column with two
    # reads and never touch the pages it does not need.
    data_bytes = int(footer["column_metadata_start"])
    total = os.path.getsize(path)
    print(f"\n  data   {data_bytes:,} bytes ({data_bytes / total:.4%} of file)")
    print(f"  meta   {total - data_bytes:,} bytes")


if __name__ == "__main__":
    main()
