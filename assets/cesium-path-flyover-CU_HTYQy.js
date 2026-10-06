import{f as e,p as t,t as n}from"./callout-BTSI9WJP.js";import{a as r,u as i}from"./lit-BFn1CURT.js";/* empty css                   */import{a,c as o,i as s,n as c,o as l,r as u,s as d,t as f}from"./card-BcpQSzF3.js";import{c as p,d as m,i as h,o as g,s as _}from"./directive-helpers-B0KETb9i.js";import{t as v}from"./setup-DMh09s7J.js";import{n as y,t as b}from"./switch-PsQ7BZQb.js";import"./button-CI_sKcZA.js";import"./icon-BcbZVKyW.js";import{t as ee}from"./motion-blur-H9Tf_aeZ.js";import{i as te,n as ne,r as re,t as ie}from"./details-DWYmLCUG.js";import{n as x}from"./slider-sLn6HB47.js";var S=i`
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
`,C=class extends c{constructor(){super(...arguments),this.disableRole=!1,this.hasOutlined=!1,this.label=``,this.orientation=`horizontal`}updated(e){super.updated(e),e.has(`orientation`)&&this.setAttribute(`aria-orientation`,this.orientation)}handleFocus(e){w(e.target)?.classList.add(`button-focus`)}handleBlur(e){w(e.target)?.classList.remove(`button-focus`)}handleMouseOver(e){w(e.target)?.classList.add(`button-hover`)}handleMouseOut(e){w(e.target)?.classList.remove(`button-hover`)}render(){return r`
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
    `}};C.css=[S],l([m(`slot`)],C.prototype,`defaultSlot`,2),l([u()],C.prototype,`disableRole`,2),l([u()],C.prototype,`hasOutlined`,2),l([s()],C.prototype,`label`,2),l([s({reflect:!0})],C.prototype,`orientation`,2),C=l([a(`wa-button-group`)],C);function w(e){let t=`wa-button, wa-radio-button`;return e.closest(t)??e.querySelector(t)}var ae=i`
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
`,T=class extends c{constructor(){super(...arguments),this.hasSlotController=new o(this,`hint`,`label`),this.label=``,this.hint=``,this.orientation=`vertical`,this.required=!1,this.withLabel=!1,this.withHint=!1,this.syncCheckboxElements=()=>{if(this.size)for(let e of this.getAllCheckboxes())e.setAttribute(`size`,this.size)}}handleSizeChange(){_(this.localName,this.size)}updated(e){e.has(`size`)&&this.syncCheckboxElements()}getAllCheckboxes(){return[...this.querySelectorAll(`:is(wa-checkbox, wa-switch)`)]}render(){let e=this.hasSlotController.test(`label`,`withLabel`),t=this.hasSlotController.test(`hint`,`withHint`),n=this.label?!0:!!e,i=this.hint?!0:!!t;return r`
      <fieldset
        part="form-control"
        class=${f({"form-control":!0,"checkbox-group-required":this.required,"form-control-has-label":n})}
      >
        <label
          part="form-control-label"
          id="label"
          class=${f({label:!0,"has-label":n})}
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
          class=${f({"has-slotted":i})}
          aria-hidden=${i?`false`:`true`}
          >${this.hint}</slot
        >
      </fieldset>
    `}};T.css=[d,y,ae],l([s()],T.prototype,`label`,2),l([s({attribute:`hint`})],T.prototype,`hint`,2),l([s({reflect:!0})],T.prototype,`orientation`,2),l([s({reflect:!0})],T.prototype,`size`,2),l([g(`size`)],T.prototype,`handleSizeChange`,1),l([s({type:Boolean,reflect:!0})],T.prototype,`required`,2),l([s({type:Boolean,attribute:`with-label`})],T.prototype,`withLabel`,2),l([s({type:Boolean,attribute:`with-hint`})],T.prototype,`withHint`,2),T=l([a(`wa-checkbox-group`)],T),T.disableWarning?.(`change-in-update`);var E=i`
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
`,D=class extends p{constructor(){super(...arguments),this.hasSlotController=new o(this,`hint`),this.title=``,this._value=this.getAttribute(`value`)??null,this.size=`m`,this.disabled=!1,this.indeterminate=!1,this._checked=null,this.defaultChecked=this.hasAttribute(`checked`),this.required=!1,this.hint=``}static get validators(){let e=[x({validationProperty:`checked`,validationElement:Object.assign(document.createElement(`input`),{type:`checkbox`,required:!0})})];return[...super.validators,...e]}get value(){return this._value??`on`}set value(e){this._value=e}handleSizeChange(){_(this.localName,this.size)}get checked(){return this.valueHasChanged?!!this._checked:this._checked??this.defaultChecked}set checked(e){this._checked=!!e,this.valueHasChanged=!0}handleClick(){this.hasInteracted=!0,this.checked=!this.checked,this.indeterminate=!1,this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))})}connectedCallback(){if(super.connectedCallback(),this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleDefaultCheckedChange()});return}this.handleDefaultCheckedChange()}handleDefaultCheckedChange(){this.handleValueOrCheckedChange()}handleValueOrCheckedChange(){if(this.didSSR&&!this.hasUpdated){this.updateComplete.then(()=>{this.handleValueOrCheckedChange()});return}this.setValue(this.checked?this.value:null,this._value),this.updateValidity()}handleStateChange(){this.hasUpdated&&(this.input.checked=this.checked,this.input.indeterminate=this.indeterminate),this.customStates.set(`checked`,this.checked),this.customStates.set(`indeterminate`,this.indeterminate),this.updateValidity()}handleDisabledChange(){this.customStates.set(`disabled`,this.disabled)}willUpdate(e){super.willUpdate(e),(e.has(`value`)||e.has(`checked`)||e.has(`defaultChecked`)||e.has(`disabled`))&&this.handleValueOrCheckedChange()}formResetCallback(){this._checked=null,super.formResetCallback(),this.handleValueOrCheckedChange()}click(){this.input.click()}focus(e){this.input.focus(e)}blur(){this.input.blur()}render(){let e=this.hasSlotController.test(`hint`),t=this.hint?!0:!!e,n=!this.checked&&this.indeterminate,i=n?`indeterminate`:`check`,a=n?`indeterminate`:`checked`,o=this.didSSR&&!this.hasUpdated?this.checked:this.defaultChecked,s=this.didSSR&&!this.hasUpdated?null:b(this.checked);return r`
      <label part="base checkbox">
        <span part="control">
          <input
            class="input"
            type="checkbox"
            title=${this.title}
            name=${h(this.name)}
            value=${h(this.value)}
            .indeterminate=${b(this.indeterminate)}
            .checked=${h(s)}
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
        aria-hidden=${t?`false`:`true`}
        class="${f({"has-slotted":t})}"
      >
        ${this.hint}
      </slot>
    `}};D.css=[y,d,E],D.shadowRootOptions={...p.shadowRootOptions,delegatesFocus:!0},l([m(`input[type="checkbox"]`)],D.prototype,`input`,2),l([s()],D.prototype,`title`,2),l([s({reflect:!0})],D.prototype,`value`,1),l([s({reflect:!0})],D.prototype,`size`,2),l([g(`size`)],D.prototype,`handleSizeChange`,1),l([s({type:Boolean})],D.prototype,`disabled`,2),l([s({type:Boolean,reflect:!0})],D.prototype,`indeterminate`,2),l([s({type:Boolean,attribute:!1})],D.prototype,`checked`,1),l([s({type:Boolean,reflect:!0,attribute:`checked`})],D.prototype,`defaultChecked`,2),l([s({type:Boolean,reflect:!0})],D.prototype,`required`,2),l([s()],D.prototype,`hint`,2),l([g([`checked`,`defaultChecked`])],D.prototype,`handleDefaultCheckedChange`,1),l([g([`checked`,`indeterminate`])],D.prototype,`handleStateChange`,1),l([g(`disabled`)],D.prototype,`handleDisabledChange`,1),D=l([a(`wa-checkbox`)],D),D.disableWarning?.(`change-in-update`);var O={"baulmes-valley":`tracks/Tour_Baulmes_valley.gpx`,"mont-de-baulmes":`tracks/Tour_du_Mont_de_Baulmes.gpx`,rechy:`tracks/Vallon_de_Rechy_gorge.gpx`,suchet:`tracks/Suchet.gpx`},oe={custom:null,default:[.5,.5],pilot:[0,0],spectator:[1,.8],drone:[.6,1]};v(`cesiumContainer`).then(async r=>{let i=document.querySelector(`#track`),a=(e,t)=>{for(let n of e.querySelectorAll(`wa-button`)){let e=n.dataset.value===t;n.variant=e?`brand`:`neutral`,n.appearance=e?`filled-outlined`:`outlined`,n.setAttribute(`aria-pressed`,String(e))}},o=document.querySelector(`#preset`),s=[...o.querySelectorAll(`wa-button`)],c=`default`,l=e=>{c=e,a(o,e)};l(c);let u=document.querySelector(`#style`),d=document.querySelector(`#motion`),f=document.querySelector(`#progress`),p=document.querySelector(`#play`),m=document.querySelector(`#playTip`),h=document.querySelector(`#time`),g=document.querySelector(`#stop`),_=document.querySelector(`#export`),v=document.querySelector(`#exportDialog`),y=document.querySelector(`#exportForm`),b=document.querySelector(`#exportSummary`),x=document.querySelector(`#exportIncluded`),S=document.querySelector(`#exportRunning`),C=document.querySelector(`#exportProgress`),w=document.querySelector(`#exportEta`),ae=document.querySelector(`#exportDone`),T=document.querySelector(`#exportReady`),E=document.querySelector(`#exportError`),D=document.querySelector(`#exportErrorText`),se=document.querySelector(`#exportCancel`),k=document.querySelector(`#exportStart`),A=document.querySelector(`#exportSave`),ce=document.querySelector(`#controls`),j=document.querySelector(`#collapse`);j.addEventListener(`click`,()=>{let e=ce.classList.toggle(`collapsed`),t=j.querySelector(`wa-icon`);t.name=e?`chevron-down`:`chevron-up`,t.label=e?`Expand`:`Collapse`});let M=new ee(r),N=document.querySelector(`#motionBlur`),le=[new ie(r,{amount:.02}),new ne(r),new te(r),new re(r,{breakup:.15})],P=document.querySelector(`#drone`),F=e=>{for(let t of le)t.active=e};N.addEventListener(`change`,()=>{M.active=N.checked,N.checked&&P.checked&&(F(!1),F(!0))}),P.addEventListener(`change`,()=>F(P.checked));let I=document.querySelector(`#placeNames`),L,R;I.addEventListener(`change`,()=>{L&&(L.active=I.checked),r.scene.requestRender()});let ue=[i,...s,u,d],z=`loading`,B=e=>{z=e;for(let e of ue)e.disabled=z!==`ready`&&z!==`failed`;f.disabled=z===`loading`||z===`failed`,g.disabled=!(z===`playing`||z===`ready`&&V.progress>0),p.loading=z===`loading`,p.disabled=z!==`ready`&&z!==`playing`;let t=p.querySelector(`wa-icon`);t.name=z===`playing`?`pause`:`play`,t.label=m.textContent=z===`playing`?`Pause`:`Play`,_.disabled=z!==`ready`;for(let e of[N,P,I])e.disabled=z===`exporting`;r.scene.globe.maximumScreenSpaceError=z===`playing`?3:2},V,H=!1,U=e=>`${Math.floor(e/60)}:${String(Math.floor(e%60)).padStart(2,`0`)}`,W=()=>{let e=V?.duration??0;h.textContent=`${U((V?.progress??0)*e)} / ${U(e)}`},G=document.createElement(`wa-option`);G.value=`dropped`;let de=async e=>{O.dropped&&URL.revokeObjectURL(O.dropped),O.dropped=URL.createObjectURL(e),G.textContent=e.name,G.parentNode||(i.append(G),await i.updateComplete),i.value=`dropped`,Y(`dropped`)},K=document.querySelector(`#cesiumContainer`),q=document.querySelector(`#dropZone`),J=()=>z===`ready`||z===`failed`;K.addEventListener(`dragover`,e=>{e.preventDefault(),q.hidden=!(J()&&e.dataTransfer?.types.includes(`Files`))}),K.addEventListener(`dragleave`,e=>{K.contains(e.relatedTarget)||(q.hidden=!0)}),K.addEventListener(`drop`,e=>{e.preventDefault(),q.hidden=!0;let t=e.dataTransfer?.files[0];t&&J()&&de(t)});let Y=async(n=i.value)=>{B(`loading`),V?.destroy(),L?.destroy(),L=void 0;let a=O[n];V=new t(r,{style:+u.value,motion:+d.value}),V.progressChanged.addEventListener(e=>{let t=Math.round(e*1e3)/1e3;!H&&+f.value!==t&&(f.value=t),W()});try{await V.load(a)}catch(e){console.error(e),B(`failed`);return}L=new e(r,V),L.active=I.checked,R=L.load().catch(e=>console.error(e)),f.value=0,fe(V),W(),B(`ready`)},fe=e=>{let t=r.camera,n={destination:t.position.clone(),orientation:{direction:t.direction.clone(),up:t.up.clone()}};e.progress=0;let i={destination:t.position.clone(),orientation:{heading:t.heading,pitch:t.pitch,roll:0}};t.setView(n),t.flyTo({...i,duration:2})};i.addEventListener(`change`,()=>Y());for(let e of s)e.addEventListener(`click`,()=>{l(e.dataset.value),[u.value,d.value]=oe[c],Y()});for(let e of[u,d])e.addEventListener(`change`,()=>{l(`custom`),Y()});f.addEventListener(`input`,()=>{H=!0,V.progress=+f.value,W()}),f.addEventListener(`change`,()=>{H=!1,z===`ready`&&B(`ready`)}),g.addEventListener(`click`,()=>{V.stop(),V.progress=0,W(),B(`ready`)}),p.addEventListener(`click`,async()=>{if(z===`playing`){V.stop();return}B(`playing`),await V.play(),B(`ready`)});let X={orientation:`portrait`,quality:`540`,fps:`30`};try{Object.assign(X,JSON.parse(localStorage.getItem(`flyover-video`)))}catch{}let pe={orientation:document.querySelector(`#videoOrientation`),quality:document.querySelector(`#videoQuality`),fps:document.querySelector(`#videoFps`)},me=()=>{let e=+X.quality,t=Math.round(e*16/9);return X.orientation===`portrait`?[e,t]:[t,e]},he=()=>{let[e,t]=me(),n=+X.fps;b.textContent=`${U(V.duration)} run · ${e} × ${t} · ${n} fps · ${Math.round(n*V.duration)} frames`;let r=[N.checked&&`motion blur`,P.checked&&`the FPV effect`].filter(Boolean);x.textContent=[I.checked?`Place names included.`:`No place names.`,r.length?`${r.join(` and `)} not exported.`.replace(/^./,e=>e.toUpperCase()):``].join(` `).trim()};for(let[e,t]of Object.entries(pe)){a(t,X[e]);for(let n of t.querySelectorAll(`wa-button`))n.addEventListener(`click`,()=>{X[e]=n.dataset.value,a(t,X[e]),he();try{localStorage.setItem(`flyover-video`,JSON.stringify(X))}catch{}})}let Z,Q=e=>{y.hidden=e!==`form`,S.hidden=e!==`running`,ae.hidden=e!==`done`,k.hidden=e!==`form`,A.hidden=e!==`done`,se.textContent=e===`running`?`Stop export`:e===`done`?`Close`:`Cancel`,v.classList.toggle(`running`,e===`running`)},ge=e=>e<60?`about ${Math.max(5,Math.round(e/5)*5)} s left`:`about ${Math.round(e/60)} min left`,$;_.addEventListener(`click`,()=>{Z=void 0,E.hidden=!0,Q(`form`),he(),v.open=!0}),k.addEventListener(`click`,async()=>{B(`exporting`),E.hidden=!0,C.value=0,C.textContent=`0%`,w.textContent=`Starting`,Q(`running`);let[e,t]=me(),a=+X.fps,o={blur:M.active,drone:P.checked};M.active=!1,F(!1),document.body.style.setProperty(`--video-width`,`${e}px`),document.body.style.setProperty(`--video-height`,`${t}px`),document.body.classList.add(`exporting`),$=new AbortController;try{await R;let o=await n({viewer:r,flyover:V,captions:L,width:e,height:t,fps:a,signal:$.signal,onProgress:({frame:e,frames:t,perFrame:n})=>{let r=Math.floor(100*e/t);C.value=r,C.textContent=`${r}%`,w.textContent=`Frame ${e+1} of ${t}`+(e>=a?` · ${ge(n*(t-e))}`:``)}});o?(Z={blob:o,name:`${i.value}.mp4`},T.textContent=`Video ready · ${(o.size/1e6).toFixed(1)} MB`,Q(`done`)):Q(`form`)}catch(e){console.error(e),D.textContent=`The export failed: ${e.message}`,E.hidden=!1,Q(`form`)}finally{document.body.classList.remove(`exporting`),r.resize(),M.active=o.blur,F(o.drone),B(`ready`)}}),A.addEventListener(`click`,()=>{let e=URL.createObjectURL(Z.blob);Object.assign(document.createElement(`a`),{href:e,download:Z.name}).click(),URL.revokeObjectURL(e)}),se.addEventListener(`click`,()=>{z===`exporting`?$.abort():v.open=!1}),v.addEventListener(`wa-hide`,e=>z===`exporting`&&e.preventDefault()),await Y()});