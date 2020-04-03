# Cesium Helpers

A collection of helpers and web component for working with [Cesium](https://cesium.com/)

## Guide

This repository uses [lerna](https://lerna.js.org/) to manage the packages.

```bash
# bootstrap/setup
npm install

# check which packages have changed since the last release.
npx lerna changed

# publish a new npm packages for all the packages
npm run publish

# push changes
git push --tags origin master
```
