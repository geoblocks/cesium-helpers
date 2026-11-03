import"./modulepreload-polyfill-P2Xu9kJm.js";import{t as e}from"./setup-COOW6wa2.js";import{B as t,T as n,i as r,m as i,w as a}from"./cesium-shim-OL_EbrB8.js";import{a as o,s,t as c,u as l}from"./lit-D8AhzmO2.js";var u=[{name:`e`,label:`E`,axis:0,sign:1},{name:`w`,label:`W`,axis:0,sign:-1},{name:`n`,label:`N`,axis:1,sign:1},{name:`s`,label:`S`,axis:1,sign:-1},{name:`top`,label:`top`,axis:2,sign:1},{name:`bottom`,label:`bottom`,axis:2,sign:-1}],d=[{name:`x`,axis:0},{name:`y`,axis:1},{name:`z`,axis:2}],f=new n(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1),p=new n,m=new n,h=new a,g=[new r,new r,new r],_=class extends c{static get properties(){return{scene:{type:Object},axes:{state:!0}}}static get styles(){return l`
      :host {
        --cesium-view-cube-size: 100px;
        /* in shares of the widget's size, bare numbers: the cube's side, its faces' labels' size, the axes' length
           from the center, their labels' distance from it and size */
        --cesium-view-cube-cube-size: 0.6;
        --cesium-view-cube-face-label-size: 0.12;
        --cesium-view-cube-axis-length: 0.28;
        --cesium-view-cube-axis-label-distance: 0.39;
        --cesium-view-cube-axis-label-size: 0.2;
        /* how much a face turns toward the camera, 0 edge on to 1 facing it, before its label shows */
        --cesium-view-cube-face-label-threshold: 0.25;
        --cesium-view-cube-fill-color: rgb(224, 225, 226);
        --cesium-view-cube-stroke-color: rgba(0, 0, 0, 0.6);
        --cesium-view-cube-face-stroke-width: 1px;
        --cesium-view-cube-label-color: rgba(0, 0, 0, 0.6);
        --cesium-view-cube-x-color: rgb(230, 50, 40);
        --cesium-view-cube-y-color: rgb(230, 200, 30);
        --cesium-view-cube-z-color: rgb(40, 180, 60);
        --cesium-view-cube-axis-width: 2px;
        display: block;
        width: var(--cesium-view-cube-size);
        height: var(--cesium-view-cube-size);
      }
      svg {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
        user-select: none;
      }
      /* the drawing is 2 units across, its center at 0: a share s of the widget is 2 s units */
      .cube {
        transform: scale(var(--cesium-view-cube-cube-size));
      }
      .axes {
        transform: scale(calc(var(--cesium-view-cube-axis-length) * 2));
      }
      .face {
        fill: var(--cesium-view-cube-fill-color);
        stroke: var(--cesium-view-cube-stroke-color);
        stroke-width: var(--cesium-view-cube-face-stroke-width);
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
      }
      text {
        text-anchor: middle;
        dominant-baseline: central;
        pointer-events: none;
      }
      /* at the face's center (--x, --y, a unit cube's), shown once the face turns enough toward the camera (--facing) */
      .face-label {
        fill: var(--cesium-view-cube-label-color);
        font-size: calc(var(--cesium-view-cube-face-label-size) * 2px);
        transform: translate(calc(var(--x) * var(--cesium-view-cube-cube-size) * 1px),
          calc(var(--y) * var(--cesium-view-cube-cube-size) * 1px));
        opacity: clamp(0, calc((var(--facing) - var(--cesium-view-cube-face-label-threshold)) * 1000), 1);
      }
      /* hidden by default: the page shows them (::part(axis), ::part(axis-label)) */
      .axis,
      .axis-label {
        display: none;
      }
      .axis {
        stroke-width: var(--cesium-view-cube-axis-width);
        stroke-linecap: round;
        vector-effect: non-scaling-stroke;
      }
      .axis-x {
        stroke: var(--cesium-view-cube-x-color);
        fill: var(--cesium-view-cube-x-color);
      }
      .axis-y {
        stroke: var(--cesium-view-cube-y-color);
        fill: var(--cesium-view-cube-y-color);
      }
      .axis-z {
        stroke: var(--cesium-view-cube-z-color);
        fill: var(--cesium-view-cube-z-color);
      }
      /* along its axis (--x, --y, a unit one's); after the colors, its stroke none */
      .axis-label {
        stroke: none;
        font-size: calc(var(--cesium-view-cube-axis-label-size) * 2px);
        font-weight: bold;
        transform: translate(calc(var(--x) * var(--cesium-view-cube-axis-label-distance) * 2px),
          calc(var(--y) * var(--cesium-view-cube-axis-label-distance) * 2px));
      }
    `}constructor(){super(),this.scene=void 0,this.axes=[r.UNIT_X,new r(0,-1,0),new r(0,0,1)],this.listening=null}connectedCallback(){super.connectedCallback(),this.requestUpdate()}disconnectedCallback(){this.stopListening(),super.disconnectedCallback()}stopListening(){this.listening?.remove(),this.listening=null}willUpdate(){if(this.listening?.scene!==this.scene&&(this.stopListening(),this.scene)){let e=this.scene;this.listening={scene:e,remove:e.postRender.addEventListener(()=>this.updateFromCamera())},this.updateFromCamera()}}updateFromCamera(){let{camera:e,ellipsoid:o,mode:s}=this.scene,c=s===t.SCENE3D?i.eastNorthUpToFixedFrame(e.positionWC,o,p):f,l=n.getMatrix3(n.multiply(e.viewMatrix,c,m),h);g.map((e,t)=>(a.getColumn(l,t,e),e.y=-e.y,!r.equalsEpsilon(e,this.axes[t],1e-6))).includes(!0)&&(this.axes=g.map(e=>r.clone(e)))}render(){let e=this.axes,t=t=>({x:t.reduce((t,n,r)=>t+n*e[r].x,0),y:t.reduce((t,n,r)=>t+n*e[r].y,0)}),n=u.filter(({axis:t,sign:n})=>n*e[t].z>.001),r=n.map(({name:e,axis:n,sign:r})=>{let[i,a]=[0,1,2].filter(e=>e!==n),o=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([e,o])=>{let s=[0,0,0];return s[n]=r,s[i]=e,s[a]=o,t(s)});return s`<polygon class="face" part="face face-${e}" points=${o.map(({x:e,y:t})=>`${e},${t}`).join(` `)}></polygon>`}),i=n.map(({name:n,label:r,axis:i,sign:a})=>{let o=t([0,1,2].map(e=>e===i?a:0));return s`<text class="face-label" part="face-label face-label-${n}"
        style="--x: ${o.x}; --y: ${o.y}; --facing: ${a*e[i].z}">${r}</text>`}),a=d.toSorted((t,n)=>e[t.axis].z-e[n.axis].z),c=e=>s`<g class="axes">${e.map(({name:e,axis:n})=>{let r=t([0,1,2].map(e=>+(e===n)));return s`<line class="axis axis-${e}" part="axis axis-${e}" x1="0" y1="0" x2=${r.x} y2=${r.y}></line>`})}</g>`,l=a.map(({name:e,axis:n})=>{let r=t([0,1,2].map(e=>+(e===n)));return s`<text class="axis-label axis-${e}" part="axis-label axis-label-${e}"
        style="--x: ${r.x}; --y: ${r.y}">${e}</text>`}),f=a.filter(({axis:t})=>e[t].z<0),p=a.filter(({axis:t})=>e[t].z>=0);return o`
      <svg viewBox="-1 -1 2 2" role="img" aria-label="View orientation">
        ${c(f)}<g class="cube">${r}</g>${i}${c(p)}${l}
      </svg>
    `}};customElements.define(`cesium-view-cube`,_),e(`cesiumContainer`).then(e=>{for(let t of document.querySelectorAll(`cesium-view-cube`))t.scene=e.scene});