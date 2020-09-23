<template>
    <div id="app">
        <div id="cesium"></div>
    </div>
</template>

<script>
  import * as Cesium from 'cesium/Cesium';
  import "cesium/Widgets/widgets.css";
  import CesiumWind from "../../../dist/cesium-wind.esm";

  export default {
    name: "App",

    mounted() {
      this.init();
    },

    methods: {
      init() {
        const viewer = new Cesium.Viewer("cesium");

        const windOptions = {
          colorScale: [
            'rgb(36,104, 180)',
            'rgb(60,157, 194)',
            'rgb(128,205,193 )',
            'rgb(151,218,168 )',
            'rgb(198,231,181)',
            'rgb(238,247,217)',
            'rgb(255,238,159)',
            'rgb(252,217,125)',
            'rgb(255,182,100)',
            'rgb(252,150,75)',
            'rgb(250,112,52)',
            'rgb(245,64,32)',
            'rgb(237,45,28)',
            'rgb(220,24,32)',
            'rgb(180,0,35)',
          ],
          frameRate: 16,
          maxAge: 60,
          globalAlpha: 0.9,
          velocityScale: 1 / 30,
          paths: 2000
        };

        fetch('https://qjvic.github.io/cesium-wind/examples/wind.json')
          .then(res => res.json())
          .then(res => {
            const windLayer = new CesiumWind(res,{windOptions});
            windLayer.addTo(viewer);
          });
      }
    }
  };
</script>

<style lang="less">
    * {
        margin: 0;
    }

    #cesium {
        height: 100vh;
        width: 100vw;
    }
</style>
