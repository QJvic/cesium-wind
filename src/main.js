import * as Cesium from "cesium/Cesium";
import {
  WindCore,
  assign,
  defaultOptions,
  Field,
  formatData,
  isArray,
  removeDomNode,
} from "wind-core";

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
    const position = Cesium.Cartesian3.fromDegrees(
      coordinate[0],
      coordinate[1]
    );
    const scene = this.viewer.scene;
    const sceneCoor = (
      Cesium.SceneTransforms?.wgs84ToWindowCoordinates ||
      Cesium.SceneTransforms.worldToWindowCoordinates
    )(scene, position);
    if (!sceneCoor) {
      return null;
    }
    return [sceneCoor.x, sceneCoor.y];
  }

  unproject(pixel) {
    const viewer = this.viewer;
    const pick = new Cesium.Cartesian2(pixel[0], pixel[1]);
    const cartesian = viewer.scene.globe.pick(
      viewer.camera.getPickRay(pick),
      viewer.scene
    );

    if (!cartesian) {
      return null;
    }

    const ellipsoid = viewer.scene.globe.ellipsoid;
    const cartographic = ellipsoid.cartesianToCartographic(cartesian);
    const lat = Cesium.Math.toDegrees(cartographic.latitude);
    const lng = Cesium.Math.toDegrees(cartographic.longitude);
    return [lng, lat];
  }

  intersectsCoordinate(coordinate) {
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    const camera = this.viewer.camera;
    const occluder = new Cesium.EllipsoidalOccluder(ellipsoid, camera.position);
    const point = Cesium.Cartesian3.fromDegrees(coordinate[0], coordinate[1]);
    return occluder.isPointVisible(point);
  }
}

const WindLayer = CesiumWind;

export { Field, WindLayer };

export default CesiumWind;
