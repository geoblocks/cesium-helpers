var e=globalThis,i={},s={},t=e.parcelRequire5532;null==t&&((t=function(e){if(e in i)return i[e].exports;if(e in s){var t=s[e];delete s[e];var r={id:e,exports:{}};return i[e]=r,t.call(r.exports,r,r.exports),r.exports}var a=Error("Cannot find module '"+e+"'");throw a.code="MODULE_NOT_FOUND",a}).register=function(e,i){s[e]=i},e.parcelRequire5532=t),t.register;var r=t("800sp");class a extends r.LitElement{static get properties(){return{scene:{type:Object},heading:{type:Number}}}static get styles(){return(0,r.css)`
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
    `}constructor(){super(),this.scene,this.unlistenFromPostRender=null}updated(){this.scene&&!this.unlistenFromPostRender&&(this.unlistenFromPostRender=this.scene.postRender.addEventListener(()=>{this.heading=this.scene.camera.heading}))}getTransform(e){let i=-50,s=-this.heading/(Math.PI/4)+4,t=s-e;return t<-4&&(i+=800),t>4&&(i-=800),`transform: translate(${100*s+i}px)`}render(){let e=(0,r.html)`
      <div class="grid">
        ${Array(7).fill().map(()=>(0,r.html)`<div></div>`)}
      </div>
    `;return(0,r.html)`
      <div class="container">
        <div class="compass-bar">
          <div style=${this.getTransform(4)}>
            <div class="label">N</div>
            ${e}
          </div>
          <div style=${this.getTransform(3)}>
            <div class="label">NE</div>
            ${e}
          </div>
          <div style=${this.getTransform(2)}>
            <div class="label">E</div>
            ${e}
          </div>
          <div style=${this.getTransform(1)}>
            <div class="label">SE</div>
            ${e}
          </div>
          <div style=${this.getTransform(0)}>
            <div class="label">S</div>
            ${e}
          </div>
          <div style=${this.getTransform(-1)}>
            <div class="label">SW</div>
            ${e}
          </div>
          <div style=${this.getTransform(-2)}>
            <div class="label">W</div>
            ${e}
          </div>
          <div style=${this.getTransform(-3)}>
            <div class="label">NW</div>
            ${e}
          </div>
        </div>
      </div>
      <div class="center-tick"></div>
    `}}customElements.define("cesium-compass-bar",a);
//# sourceMappingURL=cesium-compass-bar.d225dd17.js.map
