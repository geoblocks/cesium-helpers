# Cesium Helpers

A collection of helpers and web component for working with [Cesium](https://cesium.com/)

## Running the demos

```bash
npx parcel serve demos/cesium-compass.html --open
npx parcel serve demos/cesium-view-cube.html --open
npx parcel serve demos/cesium-first-person-mode.html --open
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
