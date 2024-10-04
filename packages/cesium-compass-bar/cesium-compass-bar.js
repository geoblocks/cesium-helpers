import { LitElement, css, html } from "lit";

// FIXME: configurable tick count

export default class CesiumCompassBar extends LitElement {
  static get properties() {
    return {
      scene: { type: Object },
      heading: { type: Number },
    };
  }

  static get styles() {
    return css`
      :host {
        --cesium-compass-bar-tick-color: #000;
        --cesium-compass-bar-intercardinal-width: 100px;
      }
      :host * {
        box-sizing: content-box;
      }
      .container {
        display: flex;
        justify-content: center;
        height: 100%;
        overflow: hidden;
      }
      .compass-bar {
        display: flex;
        align-items: flex-end;
      }
      .compass-bar > div {
        width: var(--cesium-compass-bar-intercardinal-width);
        text-align: center;
      }
      .label {
        padding: 4px;
        color: var(--cesium-compass-bar-tick-color);
      }
      .ticks {
        display: flex;
        justify-content: space-around;
      }
      .ticks > div {
        width: 1px;
        height: 6px;
        background-color: var(--cesium-compass-bar-tick-color);
      }
      .ticks > div:nth-child(4) {
        height: 10px;
      }
      .center-tick {
        margin: auto;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--cesium-compass-bar-tick-color);
      }
    `;
  }

  constructor() {
    super();

    /**
     * @type {import('cesium').Scene}
     */
    this.scene;

    /**
     * @type {number}
     */
    this.intercardinalWidth;

    /**
     * @type {import('cesium').Event.RemoveCallback}
     */
    this.unlistenFromPostRender = null;
  }

  updated() {
    if (this.scene && !this.unlistenFromPostRender) {
      this.unlistenFromPostRender = this.scene.postRender.addEventListener(
        () => {
          this.heading = this.scene.camera.heading;
        }
      );
      // FIXME: probably not the best place to compute this
      this.intercardinalWidth = parseInt(getComputedStyle(this).getPropertyValue('--cesium-compass-bar-intercardinal-width'));
    }
  }

  getTransform(index) {
    const width = this.intercardinalWidth;
    let translate = -width / 2;
    const visibleIndex = -this.heading / (Math.PI / 4) + 4;
    const distance = visibleIndex - index;

    if (distance < -4) {
      translate += 8 * width;
    }
    if (distance > 4) {
      translate -= 8 * width;
    }
    return `transform: translate(${visibleIndex * width + translate}px)`;
  }

  render() {
    const ticks = html`
      <div class="ticks">
        ${Array(7)
          .fill()
          .map(() => html`<div part="tick"></div>`)}
      </div>
    `;
    return html`
      <div class="container">
        <div class="compass-bar">
          <div style=${this.getTransform(4)}>
            <div class="label" part="label major">N</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(3)}>
            <div class="label" part="label minor">NE</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(2)}>
            <div class="label" part="label major">E</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(1)}>
            <div class="label" part="label minor">SE</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(0)}>
            <div class="label" part="label major">S</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(-1)}>
            <div class="label" part="label minor">SW</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(-2)}>
            <div class="label" part="label major">W</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(-3)}>
            <div class="label" part="label minor">NW</div>
            ${ticks}
          </div>
        </div>
      </div>
      <div class="center-tick" part="center-tick"></div>
    `;
  }
}

customElements.define("cesium-compass-bar", CesiumCompassBar);
