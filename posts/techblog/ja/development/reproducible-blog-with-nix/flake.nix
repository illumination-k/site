{
  description = "Companion flake for the 'technical blog reproducibility with Nix' post";

  inputs = {
    # Pinned to a specific commit on the nixos-25.11 branch as of 2026-04.
    # Running `nix flake lock` will additionally freeze the narHash in flake.lock.
    nixpkgs.url = "github:NixOS/nixpkgs/54170c54449ea4d6725efd30d719c5e505f1c10e";
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
            pkgs.python312
            pkgs.uv
          ];

          shellHook = ''
            echo "Reproducible shell for the blog post."
            echo "python: $(python --version)"
            echo "uv:     $(uv --version)"
          '';
        };
      });
    };
}
