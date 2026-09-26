import{a as e,t,u as n}from"./lit-BFn1CURT.js";import{t as r}from"./setup-DYuWPPM-.js";var i=class extends t{static get properties(){return{scene:{type:Object},heading:{type:Number}}}static get styles(){return n`
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
    `}constructor(){super(),this.scene=void 0,this.intercardinalWidth=0,this.heading=0,this.unlistenFromPostRender=null}updated(){this.scene&&!this.unlistenFromPostRender&&(this.unlistenFromPostRender=this.scene.postRender.addEventListener(()=>{this.heading=this.scene.camera.heading}),this.intercardinalWidth=parseFloat(getComputedStyle(this).getPropertyValue(`--cesium-compass-bar-intercardinal-width`)))}disconnectedCallback(){this.unlistenFromPostRender&&=(this.unlistenFromPostRender(),null),super.disconnectedCallback()}getTransform(e){let t=this.intercardinalWidth,n=-t/2,r=-this.heading/(Math.PI/4)+4,i=r-e;return i<-4&&(n+=8*t),i>4&&(n-=8*t),`transform: translate(${r*t+n}px)`}render(){let t=e`
      <div class="ticks">
        ${Array(7).fill(void 0).map((t,n,r)=>e`<div part="tick ${n===Math.floor(r.length/2)?`major`:`minor`}"></div>`)}
      </div>
    `;return e`
      <div class="container">
        <div class="compass-bar">
          <div style=${this.getTransform(4)}>
            <div class="label" part="label major">N</div>
            ${t}
          </div>
          <div style=${this.getTransform(3)}>
            <div class="label" part="label minor">NE</div>
            ${t}
          </div>
          <div style=${this.getTransform(2)}>
            <div class="label" part="label major">E</div>
            ${t}
          </div>
          <div style=${this.getTransform(1)}>
            <div class="label" part="label minor">SE</div>
            ${t}
          </div>
          <div style=${this.getTransform(0)}>
            <div class="label" part="label major">S</div>
            ${t}
          </div>
          <div style=${this.getTransform(-1)}>
            <div class="label" part="label minor">SW</div>
            ${t}
          </div>
          <div style=${this.getTransform(-2)}>
            <div class="label" part="label major">W</div>
            ${t}
          </div>
          <div style=${this.getTransform(-3)}>
            <div class="label" part="label minor">NW</div>
            ${t}
          </div>
        </div>
      </div>
      <div class="center-tick" part="center-tick"></div>
    `}};customElements.define(`cesium-compass-bar`,i),r(`cesiumContainer`).then(e=>{let t=document.querySelector(`cesium-compass-bar`);t.scene=e.scene});