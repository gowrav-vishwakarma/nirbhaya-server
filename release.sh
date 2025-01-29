#!/bin/bash

# Check if we are in the develop branch
# current_branch=$(git branch --show-current)
# if [ "$current_branch" != "develop" ]; then
#   echo "You are not on the develop branch. Please switch to the develop branch and try again."
#   exit 1
# fi

# Check if the branch is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "Your branch is not clean. Please commit or stash your changes and try again."
  exit 1
fi

# Checkout to master
git checkout master

# Merge develop into master
git merge develop

# Push to origin master
git push origin master

# Go back to develop
git checkout develop

echo "Release process completed successfully."
