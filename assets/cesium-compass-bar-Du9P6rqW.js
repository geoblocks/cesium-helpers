import"./modulepreload-polyfill-P2Xu9kJm.js";import{t as e}from"./setup-COOW6wa2.js";import{C as t}from"./cesium-shim-OL_EbrB8.js";import{a as n,t as r,u as i}from"./lit-D8AhzmO2.js";var a=[`N`,`NE`,`E`,`SE`,`S`,`SW`,`W`,`NW`],o=class extends r{static get properties(){return{scene:{type:Object},heading:{type:Number},intercardinalWidth:{state:!0},hostWidth:{state:!0}}}static get styles(){return i`
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
        cursor: grab;
        touch-action: none;
        user-select: none;
        mask-image: linear-gradient(to right, transparent, #000 15%, #000 85%, transparent);
      }
      .container.dragging {
        cursor: grabbing;
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
    `}constructor(){super(),this.scene=void 0,this.intercardinalWidth=0,this.hostWidth=0,this.heading=0,this.unlistenFromPostRender=null,this.resizeObserver=new ResizeObserver(()=>this.measure()),this.drag=null}onPointerDown(e){this.scene&&e.button===0&&(e.currentTarget.setPointerCapture(e.pointerId),this.drag={pointerId:e.pointerId,x:e.clientX,heading:this.scene.camera.heading},this.requestUpdate())}onPointerMove(e){if(!this.drag||e.pointerId!==this.drag.pointerId||this.intercardinalWidth<=0)return;let n=this.drag.heading-(e.clientX-this.drag.x)/this.intercardinalWidth*t.PI_OVER_FOUR,r=this.scene.camera;r.setView({orientation:{heading:n,pitch:r.pitch,roll:r.roll}})}onPointerEnd(e){this.drag&&e.pointerId===this.drag.pointerId&&(this.drag=null,this.requestUpdate())}connectedCallback(){super.connectedCallback(),this.resizeObserver.observe(this),this.requestUpdate()}disconnectedCallback(){this.resizeObserver.disconnect(),this.unlistenFromPostRender&&=(this.unlistenFromPostRender(),null),super.disconnectedCallback()}measure(){this.hostWidth=this.renderRoot.querySelector(`.container`)?.clientWidth??0,this.intercardinalWidth=parseFloat(getComputedStyle(this).getPropertyValue(`--cesium-compass-bar-intercardinal-width`))}updated(){this.scene&&!this.unlistenFromPostRender&&(this.unlistenFromPostRender=this.scene.postRender.addEventListener(()=>{this.heading=this.scene.camera.heading}))}render(){let e=this.intercardinalWidth,r=this.heading/t.PI_OVER_FOUR,i=e>0?this.hostWidth/2/e:0,o=Math.ceil(r-i-.5),s=Math.floor(r+i+.5),c=Math.round(this.hostWidth/2-e/2+(o-r)*e),l=n`
      <div class="ticks">
        ${Array(9).fill(void 0).map((e,t,r)=>n`<div part="tick ${t===Math.floor(r.length/2)?`major`:`minor`}"></div>`)}
      </div>
    `,u=[];for(let e=o;e<=s;e++){let r=a[t.mod(e,8)];u.push(n`
        <div>
          <div class="label" part="label ${e%2==0?`major`:`minor`}">${r}</div>
          ${l}
        </div>
      `)}return n`
      <div
        class="container ${this.drag?`dragging`:``}"
        @pointerdown=${this.onPointerDown}
        @pointermove=${this.onPointerMove}
        @pointerup=${this.onPointerEnd}
        @pointercancel=${this.onPointerEnd}
      >
        <div class="compass-bar" style="transform: translateX(${c}px)">${u}</div>
      </div>
      <div class="center-tick" part="center-tick"></div>
    `}};customElements.define(`cesium-compass-bar`,o),e(`cesiumContainer`).then(e=>{let t=document.querySelector(`cesium-compass-bar`);t.scene=e.scene});