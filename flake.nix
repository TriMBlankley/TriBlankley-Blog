{
    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

        nixos-generators = {
            url = "github:nix-community/nixos-generators";
            inputs.nixpkgs.follows = "nixpkgs";
        };
    };
    outputs = {nixpkgs, nixos-generators, ...}: rec {
        nixosConfigurations.TriBlankleyBlog = nixpkgs.lib.nixosSystem {
            system = "x86_64-linux";
            modules = [
                ./configuration.nix
                nixos-generators.nixosModules.all-formats
            ];
        };
        packages.x86_64-linux.image = nixosConfigurations.TriBlankleyBlog.config.formats.do;
    };
}