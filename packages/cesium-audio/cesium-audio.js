import { Cartesian2, Cartesian3} from "cesium";

export default class CesiumSound {
  constructor(viewer, position, panner) {
    this.scene = viewer.scene;
    this.position = position;
    this.panner = panner;

    this.setPan();

    viewer.scene.postRender.addEventListener(() => this.setPan());
  }

  setPan() {
    const camera = this.scene.camera;
    const cameraDirection = Cartesian2.fromCartesian3(camera.direction);
    // vector from camera to sound
    const toPosition = Cartesian2.fromCartesian3(Cartesian3.subtract(this.position, camera.position, new Cartesian3()));

    // angle between camera direction and sound
    const angle = Cartesian2.angleBetween(cameraDirection, toPosition);
    const rightSide = Cartesian2.cross(cameraDirection, toPosition) > 0;

    this.panner.pan.value = rightSide ? -Math.sin(angle) : Math.sin(angle);
    console.log(angle, this.panner.pan.value);
  }
}
