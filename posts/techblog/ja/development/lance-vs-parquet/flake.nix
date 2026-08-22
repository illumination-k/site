{
  description = "Companion flake for the 'Lance vs Parquet' post";

  inputs = {
    # Pinned to a specific commit on the nixos-25.11 branch as of 2026-06-30.
    nixpkgs.url = "github:NixOS/nixpkgs/b6018f87da91d19d0ab4cf979885689b469cdd41";
  };

  outputs = { self, nixpkgs }:
    let
      forAllSystems = f:
        nixpkgs.lib.genAttrs [
          "x86_64-linux"
          "aarch64-linux"
          "x86_64-darwin"
          "aarch64-darwin"
        ] (system: f (import nixpkgs { inherit system; }));
    in {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          # pylance is not packaged in nixpkgs, so Nix pins the toolchain
          # (Python interpreter + uv) and uv.lock pins the Python dependencies.
          packages = [
            pkgs.python312
            pkgs.uv
          ];

          shellHook = ''
            echo "python: $(python3 --version)"
            echo "uv:     $(uv --version)"
            echo "run:    uv run --frozen src/bench.py"
          '';
        };
      });
    };
}
