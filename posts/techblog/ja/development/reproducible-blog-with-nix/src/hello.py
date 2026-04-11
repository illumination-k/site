"""Minimal script used to demonstrate that the companion flake yields a
reproducible Python environment. Runs inside `nix develop -c python src/hello.py`.
"""

from __future__ import annotations

import sys


def main() -> None:
    print(f"hello from python {sys.version.split()[0]}")


if __name__ == "__main__":
    main()
