import"./cesium-compass-bar.ddd5a70c.js";var e=globalThis,t={},i={},s=e.parcelRequire5532;null==s&&((s=function(e){if(e in t)return t[e].exports;if(e in i){var s=i[e];delete i[e];var r={id:e,exports:{}};return t[e]=r,s.call(r.exports,r,r.exports),r.exports}var a=Error("Cannot find module '"+e+"'");throw a.code="MODULE_NOT_FOUND",a}).register=function(e,t){i[e]=t},e.parcelRequire5532=s),s.register;var r=s("800sp");class a extends r.LitElement{static get properties(){return{scene:{type:Object},heading:{type:Number}}}static get styles(){return(0,r.css)`
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
    `}constructor(){super(),this.scene,this.intercardinalWidth,this.unlistenFromPostRender=null}updated(){this.scene&&!this.unlistenFromPostRender&&(this.unlistenFromPostRender=this.scene.postRender.addEventListener(()=>{this.heading=this.scene.camera.heading}),this.intercardinalWidth=parseInt(getComputedStyle(this).getPropertyValue("--cesium-compass-bar-intercardinal-width")))}getTransform(e){let t=this.intercardinalWidth,i=-t/2,s=-this.heading/(Math.PI/4)+4,r=s-e;return r<-4&&(i+=8*t),r>4&&(i-=8*t),`transform: translate(${s*t+i}px)`}render(){let e=(0,r.html)`
      <div class="ticks">
        ${Array(7).fill().map(()=>(0,r.html)`<div part="tick"></div>`)}
      </div>
    `;return(0,r.html)`
      <div class="container">
        <div class="compass-bar">
          <div style=${this.getTransform(4)}>
            <div class="label" part="label major">N</div>
            ${e}
          </div>
          <div style=${this.getTransform(3)}>
            <div class="label" part="label minor">NE</div>
            ${e}
          </div>
          <div style=${this.getTransform(2)}>
            <div class="label" part="label major">E</div>
            ${e}
          </div>
          <div style=${this.getTransform(1)}>
            <div class="label" part="label minor">SE</div>
            ${e}
          </div>
          <div style=${this.getTransform(0)}>
            <div class="label" part="label major">S</div>
            ${e}
          </div>
          <div style=${this.getTransform(-1)}>
            <div class="label" part="label minor">SW</div>
            ${e}
          </div>
          <div style=${this.getTransform(-2)}>
            <div class="label" part="label major">W</div>
            ${e}
          </div>
          <div style=${this.getTransform(-3)}>
            <div class="label" part="label minor">NW</div>
            ${e}
          </div>
        </div>
      </div>
      <div class="center-tick" part="center-tick"></div>
    `}}customElements.define("cesium-compass-bar",a);
//# sourceMappingURL=cesium-compass-bar.b0199fa6.js.map
