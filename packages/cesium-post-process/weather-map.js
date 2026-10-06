import {Cartesian4} from '@cesium/core';
// @ts-expect-error the engine exports its textures, but does not type them
import {Texture} from '@cesium/engine';

const TWO_PI = 2 * Math.PI;

/**
 * Where it rains: an image whose red channel is the local intensity, 0 to 1,
 * over a rectangle of longitudes and latitudes, north up, not crossing the
 * antimeridian. Outside the rectangle there is none, so the image should
 * fade to 0 at its edges.
 * @typedef {{image: HTMLCanvasElement | ImageData, rectangle: import('@cesium/core').Rectangle}} WeatherMapOptions
 */

/**
 * A map of the rain for the shaders, WeatherMap.glsl's uniforms, and its
 * intensity at a point on the CPU, bilinear as the shaders sample it. Without
 * a map, the intensity everywhere is the empty value: 1 for rain everywhere,
 * 0 for none.
 */
export default class WeatherMap {
  /**
   * @param {number} empty the intensity everywhere without a map
   */
  constructor(empty) {
    this.empty_ = empty;
    /** @type {WeatherMapOptions | undefined} */
    this.map_ = undefined;
    /** @type {{width: number, height: number, data: Uint8ClampedArray} | undefined} */
    this.data_ = undefined;
    /**
     * The rectangle in the ellipsoid's texture coordinates: its west and
     * south, and one over its width and height; the whole globe without a map.
     */
    this.bounds = new Cartesian4(0, 0, 1, 1);
    // made when the shaders first need it: a stage given an image makes its texture a frame after
    // it is set, and draws without one in between
    /** @type {any} */
    this.texture_ = undefined;
  }

  get map() {
    return this.map_;
  }

  set map(value) {
    this.map_ = value;
    if (!value) {
      this.data_ = undefined;
      Cartesian4.fromElements(0, 0, 1, 1, this.bounds);
    } else {
      const {image, rectangle} = value;
      this.data_ = 'data' in image ? image : image.getContext('2d', {willReadFrequently: true})?.getImageData(0, 0, image.width, image.height);
      Cartesian4.fromElements(
        rectangle.west / TWO_PI + 0.5,
        rectangle.south / Math.PI + 0.5,
        TWO_PI / (rectangle.east - rectangle.west),
        Math.PI / (rectangle.north - rectangle.south),
        this.bounds,
      );
    }
    // made again from the new image when the shaders next need it
    this.texture_ = this.texture_?.destroy();
  }

  /**
   * The intensity at a point, 0 to 1, bilinear as the shaders sample it: the
   * empty value without a map, 0 outside its rectangle.
   * @param {number} longitude radians
   * @param {number} latitude radians
   */
  intensityAt(longitude, latitude) {
    if (!this.map_ || !this.data_) {
      return this.empty_;
    }
    const {west, south, east, north} = this.map_.rectangle;
    const u = (longitude - west) / (east - west);
    const v = (latitude - south) / (north - south);
    if (u < 0 || u > 1 || v < 0 || v > 1) {
      return 0;
    }
    const {width, height, data} = this.data_;
    // the image's rows go down from the north
    const x = Math.min(Math.max(u * width - 0.5, 0), width - 1);
    const y = Math.min(Math.max((1 - v) * height - 0.5, 0), height - 1);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    const red = (/** @type {number} */ column, /** @type {number} */ row) => data[4 * (row * width + column)] / 255;
    const upper = red(x0, y0) + (red(x1, y0) - red(x0, y0)) * (x - x0);
    const lower = red(x0, y1) + (red(x1, y1) - red(x0, y1)) * (x - x0);
    return upper + (lower - upper) * (y - y0);
  }

  /**
   * The map's texture, a pixel of the empty value without a map.
   * @param {any} context the scene's context
   */
  texture(context) {
    if (!this.texture_) {
      const value = 255 * this.empty_;
      this.texture_ = new Texture({
        context,
        source: this.map_?.image ?? new ImageData(new Uint8ClampedArray([value, value, value, 255]), 1, 1),
      });
    }
    return this.texture_;
  }

  destroy() {
    this.texture_ = this.texture_?.destroy();
  }
}
