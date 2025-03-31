{pkgs? import <nixpkgs> {}}:

with pkgs;

buildNpmPackage rec {
  pname = "TriBlankley-Blog";
  version = "0.2.5";

  src = ./.;

  npmDepsHash = "sha256-hs4yZpRgfl2I/+mk0YB1uSOFmY6/vg9dF0GGNPZqpDQ=";

  # The prepack script runs the build script, which we'd rather do in the build phase.
  # npmPackFlags = [ "--ignore-scripts" ];

  # NODE_OPTIONS = "--openssl-legacy-provider";

  # meta = {
  #   description = "Modern web UI for various torrent clients with a Node.js backend and React frontend";
  #   homepage = "https://flood.js.org";
  #   license = lib.licenses.gpl3Only;
  #   maintainers = with lib.maintainers; [ winter ];
  # };
}