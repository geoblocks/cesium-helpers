import"./modulepreload-polyfill-P2Xu9kJm.js";import{t as e}from"./setup-COOW6wa2.js";import{a as t,c as n,d as r,f as i,i as a,l as o,n as s,o as c,p as l,r as ee,s as te,t as ne,u}from"./callout-T1BL3Pyb.js";import{a as re,c as ie,i as d,o as f,r as p,s as ae,t as m}from"./card-vYdPa2Ii.js";import"./button-BkCDB0Kx.js";import{a as h,u as oe}from"./lit-D8AhzmO2.js";import{t as se}from"./chunk.GWSUX3V5-BjpgD_qr.js";import{n as ce}from"./switch-DNqGrSbW.js";import{n as le}from"./slider-wyxrxnWj.js";import{c as g,d as ue,o as de,s as fe}from"./directive-helpers-BBsG2Hxb.js";import"./chunk.JAAVYFGY-BzZoRSSO.js";import"./icon-LzXTYuAm.js";var pe=oe`
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
`,_=class extends g{constructor(){super(),this.hasSlotController=new ie(this,`hint`,`label`),this.label=``,this.hint=``,this.name=null,this.disabled=!1,this.orientation=`vertical`,this._value=null,this.defaultValue=this.getAttribute(`value`)||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{let t=e.target.closest(`wa-radio`);if(!t||t.disabled||t.forceDisabled||this.disabled)return;let n=this.value;this.value=t.value,t.checked=!0;let r=this.getAllRadios();for(let e of r)t!==e&&(e.checked=!1,e.setAttribute(`tabindex`,`-1`));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})},this.addEventListener(`keydown`,this.handleKeyDown),this.addEventListener(`click`,this.handleRadioClick)}static get validators(){let e=[se({validationElement:Object.assign(document.createElement(`input`),{required:!0,type:`radio`,name:le(`__wa-radio`)})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e==`number`&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){fe(this.localName,this.size)}get validationTarget(){let e=this.querySelector(`:is(wa-radio):not([disabled])`);if(e)return e}updated(e){(e.has(`disabled`)||e.has(`size`)||e.has(`value`)||e.has(`defaultValue`))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll(`wa-radio`)]}handleLabelClick(){this.focus()}async syncRadioElements(){let e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute(`size`,this.size),t.toggleAttribute(`data-wa-radio-horizontal`,this.orientation!==`vertical`),t.toggleAttribute(`data-wa-radio-vertical`,this.orientation===`vertical`),t.toggleAttribute(`data-wa-radio-first`,n===0),t.toggleAttribute(`data-wa-radio-inner`,n!==0&&n!==e.length-1),t.toggleAttribute(`data-wa-radio-last`,n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async e=>{await e.updateComplete,e.checked=!e.disabled&&e.value===this.value})),this.disabled)e.forEach(e=>{e.tabIndex=-1});else{let t=e.filter(e=>!e.disabled),n=t.find(e=>e.checked);t.length>0&&(n?t.forEach(e=>{e.tabIndex=e.checked?0:-1}):t.forEach((e,t)=>{e.tabIndex=t===0?0:-1})),e.filter(e=>e.disabled).forEach(e=>{e.tabIndex=-1})}}handleKeyDown(e){if(![`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,` `].includes(e.key)||this.disabled)return;let t=this.getAllRadios().filter(e=>!e.disabled);if(t.length<=0)return;e.preventDefault();let n=this.value,r=t.find(e=>e.checked)??t[0],i=e.key===` `?0:[`ArrowUp`,`ArrowLeft`].includes(e.key)?-1:1,a=t.indexOf(r)+i;a||=0,a<0&&(a=t.length-1),a>t.length-1&&(a=0);let o=t.some(e=>e.tagName.toLowerCase()===`wa-radio-button`);this.getAllRadios().forEach(e=>{e.checked=!1,o||e.setAttribute(`tabindex`,`-1`)}),this.value=t[a].value,t[a].checked=!0,o?t[a].shadowRoot.querySelector(`button`).focus():(t[a].setAttribute(`tabindex`,`0`),t[a].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;let t=this.getAllRadios(),n=t.find(e=>e.checked),r=t.find(e=>!e.disabled),i=n||r;i&&i.focus(e)}render(){let e=this.hasSlotController.test(`label`,`withLabel`),t=this.hasSlotController.test(`hint`,`withHint`),n=this.label?!0:!!e,r=this.hint?!0:!!t;return h`
      <fieldset
        part="form-control"
        class=${m({"form-control":!0,"form-control-radio-group":!0,"form-control-has-label":n})}
        role="radiogroup"
        aria-labelledby="label"
        aria-describedby="hint"
        aria-errormessage="error-message"
        aria-orientation=${this.orientation}
      >
        <label
          part="form-control-label"
          id="label"
          class=${m({label:!0,"has-label":n})}
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
          class=${m({"has-slotted":r})}
          aria-hidden=${r?`false`:`true`}
          >${this.hint}</slot
        >
      </fieldset>
    `}};_.css=[ae,ce,pe],_.shadowRootOptions={...g.shadowRootOptions,delegatesFocus:!0},f([ue(`slot:not([name])`)],_.prototype,`defaultSlot`,2),f([d()],_.prototype,`label`,2),f([d({attribute:`hint`})],_.prototype,`hint`,2),f([d({reflect:!0})],_.prototype,`name`,2),f([d({type:Boolean,reflect:!0})],_.prototype,`disabled`,2),f([d({reflect:!0})],_.prototype,`orientation`,2),f([p()],_.prototype,`value`,1),f([d({attribute:`value`,reflect:!0})],_.prototype,`defaultValue`,2),f([d({reflect:!0})],_.prototype,`size`,2),f([de(`size`)],_.prototype,`handleSizeChange`,1),f([d({type:Boolean,reflect:!0})],_.prototype,`required`,2),f([d({type:Boolean,attribute:`with-label`})],_.prototype,`withLabel`,2),f([d({type:Boolean,attribute:`with-hint`})],_.prototype,`withHint`,2),_=f([re(`wa-radio-group`)],_),_.disableWarning?.(`change-in-update`);var me=oe`
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
`,v=class extends g{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance=`default`,this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener(`click`,this.handleClick)}handleSizeChange(){fe(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute(`role`,`radio`),this.tabIndex=0,this.setAttribute(`aria-disabled`,this.disabled||this.forceDisabled?`true`:`false`)}updated(e){if(super.updated(e),e.has(`checked`)&&(this.customStates.set(`checked`,this.checked),this.setAttribute(`aria-checked`,this.checked?`true`:`false`),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has(`disabled`)||e.has(`forceDisabled`)){let e=this.disabled||this.forceDisabled;this.customStates.set(`disabled`,e),this.setAttribute(`aria-disabled`,e?`true`:`false`),this.tabIndex=e?-1:this.checked?0:-1}}setValue(){}render(){return h`
      <span part="control" class="control">
        ${this.checked?h`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:``}
      </span>

      <slot part="label" class="label"></slot>
    `}};v.css=[ce,ae,me],f([p()],v.prototype,`checked`,2),f([p()],v.prototype,`forceDisabled`,2),f([d({reflect:!0})],v.prototype,`value`,2),f([d({reflect:!0})],v.prototype,`appearance`,2),f([d({reflect:!0})],v.prototype,`size`,2),f([de(`size`)],v.prototype,`handleSizeChange`,1),f([d({type:Boolean})],v.prototype,`disabled`,2),v=f([re(`wa-radio`)],v),v.disableWarning?.(`change-in-update`);var he={url:`tracks/Tour_Baulmes_valley.gpx`,name:`Gorge down to Baulmes`},ge={default:{dials:[.5,.5],hint:`Follows the track from behind, a little above it.`},pilot:{dials:[0,0],hint:`Low and close behind the marker, banking into the turns.`},spectator:{dials:[1,.8],hint:`High and wide, climbing over the ridges for the view.`},drone:{dials:[.6,1],hint:`Floating and loose, drifting like a drone in the wind.`}},y=`(max-width: 40em)`,b=e=>document.querySelector(e),x=await e(`cesiumContainer`);x.scene.globe.lambertDiffuseMultiplier=.35,x.scene.globe.vertexShadowDarkness=.7;var S,C,_e,w,T=`default`,ve=T,E=`empty`,D=!1,O={...ee};matchMedia(y).matches&&(O.quality=`540`);var k=!0,ye=b(`#panel`),A=b(`#preset`),be={orientation:b(`#videoOrientation`),quality:b(`#videoQuality`)},j=b(`#placeNames`),M=b(`#play`),N=b(`#progress`),P=b(`#create`),xe=b(`#changeFile`),F=e=>{e!==`ready`&&$(),E=e,document.body.dataset.state=e;for(let t of document.querySelectorAll(`[data-states]`))t.hidden=!t.dataset.states.split(` `).includes(e);L(),z()},I=e=>{D=e,L()},L=()=>{b(`#chooseFile`).loading=D,b(`#chooseFile`).disabled=D,b(`#trySample`).disabled=D;let e=E===`ready`&&!D,t=[A,...Object.values(be),j,xe];for(let n of t)n.disabled=!e;let n=(E===`ready`||E===`playing`)&&!D;N.disabled=!n,M.disabled=!n;let r=M.querySelector(`wa-icon`);r.name=E===`playing`?`pause`:`play`,r.label=E===`playing`?`Pause preview`:`Play preview`,P.disabled=!(e&&k),P.loading=D&&E===`ready`,x.scene.globe.maximumScreenSpaceError=E===`playing`?3:2},R=e=>`${e}px`,Se=()=>{let e=ye.getBoundingClientRect();if(matchMedia(y).matches)return{x:0,y:0,width:innerWidth,height:e.top};let t=innerWidth-e.right;return{x:t,y:t,width:e.left-2*t,height:innerHeight-2*t}},z=()=>{if(E===`empty`)return;let e=document.body.style,t=Se();for(let[n,r]of Object.entries(t))e.setProperty(`--region-${n}`,R(r));let[n,r]=u(O.orientation,O.quality),i=t;if(E===`ready`||E===`playing`){let e=b(`#player`),n=e.offsetHeight+parseFloat(getComputedStyle(e).marginBlockStart);i={...t,height:t.height-n}}let a=Math.min(i.width/n,i.height/r,E===`rendering`?1:1/0);e.setProperty(`--video-width`,R(n)),e.setProperty(`--video-height`,R(r)),e.setProperty(`--preview-width`,R(n*a)),e.setProperty(`--preview-height`,R(r*a)),e.setProperty(`--fit`,String(a)),e.setProperty(`--stage-x`,R(i.x+(i.width-n*a)/2)),e.setProperty(`--stage-y`,R(i.y+(i.height-r*a)/2)),x.resize(),x.scene.requestRender()};window.addEventListener(`resize`,z);var B=e=>{let t=b(E===`empty`?`#introError`:`#panelError`);t.querySelector(`span`).textContent=e,t.hidden=!1},Ce=()=>{b(`#introError`).hidden=!0,b(`#panelError`).hidden=!0},we=(e,t=0)=>{let n=x.camera,r={destination:n.position.clone(),orientation:{direction:n.direction.clone(),up:n.up.clone()}};e.distance=t;let i={destination:n.position.clone(),orientation:{heading:n.heading,pitch:n.pitch,roll:0}};n.setView(r),n.flyTo({...i,duration:2})},Te=e=>{let t=Cesium.BoundingSphere.fromPoints(e.points);x.camera.flyToBoundingSphere(t,{offset:new Cesium.HeadingPitchRange(x.camera.heading,Cesium.Math.toRadians(-45),t.radius*2.5),duration:2,complete:()=>setTimeout(()=>e===S&&E===`ready`&&we(e),1e3)})},Ee=e=>e?.url.startsWith(`blob:`)&&URL.revokeObjectURL(e.url),V=async(e=w)=>{let t=e===w;Ce(),I(!0);let[n,r]=ge[T].dials,a=new l(x,{style:n,motion:r});try{await a.load(e.url)}catch(n){return console.error(n),a.destroy(),I(!1),t?(T=ve,A.value=T,G(),B(`The track could not be loaded again. Check the connection and try again.`)):(Ee(e),B(`This file has no GPS track we can use. Export the activity as a GPX file from Strava, Garmin Connect or Komoot, and try again.`)),!1}let o=t?S.distance:0;S?.destroy(),C?.destroy(),S=a,ve=T,t||Ee(w),w=e,a.progressChanged.addEventListener(Fe),C=new i(x,a),C.active=j.checked,_e=C.load().catch(e=>console.error(e)),N.value=0,b(`#trackName`).textContent=a.name||e.name,Me(),q(),I(!1);let s=E===`empty`;return F(`ready`),t?we(a,o):Te(a),s&&b(`#trackName`).focus(),!0},H=e=>V({url:URL.createObjectURL(e),name:e.name}),U=()=>!D&&(E===`empty`||E===`ready`),W=b(`#fileInput`);b(`#chooseFile`).addEventListener(`click`,()=>W.click()),W.addEventListener(`change`,()=>{let e=W.files[0];W.value=``,e&&U()&&H(e)}),b(`#trySample`).addEventListener(`click`,async()=>{U()&&await V(he)&&Ie()});var De=b(`#dropzone`),Oe=b(`#dropOverlay`),ke=()=>{De.classList.remove(`over`),Oe.hidden=!0};document.addEventListener(`dragover`,e=>{e.preventDefault();let t=e.dataTransfer?.types.includes(`Files`)&&U();e.dataTransfer&&(e.dataTransfer.dropEffect=t?`copy`:`none`),De.classList.toggle(`over`,t&&E===`empty`),Oe.hidden=!(t&&E===`ready`)}),document.addEventListener(`dragleave`,e=>{e.relatedTarget||ke()}),document.addEventListener(`drop`,e=>{e.preventDefault(),ke();let t=e.dataTransfer?.files[0];t&&U()&&H(t)});var Ae=0,je=async()=>{let e=++Ae,[t,n]=u(O.orientation,O.quality),i=await r(`avc`,{width:t,height:n,bitrate:Math.round(s*t*n*30)}).catch(()=>!1);e===Ae&&(k=i,b(`#noEncoder`).hidden=k,L())},Me=()=>{if(!S)return;let e=n(S.duration,O.orientation,O.quality),r=c(S.duration,O.orientation,O.quality);b(`#summary`).textContent=`${t(S.duration)} video, ${te(r)}, ${a(e)} to render`},G=()=>{A.hint=ge[T].hint};G(),A.addEventListener(`change`,()=>{T=A.value,G(),$(),V()});for(let[e,t]of Object.entries(be))t.value=O[e],t.addEventListener(`change`,()=>{O[e]=t.value,$(),Me(),je(),z()});j.addEventListener(`change`,()=>{C&&(C.active=j.checked),x.scene.requestRender()}),xe.addEventListener(`click`,()=>W.click());var Ne=b(`#collapse`);Ne.addEventListener(`click`,()=>{let e=ye.classList.toggle(`collapsed`),t=Ne.querySelector(`wa-icon`);t.name=e?`chevron-up`:`chevron-down`,t.label=e?`Show the settings`:`Hide the settings`,z()});var Pe=b(`#time`),K=!1,q=()=>{let e=S?.duration??0;Pe.textContent=`${t((S?.progress??0)*e)} / ${t(e)}`},Fe=e=>{let t=Math.round(e*1e3)/1e3;!K&&+N.value!==t&&(N.value=t),q()};N.addEventListener(`input`,()=>{K=!0,x.camera.cancelFlight(),S.progress=+N.value,q()}),N.addEventListener(`change`,()=>{K=!1});var Ie=async()=>{x.camera.cancelFlight(),F(`playing`),await S.play(),E===`playing`&&F(`ready`)};M.addEventListener(`click`,()=>E===`playing`?S.stop():Ie());var J,Le=async()=>{try{let e=await navigator.wakeLock?.request(`screen`);E===`rendering`?J=e:e?.release()}catch{}},Re=()=>{J?.release().catch(()=>{}),J=void 0};document.addEventListener(`visibilitychange`,()=>{E===`rendering`&&document.visibilityState===`visible`&&Le()});var Y,X,Z=b(`#renderProgress`),ze=b(`#renderEta`),Be=b(`#renderFrames`),Ve=()=>(S?.name||w.name).replace(/\.[^.]+$/,``).replace(/[^\p{L}\p{N}]+/gu,`-`).replace(/^-|-$/g,``)||`flyover`,He=async()=>{Ce();let[e,t]=u(O.orientation,O.quality);`Notification`in window&&Notification.permission==="default"&&Notification.requestPermission(),x.camera.cancelFlight(),F(`rendering`),b(`#stopRender`).focus(),Z.value=0,Z.textContent=`0%`,ze.textContent=`Starting`,Be.textContent=``;let n=document.title;Le(),Y=new AbortController;let r=new Promise(e=>Y.signal.addEventListener(`abort`,e,{once:!0})),i,s;try{await Promise.race([_e,r]),Y.signal.aborted||(i=await ne({viewer:x,flyover:S,captions:C,width:e,height:t,signal:Y.signal,onProgress:({frame:e,frames:t,perFrame:n})=>{let r=Math.floor(100*e/t);Z.value=r,Z.textContent=`${r}%`,document.title=o(r),e>=30&&(ze.textContent=`${a(n*(t-e))} left`),Be.textContent=`Frame ${e+1} of ${t}`}}))}catch(e){console.error(e),s=e}finally{Re(),document.title=n}if(!i){F(`ready`),s&&B(`The video could not be made: ${s.message}`),P.focus();return}X&&URL.revokeObjectURL(X.url);let c=`${Ve()}.mp4`;X={url:URL.createObjectURL(i),name:c,file:new File([i],c,{type:`video/mp4`})},b(`#resultVideo`).src=X.url,b(`#downloadLabel`).textContent=`Download video · ${(i.size/1e6).toFixed(1)} MB`,`Notification`in window&&Notification.permission===`granted`&&document.hidden&&new Notification(`Your flyover is ready`,{body:b(`#downloadLabel`).textContent});let l=navigator.canShare?.({files:[X.file]})??!1;b(`#share`).hidden=!l,b(`#download`).variant=l?`neutral`:`brand`,b(`#download`).appearance=l?`outlined`:`accent`,F(`done`),b(l?`#share`:`#download`).focus()},Q=0;function $(){Q=0,b(`#phoneWarning`).hidden=!0,b(`#createLabel`).textContent=`Create video`}P.addEventListener(`click`,()=>{if(matchMedia(`${y}, (pointer: coarse)`).matches){if(!Q){Q=performance.now(),b(`#phoneWarning`).hidden=!1,b(`#createLabel`).textContent=`Render anyway`;return}if(performance.now()-Q<600)return}$(),He()}),b(`#stopRender`).addEventListener(`click`,()=>Y.abort()),b(`#share`).addEventListener(`click`,async()=>{try{await navigator.share({files:[X.file],title:b(`#trackName`).textContent})}catch(e){e.name!==`AbortError`&&console.error(e)}}),b(`#download`).addEventListener(`click`,()=>{Object.assign(document.createElement(`a`),{href:X.url,download:X.name}).click()}),b(`#makeAnother`).addEventListener(`click`,()=>{b(`#resultVideo`).pause(),F(`ready`),P.focus()}),je(),F(`empty`);