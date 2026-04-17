{
  description = "Companion flake for the 'mise cargo backend speedup via aqua + cargo-binstall' post";

  inputs = {
    # Pinned to a specific commit on nixos-25.11 as of 2026-04-17.
    nixpkgs.url = "github:NixOS/nixpkgs/1766437c5509f444c1b15331e82b8b6a9b967000";
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
          packages = [
            pkgs.mise
            pkgs.rustc
            pkgs.cargo
            pkgs.bash
            pkgs.bc
            pkgs.coreutils
            pkgs.curl
          ];

          shellHook = ''
            echo "Reproducible shell for the mise + aqua + cargo-binstall benchmark."
            echo "mise:  $(mise --version)"
            echo "cargo: $(cargo --version)"
            echo "Run ./bench.sh to reproduce the numbers in the post."
          '';
        };
      });
    };
}
