{modulesPath, ...}:
{
    users.users.root.openssh.authorizedKeys.keys = [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL4c5ImNWJqP9UDm8FZDOzbRzgQ/pTP7LXuXk+w9UQRm shitasshp@nixos"
    ];

    nixpkgs.config.allowUnfree = true;

    services.openssh.enable = true;

    networking.firewall.enable = false;

    imports = [
        ./module.nix
        (modulesPath + "/virtualisation/digital-ocean-config.nix")
    ];

    system.stateVersion = "25.11";
}