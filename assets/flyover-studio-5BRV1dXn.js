import{a as e,u as t}from"./lit-BFn1CURT.js";import{a as n,c as r,i,o as a,r as o,s,t as c}from"./card-BcpQSzF3.js";import{c as l,d as ee,o as u,s as te}from"./directive-helpers-B0KETb9i.js";import{t as ne}from"./setup-DMh09s7J.js";import{n as re}from"./switch-PsQ7BZQb.js";import"./button-CI_sKcZA.js";import"./icon-BcbZVKyW.js";import{a as d,c as ie,d as ae,f as oe,i as f,l as se,n as ce,o as le,p as ue,r as de,s as fe,t as pe,u as p}from"./callout-BIRLMAyB.js";import{t as me}from"./chunk.GWSUX3V5-BJ2wQfMz.js";import{r as he}from"./slider-Cjeel3x6.js";var ge=t`
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
`,m=class extends l{constructor(){super(),this.hasSlotController=new r(this,`hint`,`label`),this.label=``,this.hint=``,this.name=null,this.disabled=!1,this.orientation=`vertical`,this._value=null,this.defaultValue=this.getAttribute(`value`)||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{let t=e.target.closest(`wa-radio`);if(!t||t.disabled||t.forceDisabled||this.disabled)return;let n=this.value;this.value=t.value,t.checked=!0;let r=this.getAllRadios();for(let e of r)t!==e&&(e.checked=!1,e.setAttribute(`tabindex`,`-1`));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})},this.addEventListener(`keydown`,this.handleKeyDown),this.addEventListener(`click`,this.handleRadioClick)}static get validators(){let e=[me({validationElement:Object.assign(document.createElement(`input`),{required:!0,type:`radio`,name:he(`__wa-radio`)})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e==`number`&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){te(this.localName,this.size)}get validationTarget(){let e=this.querySelector(`:is(wa-radio):not([disabled])`);if(e)return e}updated(e){(e.has(`disabled`)||e.has(`size`)||e.has(`value`)||e.has(`defaultValue`))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll(`wa-radio`)]}handleLabelClick(){this.focus()}async syncRadioElements(){let e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute(`size`,this.size),t.toggleAttribute(`data-wa-radio-horizontal`,this.orientation!==`vertical`),t.toggleAttribute(`data-wa-radio-vertical`,this.orientation===`vertical`),t.toggleAttribute(`data-wa-radio-first`,n===0),t.toggleAttribute(`data-wa-radio-inner`,n!==0&&n!==e.length-1),t.toggleAttribute(`data-wa-radio-last`,n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async e=>{await e.updateComplete,e.checked=!e.disabled&&e.value===this.value})),this.disabled)e.forEach(e=>{e.tabIndex=-1});else{let t=e.filter(e=>!e.disabled),n=t.find(e=>e.checked);t.length>0&&(n?t.forEach(e=>{e.tabIndex=e.checked?0:-1}):t.forEach((e,t)=>{e.tabIndex=t===0?0:-1})),e.filter(e=>e.disabled).forEach(e=>{e.tabIndex=-1})}}handleKeyDown(e){if(![`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,` `].includes(e.key)||this.disabled)return;let t=this.getAllRadios().filter(e=>!e.disabled);if(t.length<=0)return;e.preventDefault();let n=this.value,r=t.find(e=>e.checked)??t[0],i=e.key===` `?0:[`ArrowUp`,`ArrowLeft`].includes(e.key)?-1:1,a=t.indexOf(r)+i;a||=0,a<0&&(a=t.length-1),a>t.length-1&&(a=0);let o=t.some(e=>e.tagName.toLowerCase()===`wa-radio-button`);this.getAllRadios().forEach(e=>{e.checked=!1,o||e.setAttribute(`tabindex`,`-1`)}),this.value=t[a].value,t[a].checked=!0,o?t[a].shadowRoot.querySelector(`button`).focus():(t[a].setAttribute(`tabindex`,`0`),t[a].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;let t=this.getAllRadios(),n=t.find(e=>e.checked),r=t.find(e=>!e.disabled),i=n||r;i&&i.focus(e)}render(){let t=this.hasSlotController.test(`label`,`withLabel`),n=this.hasSlotController.test(`hint`,`withHint`),r=this.label?!0:!!t,i=this.hint?!0:!!n;return e`
      <fieldset
        part="form-control"
        class=${c({"form-control":!0,"form-control-radio-group":!0,"form-control-has-label":r})}
        role="radiogroup"
        aria-labelledby="label"
        aria-describedby="hint"
        aria-errormessage="error-message"
        aria-orientation=${this.orientation}
      >
        <label
          part="form-control-label"
          id="label"
          class=${c({label:!0,"has-label":r})}
          aria-hidden=${r?`false`:`true`}
          @click=${this.handleLabelClick}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <slot part="form-control-input" @slotchange=${this.syncRadioElements}></slot>

        <slot
          id="hint"
          name="hint"
          part="hint"
          class=${c({"has-slotted":i})}
          aria-hidden=${i?`false`:`true`}
          >${this.hint}</slot
        >
      </fieldset>
    `}};m.css=[s,re,ge],m.shadowRootOptions={...l.shadowRootOptions,delegatesFocus:!0},a([ee(`slot:not([name])`)],m.prototype,`defaultSlot`,2),a([i()],m.prototype,`label`,2),a([i({attribute:`hint`})],m.prototype,`hint`,2),a([i({reflect:!0})],m.prototype,`name`,2),a([i({type:Boolean,reflect:!0})],m.prototype,`disabled`,2),a([i({reflect:!0})],m.prototype,`orientation`,2),a([o()],m.prototype,`value`,1),a([i({attribute:`value`,reflect:!0})],m.prototype,`defaultValue`,2),a([i({reflect:!0})],m.prototype,`size`,2),a([u(`size`)],m.prototype,`handleSizeChange`,1),a([i({type:Boolean,reflect:!0})],m.prototype,`required`,2),a([i({type:Boolean,attribute:`with-label`})],m.prototype,`withLabel`,2),a([i({type:Boolean,attribute:`with-hint`})],m.prototype,`withHint`,2),m=a([n(`wa-radio-group`)],m),m.disableWarning?.(`change-in-update`);var _e=t`
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
`,h=class extends l{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance=`default`,this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener(`click`,this.handleClick)}handleSizeChange(){te(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute(`role`,`radio`),this.tabIndex=0,this.setAttribute(`aria-disabled`,this.disabled||this.forceDisabled?`true`:`false`)}updated(e){if(super.updated(e),e.has(`checked`)&&(this.customStates.set(`checked`,this.checked),this.setAttribute(`aria-checked`,this.checked?`true`:`false`),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has(`disabled`)||e.has(`forceDisabled`)){let e=this.disabled||this.forceDisabled;this.customStates.set(`disabled`,e),this.setAttribute(`aria-disabled`,e?`true`:`false`),this.tabIndex=e?-1:this.checked?0:-1}}setValue(){}render(){return e`
      <span part="control" class="control">
        ${this.checked?e`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:``}
      </span>

      <slot part="label" class="label"></slot>
    `}};h.css=[re,s,_e],a([o()],h.prototype,`checked`,2),a([o()],h.prototype,`forceDisabled`,2),a([i({reflect:!0})],h.prototype,`value`,2),a([i({reflect:!0})],h.prototype,`appearance`,2),a([i({reflect:!0})],h.prototype,`size`,2),a([u(`size`)],h.prototype,`handleSizeChange`,1),a([i({type:Boolean})],h.prototype,`disabled`,2),h=a([n(`wa-radio`)],h),h.disableWarning?.(`change-in-update`);var ve={url:`tracks/Tour_Baulmes_valley.gpx`,name:`Gorge down to Baulmes`},g={default:{dials:[.5,.5],hint:`Follows the track from behind, a little above it.`},pilot:{dials:[0,0],hint:`Low and close behind the marker, banking into the turns.`},spectator:{dials:[1,.8],hint:`High and wide, climbing over the ridges for the view.`},drone:{dials:[.6,1],hint:`Floating and loose, drifting like a drone in the wind.`}},_=`(max-width: 40em)`,v=e=>document.querySelector(e),y=await ne(`cesiumContainer`);y.scene.globe.lambertDiffuseMultiplier=.35,y.scene.globe.vertexShadowDarkness=.7;var b,x,ye,S,C=`default`,be=C,w=`empty`,T=!1,E={...de};matchMedia(_).matches&&(E.quality=`540`);var D=!0,xe=v(`#panel`),O=v(`#preset`),k={orientation:v(`#videoOrientation`),quality:v(`#videoQuality`)},A=v(`#placeNames`),j=v(`#play`),M=v(`#progress`),N=v(`#create`),P=v(`#changeFile`),F=e=>{e!==`ready`&&$(),w=e,document.body.dataset.state=e;for(let t of document.querySelectorAll(`[data-states]`))t.hidden=!t.dataset.states.split(` `).includes(e);L(),z()},I=e=>{T=e,L()},L=()=>{v(`#chooseFile`).loading=T,v(`#chooseFile`).disabled=T,v(`#trySample`).disabled=T;let e=w===`ready`&&!T,t=[O,...Object.values(k),A,P];for(let n of t)n.disabled=!e;let n=(w===`ready`||w===`playing`)&&!T;M.disabled=!n,j.disabled=!n;let r=j.querySelector(`wa-icon`);r.name=w===`playing`?`pause`:`play`,r.label=w===`playing`?`Pause preview`:`Play preview`,N.disabled=!(e&&D),N.loading=T&&w===`ready`,y.scene.globe.maximumScreenSpaceError=w===`playing`?3:2},R=e=>`${e}px`,Se=()=>{let e=xe.getBoundingClientRect();if(matchMedia(_).matches)return{x:0,y:0,width:innerWidth,height:e.top};let t=innerWidth-e.right;return{x:t,y:t,width:e.left-2*t,height:innerHeight-2*t}},z=()=>{if(w===`empty`)return;let e=document.body.style,t=Se();for(let[n,r]of Object.entries(t))e.setProperty(`--region-${n}`,R(r));let[n,r]=p(E.orientation,E.quality),i=t;if(w===`ready`||w===`playing`){let e=v(`#player`),n=e.offsetHeight+parseFloat(getComputedStyle(e).marginBlockStart);i={...t,height:t.height-n}}let a=Math.min(i.width/n,i.height/r,w===`rendering`?1:1/0);e.setProperty(`--video-width`,R(n)),e.setProperty(`--video-height`,R(r)),e.setProperty(`--preview-width`,R(n*a)),e.setProperty(`--preview-height`,R(r*a)),e.setProperty(`--fit`,String(a)),e.setProperty(`--stage-x`,R(i.x+(i.width-n*a)/2)),e.setProperty(`--stage-y`,R(i.y+(i.height-r*a)/2)),y.resize(),y.scene.requestRender()};window.addEventListener(`resize`,z);var B=e=>{let t=v(w===`empty`?`#introError`:`#panelError`);t.querySelector(`span`).textContent=e,t.hidden=!1},V=()=>{v(`#introError`).hidden=!0,v(`#panelError`).hidden=!0},Ce=(e,t=0)=>{let n=y.camera,r={destination:n.position.clone(),orientation:{direction:n.direction.clone(),up:n.up.clone()}};e.distance=t;let i={destination:n.position.clone(),orientation:{heading:n.heading,pitch:n.pitch,roll:0}};n.setView(r),n.flyTo({...i,duration:2})},we=e=>{let t=Cesium.BoundingSphere.fromPoints(e.points);y.camera.flyToBoundingSphere(t,{offset:new Cesium.HeadingPitchRange(y.camera.heading,Cesium.Math.toRadians(-45),t.radius*2.5),duration:2,complete:()=>setTimeout(()=>e===b&&w===`ready`&&Ce(e),1e3)})},Te=e=>e?.url.startsWith(`blob:`)&&URL.revokeObjectURL(e.url),H=async(e=S)=>{let t=e===S;V(),I(!0);let[n,r]=g[C].dials,i=new ue(y,{style:n,motion:r});try{await i.load(e.url)}catch(n){return console.error(n),i.destroy(),I(!1),t?(C=be,O.value=C,G(),B(`The track could not be loaded again. Check the connection and try again.`)):(Te(e),B(`This file has no GPS track we can use. Export the activity as a GPX file from Strava, Garmin Connect or Komoot, and try again.`)),!1}let a=t?b.distance:0;b?.destroy(),x?.destroy(),b=i,be=C,t||Te(S),S=e,i.progressChanged.addEventListener(Fe),x=new oe(y,i),x.active=A.checked,ye=x.load().catch(e=>console.error(e)),M.value=0,v(`#trackName`).textContent=i.name||e.name,Me(),q(),I(!1);let o=w===`empty`;return F(`ready`),t?Ce(i,a):we(i),o&&v(`#trackName`).focus(),!0},Ee=e=>H({url:URL.createObjectURL(e),name:e.name}),U=()=>!T&&(w===`empty`||w===`ready`),W=v(`#fileInput`);v(`#chooseFile`).addEventListener(`click`,()=>W.click()),W.addEventListener(`change`,()=>{let e=W.files[0];W.value=``,e&&U()&&Ee(e)}),v(`#trySample`).addEventListener(`click`,async()=>{U()&&await H(ve)&&Ie()});var De=v(`#dropzone`),Oe=v(`#dropOverlay`),ke=()=>{De.classList.remove(`over`),Oe.hidden=!0};document.addEventListener(`dragover`,e=>{e.preventDefault();let t=e.dataTransfer?.types.includes(`Files`)&&U();e.dataTransfer&&(e.dataTransfer.dropEffect=t?`copy`:`none`),De.classList.toggle(`over`,t&&w===`empty`),Oe.hidden=!(t&&w===`ready`)}),document.addEventListener(`dragleave`,e=>{e.relatedTarget||ke()}),document.addEventListener(`drop`,e=>{e.preventDefault(),ke();let t=e.dataTransfer?.files[0];t&&U()&&Ee(t)});var Ae=0,je=async()=>{let e=++Ae,[t,n]=p(E.orientation,E.quality),r=await ae(`avc`,{width:t,height:n,bitrate:Math.round(ce*t*n*30)}).catch(()=>!1);e===Ae&&(D=r,v(`#noEncoder`).hidden=D,L())},Me=()=>{if(!b)return;let e=ie(b.duration,E.orientation,E.quality),t=le(b.duration,E.orientation,E.quality);v(`#summary`).textContent=`${d(b.duration)} video, ${fe(t)}, ${f(e)} to render`},G=()=>{O.hint=g[C].hint};G(),O.addEventListener(`change`,()=>{C=O.value,G(),$(),H()});for(let[e,t]of Object.entries(k))t.value=E[e],t.addEventListener(`change`,()=>{E[e]=t.value,$(),Me(),je(),z()});A.addEventListener(`change`,()=>{x&&(x.active=A.checked),y.scene.requestRender()}),P.addEventListener(`click`,()=>W.click());var Ne=v(`#collapse`);Ne.addEventListener(`click`,()=>{let e=xe.classList.toggle(`collapsed`),t=Ne.querySelector(`wa-icon`);t.name=e?`chevron-up`:`chevron-down`,t.label=e?`Show the settings`:`Hide the settings`,z()});var Pe=v(`#time`),K=!1,q=()=>{let e=b?.duration??0;Pe.textContent=`${d((b?.progress??0)*e)} / ${d(e)}`},Fe=e=>{let t=Math.round(e*1e3)/1e3;!K&&+M.value!==t&&(M.value=t),q()};M.addEventListener(`input`,()=>{K=!0,y.camera.cancelFlight(),b.progress=+M.value,q()}),M.addEventListener(`change`,()=>{K=!1});var Ie=async()=>{y.camera.cancelFlight(),F(`playing`),await b.play(),w===`playing`&&F(`ready`)};j.addEventListener(`click`,()=>w===`playing`?b.stop():Ie());var J,Le=async()=>{try{let e=await navigator.wakeLock?.request(`screen`);w===`rendering`?J=e:e?.release()}catch{}},Re=()=>{J?.release().catch(()=>{}),J=void 0};document.addEventListener(`visibilitychange`,()=>{w===`rendering`&&document.visibilityState===`visible`&&Le()});var Y,X,Z=v(`#renderProgress`),ze=v(`#renderEta`),Be=v(`#renderFrames`),Ve=()=>(b?.name||S.name).replace(/\.[^.]+$/,``).replace(/[^\p{L}\p{N}]+/gu,`-`).replace(/^-|-$/g,``)||`flyover`,He=async()=>{V();let[e,t]=p(E.orientation,E.quality);`Notification`in window&&Notification.permission==="default"&&Notification.requestPermission(),y.camera.cancelFlight(),F(`rendering`),v(`#stopRender`).focus(),Z.value=0,Z.textContent=`0%`,ze.textContent=`Starting`,Be.textContent=``;let n=document.title;Le(),Y=new AbortController;let r=new Promise(e=>Y.signal.addEventListener(`abort`,e,{once:!0})),i,a;try{await Promise.race([ye,r]),Y.signal.aborted||(i=await pe({viewer:y,flyover:b,captions:x,width:e,height:t,signal:Y.signal,onProgress:({frame:e,frames:t,perFrame:n})=>{let r=Math.floor(100*e/t);Z.value=r,Z.textContent=`${r}%`,document.title=se(r),e>=30&&(ze.textContent=`${f(n*(t-e))} left`),Be.textContent=`Frame ${e+1} of ${t}`}}))}catch(e){console.error(e),a=e}finally{Re(),document.title=n}if(!i){F(`ready`),a&&B(`The video could not be made: ${a.message}`),N.focus();return}X&&URL.revokeObjectURL(X.url);let o=`${Ve()}.mp4`;X={url:URL.createObjectURL(i),name:o,file:new File([i],o,{type:`video/mp4`})},v(`#resultVideo`).src=X.url,v(`#downloadLabel`).textContent=`Download video · ${(i.size/1e6).toFixed(1)} MB`,`Notification`in window&&Notification.permission===`granted`&&document.hidden&&new Notification(`Your flyover is ready`,{body:v(`#downloadLabel`).textContent});let s=navigator.canShare?.({files:[X.file]})??!1;v(`#share`).hidden=!s,v(`#download`).variant=s?`neutral`:`brand`,v(`#download`).appearance=s?`outlined`:`accent`,F(`done`),v(s?`#share`:`#download`).focus()},Q=0;function $(){Q=0,v(`#phoneWarning`).hidden=!0,v(`#createLabel`).textContent=`Create video`}N.addEventListener(`click`,()=>{if(matchMedia(`${_}, (pointer: coarse)`).matches){if(!Q){Q=performance.now(),v(`#phoneWarning`).hidden=!1,v(`#createLabel`).textContent=`Render anyway`;return}if(performance.now()-Q<600)return}$(),He()}),v(`#stopRender`).addEventListener(`click`,()=>Y.abort()),v(`#share`).addEventListener(`click`,async()=>{try{await navigator.share({files:[X.file],title:v(`#trackName`).textContent})}catch(e){e.name!==`AbortError`&&console.error(e)}}),v(`#download`).addEventListener(`click`,()=>{Object.assign(document.createElement(`a`),{href:X.url,download:X.name}).click()}),v(`#makeAnother`).addEventListener(`click`,()=>{v(`#resultVideo`).pause(),F(`ready`),N.focus()}),je(),F(`empty`);