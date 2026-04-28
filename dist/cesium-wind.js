/*!
 * author: joe <qj5657@gmail.com>
 * cesium-wind 1.0.5
 * build-time: 2026-4-28 17:27
 * LICENSE: MIT
 * (c) 2020-2026 https://github.com/QJvic/cesium-wind
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('cesium/Cesium')) :
  typeof define === 'function' && define.amd ? define(['exports', 'cesium/Cesium'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.CesiumWind = {}, global.Cesium));
})(this, (function (exports, Cesium) { 'use strict';

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n["default"] = e;
    return Object.freeze(n);
  }

  var Cesium__namespace = /*#__PURE__*/_interopNamespace(Cesium);

  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const symToStringTag = typeof Symbol !== "undefined" ? Symbol.toStringTag : void 0;
  function baseGetTag(value) {
    if (value === null) {
      return value === void 0 ? "[object Undefined]" : "[object Null]";
    }
    if (!(symToStringTag && symToStringTag in Object(value))) {
      return toString.call(value);
    }
    const isOwn = hasOwnProperty.call(value, symToStringTag);
    const tag = value[symToStringTag];
    let unmasked = false;
    try {
      value[symToStringTag] = void 0;
      unmasked = true;
    } catch (e) {
    }
    const result = Object.prototype.toString.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }
  function isFunction(value) {
    if (!isObject(value)) {
      return false;
    }
    const tag = baseGetTag(value);
    return tag === "[object Function]" || tag === "[object AsyncFunction]" || tag === "[object GeneratorFunction]" || tag === "[object Proxy]";
  }
  function isObject(value) {
    const type = typeof value;
    return value !== null && (type === "object" || type === "function");
  }
  function isString(value) {
    if (value == null) {
      return false;
    }
    return typeof value === "string" || value.constructor !== null && value.constructor === String;
  }
  function isNumber(value) {
    return Object.prototype.toString.call(value) === "[object Number]" && !isNaN(value);
  }
  function isArray(arr) {
    return Array.isArray(arr);
  }
  function assign(target, ...sources) {
    return Object.assign(target, ...sources);
  }
  function warnLog(msg, n) {
    console.warn(`${n || "wind-layer"}: ${msg}`);
  }
  const warnings = {};
  function warnOnce(namespaces, msg) {
    if (!warnings[msg]) {
      warnLog(msg, namespaces);
      warnings[msg] = true;
    }
  }
  function floorMod(a, n) {
    return a - n * Math.floor(a / n);
  }
  function isValide(val) {
    return val !== void 0 && val !== null && !isNaN(val);
  }
  function formatData(data, options = {}) {
    let uComp = void 0;
    let vComp = void 0;
    data.forEach(function(record) {
      switch (record.header.parameterCategory + "," + record.header.parameterNumber) {
        case "1,2":
        case "2,2":
          uComp = record;
          break;
        case "1,3":
        case "2,3":
          vComp = record;
          break;
      }
    });
    if (!vComp || !uComp) {
      return void 0;
    }
    const header = uComp.header;
    const vectorField = new Field({
      xmin: header.lo1,
      // 一般格点数据是按照矩形范围来切割，所以定义其经纬度范围
      ymin: header.la1,
      xmax: header.lo2,
      ymax: header.la2,
      deltaX: header.dx,
      // x（经度）增量
      deltaY: header.dy,
      // y（维度）增量
      cols: header.nx,
      // 列（可由 `(xmax - xmin) / deltaX` 得到）
      rows: header.ny,
      // 行
      us: uComp.data,
      // U分量
      vs: vComp.data,
      // V分量
      ...options
    });
    return vectorField;
  }
  function removeDomNode(node) {
    if (!node) {
      return null;
    }
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    return node;
  }

  class Vector {
    constructor(u, v) {
      this.u = u;
      this.v = v;
      this.m = this.magnitude();
    }
    /**
     * 向量值（这里指风速）
     * @returns {Number}
     */
    magnitude() {
      return Math.sqrt(this.u ** 2 + this.v ** 2);
    }
    /**
     * 流体方向 （这里指风向，范围为0-360º）
     * N is 0º and E is 90º
     * @returns {Number}
     */
    directionTo() {
      const verticalAngle = Math.atan2(this.u, this.v);
      let inDegrees = verticalAngle * (180 / Math.PI);
      if (inDegrees < 0) {
        inDegrees += 360;
      }
      return inDegrees;
    }
    /**
     * Angle in degrees (0 to 360º) From x-->
     * N is 0º and E is 90º
     * @returns {Number}
     */
    directionFrom() {
      const a = this.directionTo();
      return (a + 180) % 360;
    }
  }

  class Field {
    constructor(params) {
      this.grid = [];
      this.xmin = params.xmin;
      this.xmax = params.xmax;
      this.ymin = params.ymin;
      this.ymax = params.ymax;
      this.cols = params.cols;
      this.rows = params.rows;
      this.us = params.us;
      this.vs = params.vs;
      this.deltaX = params.deltaX;
      this.deltaY = params.deltaY;
      this.flipY = Boolean(params.flipY);
      this.ymin = Math.min(params.ymax, params.ymin);
      this.ymax = Math.max(params.ymax, params.ymin);
      if (!(this.deltaY < 0 && this.ymin < this.ymax)) {
        if (params.flipY === void 0) {
          this.flipY = true;
        }
        console.warn("[wind-core]: The data is flipY");
      }
      this.isFields = true;
      const cols = Math.ceil((this.xmax - this.xmin) / params.deltaX);
      const rows = Math.ceil((this.ymax - this.ymin) / params.deltaY);
      if (cols !== this.cols || rows !== this.rows) {
        console.warn("[wind-core]: The data grid not equal");
      }
      this.isContinuous = Math.floor(this.cols * params.deltaX) >= 360;
      this.translateX = "translateX" in params ? params.translateX : this.xmax > 180;
      if ("wrappedX" in params) {
        warnOnce("[wind-core]: ", "`wrappedX` namespace will deprecated please use `translateX` instead\uFF01");
      }
      this.wrapX = Boolean(params.wrapX);
      this.grid = this.buildGrid();
      this.range = this.calculateRange();
    }
    // from https://github.com/sakitam-fdd/wind-layer/blob/95368f9433/src/windy/windy.js#L110
    buildGrid() {
      const grid = [];
      let p = 0;
      const { rows, cols, us, vs } = this;
      for (let j = 0; j < rows; j++) {
        const row = [];
        for (let i = 0; i < cols; i++, p++) {
          const u = us[p];
          const v = vs[p];
          const valid = this.isValid(u) && this.isValid(v);
          row[i] = valid ? new Vector(u, v) : null;
        }
        if (this.isContinuous) {
          row.push(row[0]);
        }
        grid[j] = row;
      }
      return grid;
    }
    /**
     * release data
     */
    release() {
      this.grid = [];
    }
    /**
     * grib data extent
     * 格点数据范围
     */
    extent() {
      return [this.xmin, this.ymin, this.xmax, this.ymax];
    }
    /**
     * Bilinear interpolation for Vector
     * 针对向量进行双线性插值
     * https://en.wikipedia.org/wiki/Bilinear_interpolation
     * @param   {Number} x
     * @param   {Number} y
     * @param   {Number[]} g00
     * @param   {Number[]} g10
     * @param   {Number[]} g01
     * @param   {Number[]} g11
     * @returns {Vector}
     */
    bilinearInterpolateVector(x, y, g00, g10, g01, g11) {
      const rx = 1 - x;
      const ry = 1 - y;
      const a = rx * ry;
      const b = x * ry;
      const c = rx * y;
      const d = x * y;
      const u = g00.u * a + g10.u * b + g01.u * c + g11.u * d;
      const v = g00.v * a + g10.v * b + g01.v * c + g11.v * d;
      return new Vector(u, v);
    }
    /**
     * calculate vector value range
     */
    calculateRange() {
      if (!this.grid || !this.grid[0])
        return;
      const rows = this.grid.length;
      const cols = this.grid[0].length;
      let min;
      let max;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const vec = this.grid[j][i];
          if (vec !== null) {
            const val = vec.m || vec.magnitude();
            if (min === void 0) {
              min = val;
            } else if (max === void 0) {
              max = val;
              min = Math.min(min, max);
              max = Math.max(min, max);
            } else {
              min = Math.min(val, min);
              max = Math.max(val, max);
            }
          }
        }
      }
      return [min, max];
    }
    /**
     * 检查 uv是否合法
     * @param x
     * @private
     */
    isValid(x) {
      return x !== null && x !== void 0;
    }
    getWrappedLongitudes() {
      let xmin = this.xmin;
      let xmax = this.xmax;
      if (this.translateX) {
        if (this.isContinuous) {
          xmin = -180;
          xmax = 180;
        } else {
          xmax = this.xmax - 360;
          xmin = this.xmin - 360;
        }
      }
      return [xmin, xmax];
    }
    contains(lon, lat) {
      const [xmin, xmax] = this.getWrappedLongitudes();
      if (xmax > 180 && lon >= -180 && lon <= xmax - 360) {
        lon += 360;
      } else if (xmin < -180 && lon <= 180 && lon >= xmin + 360) {
        lon -= 360;
      }
      const longitudeIn = lon >= xmin && lon <= xmax;
      let latitudeIn;
      if (this.deltaY >= 0) {
        latitudeIn = lat >= this.ymin && lat <= this.ymax;
      } else {
        latitudeIn = lat >= this.ymax && lat <= this.ymin;
      }
      return longitudeIn && latitudeIn;
    }
    /**
     * 获取经纬度所在的位置索引
     * @param lon
     * @param lat
     */
    getDecimalIndexes(lon, lat) {
      const i = floorMod(lon - this.xmin, 360) / this.deltaX;
      if (this.flipY) {
        const j = (this.ymax - lat) / this.deltaY;
        return [i, j];
      } else {
        const j = (this.ymin + lat) / this.deltaY;
        return [i, j];
      }
    }
    /**
     * Nearest value at lon-lat coordinates
     * 线性插值
     * @param lon
     * @param lat
     */
    valueAt(lon, lat) {
      let flag = false;
      if (this.wrapX) {
        flag = true;
      } else if (this.contains(lon, lat)) {
        flag = true;
      }
      if (!flag)
        return null;
      const indexes = this.getDecimalIndexes(lon, lat);
      const ii = Math.floor(indexes[0]);
      const jj = Math.floor(indexes[1]);
      const ci = this.clampColumnIndex(ii);
      const cj = this.clampRowIndex(jj);
      return this.valueAtIndexes(ci, cj);
    }
    /**
     * Get interpolated grid value lon-lat coordinates
     * 双线性插值
     * @param lon
     * @param lat
     */
    interpolatedValueAt(lon, lat) {
      let flag = false;
      if (this.wrapX) {
        flag = true;
      } else if (this.contains(lon, lat)) {
        flag = true;
      }
      if (!flag)
        return null;
      const [i, j] = this.getDecimalIndexes(lon, lat);
      return this.interpolatePoint(i, j);
    }
    hasValueAt(lon, lat) {
      const value = this.valueAt(lon, lat);
      return value !== null;
    }
    /**
     * 基于向量的双线性插值
     * @param i
     * @param j
     */
    interpolatePoint(i, j) {
      const indexes = this.getFourSurroundingIndexes(i, j);
      const [fi, ci, fj, cj] = indexes;
      const values = this.getFourSurroundingValues(fi, ci, fj, cj);
      if (values) {
        const [g00, g10, g01, g11] = values;
        return this.bilinearInterpolateVector(i - fi, j - fj, g00, g10, g01, g11);
      }
      return null;
    }
    /**
     * Check the column index is inside the field,
     * adjusting to min or max when needed
     * @private
     * @param   {Number} ii - index
     * @returns {Number} i - inside the allowed indexes
     */
    clampColumnIndex(ii) {
      let i = ii;
      if (ii < 0) {
        i = 0;
      }
      const maxCol = this.cols - 1;
      if (ii > maxCol) {
        i = maxCol;
      }
      return i;
    }
    /**
     * Check the row index is inside the field,
     * adjusting to min or max when needed
     * @private
     * @param   {Number} jj index
     * @returns {Number} j - inside the allowed indexes
     */
    clampRowIndex(jj) {
      let j = jj;
      if (jj < 0) {
        j = 0;
      }
      const maxRow = this.rows - 1;
      if (jj > maxRow) {
        j = maxRow;
      }
      return j;
    }
    /**
     * 计算索引位置周围的数据
     * @private
     * @param   {Number} i - decimal index
     * @param   {Number} j - decimal index
     * @returns {Array} [fi, ci, fj, cj]
     */
    getFourSurroundingIndexes(i, j) {
      const fi = Math.floor(i);
      let ci = fi + 1;
      if (this.isContinuous && ci >= this.cols) {
        ci = 0;
      }
      ci = this.clampColumnIndex(ci);
      const fj = this.clampRowIndex(Math.floor(j));
      const cj = this.clampRowIndex(fj + 1);
      return [fi, ci, fj, cj];
    }
    /**
     * Get four surrounding values or null if not available,
     * from 4 integer indexes
     * @private
     * @param   {Number} fi
     * @param   {Number} ci
     * @param   {Number} fj
     * @param   {Number} cj
     * @returns {Array}
     */
    getFourSurroundingValues(fi, ci, fj, cj) {
      let row;
      if (row = this.grid[fj]) {
        const g00 = row[fi];
        const g10 = row[ci];
        if (this.isValid(g00) && this.isValid(g10) && (row = this.grid[cj])) {
          const g01 = row[fi];
          const g11 = row[ci];
          if (this.isValid(g01) && this.isValid(g11)) {
            return [g00, g10, g01, g11];
          }
        }
      }
      return null;
    }
    /**
     * Value for grid indexes
     * @param   {Number} i - column index (integer)
     * @param   {Number} j - row index (integer)
     * @returns {Vector|Number}
     */
    valueAtIndexes(i, j) {
      return this.grid[j][i];
    }
    /**
     * Lon-Lat for grid indexes
     * @param   {Number} i - column index (integer)
     * @param   {Number} j - row index (integer)
     * @returns {Number[]} [lon, lat]
     */
    lonLatAtIndexes(i, j) {
      const lon = this.longitudeAtX(i);
      const lat = this.latitudeAtY(j);
      return [lon, lat];
    }
    /**
     * Longitude for grid-index
     * @param   {Number} i - column index (integer)
     * @returns {Number} longitude at the center of the cell
     */
    longitudeAtX(i) {
      const halfXPixel = this.deltaX / 2;
      let lon = this.xmin + halfXPixel + i * this.deltaX;
      if (this.translateX) {
        lon = lon > 180 ? lon - 360 : lon;
      }
      return lon;
    }
    /**
     * Latitude for grid-index
     * @param   {Number} j - row index (integer)
     * @returns {Number} latitude at the center of the cell
     */
    latitudeAtY(j) {
      const halfYPixel = this.deltaY / 2;
      return this.ymax - halfYPixel - j * this.deltaY;
    }
    /**
     * 生成粒子位置
     * @param o
     * @param width
     * @param height
     * @param unproject
     * @return IPosition
     */
    randomize(o = {}, width, height, unproject) {
      const i = Math.random() * (width || this.cols) | 0;
      const j = Math.random() * (height || this.rows) | 0;
      const coords = unproject([i, j]);
      if (coords !== null) {
        o.x = coords[0];
        o.y = coords[1];
      } else {
        o.x = this.longitudeAtX(i);
        o.y = this.latitudeAtY(j);
      }
      return o;
    }
    /**
     * 判断是否是 `Field` 的实例
     * @return boolean
     */
    checkFields() {
      return this.isFields;
    }
  }

  const defaultOptions = {
    globalAlpha: 0.9,
    // 全局透明度
    lineWidth: 1,
    // 线条宽度
    colorScale: "#fff",
    velocityScale: 1 / 25,
    // particleAge: 90,
    maxAge: 90,
    // alias for particleAge
    // particleMultiplier: 1 / 300, // TODO: PATHS = Math.round(width * height * particleMultiplier);
    paths: 800,
    frameRate: 20,
    useCoordsDraw: true
  };
  function indexFor(m, min, max, colorScale) {
    return Math.max(0, Math.min(colorScale.length - 1, Math.round((m - min) / (max - min) * (colorScale.length - 1))));
  }
  class WindCore {
    constructor(ctx, options, field) {
      this.particles = [];
      this.generated = false;
      this.ctx = ctx;
      if (!this.ctx) {
        throw new Error("ctx error");
      }
      this.animate = this.animate.bind(this);
      this.setOptions(options);
      if (field) {
        this.updateData(field);
      }
    }
    static {
      this.Field = Field;
    }
    /**
     * 设置配置项
     * @param options
     */
    setOptions(options) {
      this.options = { ...defaultOptions, ...options };
      const { width, height } = this.ctx.canvas;
      if ("particleAge" in options && !("maxAge" in options) && isNumber(this.options.particleAge)) {
        this.options.maxAge = this.options.particleAge;
      }
      if ("particleMultiplier" in options && !("paths" in options) && isNumber(this.options.particleMultiplier)) {
        this.options.paths = Math.round(width * height * this.options.particleMultiplier);
      }
      this.prerender();
    }
    /**
     * 获取配置项
     */
    getOptions() {
      return this.options;
    }
    /**
     * 更新数据
     * @param field
     */
    updateData(field) {
      this.field = field;
      if (!this.generated) {
        return;
      }
      this.particles = this.prepareParticlePaths();
    }
    // @ts-ignore
    project(...args) {
      throw new Error("project must be overriden");
    }
    // @ts-ignore
    unproject(...args) {
      throw new Error("unproject must be overriden");
    }
    /**
     * 判断位置是否在当前视窗内
     * @param coordinates
     */
    intersectsCoordinate(coordinates) {
      throw new Error("must be overriden");
    }
    /**
     * 清空当前画布
     */
    clearCanvas() {
      this.stop();
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.forceStop = false;
    }
    isStop() {
      return !this.starting;
    }
    /**
     * 启动粒子动画
     */
    start() {
      this.starting = true;
      this.forceStop = false;
      this.then = Date.now();
      this.animate();
    }
    /**
     * 停止粒子动画
     */
    stop() {
      cancelAnimationFrame(this.animationLoop);
      this.starting = false;
      this.forceStop = true;
    }
    animate() {
      if (this.animationLoop) {
        cancelAnimationFrame(this.animationLoop);
      }
      this.animationLoop = requestAnimationFrame(this.animate);
      const now = Date.now();
      const delta = now - this.then;
      if (delta > this.options.frameRate) {
        this.then = now - delta % this.options.frameRate;
        this.render();
      }
    }
    /**
     * 渲染前处理
     */
    prerender() {
      this.generated = false;
      if (!this.field) {
        return;
      }
      this.particles = this.prepareParticlePaths();
      this.generated = true;
      if (!this.starting && !this.forceStop) {
        this.starting = true;
        this.then = Date.now();
        this.animate();
      }
    }
    /**
     * 开始渲染
     */
    render() {
      this.moveParticles();
      this.drawParticles();
      this.postrender();
    }
    /**
     * each frame render end
     */
    postrender() {
    }
    moveParticles() {
      const { width, height } = this.ctx.canvas;
      const particles = this.particles;
      const maxAge = this.options.maxAge;
      const velocityScale = isFunction(this.options.velocityScale) ? this.options.velocityScale() : this.options.velocityScale;
      let i = 0;
      const len = particles.length;
      for (; i < len; i++) {
        const particle = particles[i];
        if (particle.age > maxAge) {
          particle.age = 0;
          this.field.randomize(particle, width, height, this.unproject);
        }
        const x = particle.x;
        const y = particle.y;
        const vector = this.field.interpolatedValueAt(x, y);
        if (vector === null) {
          particle.age = maxAge;
        } else {
          const xt = x + vector.u * velocityScale;
          const yt = y + vector.v * velocityScale;
          if (this.field.hasValueAt(xt, yt)) {
            particle.xt = xt;
            particle.yt = yt;
            particle.m = vector.m;
          } else {
            particle.x = xt;
            particle.y = yt;
            particle.age = maxAge;
          }
        }
        particle.age++;
      }
    }
    fadeIn() {
      const prev = this.ctx.globalCompositeOperation;
      this.ctx.globalCompositeOperation = "destination-in";
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.globalCompositeOperation = prev;
    }
    drawParticles() {
      const particles = this.particles;
      this.fadeIn();
      this.ctx.globalAlpha = this.options.globalAlpha;
      this.ctx.fillStyle = `rgba(0, 0, 0, ${this.options.globalAlpha})`;
      this.ctx.lineWidth = isNumber(this.options.lineWidth) ? this.options.lineWidth : 1;
      this.ctx.strokeStyle = isString(this.options.colorScale) ? this.options.colorScale : "#fff";
      let i = 0;
      const len = particles.length;
      if (this.field && len > 0) {
        let min;
        let max;
        if (isValide(this.options.minVelocity) && isValide(this.options.maxVelocity)) {
          min = this.options.minVelocity;
          max = this.options.maxVelocity;
        } else {
          [min, max] = this.field.range;
        }
        for (; i < len; i++) {
          this[this.options.useCoordsDraw ? "drawCoordsParticle" : "drawPixelParticle"](particles[i], min, max);
        }
      }
    }
    /**
     * 用于绘制像素粒子
     * @param particle
     * @param min
     * @param max
     */
    drawPixelParticle(particle, min, max) {
      const pointPrev = [particle.x, particle.y];
      const pointNext = [particle.xt, particle.yt];
      if (pointNext && pointPrev && isValide(pointNext[0]) && isValide(pointNext[1]) && isValide(pointPrev[0]) && isValide(pointPrev[1]) && particle.age <= this.options.maxAge) {
        this.ctx.beginPath();
        this.ctx.moveTo(pointPrev[0], pointPrev[1]);
        this.ctx.lineTo(pointNext[0], pointNext[1]);
        if (isFunction(this.options.colorScale)) {
          this.ctx.strokeStyle = this.options.colorScale(particle.m);
        } else if (Array.isArray(this.options.colorScale)) {
          const colorIdx = indexFor(particle.m, min, max, this.options.colorScale);
          this.ctx.strokeStyle = this.options.colorScale[colorIdx];
        }
        if (isFunction(this.options.lineWidth)) {
          this.ctx.lineWidth = this.options.lineWidth(particle.m);
        }
        particle.x = particle.xt;
        particle.y = particle.yt;
        this.ctx.stroke();
      }
    }
    /**
     * 用于绘制坐标粒子
     * @param particle
     * @param min
     * @param max
     */
    drawCoordsParticle(particle, min, max) {
      const source = [particle.x, particle.y];
      const target = [particle.xt, particle.yt];
      if (target && source && isValide(target[0]) && isValide(target[1]) && isValide(source[0]) && isValide(source[1]) && this.intersectsCoordinate(target) && particle.age <= this.options.maxAge) {
        const pointPrev = this.project(source);
        const pointNext = this.project(target);
        if (pointPrev && pointNext) {
          this.ctx.beginPath();
          this.ctx.moveTo(pointPrev[0], pointPrev[1]);
          this.ctx.lineTo(pointNext[0], pointNext[1]);
          particle.x = particle.xt;
          particle.y = particle.yt;
          if (isFunction(this.options.colorScale)) {
            this.ctx.strokeStyle = this.options.colorScale(particle.m);
          } else if (Array.isArray(this.options.colorScale)) {
            const colorIdx = indexFor(particle.m, min, max, this.options.colorScale);
            this.ctx.strokeStyle = this.options.colorScale[colorIdx];
          }
          if (isFunction(this.options.lineWidth)) {
            this.ctx.lineWidth = this.options.lineWidth(particle.m);
          }
          this.ctx.stroke();
        }
      }
    }
    prepareParticlePaths() {
      const { width, height } = this.ctx.canvas;
      const particleCount = typeof this.options.paths === "function" ? this.options.paths(this) : this.options.paths;
      const particles = [];
      if (!this.field) {
        return [];
      }
      let i = 0;
      for (; i < particleCount; i++) {
        particles.push(
          this.field.randomize(
            {
              age: this.randomize()
            },
            width,
            height,
            this.unproject
          )
        );
      }
      return particles;
    }
    randomize() {
      return Math.floor(Math.random() * this.options.maxAge);
    }
  }

  class CesiumWind {
    constructor(data, options = {}) {
      this.canvas = null;
      this.wind = null;
      this.field = null;
      this.viewer = null;
      this.options = assign({}, options);
      this._windPaused = false;
      this._particleTrails = new Map();
      this._windHooks = null;
      this._removeScenePostRender = null;
      this._lastCameraState = null;
      this._handleScenePostRender = this.handleScenePostRender.bind(this);
      this.pickWindOptions();

      const canvas = document.createElement("canvas");
      canvas.style.cssText =
        "position:absolute; left:0; top:0;user-select:none;pointer-events: none;";
      canvas.className = "cesium-wind-j";
      this.canvas = canvas;

      if (data) {
        this.setData(data);
      }
    }

    addTo(viewer) {
      this.viewer = viewer;
      this.appendCanvas();
      this.bindSceneEvents();
      this.render(this.canvas);
    }

    remove() {
      if (!this.viewer) {
        return;
      }
      this.unbindSceneEvents();
      if (this.wind) {
        this.wind.stop();
        this.restoreWindHooks();
      }
      if (this.canvas) {
        removeDomNode(this.canvas);
      }
      this.clearParticleTrails();
      this._windPaused = false;
      this._lastCameraState = null;
      delete this.canvas;
    }

    removeLayer() {
      this.remove();
    }

    setData(data) {
      if (data && data.checkFields && data.checkFields()) {
        this.field = data;
      } else if (isArray(data)) {
        this.field = formatData(data);
      } else {
        console.error("Illegal data");
      }

      if (this.viewer && this.canvas && this.field) {
        this.clearParticleTrails();
        this.wind.updateData(this.field);
        this.appendCanvas();
        this.render(this.canvas);
      }

      return this;
    }

    getData() {
      return this.field;
    }

    getWindOptions() {
      return this.options.windOptions || {};
    }

    pickWindOptions() {
      Object.keys(defaultOptions).forEach((key) => {
        if (key in this.options) {
          if (this.options.windOptions === undefined) {
            this.options.windOptions = {};
          }
          this.options.windOptions[key] = this.options[key];
        }
      });
    }

    getContext() {
      if (this.canvas === null) {
        return;
      }
      return this.canvas.getContext("2d");
    }

    appendCanvas() {
      if (!this.viewer || !this.canvas) {
        return;
      }
      if (document.querySelector(".cesium-wind-j")) {
        return;
      }
      this.adjustSize();
      const cesiumWidget = this.viewer.canvas.parentNode;
      cesiumWidget.appendChild(this.canvas);
    }

    adjustSize() {
      const viewer = this.viewer;
      const canvas = this.canvas;
      const { width, height } = viewer.canvas;
      const devicePixelRatio = 1;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
    }

    render(canvas) {
      if (!this.getData() || !this.viewer) {
        return this;
      }
      const opt = this.getWindOptions();
      if (canvas && !this.wind) {
        const data = this.getData();

        const ctx = this.getContext();

        if (ctx) {
          this.wind = new WindCore(ctx, opt, data);

          this.wind.project = this.project.bind(this);
          this.wind.unproject = this.unproject.bind(this);
          this.wind.intersectsCoordinate = this.intersectsCoordinate.bind(this);
          this.wind.postrender = () => {};
          this.bindWindHooks();
        }
      }

      if (this.wind) {
        this.wind.prerender();
        this.wind.render();
      }

      return this;
    }

    bindSceneEvents() {
      const scene = this.viewer && this.viewer.scene;
      if (!scene || !scene.postRender || this._removeScenePostRender) {
        return;
      }

      this._removeScenePostRender = scene.postRender.addEventListener(
        this._handleScenePostRender
      );
    }

    unbindSceneEvents() {
      if (this._removeScenePostRender) {
        this._removeScenePostRender();
        this._removeScenePostRender = null;
      }
    }

    bindWindHooks() {
      const wind = this.wind;
      if (!wind || this._windHooks) {
        return;
      }

      const hooks = {
        stop: wind.stop,
        start: wind.start,
        prerender: wind.prerender,
        updateData: wind.updateData,
        clearCanvas: wind.clearCanvas,
        drawParticles: wind.drawParticles,
        drawCoordsParticle: wind.drawCoordsParticle,
      };

      wind.stop = (...args) => {
        const result = hooks.stop.apply(wind, args);
        this._windPaused = true;
        this._lastCameraState = this.getCameraState();
        return result;
      };

      wind.start = (...args) => {
        this._windPaused = false;
        this._lastCameraState = null;
        return hooks.start.apply(wind, args);
      };

      wind.prerender = (...args) => {
        this.clearParticleTrails();
        return hooks.prerender.apply(wind, args);
      };

      wind.updateData = (...args) => {
        this.clearParticleTrails();
        return hooks.updateData.apply(wind, args);
      };

      wind.clearCanvas = (...args) => {
        this.clearParticleTrails();
        const result = hooks.clearCanvas.apply(wind, args);
        this._windPaused = false;
        return result;
      };

      if (hooks.drawParticles && hooks.drawCoordsParticle) {
        wind.drawParticles = (...args) => {
          this.fadeParticleTrails();
          return hooks.drawParticles.apply(wind, args);
        };

        wind.drawCoordsParticle = (particle, min, max) => {
          this.recordParticleTrail(wind, particle, min, max);
          return hooks.drawCoordsParticle.call(wind, particle, min, max);
        };
      }

      this._windHooks = hooks;
    }

    restoreWindHooks() {
      if (!this.wind || !this._windHooks) {
        return;
      }

      Object.keys(this._windHooks).forEach((key) => {
        if (this._windHooks[key]) {
          this.wind[key] = this._windHooks[key];
        }
      });
      this._windHooks = null;
    }

    handleScenePostRender() {
      if (!this._windPaused || !this.wind || !this.canvas) {
        return;
      }

      const cameraState = this.getCameraState();
      if (!cameraState || cameraState === this._lastCameraState) {
        return;
      }

      this._lastCameraState = cameraState;
      this.redrawPausedFrame();
    }

    getCameraState() {
      const camera = this.viewer && this.viewer.camera;
      if (!camera || !this.canvas) {
        return null;
      }

      const position = camera.positionWC || camera.position;
      const direction = camera.directionWC || camera.direction;
      const up = camera.upWC || camera.up;
      if (!position || !direction || !up) {
        return null;
      }

      const frustum = camera.frustum || {};
      const values = [
        this.canvas.width,
        this.canvas.height,
        position.x,
        position.y,
        position.z,
        direction.x,
        direction.y,
        direction.z,
        up.x,
        up.y,
        up.z,
        frustum.near,
        frustum.far,
        frustum.fovy,
        frustum.aspectRatio,
      ];

      return values
        .map((value) =>
          Number.isFinite(value) ? Number(value).toFixed(6) : String(value)
        )
        .join(",");
    }

    clearParticleTrails() {
      this._particleTrails.clear();
    }

    fadeParticleTrails() {
      if (!this._particleTrails.size || !this.wind) {
        return;
      }

      const options = this.wind.getOptions();
      const globalAlpha = this.getGlobalAlpha(options);
      const alpha = globalAlpha * globalAlpha;
      const minAlpha = 0.01;

      this._particleTrails.forEach((trail, particle) => {
        for (let i = trail.length - 1; i >= 0; i--) {
          trail[i].alpha *= alpha;
          if (trail[i].alpha < minAlpha) {
            trail.splice(i, 1);
          }
        }

        if (trail.length === 0) {
          this._particleTrails.delete(particle);
        }
      });
    }

    recordParticleTrail(wind, particle, min, max) {
      const options = wind.getOptions();
      if (options.useCoordsDraw === false) {
        return;
      }

      const source = [particle.x, particle.y];
      const target = [particle.xt, particle.yt];
      if (
        !this.isValidCoordinate(source) ||
        !this.isValidCoordinate(target) ||
        particle.age > options.maxAge
      ) {
        return;
      }

      let trail = this._particleTrails.get(particle);
      if (!trail) {
        trail = [];
        this._particleTrails.set(particle, trail);
      }

      if (particle.age <= 1) {
        trail.length = 0;
      }

      trail.push({
        source,
        target,
        alpha: 1,
        color: this.getParticleColor(options, particle.m, min, max),
        lineWidth: this.getParticleLineWidth(options, particle.m),
      });

      const maxTrailLength = Math.max(1, options.maxAge || 1);
      if (trail.length > maxTrailLength) {
        trail.splice(0, trail.length - maxTrailLength);
      }
    }

    redrawPausedFrame() {
      const ctx = this.getContext();
      if (!ctx || !this._particleTrails.size || !this.wind) {
        return;
      }

      const options = this.wind.getOptions();
      const globalAlpha = this.getGlobalAlpha(options);
      const previousAlpha = ctx.globalAlpha;
      const previousComposite = ctx.globalCompositeOperation;
      const previousStrokeStyle = ctx.strokeStyle;
      const previousLineWidth = ctx.lineWidth;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = "source-over";

      this._particleTrails.forEach((trail) => {
        trail.forEach((segment) => {
          if (!this.intersectsCoordinate(segment.target)) {
            return;
          }

          const pointPrev = this.project(segment.source);
          const pointNext = this.project(segment.target);
          if (!pointPrev || !pointNext) {
            return;
          }

          ctx.globalAlpha = globalAlpha * segment.alpha;
          ctx.strokeStyle = segment.color;
          ctx.lineWidth = segment.lineWidth;
          ctx.beginPath();
          ctx.moveTo(pointPrev[0], pointPrev[1]);
          ctx.lineTo(pointNext[0], pointNext[1]);
          ctx.stroke();
        });
      });

      ctx.globalAlpha = previousAlpha;
      ctx.globalCompositeOperation = previousComposite;
      ctx.strokeStyle = previousStrokeStyle;
      ctx.lineWidth = previousLineWidth;
    }

    getGlobalAlpha(options) {
      return Number.isFinite(options.globalAlpha) ? options.globalAlpha : 0.9;
    }

    getParticleLineWidth(options, value) {
      if (typeof options.lineWidth === "function") {
        return options.lineWidth(value);
      }

      return Number.isFinite(options.lineWidth) ? options.lineWidth : 1;
    }

    getParticleColor(options, value, min, max) {
      const colorScale = options.colorScale;
      if (typeof colorScale === "function") {
        return colorScale(value);
      }

      if (Array.isArray(colorScale)) {
        return colorScale[this.indexFor(value, min, max, colorScale)];
      }

      return typeof colorScale === "string" ? colorScale : "#fff";
    }

    indexFor(value, min, max, colorScale) {
      if (
        !Number.isFinite(value) ||
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        max === min
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.min(
          colorScale.length - 1,
          Math.round(((value - min) / (max - min)) * (colorScale.length - 1))
        )
      );
    }

    isValidCoordinate(coordinate) {
      return (
        coordinate &&
        Number.isFinite(coordinate[0]) &&
        Number.isFinite(coordinate[1])
      );
    }

    project(coordinate) {
      const position = Cesium__namespace.Cartesian3.fromDegrees(
        coordinate[0],
        coordinate[1]
      );
      const scene = this.viewer.scene;
      const sceneCoor = (
        Cesium__namespace.SceneTransforms?.wgs84ToWindowCoordinates ||
        Cesium__namespace.SceneTransforms.worldToWindowCoordinates
      )(scene, position);
      if (!sceneCoor) {
        return null;
      }
      return [sceneCoor.x, sceneCoor.y];
    }

    unproject(pixel) {
      const viewer = this.viewer;
      const pick = new Cesium__namespace.Cartesian2(pixel[0], pixel[1]);
      const cartesian = viewer.scene.globe.pick(
        viewer.camera.getPickRay(pick),
        viewer.scene
      );

      if (!cartesian) {
        return null;
      }

      const ellipsoid = viewer.scene.globe.ellipsoid;
      const cartographic = ellipsoid.cartesianToCartographic(cartesian);
      const lat = Cesium__namespace.Math.toDegrees(cartographic.latitude);
      const lng = Cesium__namespace.Math.toDegrees(cartographic.longitude);
      return [lng, lat];
    }

    intersectsCoordinate(coordinate) {
      const ellipsoid = Cesium__namespace.Ellipsoid.WGS84;
      const camera = this.viewer.camera;
      const occluder = new Cesium__namespace.EllipsoidalOccluder(ellipsoid, camera.position);
      const point = Cesium__namespace.Cartesian3.fromDegrees(coordinate[0], coordinate[1]);
      return occluder.isPointVisible(point);
    }
  }

  const WindLayer = CesiumWind;

  exports.Field = Field;
  exports.WindLayer = WindLayer;
  exports["default"] = CesiumWind;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
