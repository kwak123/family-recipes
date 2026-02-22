#!/bin/bash

# merge-worktree.sh - Merge a worktree back to main and clean up
# Usage: ./merge-worktree.sh <worktree-directory>

set -e

if [ -z "$1" ]; then
  echo "Usage: ./merge-worktree.sh <worktree-directory>"
  echo "Example: ./merge-worktree.sh kwak123-my-feature"
  echo ""
  echo "Current worktrees:"
  git worktree list
  exit 1
fi

WORKTREE_DIR="$1"

# Check if worktree exists
if [ ! -d "$WORKTREE_DIR" ]; then
  echo "❌ Error: Directory '$WORKTREE_DIR' not found"
  exit 1
fi

# Get the branch name from the worktree
BRANCH_NAME=$(cd "$WORKTREE_DIR" && git branch --show-current)

if [ -z "$BRANCH_NAME" ]; then
  echo "❌ Error: Could not determine branch name for worktree"
  exit 1
fi

echo "🔍 Worktree: $WORKTREE_DIR"
echo "🌿 Branch: $BRANCH_NAME"
echo ""

# Check if there are uncommitted changes in the worktree
cd "$WORKTREE_DIR"
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "⚠️  Warning: There are uncommitted changes in this worktree"
  git status --short
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Go back to main repo
cd ..

# Make sure we're on main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "📍 Switching to main branch..."
  git checkout main
fi

# Pull latest if tracking remote
if git rev-parse --abbrev-ref --symbolic-full-name @{u} > /dev/null 2>&1; then
  echo "⬇️  Pulling latest from remote..."
  git pull
fi

# Merge the worktree branch
echo "🔀 Merging $BRANCH_NAME into main..."
git merge "$BRANCH_NAME" -m "Merge $BRANCH_NAME"

echo ""
echo "🧹 Cleaning up..."

# Remove the worktree
echo "  ✓ Removing worktree: $WORKTREE_DIR"
git worktree remove "$WORKTREE_DIR" 2>/dev/null || true

# Delete the branch
echo "  ✓ Deleting branch: $BRANCH_NAME"
git branch -d "$BRANCH_NAME"

# Clean up any leftover directories
if [ -d "$WORKTREE_DIR" ]; then
  echo "  ✓ Removing leftover directory"
  rm -rf "$WORKTREE_DIR"
fi

echo ""
echo "✅ Successfully merged and cleaned up!"
echo ""
echo "Summary:"
echo "  • Merged: $BRANCH_NAME → main"
echo "  • Removed: $WORKTREE_DIR"
echo "  • Deleted: $BRANCH_NAME"
echo ""
git log --oneline -3
