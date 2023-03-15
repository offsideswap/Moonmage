#!/bin/zsh

root=$(pwd)

######Clone Repositories
git clone git@github.com:MoonmageFarms/Moonmage.git
git clone git@github.com:MoonmageFarms/Moonmage-SDK.git
git clone git@github.com:MoonmageFarms/Moonmage-UI.git
git clone git@github.com:MoonmageFarms/Moonmage-Subgraph.git
git clone git@github.com:MoonmageFarms/Moon-Subgraph.git

##### Moonmage
cd $root/Moonmage
git checkout -b monorepo
cd $root

###### SDK
# This folder gets root-leve merged with /Moonmage
cd $root/Moonmage-SDK
rm -rf .git
rm -rf .husky
mv docs projects/sdk
echo >> $root/Moonmage/.gitignore
echo >> $root/Moonmage/.gitignore
echo "# From SDK Monorepo Join:" >> $root/Moonmage/.gitignore
cat .gitignore >> $root/Moonmage/.gitignore
rm .gitignore
rm README.md
cp -r . $root/Moonmage

cd $root/Moonmage
git add .
git commit -m "monorepo: merge with sdk"

###### UI
cd $root/Moonmage-UI
rm -rf .git
rm -rf .yarn
rm .yarnrc.yml 
mkdir $root/Moonmage/projects/ui
cp -r . $root/Moonmage/projects/ui

cd $root/Moonmage
git add .
git commit -m "monorepo: add ui"

###### Moonmage-Subgraph
cd $root/Moonmage-Subgraph
rm -rf .git
rm package-lock.json
mkdir $root/Moonmage/projects/subgraph-moonmage
cp -r . $root/Moonmage/projects/subgraph-moonmage
cd $root/Moonmage
git add .
git commit -m "monorepo: add subgraph-moonmage"

##### Moon-Subgraph
cd $root/Moon-Subgraph
rm -rf .git
rm package-lock.json
mkdir $root/Moonmage/projects/subgraph-moon
cp -r . $root/Moonmage/projects/subgraph-moon
cd $root/Moonmage
git add .
git commit -m "monorepo: add subgraph-moon"

##### Post Ops
cd $root
# rm -rf Moonmage-SDK
# rm -rf Moonmage-UI
# rm -rf Moonmage-Subgraph
# rm -rf Moon-Subgraph

# update package.json files as needed
node ./mono.js
cd $root/Moonmage
git add .
git commit -m "monorepo: update projects' package.json"

# Make yarn work
rm $root/Moonmage/protocol/yarn.lock
rm $root/Moonmage/projects/subgraph-moonmage/yarn.lock
rm $root/Moonmage/projects/subgraph-moon/yarn.lock
rm $root/Moonmage/projects/ui/yarn.lock
yarn && git add . && git commit -m "monorepo: update yarn"
 
# Add monorepo scripts for historic/audit purposes
mkdir -p $root/Moonmage/utils/monorepo-creation
cp $root/go.sh $root/Moonmage/utils/monorepo-creation
cp $root/reset.sh $root/Moonmage/utils/monorepo-creation
cp $root/mono.js $root/Moonmage/utils/monorepo-creation
git add . && git commit -m "monorepo: add utils"



