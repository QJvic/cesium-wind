# cesium-wind

[![npm](https://img.shields.io/npm/v/cesium-wind.svg)](https://www.npmjs.com/package/cesium-wind)
[![license](https://img.shields.io/npm/l/cesium-wind.svg)](https://github.com/QJvic/cesium-wind/blob/master/LICENSE)

[English](./README.md#english) | 中文

一个用于在 Cesium 中展示风场的插件。

该项目基于 https://github.com/sakitam-fdd/wind-layer 项目完成，使用设置(windOptions)及数据(data)与原项目一致。 已应用至实际项目中，请放心食用。

## ✨ 特性

- 易于使用，兼容各种 Cesium 版本。
- 基于 `wind-layer` 核心库，性能高效。
- 支持多种数据格式。

## 🚀 在线示例

[https://qjvic.github.io/cesium-wind/examples/umd.html](https://qjvic.github.io/cesium-wind/examples/umd.html)

## 📦 安装

```bash
npm install cesium-wind
```

## 💡 使用

### 在浏览器中直接使用

[点击查看 `examples/umd.html` 中的示例代码](./examples/umd.html)

### 在模块化项目中使用 (例如 Vite 或 Webpack)

```javascript
import * as Cesium from "cesium";
import CesiumWind from "cesium-wind";

const viewer = new Cesium.Viewer("cesium-container");

const windOptions = {
  colorScale: [
    "rgb(36,104, 180)",
    "rgb(60,157, 194)",
    "rgb(128,205,193 )",
    "rgb(151,218,168 )",
    "rgb(198,231,181)",
    "rgb(238,247,217)",
    "rgb(255,238,159)",
    "rgb(252,217,125)",
    "rgb(255,182,100)",
    "rgb(252,150,75)",
    "rgb(250,112,52)",
    "rgb(245,64,32)",
    "rgb(237,45,28)",
    "rgb(220,24,32)",
    "rgb(180,0,35)",
  ],
  frameRate: 16,
  maxAge: 60,
  globalAlpha: 0.9,
  velocityScale: 1 / 30,
  paths: 2000,
};
fetch("your-wind.json")
  .then((res) => res.json())
  .then((res) => {
    const windLayer = new CesiumWind.WindLayer(res, { windOptions });
    windLayer.addTo(viewer);
  });
```

---

# <a name="english"></a>cesium-wind

[![npm](https://img.shields.io/npm/v/cesium-wind.svg)](https://www.npmjs.com/package/cesium-wind)
[![license](https://img.shields.io/npm/l/cesium-wind.svg)](https://github.com/QJvic/cesium-wind/blob/master/LICENSE)

[中文](./README.md) | English

A plugin for displaying wind fields in Cesium.

This project is based on https://github.com/sakitam-fdd/wind-layer. The usage settings (`windOptions`) and data format are consistent with the original project. It has been proven in production environments, so you can use it with confidence.

## ✨ Features

- Easy to use and compatible with various Cesium versions.
- High-performance, based on the `wind-layer` core library.
- Supports multiple data formats.

## 🚀 Live Demo

[https://qjvic.github.io/cesium-wind/examples/umd.html](https://qjvic.github.io/cesium-wind/examples/umd.html)

## 📦 Installation

```bash
npm install cesium-wind
```

## 💡 Usage

### In the browser

[Click here to see the example code in `examples/umd.html`](./examples/umd.html)

### In a modular project (e.g., Vite or Webpack)

```javascript
import * as Cesium from "cesium";
import CesiumWind from "cesium-wind";

const viewer = new Cesium.Viewer("cesium-container");

const windOptions = {
  colorScale: [
    "rgb(36,104, 180)",
    "rgb(60,157, 194)",
    "rgb(128,205,193 )",
    "rgb(151,218,168 )",
    "rgb(198,231,181)",
    "rgb(238,247,217)",
    "rgb(255,238,159)",
    "rgb(252,217,125)",
    "rgb(255,182,100)",
    "rgb(252,150,75)",
    "rgb(250,112,52)",
    "rgb(245,64,32)",
    "rgb(237,45,28)",
    "rgb(220,24,32)",
    "rgb(180,0,35)",
  ],
  frameRate: 16,
  maxAge: 60,
  globalAlpha: 0.9,
  velocityScale: 1 / 30,
  paths: 2000,
};
fetch("your-wind.json")
  .then((res) => res.json())
  .then((res) => {
    const windLayer = new CesiumWind.WindLayer(res, { windOptions });
    windLayer.addTo(viewer);
  });
```
