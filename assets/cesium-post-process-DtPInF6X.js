import{a as e,u as t}from"./lit-BFn1CURT.js";import{a as n,i as r,n as i,o as a,r as o,t as s}from"./card-58mEaPX-.js";import{a as c,c as l,d as u,o as d}from"./directive-helpers-B5gL4DMf.js";import{t as f}from"./setup-DYuWPPM-.js";import"./switch-BktEAscN.js";import"./button-C4a7i2eR.js";import{a as p,c as m,d as h,f as g,g as _,h as v,i as y,m as b,n as x,o as S,p as C,r as w,s as T,t as E,u as D}from"./cesium-post-process-Czdn4zn-.js";import{a as O,i as k,n as A,o as j,r as M,s as N,t as P}from"./slider-C4R-zmeo.js";var F=t`
  :host {
    --spacing: var(--wa-space-m);
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);

    display: block;
  }

  details {
    display: block;
    overflow-anchor: none;
    border: var(--wa-panel-border-width) var(--wa-color-surface-border) var(--wa-panel-border-style);
    background-color: var(--wa-color-surface-default);
    border-radius: var(--wa-panel-border-radius);
    color: var(--wa-color-text-normal);

    /* Print styles */
    @media print {
      background: none;
      border: solid var(--wa-border-width-s) var(--wa-color-surface-border);

      summary {
        list-style: none;
      }
    }
  }

  /* Appearance modifiers */
  :host([appearance='plain']) details {
    background-color: transparent;
    border-color: transparent;
    border-radius: 0;
  }

  :host([appearance='outlined']) details {
    background-color: var(--wa-color-surface-default);
    border-color: var(--wa-color-surface-border);
  }

  :host([appearance='filled']) details {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: transparent;
  }

  :host([appearance='filled-outlined']) details {
    background-color: var(--wa-color-neutral-fill-quiet);
    border-color: var(--wa-color-neutral-border-quiet);
  }

  :host([disabled]) details {
    opacity: 0.5;
    cursor: not-allowed;
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing);
    padding: var(--spacing); /* Add padding here */
    border-radius: calc(var(--wa-panel-border-radius) - var(--wa-panel-border-width));
    user-select: none;
    -webkit-user-select: none;
    cursor: pointer;

    &::marker,
    &::-webkit-details-marker {
      display: none;
    }

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: calc(var(--wa-panel-border-width) + var(--wa-focus-ring-offset));
    }
  }

  :host([open]) summary {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  /* 'Start' icon placement */
  :host([icon-placement='start']) summary {
    flex-direction: row-reverse;
    justify-content: start;
  }

  [part~='icon'] {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--wa-color-text-quiet);
    transition: rotate var(--wa-transition-normal) var(--wa-transition-easing);
  }

  :host([open]) [part~='icon'] {
    rotate: 90deg;
  }

  :host([open]:dir(rtl)) [part~='icon'] {
    rotate: -90deg;
  }

  :host([open]) slot[name='expand-icon'],
  :host(:not([open])) slot[name='collapse-icon'] {
    display: none;
  }

  .body.animating {
    overflow: hidden;
  }

  .content {
    display: block;
    box-sizing: border-box; /* Ensure contents don't overflow */
    padding-block-start: var(--spacing);
    padding-inline: var(--spacing); /* Add horizontal padding */
    padding-block-end: var(--spacing); /* Add bottom padding */
  }
`,I=class extends i{constructor(){super(...arguments),this.localize=new c(this),this.animationGeneration=0,this.isAnimating=!1,this.open=!1,this.disabled=!1,this.appearance=`outlined`,this.iconPlacement=`end`}disconnectedCallback(){super.disconnectedCallback(),this.detailsObserver?.disconnect()}firstUpdated(e){super.firstUpdated(e),this.body.style.height=this.open?`auto`:`0`,this.open&&(this.details.open=!0),this.detailsObserver=new MutationObserver(e=>{for(let t of e)t.type===`attributes`&&t.attributeName===`open`&&(this.details.open?this.show():this.hide())}),this.detailsObserver.observe(this.details,{attributes:!0})}updated(e){e.has(`isAnimating`)&&this.customStates.set(`animating`,this.isAnimating)}handleSummaryClick(e){e.composedPath().some(e=>{if(!(e instanceof HTMLElement))return!1;let t=e.tagName?.toLowerCase();return[`a`,`button`,`input`,`textarea`,`select`].includes(t)?!0:e instanceof l?!(`disabled`in e)||!e.disabled:!1})||(e.preventDefault(),this.disabled||(this.open?this.hide():this.show(),this.header.focus()))}handleSummaryKeyDown(e){(e.key===`Enter`||e.key===` `)&&(e.preventDefault(),this.open?this.hide():this.show()),(e.key===`ArrowUp`||e.key===`ArrowLeft`)&&(e.preventDefault(),this.hide()),(e.key===`ArrowDown`||e.key===`ArrowRight`)&&(e.preventDefault(),this.show())}closeOthersWithSameName(){this.name&&this.getRootNode().querySelectorAll(`wa-details[name="${this.name}"]`).forEach(e=>{e!==this&&e.open&&(e.open=!1)})}async handleOpenChange(){this.animationGeneration++;let e=this.animationGeneration;if(this.open){this.details.open=!0;let t=new N;if(this.dispatchEvent(t),t.defaultPrevented){this.open=!1,this.details.open=!1;return}this.closeOthersWithSameName(),this.isAnimating=!0;let n=A(getComputedStyle(this.body).getPropertyValue(`--show-duration`));if(await P(this.body,[{height:`0`,opacity:`0`},{height:`${this.body.scrollHeight}px`,opacity:`1`}],{duration:n,easing:`linear`}),this.animationGeneration!==e)return;this.body.style.height=`auto`,this.isAnimating=!1,this.dispatchEvent(new k)}else{let t=new j;if(this.dispatchEvent(t),t.defaultPrevented){this.details.open=!0,this.open=!0;return}this.isAnimating=!0;let n=A(getComputedStyle(this.body).getPropertyValue(`--hide-duration`));if(await P(this.body,[{height:`${this.body.scrollHeight}px`,opacity:`1`},{height:`0`,opacity:`0`}],{duration:n,easing:`linear`}),this.animationGeneration!==e)return;this.body.style.height=`0`,this.isAnimating=!1,this.details.open=!1,this.dispatchEvent(new O)}}async show(){if(!(this.open||this.disabled))return this.open=!0,M(this,`wa-after-show`)}async hide(){if(this.open&&!this.disabled)return this.open=!1,M(this,`wa-after-hide`)}render(){let t=this.hasUpdated?this.localize.dir()===`rtl`:this.dir===`rtl`;return e`
      <details part="base details">
        <summary
          part="header"
          role="button"
          aria-expanded=${this.open?`true`:`false`}
          aria-controls="content"
          aria-disabled=${this.disabled?`true`:`false`}
          tabindex=${this.disabled?`-1`:`0`}
          @click=${this.handleSummaryClick}
          @keydown=${this.handleSummaryKeyDown}
        >
          <slot name="summary" part="summary">${this.summary}</slot>

          <span part="icon">
            <slot name="expand-icon">
              <wa-icon library="system" variant="solid" name=${t?`chevron-left`:`chevron-right`}></wa-icon>
            </slot>
            <slot name="collapse-icon">
              <wa-icon library="system" variant="solid" name=${t?`chevron-left`:`chevron-right`}></wa-icon>
            </slot>
          </span>
        </summary>

        <div
          class=${s({body:!0,animating:this.isAnimating})}
          role="region"
          aria-labelledby="header"
        >
          <slot part="content" id="content" class="content"></slot>
        </div>
      </details>
    `}};I.css=F,a([u(`details`)],I.prototype,`details`,2),a([u(`summary`)],I.prototype,`header`,2),a([u(`.body`)],I.prototype,`body`,2),a([u(`.expand-icon-slot`)],I.prototype,`expandIconSlot`,2),a([o()],I.prototype,`isAnimating`,2),a([r({type:Boolean,reflect:!0})],I.prototype,`open`,2),a([r()],I.prototype,`summary`,2),a([r({reflect:!0})],I.prototype,`name`,2),a([r({type:Boolean,reflect:!0})],I.prototype,`disabled`,2),a([r({reflect:!0})],I.prototype,`appearance`,2),a([r({attribute:`icon-placement`,reflect:!0})],I.prototype,`iconPlacement`,2),a([d(`open`,{waitUntilFirstUpdate:!0})],I.prototype,`handleOpenChange`,1),I=a([n(`wa-details`)],I);var L={m:e=>`${e} m`,deg:e=>`${e}°`,percent:e=>`${Math.round(e*100)} %`,shutter:e=>`1/${Math.round(1/e)} s`,px:e=>`${+e.toFixed(1)} px`,hz:e=>`${e} Hz`,"per-m":e=>`${+e.toFixed(4)} /m`};for(let e of document.querySelectorAll(`#controls wa-slider[data-unit]`))e.valueFormatter=L[e.dataset.unit];var R=[`snowLine`,`valleyFog`,`spotlight`,`tiltShift`,`motionBlur`,`speedLines`,`colorIsolation`,`infrared`,`technicolor`,`super8`,`lensDistortion`,`jello`,`droneDisplay`,`analogVideo`,`digitalVideo`];f(`cesiumContainer`).then(e=>{e.clock.currentTime=Cesium.JulianDate.fromIso8601(`2026-09-25T14:00:00+02:00`),e.clock.shouldAnimate=!1;let t={snowLine:new T(e),valleyFog:new E(e),tiltShift:new x(e),motionBlur:new m(e,{exposure:.04}),speedLines:new S(e),spotlight:new p(e),colorIsolation:new v(e),infrared:new g(e),technicolor:new w(e),super8:new y(e),lensDistortion:new D(e),jello:new h(e),droneDisplay:new C(e),analogVideo:new _(e),digitalVideo:new b(e)},n=!1;document.querySelector(`#controls`).addEventListener(`input`,e=>{let{name:r,value:i,checked:a}=e.target,o=e.target.closest(`[data-effect]`).dataset.effect;if(r===`followCursor`){n=a;return}if(r!==`active`){let e=Number(i);t[o][r]=Number.isNaN(e)?i:e;return}if(t[o].active=a,a){e.target.closest(`wa-details`).open=!0;for(let e of R.slice(R.indexOf(o)+1))t[e].active&&(t[e].active=!1,t[e].active=!0)}});let r=e=>{t.tiltShift.focus=e,t.spotlight.focus=e,t.speedLines.focus=e};e.screenSpaceEventHandler.setInputAction(({position:t})=>{let n=e.scene.pickPosition(t);n&&r(n)},Cesium.ScreenSpaceEventType.LEFT_CLICK),e.screenSpaceEventHandler.setInputAction(({endPosition:r})=>{let i=n&&e.scene.pickPosition(r);i&&(t.spotlight.focus=i)},Cesium.ScreenSpaceEventType.MOUSE_MOVE),document.querySelector(`#center`).addEventListener(`click`,()=>r(void 0))});