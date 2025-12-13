# NixOS module for running the blog.
{ pkgs, lib, ... }:
let
  build = import ./. { inherit pkgs; };
in
{
  # Run a MongoDB server for storing the backend data.
  services.mongodb.enable = true;

  # Backend server.
  systemd.services.blog_backend = {
    wantedBy = [ "nginx.service" ];
    path = [ pkgs.nodejs ];
    script = "node ${build}/blogDB/dbAPI.js";

    serviceConfig.Restart = "always";
  };

  # Use nginx to wire the frontend and backend together.
  services.nginx = {
    enable = true;
    virtualHosts."triblankleyblog.com" = {
      # Use this to enable HTTPS:
      forceSSL = true;
      enableACME = true;

      locations."/" = {
        root = "${build}/dist";
      };

      locations."/api" = {
        # Hit the backend server
        proxyPass = "http://127.0.0.1:8050";
      };
    };

    # Allow large uploads
    clientMaxBodySize = "100M";
  };

  # Needed for HTTPS as well, does nothing otherwise
  security.acme = {
    acceptTerms = true;
    defaults.email = "admin@example.com";
  };
}
