#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

nixos-rebuild switch -L --target-host=root@triblankley.blog --flake=.#TriBlankleyBlog
