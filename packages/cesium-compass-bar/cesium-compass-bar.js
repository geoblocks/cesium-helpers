import { LitElement, css, html } from "lit";

// FIXME: configurable width
// FIXME: configurable styling with css part

class CesiumCompassBar extends LitElement {
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
      }
      .compass-bar > div {
        width: 100px;
        text-align: center;
      }
      .label {
        padding: 4px;
        color: var(--cesium-compass-bar-tick-color);
      }
      .grid {
        display: flex;
        justify-content: space-around;
        align-items: flex-end;
      }
      .grid > div {
        width: 1px;
        height: 6px;
        background-color: var(--cesium-compass-bar-tick-color);
      }
      .grid > div:nth-child(4) {
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
    }
  }

  getTransform(index) {
    const width = 100;
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
      <div class="grid">
        ${Array(7)
          .fill()
          .map(() => html`<div></div>`)}
      </div>
    `;
    return html`
      <div class="container">
        <div class="compass-bar">
          <div style=${this.getTransform(4)}>
            <div class="label">N</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(3)}>
            <div class="label">NE</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(2)}>
            <div class="label">E</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(1)}>
            <div class="label">SE</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(0)}>
            <div class="label">S</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(-1)}>
            <div class="label">SW</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(-2)}>
            <div class="label">W</div>
            ${ticks}
          </div>
          <div style=${this.getTransform(-3)}>
            <div class="label">NW</div>
            ${ticks}
          </div>
        </div>
      </div>
      <div class="center-tick"></div>
    `;
  }
}

customElements.define("cesium-compass-bar", CesiumCompassBar);
