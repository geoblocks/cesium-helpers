import{a as e,u as t}from"./lit-BFn1CURT.js";import{a as n,c as r,i,o as a,r as o,s,t as c}from"./card-AeaRol_r.js";import{c as l,d as ee,o as te,s as ne}from"./directive-helpers-BiOJKcbC.js";import{t as re}from"./setup-DMh09s7J.js";import{n as ie}from"./switch-C191omm4.js";import{t as ae}from"./chunk.GWSUX3V5-BJ2wQfMz.js";import"./chunk.JAAVYFGY-DnLsQWHm.js";import"./button-C75z8WNE.js";import"./icon-wq7GPeeB.js";import{a as u,c as oe,d as se,f as ce,i as d,l as le,n as ue,o as de,p as fe,r as pe,s as me,t as he,u as f}from"./callout-C14Mofhq.js";import{n as ge}from"./slider-BKt-Dcqc.js";var _e=t`
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
`,p=class extends l{constructor(){super(),this.hasSlotController=new r(this,`hint`,`label`),this.label=``,this.hint=``,this.name=null,this.disabled=!1,this.orientation=`vertical`,this._value=null,this.defaultValue=this.getAttribute(`value`)||null,this.required=!1,this.withLabel=!1,this.withHint=!1,this.handleRadioClick=e=>{let t=e.target.closest(`wa-radio`);if(!t||t.disabled||t.forceDisabled||this.disabled)return;let n=this.value;this.value=t.value,t.checked=!0;let r=this.getAllRadios();for(let e of r)t!==e&&(e.checked=!1,e.setAttribute(`tabindex`,`-1`));this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})},this.addEventListener(`keydown`,this.handleKeyDown),this.addEventListener(`click`,this.handleRadioClick)}static get validators(){let e=[ae({validationElement:Object.assign(document.createElement(`input`),{required:!0,type:`radio`,name:ge(`__wa-radio`)})})];return[...super.validators,...e]}get value(){return this.valueHasChanged?this._value:this._value??this.defaultValue}set value(e){typeof e==`number`&&(e=String(e)),this.valueHasChanged=!0,this._value=e}handleSizeChange(){ne(this.localName,this.size)}get validationTarget(){let e=this.querySelector(`:is(wa-radio):not([disabled])`);if(e)return e}updated(e){(e.has(`disabled`)||e.has(`size`)||e.has(`value`)||e.has(`defaultValue`))&&this.syncRadioElements()}formResetCallback(...e){this._value=null,super.formResetCallback(...e),this.syncRadioElements()}getAllRadios(){return[...this.querySelectorAll(`wa-radio`)]}handleLabelClick(){this.focus()}async syncRadioElements(){let e=this.getAllRadios();if(e.forEach((t,n)=>{this.size&&t.setAttribute(`size`,this.size),t.toggleAttribute(`data-wa-radio-horizontal`,this.orientation!==`vertical`),t.toggleAttribute(`data-wa-radio-vertical`,this.orientation===`vertical`),t.toggleAttribute(`data-wa-radio-first`,n===0),t.toggleAttribute(`data-wa-radio-inner`,n!==0&&n!==e.length-1),t.toggleAttribute(`data-wa-radio-last`,n===e.length-1),t.forceDisabled=this.disabled}),await Promise.all(e.map(async e=>{await e.updateComplete,e.checked=!e.disabled&&e.value===this.value})),this.disabled)e.forEach(e=>{e.tabIndex=-1});else{let t=e.filter(e=>!e.disabled),n=t.find(e=>e.checked);t.length>0&&(n?t.forEach(e=>{e.tabIndex=e.checked?0:-1}):t.forEach((e,t)=>{e.tabIndex=t===0?0:-1})),e.filter(e=>e.disabled).forEach(e=>{e.tabIndex=-1})}}handleKeyDown(e){if(![`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,` `].includes(e.key)||this.disabled)return;let t=this.getAllRadios().filter(e=>!e.disabled);if(t.length<=0)return;e.preventDefault();let n=this.value,r=t.find(e=>e.checked)??t[0],i=e.key===` `?0:[`ArrowUp`,`ArrowLeft`].includes(e.key)?-1:1,a=t.indexOf(r)+i;a||=0,a<0&&(a=t.length-1),a>t.length-1&&(a=0);let o=t.some(e=>e.tagName.toLowerCase()===`wa-radio-button`);this.getAllRadios().forEach(e=>{e.checked=!1,o||e.setAttribute(`tabindex`,`-1`)}),this.value=t[a].value,t[a].checked=!0,o?t[a].shadowRoot.querySelector(`button`).focus():(t[a].setAttribute(`tabindex`,`0`),t[a].focus()),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),e.preventDefault()}focus(e){if(this.disabled)return;let t=this.getAllRadios(),n=t.find(e=>e.checked),r=t.find(e=>!e.disabled),i=n||r;i&&i.focus(e)}render(){let t=this.hasSlotController.test(`label`,`withLabel`),n=this.hasSlotController.test(`hint`,`withHint`),r=this.label?!0:!!t,i=this.hint?!0:!!n;return e`
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
    `}};p.css=[s,ie,_e],p.shadowRootOptions={...l.shadowRootOptions,delegatesFocus:!0},a([ee(`slot:not([name])`)],p.prototype,`defaultSlot`,2),a([i()],p.prototype,`label`,2),a([i({attribute:`hint`})],p.prototype,`hint`,2),a([i({reflect:!0})],p.prototype,`name`,2),a([i({type:Boolean,reflect:!0})],p.prototype,`disabled`,2),a([i({reflect:!0})],p.prototype,`orientation`,2),a([o()],p.prototype,`value`,1),a([i({attribute:`value`,reflect:!0})],p.prototype,`defaultValue`,2),a([i({reflect:!0})],p.prototype,`size`,2),a([te(`size`)],p.prototype,`handleSizeChange`,1),a([i({type:Boolean,reflect:!0})],p.prototype,`required`,2),a([i({type:Boolean,attribute:`with-label`})],p.prototype,`withLabel`,2),a([i({type:Boolean,attribute:`with-hint`})],p.prototype,`withHint`,2),p=a([n(`wa-radio-group`)],p),p.disableWarning?.(`change-in-update`);var ve=t`
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
`,m=class extends l{constructor(){super(),this.checked=!1,this.forceDisabled=!1,this.appearance=`default`,this.disabled=!1,this.handleClick=()=>{!this.disabled&&!this.forceDisabled&&(this.checked=!0)},this.addEventListener(`click`,this.handleClick)}handleSizeChange(){ne(this.localName,this.size)}connectedCallback(){super.connectedCallback(),this.setInitialAttributes()}setInitialAttributes(){this.setAttribute(`role`,`radio`),this.tabIndex=0,this.setAttribute(`aria-disabled`,this.disabled||this.forceDisabled?`true`:`false`)}updated(e){if(super.updated(e),e.has(`checked`)&&(this.customStates.set(`checked`,this.checked),this.setAttribute(`aria-checked`,this.checked?`true`:`false`),!this.disabled&&!this.forceDisabled&&(this.tabIndex=this.checked?0:-1)),e.has(`disabled`)||e.has(`forceDisabled`)){let e=this.disabled||this.forceDisabled;this.customStates.set(`disabled`,e),this.setAttribute(`aria-disabled`,e?`true`:`false`),this.tabIndex=e?-1:this.checked?0:-1}}setValue(){}render(){return e`
      <span part="control" class="control">
        ${this.checked?e`
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" part="checked-icon" class="checked-icon">
                <circle cx="8" cy="8" r="8" />
              </svg>
            `:``}
      </span>

      <slot part="label" class="label"></slot>
    `}};m.css=[ie,s,ve],a([o()],m.prototype,`checked`,2),a([o()],m.prototype,`forceDisabled`,2),a([i({reflect:!0})],m.prototype,`value`,2),a([i({reflect:!0})],m.prototype,`appearance`,2),a([i({reflect:!0})],m.prototype,`size`,2),a([te(`size`)],m.prototype,`handleSizeChange`,1),a([i({type:Boolean})],m.prototype,`disabled`,2),m=a([n(`wa-radio`)],m),m.disableWarning?.(`change-in-update`);var ye={url:`tracks/Tour_Baulmes_valley.gpx`,name:`Gorge down to Baulmes`},h={default:{dials:[.5,.5],hint:`Follows the track from behind, a little above it.`},pilot:{dials:[0,0],hint:`Low and close behind the marker, banking into the turns.`},spectator:{dials:[1,.8],hint:`High and wide, climbing over the ridges for the view.`},drone:{dials:[.6,1],hint:`Floating and loose, drifting like a drone in the wind.`}},g=`(max-width: 40em)`,_=e=>document.querySelector(e),v=await re(`cesiumContainer`);v.scene.globe.lambertDiffuseMultiplier=.35,v.scene.globe.vertexShadowDarkness=.7;var y,b,be,x,S=`default`,xe=S,C=`empty`,w=!1,T={...pe};matchMedia(g).matches&&(T.quality=`540`);var E=!0,D=_(`#panel`),O=_(`#preset`),k={orientation:_(`#videoOrientation`),quality:_(`#videoQuality`)},A=_(`#placeNames`),j=_(`#play`),M=_(`#progress`),N=_(`#create`),P=_(`#changeFile`),F=e=>{e!==`ready`&&$(),C=e,document.body.dataset.state=e;for(let t of document.querySelectorAll(`[data-states]`))t.hidden=!t.dataset.states.split(` `).includes(e);L(),z()},I=e=>{w=e,L()},L=()=>{_(`#chooseFile`).loading=w,_(`#chooseFile`).disabled=w,_(`#trySample`).disabled=w;let e=C===`ready`&&!w,t=[O,...Object.values(k),A,P];for(let n of t)n.disabled=!e;let n=(C===`ready`||C===`playing`)&&!w;M.disabled=!n,j.disabled=!n;let r=j.querySelector(`wa-icon`);r.name=C===`playing`?`pause`:`play`,r.label=C===`playing`?`Pause preview`:`Play preview`,N.disabled=!(e&&E),N.loading=w&&C===`ready`,v.scene.globe.maximumScreenSpaceError=C===`playing`?3:2},R=e=>`${e}px`,Se=()=>{let e=D.getBoundingClientRect();if(matchMedia(g).matches)return{x:0,y:0,width:innerWidth,height:e.top};let t=innerWidth-e.right;return{x:t,y:t,width:e.left-2*t,height:innerHeight-2*t}},z=()=>{if(C===`empty`)return;let e=document.body.style,t=Se();for(let[n,r]of Object.entries(t))e.setProperty(`--region-${n}`,R(r));let[n,r]=f(T.orientation,T.quality),i=t;if(C===`ready`||C===`playing`){let e=_(`#player`),n=e.offsetHeight+parseFloat(getComputedStyle(e).marginBlockStart);i={...t,height:t.height-n}}let a=Math.min(i.width/n,i.height/r,C===`rendering`?1:1/0);e.setProperty(`--video-width`,R(n)),e.setProperty(`--video-height`,R(r)),e.setProperty(`--preview-width`,R(n*a)),e.setProperty(`--preview-height`,R(r*a)),e.setProperty(`--fit`,String(a)),e.setProperty(`--stage-x`,R(i.x+(i.width-n*a)/2)),e.setProperty(`--stage-y`,R(i.y+(i.height-r*a)/2)),v.resize(),v.scene.requestRender()};window.addEventListener(`resize`,z);var B=e=>{let t=_(C===`empty`?`#introError`:`#panelError`);t.querySelector(`span`).textContent=e,t.hidden=!1},V=()=>{_(`#introError`).hidden=!0,_(`#panelError`).hidden=!0},Ce=(e,t=0)=>{let n=v.camera,r={destination:n.position.clone(),orientation:{direction:n.direction.clone(),up:n.up.clone()}};e.distance=t;let i={destination:n.position.clone(),orientation:{heading:n.heading,pitch:n.pitch,roll:0}};n.setView(r),n.flyTo({...i,duration:2})},we=e=>{let t=Cesium.BoundingSphere.fromPoints(e.points);v.camera.flyToBoundingSphere(t,{offset:new Cesium.HeadingPitchRange(v.camera.heading,Cesium.Math.toRadians(-45),t.radius*2.5),duration:2,complete:()=>setTimeout(()=>e===y&&C===`ready`&&Ce(e),1e3)})},Te=e=>e?.url.startsWith(`blob:`)&&URL.revokeObjectURL(e.url),H=async(e=x)=>{let t=e===x;V(),I(!0);let[n,r]=h[S].dials,i=new fe(v,{style:n,motion:r});try{await i.load(e.url)}catch(n){return console.error(n),i.destroy(),I(!1),t?(S=xe,O.value=S,G(),B(`The track could not be loaded again. Check the connection and try again.`)):(Te(e),B(`This file has no GPS track we can use. Export the activity as a GPX file from Strava, Garmin Connect or Komoot, and try again.`)),!1}let a=t?y.distance:0;y?.destroy(),b?.destroy(),y=i,xe=S,t||Te(x),x=e,i.progressChanged.addEventListener(Fe),b=new ce(v,i),b.active=A.checked,be=b.load().catch(e=>console.error(e)),M.value=0,_(`#trackName`).textContent=i.name||e.name,Me(),q(),I(!1);let o=C===`empty`;return F(`ready`),t?Ce(i,a):we(i),o&&_(`#trackName`).focus(),!0},Ee=e=>H({url:URL.createObjectURL(e),name:e.name}),U=()=>!w&&(C===`empty`||C===`ready`),W=_(`#fileInput`);_(`#chooseFile`).addEventListener(`click`,()=>W.click()),W.addEventListener(`change`,()=>{let e=W.files[0];W.value=``,e&&U()&&Ee(e)}),_(`#trySample`).addEventListener(`click`,async()=>{U()&&await H(ye)&&Ie()});var De=_(`#dropzone`),Oe=_(`#dropOverlay`),ke=()=>{De.classList.remove(`over`),Oe.hidden=!0};document.addEventListener(`dragover`,e=>{e.preventDefault();let t=e.dataTransfer?.types.includes(`Files`)&&U();e.dataTransfer&&(e.dataTransfer.dropEffect=t?`copy`:`none`),De.classList.toggle(`over`,t&&C===`empty`),Oe.hidden=!(t&&C===`ready`)}),document.addEventListener(`dragleave`,e=>{e.relatedTarget||ke()}),document.addEventListener(`drop`,e=>{e.preventDefault(),ke();let t=e.dataTransfer?.files[0];t&&U()&&Ee(t)});var Ae=0,je=async()=>{let e=++Ae,[t,n]=f(T.orientation,T.quality),r=await se(`avc`,{width:t,height:n,bitrate:Math.round(ue*t*n*30)}).catch(()=>!1);e===Ae&&(E=r,_(`#noEncoder`).hidden=E,L())},Me=()=>{if(!y)return;let e=oe(y.duration,T.orientation,T.quality),t=de(y.duration,T.orientation,T.quality);_(`#summary`).textContent=`${u(y.duration)} video, ${me(t)}, ${d(e)} to render`},G=()=>{O.hint=h[S].hint};G(),O.addEventListener(`change`,()=>{S=O.value,G(),$(),H()});for(let[e,t]of Object.entries(k))t.value=T[e],t.addEventListener(`change`,()=>{T[e]=t.value,$(),Me(),je(),z()});A.addEventListener(`change`,()=>{b&&(b.active=A.checked),v.scene.requestRender()}),P.addEventListener(`click`,()=>W.click());var Ne=_(`#collapse`);Ne.addEventListener(`click`,()=>{let e=D.classList.toggle(`collapsed`),t=Ne.querySelector(`wa-icon`);t.name=e?`chevron-up`:`chevron-down`,t.label=e?`Show the settings`:`Hide the settings`,z()});var Pe=_(`#time`),K=!1,q=()=>{let e=y?.duration??0;Pe.textContent=`${u((y?.progress??0)*e)} / ${u(e)}`},Fe=e=>{let t=Math.round(e*1e3)/1e3;!K&&+M.value!==t&&(M.value=t),q()};M.addEventListener(`input`,()=>{K=!0,v.camera.cancelFlight(),y.progress=+M.value,q()}),M.addEventListener(`change`,()=>{K=!1});var Ie=async()=>{v.camera.cancelFlight(),F(`playing`),await y.play(),C===`playing`&&F(`ready`)};j.addEventListener(`click`,()=>C===`playing`?y.stop():Ie());var J,Le=async()=>{try{let e=await navigator.wakeLock?.request(`screen`);C===`rendering`?J=e:e?.release()}catch{}},Re=()=>{J?.release().catch(()=>{}),J=void 0};document.addEventListener(`visibilitychange`,()=>{C===`rendering`&&document.visibilityState===`visible`&&Le()});var Y,X,Z=_(`#renderProgress`),ze=_(`#renderEta`),Be=_(`#renderFrames`),Ve=()=>(y?.name||x.name).replace(/\.[^.]+$/,``).replace(/[^\p{L}\p{N}]+/gu,`-`).replace(/^-|-$/g,``)||`flyover`,He=async()=>{V();let[e,t]=f(T.orientation,T.quality);`Notification`in window&&Notification.permission==="default"&&Notification.requestPermission(),v.camera.cancelFlight(),F(`rendering`),_(`#stopRender`).focus(),Z.value=0,Z.textContent=`0%`,ze.textContent=`Starting`,Be.textContent=``;let n=document.title;Le(),Y=new AbortController;let r=new Promise(e=>Y.signal.addEventListener(`abort`,e,{once:!0})),i,a;try{await Promise.race([be,r]),Y.signal.aborted||(i=await he({viewer:v,flyover:y,captions:b,width:e,height:t,signal:Y.signal,onProgress:({frame:e,frames:t,perFrame:n})=>{let r=Math.floor(100*e/t);Z.value=r,Z.textContent=`${r}%`,document.title=le(r),e>=30&&(ze.textContent=`${d(n*(t-e))} left`),Be.textContent=`Frame ${e+1} of ${t}`}}))}catch(e){console.error(e),a=e}finally{Re(),document.title=n}if(!i){F(`ready`),a&&B(`The video could not be made: ${a.message}`),N.focus();return}X&&URL.revokeObjectURL(X.url);let o=`${Ve()}.mp4`;X={url:URL.createObjectURL(i),name:o,file:new File([i],o,{type:`video/mp4`})},_(`#resultVideo`).src=X.url,_(`#downloadLabel`).textContent=`Download video · ${(i.size/1e6).toFixed(1)} MB`,`Notification`in window&&Notification.permission===`granted`&&document.hidden&&new Notification(`Your flyover is ready`,{body:_(`#downloadLabel`).textContent});let s=navigator.canShare?.({files:[X.file]})??!1;_(`#share`).hidden=!s,_(`#download`).variant=s?`neutral`:`brand`,_(`#download`).appearance=s?`outlined`:`accent`,F(`done`),_(s?`#share`:`#download`).focus()},Q=0;function $(){Q=0,_(`#phoneWarning`).hidden=!0,_(`#createLabel`).textContent=`Create video`}N.addEventListener(`click`,()=>{if(matchMedia(`${g}, (pointer: coarse)`).matches){if(!Q){Q=performance.now(),_(`#phoneWarning`).hidden=!1,_(`#createLabel`).textContent=`Render anyway`;return}if(performance.now()-Q<600)return}$(),He()}),_(`#stopRender`).addEventListener(`click`,()=>Y.abort()),_(`#share`).addEventListener(`click`,async()=>{try{await navigator.share({files:[X.file],title:_(`#trackName`).textContent})}catch(e){e.name!==`AbortError`&&console.error(e)}}),_(`#download`).addEventListener(`click`,()=>{Object.assign(document.createElement(`a`),{href:X.url,download:X.name}).click()}),_(`#makeAnother`).addEventListener(`click`,()=>{_(`#resultVideo`).pause(),F(`ready`),N.focus()}),je(),F(`empty`);