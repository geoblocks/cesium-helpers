# Cesium Helpers

A collection of helpers and web component for working with [Cesium](https://cesium.com/)

## Running the demos

```bash
npx es-dev-server --watch --node-resolve --open demos/cesium-compass.html
npx es-dev-server --watch --node-resolve --open demos/cesium-view-cube.html
npx es-dev-server --watch --node-resolve --open demos/cesium-first-person-mode.html
```

## Guide

This repository uses [lerna](https://lerna.js.org/) to manage the packages.

```bash
# bootstrap/setup
npm install

# check which packages have changed since the last release.
npx lerna changed

# publish a new npm packages for all the packages
npx lerna publish
```
