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
    this.render(this.canvas);
  }

  remove() {
    if (!this.viewer) {
      return;
    }
    if (this.wind) {
      this.wind.stop();
    }
    if (this.canvas) {
      removeDomNode(this.canvas);
    }
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
      }
    }

    if (this.wind) {
      this.wind.prerender();
      this.wind.render();
    }

    return this;
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
