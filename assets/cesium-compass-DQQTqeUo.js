import{a as e,s as t,t as n,u as r}from"./lit-BFn1CURT.js";import{t as i}from"./setup-0DgT5JyI.js";import{M as a,O as o,b as s,i as c,r as l,u,y as d}from"./cesium-shim-deYMRcZt.js";import{t as f}from"./style-map-ly-_uhSr.js";var p=new l,m=new l,h=new l,g=new c,_=new s,v=new s,y=new o,b=.45,x=Array.from({length:12},(e,t)=>t*30).filter(e=>e!==0).map(e=>{let n=e%90==0;return t`<line class="tick ${n?`cardinal`:``}" x1="50" y1="${n?4:6}" x2="50" y2="${n?11.5:9.5}" transform="rotate(${e} 50 50)"/>`}),S=e=>t`<svg viewBox="0 0 100 100">
  ${x}
  <path class="north ${e?`pulse`:``}" d="M50 2.5 L45.6 12.5 L54.4 12.5 Z"/>
  <text class="label n" x="50" y="22">N</text>
  <text class="label" x="78" y="50">E</text>
  <text class="label" x="50" y="78">S</text>
  <text class="label" x="22" y="50">W</text>
</svg>`,C=t`<svg viewBox="0 0 34 34">
  <circle class="core" cx="17" cy="17" r="2.4"/>
  ${[0,90,180,270].map(e=>t`<path class="chevron" d="M13.2 9.2 L17 5.4 L20.8 9.2" transform="rotate(${e} 17 17)"/>`)}
</svg>`,w=t`<svg viewBox="0 0 100 100"><path d="M33.9 10.13 A43 43 0 0 1 66.1 10.13"/></svg>`,T=class extends n{static get properties(){return{scene:{type:Object},clock:{type:Object},ready:{type:Boolean},heading:{type:Number},northPulse:{type:Boolean},dragging:{type:String,reflect:!0},orbitCursorAngle:{type:Number},orbitCursorOpacity:{type:Number},resetSpeed:{type:Number}}}static get styles(){return r`
      :host {
        --cesium-compass-fill-color: rgba(0, 0, 0, 0.6);
        --cesium-compass-stroke-color: rgb(224, 225, 226);
        --cesium-compass-north-color: rgb(233, 84, 64);
        --cesium-compass-size: 70px;

        display: block;
        width: var(--cesium-compass-size);
        height: var(--cesium-compass-size);
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        color: var(--cesium-compass-stroke-color);
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      :host * {
        box-sizing: border-box;
      }
      .compass {
        position: relative;
        width: 100%;
        height: 100%;
        touch-action: none;
      }
      .face {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: var(--cesium-compass-fill-color);
        -webkit-backdrop-filter: blur(6px);
        backdrop-filter: blur(6px);
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.15),
          0 2px 8px rgba(0, 0, 0, 0.35);
      }
      .ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        cursor: grab;
        transition: background-color 150ms ease;
      }
      .ring:hover, :host([dragging="rotate"]) .ring {
        background-color: rgba(255, 255, 255, 0.06);
      }
      :host([dragging="rotate"]) .ring {
        cursor: grabbing;
      }
      .rose {
        position: absolute;
        inset: 0;
        will-change: transform;
        pointer-events: none;
        transition: transform 80ms linear;
      }
      /* the ring must follow the cursor without lag while a gesture drives the camera */
      :host(:not([dragging=""])) .rose {
        transition: none;
      }
      .rose .tick {
        stroke: currentColor;
        stroke-width: 1.2;
        stroke-linecap: round;
        opacity: 0.45;
      }
      .rose .tick.cardinal {
        stroke-width: 1.8;
        opacity: 0.9;
      }
      .rose .north {
        fill: var(--cesium-compass-north-color);
        transform-origin: 50px 9px;
        transform-box: view-box;
      }
      .rose .north.pulse {
        animation: north-pulse 450ms ease-out;
      }
      @keyframes north-pulse {
        0% { transform: scale(1); }
        35% { transform: scale(1.6); filter: brightness(1.4); }
        100% { transform: scale(1); }
      }
      .rose .label {
        fill: currentColor;
        font-size: 7.5px;
        font-weight: 300;
        opacity: 0.55;
        text-anchor: middle;
        dominant-baseline: central;
        letter-spacing: 0.02em;
      }
      .rose .label.n {
        font-size: 10px;
        font-weight: 700;
        opacity: 1;
      }
      .gyro {
        position: absolute;
        left: 30%;
        top: 30%;
        width: 40%;
        height: 40%;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18), 0 1px 3px rgba(0, 0, 0, 0.3);
        cursor: move;
        transition: background-color 150ms ease;
      }
      .gyro:hover, :host([dragging="orbit"]) .gyro {
        background: rgba(255, 255, 255, 0.22);
      }
      .gyro .core {
        fill: currentColor;
      }
      .gyro .chevron {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
        opacity: 0.85;
      }
      .rotation-marker {
        position: absolute;
        inset: 0;
        will-change: opacity, transform;
        pointer-events: none;
        transition: opacity 120ms ease;
      }
      .rotation-marker path {
        fill: none;
        stroke: currentColor;
        stroke-width: 4;
        stroke-linecap: round;
      }
      svg {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      @media (prefers-reduced-motion: reduce) {
        .ring, .gyro, .rotation-marker, .rose {
          transition: none;
        }
        .rose .north.pulse {
          animation: none;
        }
      }
    `}constructor(){super(),this.scene=void 0,this.clock=void 0,this.ready=!1,this.resetSpeed=Math.PI/100,this.dragging=``,this.displayHeading=0,this.northPulse=!1,this.animationFrame=0,this.northPulseTimeout=void 0,this.rotateClick=!1,this.unlistenFromPostRender=null,this.unlistenFromClockTick=null,this.orbitCursorOpacity=0,this.orbitCursorAngle=0,this.heading=0,this.handleRotatePointerMoveFunction=this.handleRotatePointerMove.bind(this),this.handleRotatePointerUpFunction=this.handleRotatePointerUp.bind(this),this.handleOrbitPointerMoveFunction=this.handleOrbitPointerMove.bind(this),this.handleOrbitPointerUpFunction=this.handleOrbitPointerUp.bind(this),this.handleOrbitTickFunction=this.handleOrbitTick.bind(this),this.context={}}willUpdate(){this.scene&&this.clock&&!this.unlistenFromPostRender&&(this.unlistenFromPostRender=this.scene.postRender.addEventListener(()=>{let e=this.scene.camera.heading;this.displayHeading+=d.negativePiToPi(e-this.heading),this.heading=e}),this.ready=!0)}get roseStyle(){return{transform:`rotate(${-this.displayHeading}rad)`}}get rotationMarkerStyle(){return{transform:`rotate(-${this.orbitCursorAngle}rad)`,opacity:`${this.orbitCursorOpacity}`}}cursorVector(e){return h.x=e.clientX-this.context.compassRectangle.left,h.y=e.clientY-this.context.compassRectangle.top,l.subtract(h,this.context.compassCenter,p)}disconnectedCallback(){this.cancelAnimation(),clearTimeout(this.northPulseTimeout),this.unlistenFromPostRender&&this.unlistenFromPostRender(),this.unlistenFromClockTick&&(this.unlistenFromClockTick(),this.unlistenFromClockTick=null,this.orbitCursorOpacity=0),super.disconnectedCallback()}handlePointerDown(e){this.cancelAnimation();let t=this.scene.camera,n=e.currentTarget;this.context.compassRectangle=n.getBoundingClientRect(),this.context.compassCenter=new l((this.context.compassRectangle.right-this.context.compassRectangle.left)/2,(this.context.compassRectangle.bottom-this.context.compassRectangle.top)/2);let r=this.cursorVector(e),i=l.magnitude(r);m.x=this.scene.canvas.clientWidth/2,m.y=this.scene.canvas.clientHeight/2,t.getPickRay(m,y),this.context.viewCenter=this.scene.globe.pick(y,this.scene,g),this.context.frameBackup=s.clone(t.transform,this.context.frameBackup||new s),this.context.frame=a.eastNorthUpToFixedFrame(this.context.viewCenter?this.context.viewCenter:t.positionWC,u.WGS84,v);let o=i/(this.context.compassRectangle.width/2);o<b?this.orbit(r):o<1&&this.rotate(r),e.stopPropagation(),e.preventDefault()}rotate(e){let t=this.scene.camera;this.context.rotateInitialCursorAngle=Math.atan2(-e.y,e.x);let n=s.clone(t.transform,_);t.lookAtTransform(this.context.frame),this.context.rotateInitialCameraAngle=Math.atan2(t.position.y,t.position.x),t.lookAtTransform(n),this.rotateClick=!0,this.dragging=`rotate`,document.addEventListener(`pointermove`,this.handleRotatePointerMoveFunction,!1),document.addEventListener(`pointerup`,this.handleRotatePointerUpFunction,!1)}handleRotatePointerMove(e){if(this.moveUpIfTooCloseToTerrain())return;let t=this.scene.camera,n=this.cursorVector(e),r=Math.atan2(-n.y,n.x)-this.context.rotateInitialCursorAngle,i=d.zeroToTwoPi(this.context.rotateInitialCameraAngle-r),a=s.clone(t.transform,_);t.lookAtTransform(this.context.frame);let o=Math.atan2(t.position.y,t.position.x);t.rotateRight(i-o),t.lookAtTransform(a),this.rotateClick=!1}handleRotatePointerUp(){document.removeEventListener(`pointermove`,this.handleRotatePointerMoveFunction,!1),document.removeEventListener(`pointerup`,this.handleRotatePointerUpFunction,!1),this.dragging=``,this.rotateClick&&this.handleRingClick()}handleRingClick(){Math.abs(d.negativePiToPi(this.scene.camera.heading))<d.toRadians(1)?this.resetToTopDown():this.resetToNorth()}handleGyroDoubleClick(e){e.stopPropagation(),e.preventDefault(),this.resetToTopDown()}resetToNorth(){let e=this.scene.camera;e.lookAtTransform(this.context.frame);let t=d.negativePiToPi(d.PI_OVER_TWO+Math.atan2(e.position.y,e.position.x));this.animateInFrame(t,t=>e.rotateLeft(t))}resetToTopDown(){let e=this.scene.camera;if(this.context.viewCenter){e.lookAtTransform(this.context.frame);let t=e.position,n=Math.atan2(t.z,Math.hypot(t.x,t.y));this.animateInFrame(d.PI_OVER_TWO-n,t=>e.rotateDown(t))}else{let t=-d.PI_OVER_TWO-e.pitch;this.animateInFrame(t,t=>e.lookUp(t),!1)}}animateInFrame(e,t,n=!0){let r=this.scene.camera,i=n?s.clone(this.context.frameBackup,new s):void 0,a=Math.abs(e)/this.resetSpeed,o=0,c=performance.now(),l=()=>{i&&r.lookAtTransform(i),this.animationFrame=0,this.flashNorth()},u=()=>{let n=performance.now()-c,r=a>0?d.clamp(n/a,0,1):1;t((r-o)*e),o=r,r<1?this.animationFrame=window.requestAnimationFrame(u):l()};if(a===0){l();return}this.animationFrame=window.requestAnimationFrame(u)}cancelAnimation(){this.animationFrame&&(window.cancelAnimationFrame(this.animationFrame),this.animationFrame=0,this.scene.camera.lookAtTransform(this.context.frameBackup))}flashNorth(){clearTimeout(this.northPulseTimeout),this.northPulse=!1,requestAnimationFrame(()=>{this.northPulse=!0,this.northPulseTimeout=setTimeout(()=>{this.northPulse=!1},500)})}orbit(e){this.context.orbitIsLook=!this.context.viewCenter,this.context.orbitLastTimestamp=performance.now(),this.dragging=`orbit`,document.addEventListener(`pointermove`,this.handleOrbitPointerMoveFunction,!1),document.addEventListener(`pointerup`,this.handleOrbitPointerUpFunction,!1),this.unlistenFromClockTick=this.clock.onTick.addEventListener(this.handleOrbitTickFunction),this.updateAngleAndOpacity(e,this.context.compassRectangle.width)}handleOrbitTick(){if(this.moveUpIfTooCloseToTerrain())return;let e=this.scene.camera,t=performance.now(),n=(t-this.context.orbitLastTimestamp)*((this.orbitCursorOpacity-.5)*2.5/1e3),r=this.orbitCursorAngle+d.PI_OVER_TWO,i=Math.cos(r)*n,a=Math.sin(r)*n,o=s.clone(e.transform,_);e.lookAtTransform(this.context.frame),this.context.orbitIsLook?(e.look(c.UNIT_Z,-i),e.look(e.right,-a)):(e.rotateLeft(i),e.rotateUp(a)),e.lookAtTransform(o),this.context.orbitLastTimestamp=t}distanceToTerrain(){let e=this.scene.camera,t=this.scene.globe.getHeight(e.positionCartographic);return t===void 0?1/0:e.positionCartographic.height-t}moveUpIfTooCloseToTerrain(){let e=this.scene.screenSpaceCameraController;if(!e.enableCollisionDetection)return!1;let t=this.distanceToTerrain()-e.minimumZoomDistance;return d.lessThan(t,0,d.EPSILON1)?(this.scene.camera.moveUp(-t),!0):!1}updateAngleAndOpacity(e,t){let n=Math.atan2(-e.y,e.x);this.orbitCursorAngle=d.zeroToTwoPi(n-d.PI_OVER_TWO);let r=l.magnitude(e),i=t/2,a=Math.min(r/i,1);this.orbitCursorOpacity=.5*a*a+.5}handleOrbitPointerMove(e){let t=this.cursorVector(e);this.updateAngleAndOpacity(t,this.context.compassRectangle.width)}handleOrbitPointerUp(){document.removeEventListener(`pointermove`,this.handleOrbitPointerMoveFunction,!1),document.removeEventListener(`pointerup`,this.handleOrbitPointerUpFunction,!1),this.unlistenFromClockTick&&this.unlistenFromClockTick(),this.dragging=``,this.orbitCursorOpacity=0}render(){return this.ready?e`
        <div class="compass" @pointerdown=${this.handlePointerDown}>
          <div class="face"></div>
          <div class="ring" role="button" aria-label="Rotate the view, click to face north"></div>
          <div class="rose" style=${f(this.roseStyle)}>${S(this.northPulse)}</div>
          <div class="gyro" role="button" aria-label="Orbit the view, double-click to look down" @dblclick=${this.handleGyroDoubleClick}>${C}</div>
          <div class="rotation-marker" style=${f(this.rotationMarkerStyle)}>${w}</div>
        </div>
      `:e``}};customElements.define(`cesium-compass`,T),i(`cesiumContainer`).then(e=>{let t=document.querySelector(`cesium-compass`);t.scene=e.scene,t.clock=e.clock});