#!/bin/bash

# create-worktree.sh - Create a new git worktree and copy ignored files
# Usage: ./create-worktree.sh <branch-name>

set -e

if [ -z "$1" ]; then
  echo "Usage: ./create-worktree.sh <branch-name>"
  echo "Example: ./create-worktree.sh feature/new-feature"
  exit 1
fi

BRANCH_NAME="$1"
# Convert branch name to directory name (replace / with -)
DIR_NAME=$(echo "$BRANCH_NAME" | sed 's/\//-/g')

# Get the root directory of the repo
REPO_ROOT=$(git rev-parse --show-toplevel)

echo "📦 Creating worktree for branch: $BRANCH_NAME"
echo "📁 Directory: $DIR_NAME"

# Create the worktree
git worktree add "$DIR_NAME" -b "$BRANCH_NAME"

echo ""
echo "📋 Copying ignored files..."

# Copy environment files
if [ -f "$REPO_ROOT/.env.local" ]; then
  echo "  ✓ Copying .env.local"
  cp "$REPO_ROOT/.env.local" "$DIR_NAME/.env.local"
fi

if [ -f "$REPO_ROOT/.env" ]; then
  echo "  ✓ Copying .env"
  cp "$REPO_ROOT/.env" "$DIR_NAME/.env"
fi

# Copy VSCode settings if they exist
if [ -d "$REPO_ROOT/.vscode" ]; then
  echo "  ✓ Copying .vscode settings"
  cp -r "$REPO_ROOT/.vscode" "$DIR_NAME/.vscode"
fi

# Copy any other local config files you might have
# Add more files here as needed
# if [ -f "$REPO_ROOT/.some-config" ]; then
#   cp "$REPO_ROOT/.some-config" "$DIR_NAME/.some-config"
# fi

echo ""
echo "✅ Worktree created successfully!"
echo ""
echo "Next steps:"
echo "  cd $DIR_NAME"
echo "  npm install  # if dependencies changed"
echo ""
echo "To remove this worktree later:"
echo "  git worktree remove $DIR_NAME"
