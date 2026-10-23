import{a as e,s as t,t as n,u as r}from"./lit-BFn1CURT.js";import{C as i,J as a,R as o,i as s,p as c,w as l}from"./cesium-shim-DLIYJZws.js";var u=[{name:`e`,label:`E`,axis:0,sign:1},{name:`w`,label:`W`,axis:0,sign:-1},{name:`n`,label:`N`,axis:1,sign:1},{name:`s`,label:`S`,axis:1,sign:-1},{name:`top`,label:`top`,axis:2,sign:1},{name:`bottom`,label:`bottom`,axis:2,sign:-1}],d=[{name:`x`,axis:0},{name:`y`,axis:1},{name:`z`,axis:2}],f=new l(0,0,1,0,1,0,0,0,0,1,0,0,0,0,0,1),p=new l,m=new l,h=new i,g=[new s,new s,new s],_=class extends n{static get properties(){return{scene:{type:Object},axes:{state:!0}}}static get styles(){return r`
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
    `}constructor(){super(),this.scene=void 0,this.axes=[s.UNIT_X,new s(0,-1,0),new s(0,0,1)],this.listening=null}connectedCallback(){super.connectedCallback(),this.requestUpdate()}disconnectedCallback(){this.stopListening(),super.disconnectedCallback()}stopListening(){this.listening?.remove(),this.listening=null}willUpdate(){if(this.listening?.scene!==this.scene&&(this.stopListening(),this.scene)){let e=this.scene;this.listening={scene:e,remove:e.postRender.addEventListener(()=>this.updateFromCamera())},this.updateFromCamera()}}updateFromCamera(){let{camera:e,ellipsoid:t,mode:n}=this.scene,r=n===o.SCENE3D?c.eastNorthUpToFixedFrame(e.positionWC,t,p):f,a=l.getMatrix3(l.multiply(e.viewMatrix,r,m),h);g.map((e,t)=>(i.getColumn(a,t,e),e.y=-e.y,!s.equalsEpsilon(e,this.axes[t],1e-6))).includes(!0)&&(this.axes=g.map(e=>s.clone(e)))}render(){let n=this.axes,r=e=>({x:e.reduce((e,t,r)=>e+t*n[r].x,0),y:e.reduce((e,t,r)=>e+t*n[r].y,0)}),i=u.filter(({axis:e,sign:t})=>t*n[e].z>.001),a=i.map(({name:e,axis:n,sign:i})=>{let[a,o]=[0,1,2].filter(e=>e!==n),s=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([e,t])=>{let s=[0,0,0];return s[n]=i,s[a]=e,s[o]=t,r(s)});return t`<polygon class="face" part="face face-${e}" points=${s.map(({x:e,y:t})=>`${e},${t}`).join(` `)}></polygon>`}),o=i.map(({name:e,label:i,axis:a,sign:o})=>{let s=r([0,1,2].map(e=>e===a?o:0));return t`<text class="face-label" part="face-label face-label-${e}"
        style="--x: ${s.x}; --y: ${s.y}; --facing: ${o*n[a].z}">${i}</text>`}),s=d.toSorted((e,t)=>n[e.axis].z-n[t.axis].z),c=e=>t`<g class="axes">${e.map(({name:e,axis:n})=>{let i=r([0,1,2].map(e=>+(e===n)));return t`<line class="axis axis-${e}" part="axis axis-${e}" x1="0" y1="0" x2=${i.x} y2=${i.y}></line>`})}</g>`,l=s.map(({name:e,axis:n})=>{let i=r([0,1,2].map(e=>+(e===n)));return t`<text class="axis-label axis-${e}" part="axis-label axis-label-${e}"
        style="--x: ${i.x}; --y: ${i.y}">${e}</text>`}),f=s.filter(({axis:e})=>n[e].z<0),p=s.filter(({axis:e})=>n[e].z>=0);return e`
      <svg viewBox="-1 -1 2 2" role="img" aria-label="View orientation">
        ${c(f)}<g class="cube">${a}</g>${o}${c(p)}${l}
      </svg>
    `}};customElements.define(`cesium-view-cube`,_),a(`cesiumContainer`).then(e=>{for(let t of document.querySelectorAll(`cesium-view-cube`))t.scene=e.scene});