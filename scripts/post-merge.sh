#!/bin/bash
set -e

npm install --no-audit --no-fund

# Drizzle may ask whether to truncate populated tables when adding constraints.
# Select the default safe option ("No") rather than allowing an interactive
# prompt to hang or automatically approving data loss.
printf '\n' | npm run db:push
