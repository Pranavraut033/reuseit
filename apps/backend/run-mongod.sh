#!/usr/bin/env bash
set -euo pipefail

# Ensure directories exist
mkdir -p "$HOME/data/db" "$(dirname "$HOME/data/mongod.log")"

# Run your command
mongod --replSet rs0 --dbpath ~/data/db --bind_ip localhost --logpath ~/data/mongod.log
