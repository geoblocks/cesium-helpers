import{a as e,c as t,d as n,f as r,i,l as a,n as o,o as s,p as c,r as l,s as ee,t as te,u}from"./callout-C4yhdWjn.js";import{a as d,u as ne}from"./lit-BFn1CURT.js";import{a as re,c as ie,i as f,o as p,r as m,s as ae,t as h}from"./card-BcpQSzF3.js";import{c as g,d as oe,o as se,s as ce}from"./directive-helpers-B0KETb9i.js";import{t as le}from"./setup-DMh09s7J.js";import{n as ue}from"./switch-PsQ7BZQb.js";import"./button-CI_sKcZA.js";import"./icon-BcbZVKyW.js";import{i as de,n as fe}from"./slider-sLn6HB47.js";var pe=ne`
  .form-control {
    position: relative;
    border: none;
    padding: 0;
    margin: 0;
  }

  .label {
    padding: 0;
  }

  .radio-group-required .label::after {
    content: var(--wa-form-control-required-content);
    margin-inline-start: var(--wa-form-control-required-content-offset);
  }

  [part~='form-control-input'] {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 0; /* Radios handle their own spacing */
  }

  /* Horizontal */
  :host([orientation='horizontal']) [part~='form-control-input'] {
    flex-direction: row;
  }

  /* Help text */
  [part~='hint'] {
    margin-block-start: 0.5em;
  }
`,_=class extends g{constructor(){super(),this.hasSlotController=new ie(this,`hint`,`label`),this.label=``,this.hint=``,this.name=null,this.disabled=!1,this.orientation=`vertical`,this._value=null,this.defaultValue=this.getAttribute(`value`)||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{let t=e.target.closest(`wa-radio`);if(!t||t.disabled||t.forceDisabled||this.disabled)return;let n=this.value;this.value=t.value,t.checked=!0;let r=this.getAllRadios();for(let e of r)t!==e&&(e.checked=!1,e.setAttribute(`tabindex`,`-1`));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})},this.addEventListener(`keydown`,this.handleKeyDown),this.addEventListener(`click`,this.handleRadioClick)}static get validators(){let e=[fe({validationElement:Object.assign(document.createElement(`input`),{required:!0,type:`radio`,name:de(`__wa-radio`)})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e==`number`&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){ce(this.localName,this.size)}get validationTarget(){let e=this.querySelector(`:is(wa-radio):not([disabled])`);if(e)return e}updated(e){(e.has(`disabled`)||e.has(`size`)||e.has(`value`)||e.has(`defaultValue`))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll(`wa-radio`)]}handleLabelClick(){this.focus()}async syncRadioElements(){let e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute(`size`,this.size),t.toggleAttribute(`data-wa-radio-horizontal`,this.orientation!==`vertical`),t.toggleAttribute(`data-wa-radio-vertical`,this.orientation===`vertical`),t.toggleAttribute(`data-wa-radio-first`,n===0),t.toggleAttribute(`data-wa-radio-inner`,n!==0&&n!==e.length-1),t.toggleAttribute(`data-wa-radio-last`,n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async e=>{await e.updateComplete,e.checked=!e.disabled&&e.value===this.value})),this.disabled)e.forEach(e=>{e.tabIndex=-1});else{let t=e.filter(e=>!e.disabled),n=t.find(e=>e.checked);t.length>0&&(n?t.forEach(e=>{e.tabIndex=e.checked?0:-1}):t.forEach((e,t)=>{e.tabIndex=t===0?0:-1})),e.filter(e=>e.disabled).forEach(e=>{e.tabIndex=-1})}}handleKeyDown(e){if(![`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,` `].includes(e.key)||this.disabled)return;let t=this.getAllRadios().filter(e=>!e.disabled);if(t.length<=0)return;e.preventDefault();let n=this.value,r=t.find(e=>e.checked)??t[0],i=e.key===` `?0:[`ArrowUp`,`ArrowLeft`].includes(e.key)?-1:1,a=t.indexOf(r)+i;a||=0,a<0&&(a=t.length-1),a>t.length-1&&(a=0);let o=t.some(e=>e.tagName.toLowerCase()===`wa-radio-button`);this.getAllRadios().forEach(e=>{e.checked=!1,o||e.setAttribute(`tabindex`,`-1`)}),this.value=t[a].value,t[a].checked=!0,o?t[a].shadowRoot.querySelector(`button`).focus():(t[a].setAttribute(`tabindex`,`0`),t[a].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;let t=this.getAllRadios(),n=t.find(e=>e.checked),r=t.find(e=>!e.disabled),i=n||r;i&&i.focus(e)}render(){let e=this.hasSlotController.test(`label`,`withLabel`),t=this.hasSlotController.test(`hint`,`withHint`),n=this.label?!0:!!e,r=this.hint?!0:!!t;return d`
      <fieldset
        part="form-control"
        class=${h({"form-control":!0,"form-control-radio-group":!0,"form-control-has-label":n})}
        role="radiogroup"
        aria-labelledby="label"
        aria-describedby="hint"
        aria-errormessage="error-message"
        aria-orientation=${this.orientation}
      >
        <label
          part="form-control-label"
          id="label"
          class=${h({label:!0,"has-label":n})}
          aria-hidden=${n?`false`:`true`}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <slot part="form-control-input" @slotchange=${this.syncRadioElements}></slot>

        <slot
          id="hint"
          name="hint"
          part="hint"
          class=${h({"has-slotted":r})}
          aria-hidden=${r?`false`:`true`}
          >${this.hint}</slot
        >
      </fieldset>
    `}};_.css=[ae,ue,pe],_.shadowRootOptions={...g.shadowRootOptions,delegatesFocus:!0},p([oe(`slot:not([name])`)],_.prototype,`defaultSlot`,2),p([f()],_.prototype,`label`,2),p([f({attribute:`hint`})],_.prototype,`hint`,2),p([f({reflect:!0})],_.prototype,`name`,2),p([f({type:Boolean,reflect:!0})],_.prototype,`disabled`,2),p([f({reflect:!0})],_.prototype,`orientation`,2),p([m()],_.prototype,`value`,1),p([f({attribute:`value`,reflect:!0})],_.prototype,`defaultValue`,2),p([f({reflect:!0})],_.prototype,`size`,2),p([se(`size`)],_.prototype,`handleSizeChange`,1),p([f({type:Boolean,reflect:!0})],_.prototype,`required`,2),p([f({type:Boolean,attribute:`with-label`})],_.prototype,`withLabel`,2),p([f({type:Boolean,attribute:`with-hint`})],_.prototype,`withHint`,2),_=p([re(`wa-radio-group`)],_),_.disableWarning?.(`change-in-update`);var me=ne`
  :host {
    --checked-icon-color: var(--wa-form-control-activated-color);
    --checked-icon-scale: 0.7;

    color: var(--wa-form-control-value-color);
    display: inline-flex;
    flex-direction: row;
    align-items: top;
    font-family: inherit;
    font-weight: var(--wa-form-control-value-font-weight);
    line-height: var(--wa-form-control-value-line-height);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
  }

  :host(:focus) {
    outline: none;
  }

  /* When the control isn't checked, hide the circle for Windows High Contrast mode a11y */
  :host(:not(:state(checked))) svg circle {
    opacity: 0;
  }

  [part~='label'] {
    display: inline;
  }

  [part~='hint'] {
    margin-block-start: 0.5em;
  }

  /* Default spacing for default appearance radios */
  :host([appearance='default']) {
    margin-block: 0.375em; /* Half of the original 0.75em gap on each side */
  }

  :host([appearance='default'][data-wa-radio-horizontal]) {
    margin-block: 0;
    margin-inline: 0.5em; /* Half of the original 1em gap on each side */
  }

  /* Remove margin from first/last items to prevent extra space */
  :host([appearance='default'][data-wa-radio-first]) {
    margin-block-start: 0;
    margin-inline-start: 0;
  }

  :host([appearance='default'][data-wa-radio-last]) {
    margin-block-end: 0;
    margin-inline-end: 0;
  }

  /* Button appearance have no spacing, they get handled by the overlap margins below */
  :host([appearance='button']) {
    margin: 0;
    align-items: center;
    min-height: var(--wa-form-control-height);
    background-color: var(--wa-color-surface-default);
    border: var(--wa-form-control-border-width) var(--wa-form-control-border-style) var(--wa-form-control-border-color);
    border-radius: var(--wa-border-radius-m);
    padding: 0 var(--wa-form-control-padding-inline);
    transition:
      background-color var(--wa-transition-fast),
      border-color var(--wa-transition-fast);
  }

  /* Default appearance */
  :host([appearance='default']) {
    .control {
      flex: 0 0 auto;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--wa-form-control-toggle-size);
      height: var(--wa-form-control-toggle-size);
      border-color: var(--wa-form-control-border-color);
      border-radius: 50%;
      border-style: var(--wa-form-control-border-style);
      border-width: var(--wa-form-control-border-width);
      background-color: var(--wa-form-control-background-color);
      color: transparent;
      transition:
        background var(--wa-transition-normal),
        border-color var(--wa-transition-fast),
        box-shadow var(--wa-transition-fast),
        color var(--wa-transition-fast);
      transition-timing-function: var(--wa-transition-easing);

      margin-inline-end: 0.5em;
    }

    .checked-icon {
      display: flex;
      fill: currentColor;
      width: var(--wa-form-control-toggle-size);
      height: var(--wa-form-control-toggle-size);
      scale: var(--checked-icon-scale);
    }
  }

  /* Button appearance */
  :host([appearance='button']) {
    .control {
      display: none;
    }
  }

  /* Checked */
  :host(:state(checked)) .control {
    color: var(--checked-icon-color);
    border-color: var(--wa-form-control-activated-color);
    background-color: var(--wa-form-control-background-color);
  }

  /* Focus */
  :host(:focus-visible) .control {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Disabled */
  :host(:state(disabled)) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Horizontal grouping - remove inner border radius */
  :host([appearance='button'][data-wa-radio-horizontal][data-wa-radio-inner]) {
    border-radius: 0;
  }

  :host([appearance='button'][data-wa-radio-horizontal][data-wa-radio-first]) {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }

  :host([appearance='button'][data-wa-radio-horizontal][data-wa-radio-last]) {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }

  /* Vertical grouping - remove inner border radius */
  :host([appearance='button'][data-wa-radio-vertical][data-wa-radio-inner]) {
    border-radius: 0;
  }

  :host([appearance='button'][data-wa-radio-vertical][data-wa-radio-first]) {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  :host([appearance='button'][data-wa-radio-vertical][data-wa-radio-last]) {
    border-start-start-radius: 0;
    border-start-end-radius: 0;
  }

  @media (hover: hover) {
    :host([appearance='button']:hover:not(:state(disabled), :state(checked))) {
      background-color: color-mix(in srgb, var(--wa-color-surface-default) 95%, var(--wa-color-mix-hover));
    }
  }

  :host([appearance='button']:focus-visible) {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  :host([appearance='button']:state(checked)) {
    border-color: var(--wa-form-control-activated-color);
    background-color: var(--wa-color-brand-fill-quiet);
  }

  :host([appearance='button']:state(checked):focus-visible) {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Button overlap margins */
  :host([appearance='button'][data-wa-radio-horizontal]:not([data-wa-radio-first])) {
    margin-inline-start: calc(-1 * var(--wa-form-control-border-width));
  }

  :host([appearance='button'][data-wa-radio-vertical]:not([data-wa-radio-first])) {
    margin-block-start: calc(-1 * var(--wa-form-control-border-width));
  }

  /* Ensure interactive states are visible above adjacent buttons */
  :host([appearance='button']:hover),
  :host([appearance='button']:state(checked)) {
    position: relative;
    z-index: 1;
  }

  :host([appearance='button']:focus-visible) {
    z-index: 2;
  }
`,v=class extends g{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance=`default`,this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener(`click`,this.handleClick)}handleSizeChange(){ce(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute(`role`,`radio`),this.tabIndex=0,this.setAttribute(`aria-disabled`,this.disabled||this.forceDisabled?`true`:`false`)}updated(e){if(super.updated(e),e.has(`checked`)&&(this.customStates.set(`checked`,this.checked),this.setAttribute(`aria-checked`,this.checked?`true`:`false`),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has(`disabled`)||e.has(`forceDisabled`)){let e=this.disabled||this.forceDisabled;this.customStates.set(`disabled`,e),this.setAttribute(`aria-disabled`,e?`true`:`false`),this.tabIndex=e?-1:this.checked?0:-1}}setValue(){}render(){return d`
      <span part="control" class="control">
        ${this.checked?d`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:``}
      </span>

      <slot part="label" class="label"></slot>
    `}};v.css=[ue,ae,me],p([m()],v.prototype,`checked`,2),p([m()],v.prototype,`forceDisabled`,2),p([f({reflect:!0})],v.prototype,`value`,2),p([f({reflect:!0})],v.prototype,`appearance`,2),p([f({reflect:!0})],v.prototype,`size`,2),p([se(`size`)],v.prototype,`handleSizeChange`,1),p([f({type:Boolean})],v.prototype,`disabled`,2),v=p([re(`wa-radio`)],v),v.disableWarning?.(`change-in-update`);var he={url:`tracks/Tour_Baulmes_valley.gpx`,name:`Gorge down to Baulmes`},y={default:{dials:[.5,.5],hint:`Follows the track from behind, a little above it.`},pilot:{dials:[0,0],hint:`Low and close behind the marker, banking into the turns.`},spectator:{dials:[1,.8],hint:`High and wide, climbing over the ridges for the view.`},drone:{dials:[.6,1],hint:`Floating and loose, drifting like a drone in the wind.`}},b=`(max-width: 40em)`,x=e=>document.querySelector(e),S=await le(`cesiumContainer`),C,w,ge,T,E=`default`,_e=E,D=`empty`,O=!1,k={...l};matchMedia(b).matches&&(k.quality=`540`);var A=!0,ve=x(`#panel`),j=x(`#preset`),ye={orientation:x(`#videoOrientation`),quality:x(`#videoQuality`)},M=x(`#placeNames`),N=x(`#play`),P=x(`#progress`),F=x(`#create`),be=x(`#changeFile`),I=e=>{e!==`ready`&&$(),D=e,document.body.dataset.state=e;for(let t of document.querySelectorAll(`[data-states]`))t.hidden=!t.dataset.states.split(` `).includes(e);R(),B()},L=e=>{O=e,R()},R=()=>{x(`#chooseFile`).loading=O,x(`#chooseFile`).disabled=O,x(`#trySample`).disabled=O;let e=D===`ready`&&!O,t=[j,...Object.values(ye),M,be];for(let n of t)n.disabled=!e;let n=(D===`ready`||D===`playing`)&&!O;P.disabled=!n,N.disabled=!n;let r=N.querySelector(`wa-icon`);r.name=D===`playing`?`pause`:`play`,r.label=D===`playing`?`Pause preview`:`Play preview`,F.disabled=!(e&&A),F.loading=O&&D===`ready`,S.scene.globe.maximumScreenSpaceError=D===`playing`?3:2},z=e=>`${e}px`,xe=()=>{let e=ve.getBoundingClientRect();if(matchMedia(b).matches)return{x:0,y:0,width:innerWidth,height:e.top};let t=innerWidth-e.right;return{x:t,y:t,width:e.left-2*t,height:innerHeight-2*t}},B=()=>{if(D===`empty`)return;let e=document.body.style,t=xe();for(let[n,r]of Object.entries(t))e.setProperty(`--region-${n}`,z(r));let[n,r]=u(k.orientation,k.quality),i=t;if(D===`ready`||D===`playing`){let e=x(`#player`),n=e.offsetHeight+parseFloat(getComputedStyle(e).marginBlockStart);i={...t,height:t.height-n}}let a=Math.min(i.width/n,i.height/r,D===`rendering`?1:1/0);e.setProperty(`--video-width`,z(n)),e.setProperty(`--video-height`,z(r)),e.setProperty(`--preview-width`,z(n*a)),e.setProperty(`--preview-height`,z(r*a)),e.setProperty(`--fit`,String(a)),e.setProperty(`--stage-x`,z(i.x+(i.width-n*a)/2)),e.setProperty(`--stage-y`,z(i.y+(i.height-r*a)/2)),S.resize(),S.scene.requestRender()};window.addEventListener(`resize`,B);var V=e=>{let t=x(D===`empty`?`#introError`:`#panelError`);t.querySelector(`span`).textContent=e,t.hidden=!1},Se=()=>{x(`#introError`).hidden=!0,x(`#panelError`).hidden=!0},Ce=(e,t=0)=>{let n=S.camera,r={destination:n.position.clone(),orientation:{direction:n.direction.clone(),up:n.up.clone()}};e.distance=t;let i={destination:n.position.clone(),orientation:{heading:n.heading,pitch:n.pitch,roll:0}};n.setView(r),n.flyTo({...i,duration:2})},we=e=>{let t=Cesium.BoundingSphere.fromPoints(e.points);S.camera.flyToBoundingSphere(t,{offset:new Cesium.HeadingPitchRange(S.camera.heading,Cesium.Math.toRadians(-45),t.radius*2.5),duration:2,complete:()=>setTimeout(()=>e===C&&D===`ready`&&Ce(e),1e3)})},Te=e=>e?.url.startsWith(`blob:`)&&URL.revokeObjectURL(e.url),H=async(e=T)=>{let t=e===T;Se(),L(!0);let[n,i]=y[E].dials,a=new c(S,{style:n,motion:i});try{await a.load(e.url)}catch(n){return console.error(n),a.destroy(),L(!1),t?(E=_e,j.value=E,G(),V(`The track could not be loaded again. Check the connection and try again.`)):(Te(e),V(`This file has no GPS track we can use. Export the activity as a GPX file from Strava, Garmin Connect or Komoot, and try again.`)),!1}let o=t?C.distance:0;C?.destroy(),w?.destroy(),C=a,_e=E,t||Te(T),T=e,a.progressChanged.addEventListener(Fe),w=new r(S,a),w.active=M.checked,ge=w.load().catch(e=>console.error(e)),P.value=0,x(`#trackName`).textContent=a.name||e.name,Me(),q(),L(!1);let s=D===`empty`;return I(`ready`),t?Ce(a,o):we(a),s&&x(`#trackName`).focus(),!0},Ee=e=>H({url:URL.createObjectURL(e),name:e.name}),U=()=>!O&&(D===`empty`||D===`ready`),W=x(`#fileInput`);x(`#chooseFile`).addEventListener(`click`,()=>W.click()),W.addEventListener(`change`,()=>{let e=W.files[0];W.value=``,e&&U()&&Ee(e)}),x(`#trySample`).addEventListener(`click`,async()=>{U()&&await H(he)&&Ie()});var De=x(`#dropzone`),Oe=x(`#dropOverlay`),ke=()=>{De.classList.remove(`over`),Oe.hidden=!0};document.addEventListener(`dragover`,e=>{e.preventDefault();let t=e.dataTransfer?.types.includes(`Files`)&&U();e.dataTransfer&&(e.dataTransfer.dropEffect=t?`copy`:`none`),De.classList.toggle(`over`,t&&D===`empty`),Oe.hidden=!(t&&D===`ready`)}),document.addEventListener(`dragleave`,e=>{e.relatedTarget||ke()}),document.addEventListener(`drop`,e=>{e.preventDefault(),ke();let t=e.dataTransfer?.files[0];t&&U()&&Ee(t)});var Ae=0,je=async()=>{let e=++Ae,[t,r]=u(k.orientation,k.quality),i=await n(`avc`,{width:t,height:r,bitrate:Math.round(o*t*r*30)}).catch(()=>!1);e===Ae&&(A=i,x(`#noEncoder`).hidden=A,R())},Me=()=>{if(!C)return;let n=t(C.duration,k.orientation,k.quality),r=s(C.duration,k.orientation,k.quality);x(`#summary`).textContent=`${e(C.duration)} video, ${ee(r)}, ${i(n)} to render`},G=()=>{j.hint=y[E].hint};G(),j.addEventListener(`change`,()=>{E=j.value,G(),$(),H()});for(let[e,t]of Object.entries(ye))t.value=k[e],t.addEventListener(`change`,()=>{k[e]=t.value,$(),Me(),je(),B()});M.addEventListener(`change`,()=>{w&&(w.active=M.checked),S.scene.requestRender()}),be.addEventListener(`click`,()=>W.click());var Ne=x(`#collapse`);Ne.addEventListener(`click`,()=>{let e=ve.classList.toggle(`collapsed`),t=Ne.querySelector(`wa-icon`);t.name=e?`chevron-up`:`chevron-down`,t.label=e?`Show the settings`:`Hide the settings`,B()});var Pe=x(`#time`),K=!1,q=()=>{let t=C?.duration??0;Pe.textContent=`${e((C?.progress??0)*t)} / ${e(t)}`},Fe=e=>{let t=Math.round(e*1e3)/1e3;!K&&+P.value!==t&&(P.value=t),q()};P.addEventListener(`input`,()=>{K=!0,S.camera.cancelFlight(),C.progress=+P.value,q()}),P.addEventListener(`change`,()=>{K=!1});var Ie=async()=>{S.camera.cancelFlight(),I(`playing`),await C.play(),D===`playing`&&I(`ready`)};N.addEventListener(`click`,()=>D===`playing`?C.stop():Ie());var J,Le=async()=>{try{let e=await navigator.wakeLock?.request(`screen`);D===`rendering`?J=e:e?.release()}catch{}},Re=()=>{J?.release().catch(()=>{}),J=void 0};document.addEventListener(`visibilitychange`,()=>{D===`rendering`&&document.visibilityState===`visible`&&Le()});var Y,X,Z=x(`#renderProgress`),ze=x(`#renderEta`),Be=x(`#renderFrames`),Ve=()=>(C?.name||T.name).replace(/\.[^.]+$/,``).replace(/[^\p{L}\p{N}]+/gu,`-`).replace(/^-|-$/g,``)||`flyover`,He=async()=>{Se();let[e,t]=u(k.orientation,k.quality);`Notification`in window&&Notification.permission==="default"&&Notification.requestPermission(),S.camera.cancelFlight(),I(`rendering`),x(`#stopRender`).focus(),Z.value=0,Z.textContent=`0%`,ze.textContent=`Starting`,Be.textContent=``;let n=document.title;Le(),Y=new AbortController;let r=new Promise(e=>Y.signal.addEventListener(`abort`,e,{once:!0})),o,s;try{await Promise.race([ge,r]),Y.signal.aborted||(o=await te({viewer:S,flyover:C,captions:w,width:e,height:t,signal:Y.signal,onProgress:({frame:e,frames:t,perFrame:n})=>{let r=Math.floor(100*e/t);Z.value=r,Z.textContent=`${r}%`,document.title=a(r),e>=30&&(ze.textContent=`${i(n*(t-e))} left`),Be.textContent=`Frame ${e+1} of ${t}`}}))}catch(e){console.error(e),s=e}finally{Re(),document.title=n}if(!o){I(`ready`),s&&V(`The video could not be made: ${s.message}`),F.focus();return}X&&URL.revokeObjectURL(X.url);let c=`${Ve()}.mp4`;X={url:URL.createObjectURL(o),name:c,file:new File([o],c,{type:`video/mp4`})},x(`#resultVideo`).src=X.url,x(`#downloadLabel`).textContent=`Download video · ${(o.size/1e6).toFixed(1)} MB`,`Notification`in window&&Notification.permission===`granted`&&document.hidden&&new Notification(`Your flyover is ready`,{body:x(`#downloadLabel`).textContent});let l=navigator.canShare?.({files:[X.file]})??!1;x(`#share`).hidden=!l,x(`#download`).variant=l?`neutral`:`brand`,x(`#download`).appearance=l?`outlined`:`accent`,I(`done`),x(l?`#share`:`#download`).focus()},Q=0;function $(){Q=0,x(`#phoneWarning`).hidden=!0,x(`#createLabel`).textContent=`Create video`}F.addEventListener(`click`,()=>{if(matchMedia(`${b}, (pointer: coarse)`).matches){if(!Q){Q=performance.now(),x(`#phoneWarning`).hidden=!1,x(`#createLabel`).textContent=`Render anyway`;return}if(performance.now()-Q<600)return}$(),He()}),x(`#stopRender`).addEventListener(`click`,()=>Y.abort()),x(`#share`).addEventListener(`click`,async()=>{try{await navigator.share({files:[X.file],title:x(`#trackName`).textContent})}catch(e){e.name!==`AbortError`&&console.error(e)}}),x(`#download`).addEventListener(`click`,()=>{Object.assign(document.createElement(`a`),{href:X.url,download:X.name}).click()}),x(`#makeAnother`).addEventListener(`click`,()=>{x(`#resultVideo`).pause(),I(`ready`),F.focus()}),je(),I(`empty`);