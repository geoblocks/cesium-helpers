import{a as e,u as t}from"./lit-BFn1CURT.js";/* empty css                   */import{a as n,c as r,i,n as a,o,r as s,s as c,t as l}from"./card-BcpQSzF3.js";import{c as u,d,i as f,o as p,s as m}from"./directive-helpers-B0KETb9i.js";import{t as h}from"./setup-DMh09s7J.js";import{n as g,t as _}from"./switch-PsQ7BZQb.js";import"./button-CI_sKcZA.js";import"./icon-BcbZVKyW.js";import{i as ee,n as te,r as ne,t as re}from"./details-QA_mTQXC.js";import{t as ie}from"./motion-blur-BTsEzwaP.js";import{f as ae,p as oe,t as se}from"./callout-CmuHSzdh.js";import{t as v}from"./chunk.GWSUX3V5-BJ2wQfMz.js";import"./slider-Cjeel3x6.js";var y=t`
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
`,b=class extends a{constructor(){super(...arguments),this.disableRole=!1,this.hasOutlined=!1,this.label=``,this.orientation=`horizontal`}updated(e){super.updated(e),e.has(`orientation`)&&this.setAttribute(`aria-orientation`,this.orientation)}handleFocus(e){x(e.target)?.classList.add(`button-focus`)}handleBlur(e){x(e.target)?.classList.remove(`button-focus`)}handleMouseOver(e){x(e.target)?.classList.add(`button-hover`)}handleMouseOut(e){x(e.target)?.classList.remove(`button-hover`)}render(){return e`
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
    `}};b.css=[y],o([d(`slot`)],b.prototype,`defaultSlot`,2),o([s()],b.prototype,`disableRole`,2),o([s()],b.prototype,`hasOutlined`,2),o([i()],b.prototype,`label`,2),o([i({reflect:!0})],b.prototype,`orientation`,2),b=o([n(`wa-button-group`)],b);function x(e){let t=`wa-button, wa-radio-button`;return e.closest(t)??e.querySelector(t)}var S=t`
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
`,C=class extends a{constructor(){super(...arguments),this.hasSlotController=new r(this,`hint`,`label`),this.label=``,this.hint=``,this.orientation=`vertical`,this.required=!1,this.withLabel=!1,this.withHint=!1,this.syncCheckboxElements=()=>{if(this.size)for(let e of this.getAllCheckboxes())e.setAttribute(`size`,this.size)}}handleSizeChange(){m(this.localName,this.size)}updated(e){e.has(`size`)&&this.syncCheckboxElements()}getAllCheckboxes(){return[...this.querySelectorAll(`:is(wa-checkbox, wa-switch)`)]}render(){let t=this.hasSlotController.test(`label`,`withLabel`),n=this.hasSlotController.test(`hint`,`withHint`),r=this.label?!0:!!t,i=this.hint?!0:!!n;return e`
      <fieldset
        part="form-control"
        class=${l({"form-control":!0,"checkbox-group-required":this.required,"form-control-has-label":r})}
      >
        <label
          part="form-control-label"
          id="label"
          class=${l({label:!0,"has-label":r})}
          aria-hidden=${r?`false`:`true`}
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
          class=${l({"has-slotted":i})}
          aria-hidden=${i?`false`:`true`}
          >${this.hint}</slot
        >
      </fieldset>
    `}};C.css=[c,g,S],o([i()],C.prototype,`label`,2),o([i({attribute:`hint`})],C.prototype,`hint`,2),o([i({reflect:!0})],C.prototype,`orientation`,2),o([i({reflect:!0})],C.prototype,`size`,2),o([p(`size`)],C.prototype,`handleSizeChange`,1),o([i({type:Boolean,reflect:!0})],C.prototype,`required`,2),o([i({type:Boolean,attribute:`with-label`})],C.prototype,`withLabel`,2),o([i({type:Boolean,attribute:`with-hint`})],C.prototype,`withHint`,2),C=o([n(`wa-checkbox-group`)],C),C.disableWarning?.(`change-in-update`);var w=t`
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
`,T=class extends u{constructor(){super(...arguments),this.hasSlotController=new r(this,`hint`),this.title=``,this._value=this.getAttribute(`value`)??null,this.size=`m`,this.disabled=!1,this.indeterminate=!1,this._checked=null,this.defaultChecked=this.hasAttribute(`checked`),this.required=!1,this.hint=``}static get validators(){let e=[v({validationProperty:`checked`,validationElement:Object.assign(document.createElement(`input`),{type:`checkbox`,required:!0})})];return[...super.validators,...e]}get value(){return this._value??`on`}set value(e){this._value=e}handleSizeChange(){m(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.indeterminate=!1,this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})}connectedCallback(){if(super.connectedCallback(),this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleDefaultCheckedChange()});return}this.handleDefaultCheckedChange()}handleDefaultCheckedChange(){this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){if(this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleValueOrCheckedChange()});return}this.setValue(this.checked?this.value:null,this._value),this.updateValidity()}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked,this.input.indeterminate=this.indeterminate),this.customStates.set(`checked`,this.checked),this.customStates.set(`indeterminate`,this.indeterminate),this.updateValidity()}handleDisabledChange(){this.customStates.set(`disabled`,this.disabled)}willUpdate(e){super.willUpdate(e),(e.has(`value`)||e.has(`checked`)||e.has(`defaultChecked`)||e.has(`disabled`))&&this.handleValueOrCheckedChange()}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}render(){let t=this.hasSlotController.test(`hint`),n=this.hint?!0:!!t,r=!this.checked&&this.indeterminate,i=r?`indeterminate`:`check`,a=r?`indeterminate`:`checked`,o=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,s=this.didSSR&&!this.hasUpdated?null:_(this.checked);return e`
      <label part="base checkbox">
        <span part="control">
          <input
            class="input"
            type="checkbox"
            title=${this.title}
            name=${f(this.name)}
            value=${f(this.value)}
            .indeterminate=${_(this.indeterminate)}
            .checked=${f(s)}
            ?checked=${o}
            ?disabled=${this.disabled}
            ?required=${this.required}
            aria-checked=${this.indeterminate?`mixed`:this.checked?`true`:`false`}
            aria-describedby="hint"
            @click=${this.handleClick}
          />

          <wa-icon part="${a}-icon icon" library="system" name=${i}></wa-icon>
        </span>

        <slot part="label"></slot>
      </label>

      <slot
        id="hint"
        part="hint"
        name="hint"
        aria-hidden=${n?`false`:`true`}
        class="${l({"has-slotted":n})}"
      >
        ${this.hint}
      </slot>
    `}};T.css=[g,c,w],T.shadowRootOptions={...u.shadowRootOptions,delegatesFocus:!0},o([d(`input[type="checkbox"]`)],T.prototype,`input`,2),o([i()],T.prototype,`title`,2),o([i({reflect:!0})],T.prototype,`value`,1),o([i({reflect:!0})],T.prototype,`size`,2),o([p(`size`)],T.prototype,`handleSizeChange`,1),o([i({type:Boolean})],T.prototype,`disabled`,2),o([i({type:Boolean,reflect:!0})],T.prototype,`indeterminate`,2),o([i({type:Boolean,attribute:!1})],T.prototype,`checked`,1),o([i({type:Boolean,reflect:!0,attribute:`checked`})],T.prototype,`defaultChecked`,2),o([i({type:Boolean,reflect:!0})],T.prototype,`required`,2),o([i()],T.prototype,`hint`,2),o([p([`checked`,`defaultChecked`])],T.prototype,`handleDefaultCheckedChange`,1),o([p([`checked`,`indeterminate`])],T.prototype,`handleStateChange`,1),o([p(`disabled`)],T.prototype,`handleDisabledChange`,1),T=o([n(`wa-checkbox`)],T),T.disableWarning?.(`change-in-update`);var E={"baulmes-valley":`tracks/Tour_Baulmes_valley.gpx`,"mont-de-baulmes":`tracks/Tour_du_Mont_de_Baulmes.gpx`,rechy:`tracks/Vallon_de_Rechy_gorge.gpx`,suchet:`tracks/Suchet.gpx`},ce={custom:null,default:[.5,.5],pilot:[0,0],spectator:[1,.8],drone:[.6,1]};h(`cesiumContainer`).then(async e=>{let t=document.querySelector(`#track`),n=(e,t)=>{for(let n of e.querySelectorAll(`wa-button`)){let e=n.dataset.value===t;n.variant=e?`brand`:`neutral`,n.appearance=e?`filled-outlined`:`outlined`,n.setAttribute(`aria-pressed`,String(e))}},r=document.querySelector(`#preset`),i=[...r.querySelectorAll(`wa-button`)],a=`default`,o=e=>{a=e,n(r,e)};o(a);let s=document.querySelector(`#style`),c=document.querySelector(`#motion`),l=document.querySelector(`#progress`),u=document.querySelector(`#play`),d=document.querySelector(`#playTip`),f=document.querySelector(`#time`),p=document.querySelector(`#stop`),m=document.querySelector(`#export`),h=document.querySelector(`#exportDialog`),g=document.querySelector(`#exportForm`),_=document.querySelector(`#exportSummary`),v=document.querySelector(`#exportIncluded`),y=document.querySelector(`#exportRunning`),b=document.querySelector(`#exportProgress`),x=document.querySelector(`#exportEta`),S=document.querySelector(`#exportDone`),C=document.querySelector(`#exportReady`),w=document.querySelector(`#exportError`),T=document.querySelector(`#exportErrorText`),D=document.querySelector(`#exportCancel`),O=document.querySelector(`#exportStart`),k=document.querySelector(`#exportSave`),le=document.querySelector(`#controls`),A=document.querySelector(`#collapse`);A.addEventListener(`click`,()=>{let e=le.classList.toggle(`collapsed`),t=A.querySelector(`wa-icon`);t.name=e?`chevron-down`:`chevron-up`,t.label=e?`Expand`:`Collapse`});let j=new ie(e),M=document.querySelector(`#motionBlur`),ue=[new re(e,{amount:.02}),new te(e),new ee(e),new ne(e,{breakup:.15})],N=document.querySelector(`#drone`),P=e=>{for(let t of ue)t.active=e};M.addEventListener(`change`,()=>{j.active=M.checked,M.checked&&N.checked&&(P(!1),P(!0))}),N.addEventListener(`change`,()=>P(N.checked));let F=document.querySelector(`#placeNames`),I,L;F.addEventListener(`change`,()=>{I&&(I.active=F.checked),e.scene.requestRender()});let de=[t,...i,s,c],R=`loading`,z=t=>{R=t;for(let e of de)e.disabled=R!==`ready`&&R!==`failed`;l.disabled=R===`loading`||R===`failed`,p.disabled=!(R===`playing`||R===`ready`&&B.progress>0),u.loading=R===`loading`,u.disabled=R!==`ready`&&R!==`playing`;let n=u.querySelector(`wa-icon`);n.name=R===`playing`?`pause`:`play`,n.label=d.textContent=R===`playing`?`Pause`:`Play`,m.disabled=R!==`ready`;for(let e of[M,N,F])e.disabled=R===`exporting`;e.scene.globe.maximumScreenSpaceError=R===`playing`?3:2},B,V=!1,H=e=>`${Math.floor(e/60)}:${String(Math.floor(e%60)).padStart(2,`0`)}`,U=()=>{let e=B?.duration??0;f.textContent=`${H((B?.progress??0)*e)} / ${H(e)}`},W=document.createElement(`wa-option`);W.value=`dropped`;let fe=async e=>{E.dropped&&URL.revokeObjectURL(E.dropped),E.dropped=URL.createObjectURL(e),W.textContent=e.name,W.parentNode||(t.append(W),await t.updateComplete),t.value=`dropped`,J(`dropped`)},G=document.querySelector(`#cesiumContainer`),K=document.querySelector(`#dropZone`),q=()=>R===`ready`||R===`failed`;G.addEventListener(`dragover`,e=>{e.preventDefault(),K.hidden=!(q()&&e.dataTransfer?.types.includes(`Files`))}),G.addEventListener(`dragleave`,e=>{G.contains(e.relatedTarget)||(K.hidden=!0)}),G.addEventListener(`drop`,e=>{e.preventDefault(),K.hidden=!0;let t=e.dataTransfer?.files[0];t&&q()&&fe(t)});let J=async(n=t.value)=>{z(`loading`),B?.destroy(),I?.destroy(),I=void 0;let r=E[n];B=new oe(e,{style:+s.value,motion:+c.value}),B.progressChanged.addEventListener(e=>{let t=Math.round(e*1e3)/1e3;!V&&+l.value!==t&&(l.value=t),U()});try{await B.load(r)}catch(e){console.error(e),z(`failed`);return}I=new ae(e,B),I.active=F.checked,L=I.load().catch(e=>console.error(e)),l.value=0,pe(B),U(),z(`ready`)},pe=t=>{let n=e.camera,r={destination:n.position.clone(),orientation:{direction:n.direction.clone(),up:n.up.clone()}};t.progress=0;let i={destination:n.position.clone(),orientation:{heading:n.heading,pitch:n.pitch,roll:0}};n.setView(r),n.flyTo({...i,duration:2})};t.addEventListener(`change`,()=>J());for(let e of i)e.addEventListener(`click`,()=>{o(e.dataset.value),[s.value,c.value]=ce[a],J()});for(let e of[s,c])e.addEventListener(`change`,()=>{o(`custom`),J()});l.addEventListener(`input`,()=>{V=!0,B.progress=+l.value,U()}),l.addEventListener(`change`,()=>{V=!1,R===`ready`&&z(`ready`)}),p.addEventListener(`click`,()=>{B.stop(),B.progress=0,U(),z(`ready`)}),u.addEventListener(`click`,async()=>{if(R===`playing`){B.stop();return}z(`playing`),await B.play(),z(`ready`)});let Y={orientation:`portrait`,quality:`540`,fps:`30`};try{Object.assign(Y,JSON.parse(localStorage.getItem(`flyover-video`)))}catch{}let me={orientation:document.querySelector(`#videoOrientation`),quality:document.querySelector(`#videoQuality`),fps:document.querySelector(`#videoFps`)},X=()=>{let e=+Y.quality,t=Math.round(e*16/9);return Y.orientation===`portrait`?[e,t]:[t,e]},he=()=>{let[e,t]=X(),n=+Y.fps;_.textContent=`${H(B.duration)} run · ${e} × ${t} · ${n} fps · ${Math.round(n*B.duration)} frames`;let r=[M.checked&&`motion blur`,N.checked&&`the FPV effect`].filter(Boolean);v.textContent=[F.checked?`Place names included.`:`No place names.`,r.length?`${r.join(` and `)} not exported.`.replace(/^./,e=>e.toUpperCase()):``].join(` `).trim()};for(let[e,t]of Object.entries(me)){n(t,Y[e]);for(let r of t.querySelectorAll(`wa-button`))r.addEventListener(`click`,()=>{Y[e]=r.dataset.value,n(t,Y[e]),he();try{localStorage.setItem(`flyover-video`,JSON.stringify(Y))}catch{}})}let Z,Q=e=>{g.hidden=e!==`form`,y.hidden=e!==`running`,S.hidden=e!==`done`,O.hidden=e!==`form`,k.hidden=e!==`done`,D.textContent=e===`running`?`Stop export`:e===`done`?`Close`:`Cancel`,h.classList.toggle(`running`,e===`running`)},ge=e=>e<60?`about ${Math.max(5,Math.round(e/5)*5)} s left`:`about ${Math.round(e/60)} min left`,$;m.addEventListener(`click`,()=>{Z=void 0,w.hidden=!0,Q(`form`),he(),h.open=!0}),O.addEventListener(`click`,async()=>{z(`exporting`),w.hidden=!0,b.value=0,b.textContent=`0%`,x.textContent=`Starting`,Q(`running`);let[n,r]=X(),i=+Y.fps,a={blur:j.active,drone:N.checked};j.active=!1,P(!1),document.body.style.setProperty(`--video-width`,`${n}px`),document.body.style.setProperty(`--video-height`,`${r}px`),document.body.classList.add(`exporting`),$=new AbortController;try{await L;let a=await se({viewer:e,flyover:B,captions:I,width:n,height:r,fps:i,signal:$.signal,onProgress:({frame:e,frames:t,perFrame:n})=>{let r=Math.floor(100*e/t);b.value=r,b.textContent=`${r}%`,x.textContent=`Frame ${e+1} of ${t}`+(e>=i?` · ${ge(n*(t-e))}`:``)}});a?(Z={blob:a,name:`${t.value}.mp4`},C.textContent=`Video ready · ${(a.size/1e6).toFixed(1)} MB`,Q(`done`)):Q(`form`)}catch(e){console.error(e),T.textContent=`The export failed: ${e.message}`,w.hidden=!1,Q(`form`)}finally{document.body.classList.remove(`exporting`),e.resize(),j.active=a.blur,P(a.drone),z(`ready`)}}),k.addEventListener(`click`,()=>{let e=URL.createObjectURL(Z.blob);Object.assign(document.createElement(`a`),{href:e,download:Z.name}).click(),URL.revokeObjectURL(e)}),D.addEventListener(`click`,()=>{R===`exporting`?$.abort():h.open=!1}),h.addEventListener(`wa-hide`,e=>R===`exporting`&&e.preventDefault()),await J()});