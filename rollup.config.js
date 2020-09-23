import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';

const pkg = require(`./package.json`);

const time = new Date();
const banner = `/*!
 * author: ${pkg.author}
 * cesium-wind ${pkg.version}
 * build-time: ${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}
 * LICENSE: ${pkg.license}
 * (c) 2020-${time.getFullYear()} ${pkg.homepage}
 */
`

export default {
  input: 'src/main.js',
  output: [
    {
      file: "dist/cesium-wind.esm.js",
      format: "esm",
      banner,
      sourcemap: true
    },
    {
      file: "dist/cesium-wind.js",
      format: "umd",
      name: "CesiumWind",
      banner
    },
    {
      file: "dist/cesium-wind.cjs.js",
      format: "cjs",
      banner,
      sourcemap: true
    }
  ],
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    sourcemaps()
  ],
};
