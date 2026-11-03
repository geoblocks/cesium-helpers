import"./modulepreload-polyfill-P2Xu9kJm.js";import{t as e}from"./setup-COOW6wa2.js";import{f as t,p as n,t as r}from"./callout-T1BL3Pyb.js";import{i,n as a,r as o,t as ee}from"./jello-D-lU0Ys4.js";import{t as te}from"./motion-blur-DMXIRabv.js";/* empty css                   */import{a as s,c,i as l,n as u,o as d,r as f,s as p,t as m}from"./card-vYdPa2Ii.js";import"./option-DXr0-CFK.js";import"./slider-wyxrxnWj.js";import{n as h,t as g}from"./switch-DNqGrSbW.js";import"./button-BkCDB0Kx.js";import{a as _,u as v}from"./lit-D8AhzmO2.js";import"./details-HCN2I86B.js";import{c as y,d as b,i as x,o as S,s as C}from"./directive-helpers-BBsG2Hxb.js";import{t as w}from"./chunk.GWSUX3V5-BjpgD_qr.js";import"./chunk.JAAVYFGY-BzZoRSSO.js";import"./chunk.UEBQI7VV-BEgIlvmp.js";import"./icon-LzXTYuAm.js";var T=v`
  :host {
    display: inline-flex;
  }

  .button-group {
    display: flex;
    position: relative;
    isolation: isolate;
    flex-wrap: wrap;

    @media (hover: hover) {
      > :hover,
      &::slotted(:hover) {
        z-index: 1;
      }
    }

    /* Focus and checked are always on top */
    > :focus,
    &::slotted(:focus),
    > [aria-checked='true'],
    &::slotted([aria-checked='true']),
    > [checked],
    &::slotted([checked]) {
      z-index: 2 !important;
    }

    :host([orientation='horizontal']) & {
      flex-direction: row;
    }

    :host([orientation='vertical']) & {
      flex-direction: column;
    }
  }

  /* Set custom properties to be inherited by slotted buttons */
  :host([orientation='horizontal']) {
    --_button-horizontal-indent: var(--wa-form-control-border-width);
    --_button-horizontal-indent-outlined: calc(var(--wa-form-control-border-width) * -1);

    ::slotted(:first-child) {
      --_button-horizontal-indent: 0;
      --_button-horizontal-indent-outlined: 0;
    }
  }

  :host([orientation='vertical']) {
    --_button-vertical-indent: var(--wa-form-control-border-width);
    --_button-vertical-indent-outlined: calc(var(--wa-form-control-border-width) * -1);

    ::slotted(:first-child) {
      --_button-vertical-indent: 0;
      --_button-vertical-indent-outlined: 0;
    }
  }

  /* All buttons that are not in front or at the end get their border radius removed */
  ::slotted(:not(:first-child):not(:last-child)) {
    --_button-start-start-radius: 0;
    --_button-start-end-radius: 0;
    --_button-end-start-radius: 0;
    --_button-end-end-radius: 0;
  }

  /* Remove leading and trailing buttons border radius individually */
  :host([orientation='horizontal']) {
    ::slotted(:first-child:not(:last-child)) {
      --_button-start-end-radius: 0;
      --_button-end-end-radius: 0;
    }

    ::slotted(:last-child:not(:first-child)) {
      --_button-start-start-radius: 0;
      --_button-end-start-radius: 0;
    }
  }

  :host([orientation='vertical']) {
    ::slotted(:first-child:not(:last-child)) {
      --_button-end-start-radius: 0;
      --_button-end-end-radius: 0;
    }

    ::slotted(:last-child:not(:first-child)) {
      --_button-start-start-radius: 0;
      --_button-start-end-radius: 0;
    }
  }
`,E=class extends u{constructor(){super(...arguments),this.disableRole=!1,this.hasOutlined=!1,this.label=``,this.orientation=`horizontal`}updated(e){super.updated(e),e.has(`orientation`)&&this.setAttribute(`aria-orientation`,this.orientation)}handleFocus(e){D(e.target)?.classList.add(`button-focus`)}handleBlur(e){D(e.target)?.classList.remove(`button-focus`)}handleMouseOver(e){D(e.target)?.classList.add(`button-hover`)}handleMouseOut(e){D(e.target)?.classList.remove(`button-hover`)}render(){return _`
      <slot
        part="base"
        class="button-group"
        role="${this.disableRole?`presentation`:`group`}"
        aria-label=${this.label}
        aria-orientation=${this.orientation}
        @focusout=${this.handleBlur}
        @focusin=${this.handleFocus}
        @mouseover=${this.handleMouseOver}
        @mouseout=${this.handleMouseOut}
      ></slot>
    `}};E.css=[T],d([b(`slot`)],E.prototype,`defaultSlot`,2),d([f()],E.prototype,`disableRole`,2),d([f()],E.prototype,`hasOutlined`,2),d([l()],E.prototype,`label`,2),d([l({reflect:!0})],E.prototype,`orientation`,2),E=d([s(`wa-button-group`)],E);function D(e){let t=`wa-button, wa-radio-button`;return e.closest(t)??e.querySelector(t)}var O=v`
  :host {
    --gap: 0.5em;

    display: block;
  }

  :host([orientation='horizontal']) {
    --gap: 1em;
  }

  .form-control {
    position: relative;
    border: none;
    padding: 0;
    margin: 0;
  }

  .label {
    padding: 0;
  }

  .checkbox-group-required .label::after {
    content: var(--wa-form-control-required-content);
    margin-inline-start: var(--wa-form-control-required-content-offset);
  }

  /* The group of checkboxes */
  [part~='form-control-input'] {
    display: flex;
    flex-direction: column;
    /* Keep items sized to their content so the clickable label doesn't span the full width */
    align-items: start;
    gap: var(--gap);
    margin-block-start: 0.5em;
  }

  /* Horizontal */
  :host([orientation='horizontal']) [part~='form-control-input'] {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  /* Hint */
  [part~='hint'] {
    margin-block-start: 0.5em;
  }

  /* Hide the required asterisk on individual controls; the group's label carries the indicator instead. */
  ::slotted(wa-checkbox[required]),
  ::slotted(wa-switch[required]) {
    --wa-form-control-required-content: '';
  }
`,k=class extends u{constructor(){super(...arguments),this.hasSlotController=new c(this,`hint`,`label`),this.label=``,this.hint=``,this.orientation=`vertical`,this.required=!1,this.withLabel=!1,this.withHint=!1,this.syncCheckboxElements=()=>{if(this.size)for(let e of this.getAllCheckboxes())e.setAttribute(`size`,this.size)}}handleSizeChange(){C(this.localName,this.size)}updated(e){e.has(`size`)&&this.syncCheckboxElements()}getAllCheckboxes(){return[...this.querySelectorAll(`:is(wa-checkbox, wa-switch)`)]}render(){let e=this.hasSlotController.test(`label`,`withLabel`),t=this.hasSlotController.test(`hint`,`withHint`),n=this.label?!0:!!e,r=this.hint?!0:!!t;return _`
      <fieldset
        part="form-control"
        class=${m({"form-control":!0,"checkbox-group-required":this.required,"form-control-has-label":n})}
      >
        <label
          part="form-control-label"
          id="label"
          class=${m({label:!0,"has-label":n})}
          aria-hidden=${n?`false`:`true`}
        >
          <slot name="label">${this.label}</slot>
        </label>

        <div part="form-control-input" role="group" aria-labelledby="label" aria-describedby="hint">
          <slot @slotchange=${this.syncCheckboxElements}></slot>
        </div>

        <slot
          id="hint"
          name="hint"
          part="hint"
          class=${m({"has-slotted":r})}
          aria-hidden=${r?`false`:`true`}
          >${this.hint}</slot
        >
      </fieldset>
    `}};k.css=[p,h,O],d([l()],k.prototype,`label`,2),d([l({attribute:`hint`})],k.prototype,`hint`,2),d([l({reflect:!0})],k.prototype,`orientation`,2),d([l({reflect:!0})],k.prototype,`size`,2),d([S(`size`)],k.prototype,`handleSizeChange`,1),d([l({type:Boolean,reflect:!0})],k.prototype,`required`,2),d([l({type:Boolean,attribute:`with-label`})],k.prototype,`withLabel`,2),d([l({type:Boolean,attribute:`with-hint`})],k.prototype,`withHint`,2),k=d([s(`wa-checkbox-group`)],k),k.disableWarning?.(`change-in-update`);var A=v`
  :host {
    --checked-icon-color: var(--wa-color-brand-on-loud);
    --checked-icon-scale: 0.8;

    display: inline-flex;
    color: var(--wa-form-control-value-color);
    font-family: inherit;
    font-weight: var(--wa-form-control-value-font-weight);
    line-height: var(--wa-form-control-value-line-height);
    user-select: none;
    -webkit-user-select: none;
  }

  [part~='control'] {
    display: inline-flex;
    flex: 0 0 auto;
    position: relative;
    align-items: center;
    justify-content: center;
    width: var(--wa-form-control-toggle-size);
    height: var(--wa-form-control-toggle-size);
    border-color: var(--wa-form-control-border-color);
    border-radius: min(
      calc(var(--wa-form-control-toggle-size) * 0.375),
      var(--wa-border-radius-s)
    ); /* min prevents entirely circular checkbox */
    border-style: var(--wa-border-style);
    border-width: var(--wa-form-control-border-width);
    background-color: var(--wa-form-control-background-color);
    transition:
      background var(--wa-transition-normal),
      border-color var(--wa-transition-fast),
      box-shadow var(--wa-transition-fast),
      color var(--wa-transition-fast);
    transition-timing-function: var(--wa-transition-easing);

    margin-inline-end: 0.5em;
  }

  [part~='base'] {
    display: flex;
    align-items: flex-start;
    position: relative;
    color: currentColor;
    vertical-align: middle;
    cursor: pointer;
  }

  [part~='label'] {
    display: inline;
  }

  /* Checked */
  [part~='control']:has(:checked, :indeterminate) {
    color: var(--checked-icon-color);
    border-color: var(--wa-form-control-activated-color);
    background-color: var(--wa-form-control-activated-color);
  }

  /* Focus */
  [part~='control']:has(> input:focus-visible:not(:disabled)) {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Disabled */
  :host [part~='base']:has(input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  input {
    position: absolute;
    padding: 0;
    margin: 0;
    height: 100%;
    width: 100%;
    opacity: 0;
    pointer-events: none;
  }

  [part~='icon'] {
    display: flex;
    scale: var(--checked-icon-scale);

    /* Without this, Safari renders the icon slightly to the left */
    &::part(svg) {
      translate: 0.0009765625em;
    }

    input:not(:checked, :indeterminate) + & {
      visibility: hidden;
    }
  }

  :host([required]) [part~='label']::after {
    content: var(--wa-form-control-required-content);
    color: var(--wa-form-control-required-content-color);
    margin-inline-start: var(--wa-form-control-required-content-offset);
  }
`,j=class extends y{constructor(){super(...arguments),this.hasSlotController=new c(this,`hint`),this.title=``,this._value=this.getAttribute(`value`)??null,this.size=`m`,this.disabled=!1,this.indeterminate=!1,this._checked=null,this.defaultChecked=this.hasAttribute(`checked`),this.required=!1,this.hint=``}static get validators(){let e=[w({validationProperty:`checked`,validationElement:Object.assign(document.createElement(`input`),{type:`checkbox`,required:!0})})];return[...super.validators,...e]}get value(){return this._value??`on`}set value(e){this._value=e}handleSizeChange(){C(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.indeterminate=!1,this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})}connectedCallback(){super.connectedCallback(),this.didSSR&&!this.hasUpdated?this.updateComplete.then(()=>{this.handleDefaultCheckedChange()}):this.handleDefaultCheckedChange()}handleDefaultCheckedChange(){this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){this.didSSR&&!this.hasUpdated?this.updateComplete.then(()=>{this.handleValueOrCheckedChange()}):(this.setValue(this.checked?this.value:null,this._value),this.updateValidity())}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked,this.input.indeterminate=this.indeterminate),this.customStates.set(`checked`,this.checked),this.customStates.set(`indeterminate`,this.indeterminate),this.updateValidity()}handleDisabledChange(){this.customStates.set(`disabled`,this.disabled)}willUpdate(e){super.willUpdate(e),(e.has(`value`)||e.has(`checked`)||e.has(`defaultChecked`)||e.has(`disabled`))&&this.handleValueOrCheckedChange()}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}render(){let e=this.hasSlotController.test(`hint`),t=this.hint?!0:!!e,n=!this.checked&&this.indeterminate,r=n?`indeterminate`:`check`,i=n?`indeterminate`:`checked`,a=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,o=this.didSSR&&!this.hasUpdated?null:g(this.checked);return _`
      <label part="base checkbox">
        <span part="control">
          <input
            class="input"
            type="checkbox"
            title=${this.title}
            name=${x(this.name)}
            value=${x(this.value)}
            .indeterminate=${g(this.indeterminate)}
            .checked=${x(o)}
            ?checked=${a}
            ?disabled=${this.disabled}
            ?required=${this.required}
            aria-checked=${this.indeterminate?`mixed`:this.checked?`true`:`false`}
            aria-describedby="hint"
            @click=${this.handleClick}
          />

          <wa-icon part="${i}-icon icon" library="system" name=${r}></wa-icon>
        </span>

        <slot part="label"></slot>
      </label>

      <slot
        id="hint"
        part="hint"
        name="hint"
        aria-hidden=${t?`false`:`true`}
        class="${m({"has-slotted":t})}"
      >
        ${this.hint}
      </slot>
    `}};j.css=[h,p,A],j.shadowRootOptions={...y.shadowRootOptions,delegatesFocus:!0},d([b(`input[type="checkbox"]`)],j.prototype,`input`,2),d([l()],j.prototype,`title`,2),d([l({reflect:!0})],j.prototype,`value`,1),d([l({reflect:!0})],j.prototype,`size`,2),d([S(`size`)],j.prototype,`handleSizeChange`,1),d([l({type:Boolean})],j.prototype,`disabled`,2),d([l({type:Boolean,reflect:!0})],j.prototype,`indeterminate`,2),d([l({type:Boolean,attribute:!1})],j.prototype,`checked`,1),d([l({type:Boolean,reflect:!0,attribute:`checked`})],j.prototype,`defaultChecked`,2),d([l({type:Boolean,reflect:!0})],j.prototype,`required`,2),d([l()],j.prototype,`hint`,2),d([S([`checked`,`defaultChecked`])],j.prototype,`handleDefaultCheckedChange`,1),d([S([`checked`,`indeterminate`])],j.prototype,`handleStateChange`,1),d([S(`disabled`)],j.prototype,`handleDisabledChange`,1),j=d([s(`wa-checkbox`)],j),j.disableWarning?.(`change-in-update`);var M={"baulmes-valley":`tracks/Tour_Baulmes_valley.gpx`,"mont-de-baulmes":`tracks/Tour_du_Mont_de_Baulmes.gpx`,rechy:`tracks/Vallon_de_Rechy_gorge.gpx`,suchet:`tracks/Suchet.gpx`},ne={custom:null,default:[.5,.5],pilot:[0,0],spectator:[1,.8],drone:[.6,1]};e(`cesiumContainer`).then(async e=>{let s=document.querySelector(`#track`),c=(e,t)=>{for(let n of e.querySelectorAll(`wa-button`)){let e=n.dataset.value===t;n.variant=e?`brand`:`neutral`,n.appearance=e?`filled-outlined`:`outlined`,n.setAttribute(`aria-pressed`,String(e))}},l=document.querySelector(`#preset`),u=[...l.querySelectorAll(`wa-button`)],d=`default`,f=e=>{d=e,c(l,e)};f(d);let p=document.querySelector(`#style`),m=document.querySelector(`#motion`),h=document.querySelector(`#progress`),g=document.querySelector(`#play`),_=document.querySelector(`#playTip`),v=document.querySelector(`#time`),y=document.querySelector(`#stop`),b=document.querySelector(`#export`),x=document.querySelector(`#exportDialog`),S=document.querySelector(`#exportForm`),C=document.querySelector(`#exportSummary`),w=document.querySelector(`#exportIncluded`),T=document.querySelector(`#exportRunning`),E=document.querySelector(`#exportProgress`),D=document.querySelector(`#exportEta`),O=document.querySelector(`#exportDone`),k=document.querySelector(`#exportReady`),A=document.querySelector(`#exportError`),j=document.querySelector(`#exportErrorText`),re=document.querySelector(`#exportCancel`),ie=document.querySelector(`#exportStart`),ae=document.querySelector(`#exportSave`),oe=document.querySelector(`#controls`),N=document.querySelector(`#collapse`);N.addEventListener(`click`,()=>{let e=oe.classList.toggle(`collapsed`),t=N.querySelector(`wa-icon`);t.name=e?`chevron-down`:`chevron-up`,t.label=e?`Expand`:`Collapse`});let P=new te(e),F=document.querySelector(`#motionBlur`),se=[new ee(e,{amount:.02}),new a(e),new i(e),new o(e,{breakup:.15})],I=document.querySelector(`#drone`),L=e=>{for(let t of se)t.active=e};F.addEventListener(`change`,()=>{P.active=F.checked,F.checked&&I.checked&&(L(!1),L(!0))}),I.addEventListener(`change`,()=>L(I.checked));let R=document.querySelector(`#placeNames`),z,ce;R.addEventListener(`change`,()=>{z&&(z.active=R.checked),e.scene.requestRender()});let le=[s,...u,p,m],B=`loading`,V=t=>{B=t;for(let e of le)e.disabled=B!==`ready`&&B!==`failed`;h.disabled=B===`loading`||B===`failed`,y.disabled=!(B===`playing`||B===`ready`&&H.progress>0),g.loading=B===`loading`,g.disabled=B!==`ready`&&B!==`playing`;let n=g.querySelector(`wa-icon`);n.name=B===`playing`?`pause`:`play`,n.label=_.textContent=B===`playing`?`Pause`:`Play`,b.disabled=B!==`ready`;for(let e of[F,I,R])e.disabled=B===`exporting`;e.scene.globe.maximumScreenSpaceError=B===`playing`?3:2},H,U=!1,W=e=>`${Math.floor(e/60)}:${String(Math.floor(e%60)).padStart(2,`0`)}`,G=()=>{let e=H?.duration??0;v.textContent=`${W((H?.progress??0)*e)} / ${W(e)}`},K=document.createElement(`wa-option`);K.value=`dropped`;let ue=async e=>{M.dropped&&URL.revokeObjectURL(M.dropped),M.dropped=URL.createObjectURL(e),K.textContent=e.name,K.parentNode||(s.append(K),await s.updateComplete),s.value=`dropped`,Y(`dropped`)},q=document.querySelector(`#cesiumContainer`),J=document.querySelector(`#dropZone`),de=()=>B===`ready`||B===`failed`;q.addEventListener(`dragover`,e=>{e.preventDefault(),J.hidden=!(de()&&e.dataTransfer?.types.includes(`Files`))}),q.addEventListener(`dragleave`,e=>{q.contains(e.relatedTarget)||(J.hidden=!0)}),q.addEventListener(`drop`,e=>{e.preventDefault(),J.hidden=!0;let t=e.dataTransfer?.files[0];t&&de()&&ue(t)});let Y=async(r=s.value)=>{V(`loading`),H?.destroy(),z?.destroy(),z=void 0;let i=M[r];H=new n(e,{style:+p.value,motion:+m.value}),H.progressChanged.addEventListener(e=>{let t=Math.round(e*1e3)/1e3;!U&&+h.value!==t&&(h.value=t),G()});try{await H.load(i)}catch(e){console.error(e),V(`failed`);return}z=new t(e,H),z.active=R.checked,ce=z.load().catch(e=>console.error(e)),h.value=0,fe(H),G(),V(`ready`)},fe=t=>{let n=e.camera,r={destination:n.position.clone(),orientation:{direction:n.direction.clone(),up:n.up.clone()}};t.progress=0;let i={destination:n.position.clone(),orientation:{heading:n.heading,pitch:n.pitch,roll:0}};n.setView(r),n.flyTo({...i,duration:2})};s.addEventListener(`change`,()=>Y());for(let e of u)e.addEventListener(`click`,()=>{f(e.dataset.value),[p.value,m.value]=ne[d],Y()});for(let e of[p,m])e.addEventListener(`change`,()=>{f(`custom`),Y()});h.addEventListener(`input`,()=>{U=!0,H.progress=+h.value,G()}),h.addEventListener(`change`,()=>{U=!1,B===`ready`&&V(`ready`)}),y.addEventListener(`click`,()=>{H.stop(),H.progress=0,G(),V(`ready`)}),g.addEventListener(`click`,async()=>{B===`playing`?H.stop():(V(`playing`),await H.play(),V(`ready`))});let X={orientation:`portrait`,quality:`540`,fps:`30`};try{Object.assign(X,JSON.parse(localStorage.getItem(`flyover-video`)))}catch{}let pe={orientation:document.querySelector(`#videoOrientation`),quality:document.querySelector(`#videoQuality`),fps:document.querySelector(`#videoFps`)},me=()=>{let e=+X.quality,t=Math.round(e*16/9);return X.orientation===`portrait`?[e,t]:[t,e]},he=()=>{let[e,t]=me(),n=+X.fps;C.textContent=`${W(H.duration)} run · ${e} × ${t} · ${n} fps · ${Math.round(n*H.duration)} frames`;let r=[F.checked&&`motion blur`,I.checked&&`the FPV effect`].filter(Boolean);w.textContent=[R.checked?`Place names included.`:`No place names.`,r.length?`${r.join(` and `)} not exported.`.replace(/^./,e=>e.toUpperCase()):``].join(` `).trim()};for(let[e,t]of Object.entries(pe)){c(t,X[e]);for(let n of t.querySelectorAll(`wa-button`))n.addEventListener(`click`,()=>{X[e]=n.dataset.value,c(t,X[e]),he();try{localStorage.setItem(`flyover-video`,JSON.stringify(X))}catch{}})}let Z,Q=e=>{S.hidden=e!==`form`,T.hidden=e!==`running`,O.hidden=e!==`done`,ie.hidden=e!==`form`,ae.hidden=e!==`done`,re.textContent=e===`running`?`Stop export`:e===`done`?`Close`:`Cancel`,x.classList.toggle(`running`,e===`running`)},ge=e=>e<60?`about ${Math.max(5,Math.round(e/5)*5)} s left`:`about ${Math.round(e/60)} min left`,$;b.addEventListener(`click`,()=>{Z=void 0,A.hidden=!0,Q(`form`),he(),x.open=!0}),ie.addEventListener(`click`,async()=>{V(`exporting`),A.hidden=!0,E.value=0,E.textContent=`0%`,D.textContent=`Starting`,Q(`running`);let[t,n]=me(),i=+X.fps,a={blur:P.active,drone:I.checked};P.active=!1,L(!1),document.body.style.setProperty(`--video-width`,`${t}px`),document.body.style.setProperty(`--video-height`,`${n}px`),document.body.classList.add(`exporting`),$=new AbortController;try{await ce;let a=await r({viewer:e,flyover:H,captions:z,width:t,height:n,fps:i,signal:$.signal,onProgress:({frame:e,frames:t,perFrame:n})=>{let r=Math.floor(100*e/t);E.value=r,E.textContent=`${r}%`,D.textContent=`Frame ${e+1} of ${t}`+(e>=i?` · ${ge(n*(t-e))}`:``)}});a?(Z={blob:a,name:`${s.value}.mp4`},k.textContent=`Video ready · ${(a.size/1e6).toFixed(1)} MB`,Q(`done`)):Q(`form`)}catch(e){console.error(e),j.textContent=`The export failed: ${e.message}`,A.hidden=!1,Q(`form`)}finally{document.body.classList.remove(`exporting`),e.resize(),P.active=a.blur,L(a.drone),V(`ready`)}}),ae.addEventListener(`click`,()=>{let e=URL.createObjectURL(Z.blob);Object.assign(document.createElement(`a`),{href:e,download:Z.name}).click(),URL.revokeObjectURL(e)}),re.addEventListener(`click`,()=>{B===`exporting`?$.abort():x.open=!1}),x.addEventListener(`wa-hide`,e=>B===`exporting`&&e.preventDefault()),await Y()});