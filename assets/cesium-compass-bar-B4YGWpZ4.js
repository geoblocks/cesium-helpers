import{a as e,t,u as n}from"./lit-BFn1CURT.js";import{t as r}from"./setup-0DgT5JyI.js";var i=[`N`,`NE`,`E`,`SE`,`S`,`SW`,`W`,`NW`],a=class extends t{static get properties(){return{scene:{type:Object},heading:{type:Number},intercardinalWidth:{state:!0},hostWidth:{state:!0}}}static get styles(){return n`
      :host {
        --cesium-compass-bar-tick-color: rgb(224, 225, 226);
        --cesium-compass-bar-intercardinal-width: 100px;
        display: block;
        position: relative;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 6px;
      }
      :host * {
        box-sizing: content-box;
      }
      .container {
        height: 100%;
        overflow: hidden;
        mask-image: linear-gradient(to right, transparent, #000 15%, #000 85%, transparent);
      }
      .compass-bar {
        display: flex;
        align-items: flex-end;
      }
      .compass-bar > div {
        flex: none;
        width: var(--cesium-compass-bar-intercardinal-width);
        text-align: center;
      }
      .label {
        padding: 4px;
        color: var(--cesium-compass-bar-tick-color);
      }
      .ticks {
        display: flex;
        justify-content: space-between;
        margin: 0 calc(100% / 18);
      }
      .ticks > div {
        width: 1px;
        height: 6px;
        background-color: var(--cesium-compass-bar-tick-color);
      }
      .ticks > div:nth-child(5) {
        height: 10px;
      }
      .center-tick {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 10px;
        height: 6px;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
        background-color: var(--cesium-compass-bar-tick-color);
      }
    `}constructor(){super(),this.scene=void 0,this.intercardinalWidth=0,this.hostWidth=0,this.heading=0,this.unlistenFromPostRender=null,this.resizeObserver=new ResizeObserver(()=>this.measure())}connectedCallback(){super.connectedCallback(),this.resizeObserver.observe(this),this.requestUpdate()}disconnectedCallback(){this.resizeObserver.disconnect(),this.unlistenFromPostRender&&=(this.unlistenFromPostRender(),null),super.disconnectedCallback()}measure(){this.hostWidth=this.renderRoot.querySelector(`.container`)?.clientWidth??0,this.intercardinalWidth=parseFloat(getComputedStyle(this).getPropertyValue(`--cesium-compass-bar-intercardinal-width`))}updated(){this.scene&&!this.unlistenFromPostRender&&(this.unlistenFromPostRender=this.scene.postRender.addEventListener(()=>{this.heading=this.scene.camera.heading}))}render(){let t=this.intercardinalWidth,n=this.heading/(Math.PI/4),r=t>0?this.hostWidth/2/t:0,a=Math.ceil(n-r-.5),o=Math.floor(n+r+.5),s=Math.round(this.hostWidth/2-t/2+(a-n)*t),c=e`
      <div class="ticks">
        ${Array(9).fill(void 0).map((t,n,r)=>e`<div part="tick ${n===Math.floor(r.length/2)?`major`:`minor`}"></div>`)}
      </div>
    `,l=[];for(let t=a;t<=o;t++){let n=i[(t%8+8)%8];l.push(e`
        <div>
          <div class="label" part="label ${t%2==0?`major`:`minor`}">${n}</div>
          ${c}
        </div>
      `)}return e`
      <div class="container">
        <div class="compass-bar" style="transform: translateX(${s}px)">${l}</div>
      </div>
      <div class="center-tick" part="center-tick"></div>
    `}};customElements.define(`cesium-compass-bar`,a),r(`cesiumContainer`).then(e=>{let t=document.querySelector(`cesium-compass-bar`);t.scene=e.scene});