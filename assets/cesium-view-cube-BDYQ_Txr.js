import{t as e}from"./setup-Bj0t9lPR.js";import{a as t,r as n,t as r}from"./lit-DfHKIwhG.js";var i=class extends r{static get properties(){return{scene:{type:Object}}}static get styles(){return t`
      :host {
        --cesium-view-cube-stroke-color: rgba(0, 0, 0, 0.6);
        --cesium-view-cube-fill-color: rgb(224, 225, 226);
      }
      :host * {
        box-sizing: content-box;
      }
      #wrapper {
        width: 100px;
        height: 100px;
      }
      #cube {
        width: 50%;
        height: 50%;
        top: 25%;
        transform-style: preserve-3d;
        margin: auto;
        position: relative;
        will-change: transform;
      }
      #cube > div {
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        width: 100%;
        height: 100%;
        user-select: none;
        color: var(--cesium-view-cube-stroke-color);
        background-color: var(--cesium-view-cube-fill-color);
        border: 1px solid var(--cesium-view-cube-stroke-color);
      }
      #side_t {
        transform: rotatex(90deg) translateZ(25px);
      }
      #side_w {
        transform: rotateY(-90deg) translateZ(25px);
        border-right: 2px solid blue !important;
        border-bottom: 2px solid green !important;
      }
      #side_s {
        border-left: 2px solid blue !important;
        border-bottom: 2px solid red !important;
        transform: translateZ(25px);
      }
      #side_e {
        transform: rotateY(90deg) translateZ(25px);
      }
      #side_n {
        transform: rotateY(180deg) translateZ(25px);
      }
      #side_b {
        transform: rotateX(-90deg) translateZ(25px);
        border-top: 2px solid red !important;
        border-left: 2px solid green !important;
      }
    `}constructor(){super(),this.scene=void 0,this.cubeElement=void 0,this.unlistenPostRender=null}firstUpdated(){this.cubeElement=this.renderRoot.querySelector(`#cube`)}updated(){this.scene&&!this.unlistenPostRender&&(this.unlistenPostRender=this.scene.postRender.addEventListener(()=>this.updateFromCamera()))}disconnectedCallback(){this.unlistenPostRender&&this.unlistenPostRender(),super.disconnectedCallback()}updateFromCamera(){if(this.cubeElement){let e=this.scene.camera;this.cubeElement.style.transform=`rotateX(${e.pitch}rad) rotateY(${e.heading}rad)`}}render(){return n`
      <div id="wrapper">
        <div id="cube">
          <div id="side_t">top</div>
          <div id="side_w">W</div>
          <div id="side_s">S</div>
          <div id="side_e">E</div>
          <div id="side_n">N</div>
          <div id="side_b">bottom</div>
        </div>
      </div>
    `}};customElements.define(`cesium-view-cube`,i),e(`cesiumContainer`).then(e=>{let t=document.querySelector(`cesium-view-cube`);t.scene=e.scene});