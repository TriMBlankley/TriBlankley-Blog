{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/basics/
  # env.GREET = "devenv";

  # https://devenv.sh/packages/
  # packages = [ ];

  # https://devenv.sh/languages/
  # languages.rust.enable = true;
    languages.python = {
      enable = true; 
      venv = {
        enable = true;
        requirements = ./requirements.txt;
      };
    };


  # https://devenv.sh/processes/
  # processes.cargo-watch.exec = "cargo-watch";

  # NPM setup ---------------------------------------
  processes = {
    TriBlankley-Blog.exec = "npm run dev -- --host --open";
  };

  # https://devenv.sh/services/
  # services.postgres.enable = true;

  # MongoDB Setup -----------------------------------
  services.mongodb.enable = true;


  # Nginx Config --------------------------------------
    services.nginx = {
      enable = true;
      httpConfig = ''
        server {
          listen 0.0.0.0:8080;
          server_name localhost ;
          location / {
            proxy_pass http://localhost:5173 ;
          }
        }
      '';
    };

  # https://devenv.sh/scripts/
  # scripts.hello.exec = ''
  #   echo hello from $GREET
  # '';

  enterShell = ''
    npm i
  '';

  # https://devenv.sh/tasks/
  # tasks = {
  #   "myproj:setup".exec = "mytool build";
  #   "devenv:enterShell".after = [ "myproj:setup" ];
  # };

  # https://devenv.sh/tests/
  # enterTest = ''
  #   echo "Running tests"
  #   git --version | grep --color=auto "${pkgs.git.version}"
  # '';

  # https://devenv.sh/pre-commit-hooks/
  # pre-commit.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
