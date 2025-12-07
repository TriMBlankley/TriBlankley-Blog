{pkgs? import <nixpkgs> {}}:

with pkgs;

buildNpmPackage rec {
  pname = "TriBlankley-Blog";
  version = "0.2.5";

  src = lib.cleanSource ./.;

  npmDepsHash = "sha256-I8fFUFoWWmgFywts14gN5AW/epv3/9431fbxA4GDp08=";

  # Two outputs:
  #  - $out/dist: point your HTTP server at this root directory for
  #    the website frontend.
  #  - $out/blogDB: run `node $out/blogDB/dbAPI.js` to run the backend
  #    server, which listens on 127.0.0.1:8050 by default. The main
  #    HTTP server should make this server's root path accessible
  #    under the subpath "/api".
  installPhase = ''
    mkdir -p $out
    cp -r dist $out/dist

    cp -r ${./blogDB} $out/blogDB
    chmod +w $out/blogDB
    cp -r node_modules $out/blogDB/node_modules
  '';
}
