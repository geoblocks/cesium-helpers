import{a as e,u as t}from"./lit-BFn1CURT.js";import{a as n,c as r,i,n as a,o,r as s,s as c,t as l}from"./card-AeaRol_r.js";import{a as u,c as d,d as f,o as p,s as m}from"./directive-helpers-BiOJKcbC.js";import{n as h}from"./switch-C191omm4.js";import{t as g}from"./style-map-ly-_uhSr.js";import{a as _,c as v,d as y,f as b,l as x,o as S,r as C,s as w,t as T,u as E}from"./chunk.UEBQI7VV-up6OAE6C.js";var D=`useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict`,O=(e=21)=>{let t=``,n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=D[n[e]&63];return t};function k(e,t,n){return(e=>Object.is(e,-0)?0:e)(e<t?t:e>n?n:e)}function A(e=``){return`${e}${O()}`}var j=t`
  :host {
    --track-size: 0.5em;
    --thumb-width: 1.4em;
    --thumb-height: 1.4em;
    --marker-width: 0.1875em;
    --marker-height: 0.1875em;
  }

  :host([orientation='vertical']) {
    width: auto;
  }

  #label:has(~ .vertical) {
    display: block;
    order: 2;
    max-width: none;
    text-align: center;
  }

  #description:has(~ .vertical) {
    order: 3;
    text-align: center;
  }

  /* Add extra space between slider and label, when present */
  #label.has-label ~ #slider {
    &.horizontal {
      margin-block-start: 0.5em;
    }
    &.vertical {
      margin-block-end: 0.5em;
    }
  }

  #slider {
    touch-action: none;

    &:focus {
      outline: none;
    }

    &:focus-visible:not(.disabled) #thumb,
    &:focus-visible:not(.disabled) #thumb-min,
    &:focus-visible:not(.disabled) #thumb-max {
      outline: var(--wa-focus-ring);
      /* intentionally no offset due to border */
    }
  }

  #track {
    position: relative;
    border-radius: 9999px;
    background: var(--wa-color-neutral-fill-normal);
    isolation: isolate;
  }

  /* Orientation */
  .horizontal #track {
    height: var(--track-size);
  }

  .vertical #track {
    order: 1;
    width: var(--track-size);
    height: 200px;
  }

  /* Disabled */
  .disabled #track {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Indicator */
  #indicator {
    position: absolute;
    border-radius: inherit;
    background-color: var(--wa-form-control-activated-color);

    &:dir(ltr) {
      right: calc(100% - max(var(--start), var(--end)));
      left: min(var(--start), var(--end));
    }

    &:dir(rtl) {
      right: min(var(--start), var(--end));
      left: calc(100% - max(var(--start), var(--end)));
    }
  }

  .horizontal #indicator {
    top: 0;
    height: 100%;
  }

  .vertical #indicator {
    top: calc(100% - var(--end));
    bottom: var(--start);
    left: 0;
    width: 100%;
  }

  /* Thumbs */
  #thumb,
  #thumb-min,
  #thumb-max {
    z-index: 3;
    position: absolute;
    width: var(--thumb-width);
    height: var(--thumb-height);
    border: solid 0.125em var(--wa-color-surface-default);
    border-radius: 50%;
    background-color: var(--wa-form-control-activated-color);
    cursor: pointer;
  }

  .disabled #thumb,
  .disabled #thumb-min,
  .disabled #thumb-max {
    cursor: inherit;
  }

  .horizontal #thumb,
  .horizontal #thumb-min,
  .horizontal #thumb-max {
    top: calc(50% - var(--thumb-height) / 2);

    &:dir(ltr) {
      right: auto;
      left: calc(var(--position) - var(--thumb-width) / 2);
    }

    &:dir(rtl) {
      right: calc(var(--position) - var(--thumb-width) / 2);
      left: auto;
    }
  }

  .vertical #thumb,
  .vertical #thumb-min,
  .vertical #thumb-max {
    bottom: calc(var(--position) - var(--thumb-height) / 2);
    left: calc(50% - var(--thumb-width) / 2);
  }

  /* Range-specific thumb styles */
  :host([range]) {
    #thumb-min:focus-visible,
    #thumb-max:focus-visible {
      z-index: 4; /* Ensure focused thumb appears on top */
      outline: var(--wa-focus-ring);
      /* intentionally no offset due to border */
    }
  }

  /* Markers */
  #markers {
    pointer-events: none;
  }

  .marker {
    z-index: 2;
    position: absolute;
    width: var(--marker-width);
    height: var(--marker-height);
    border-radius: 50%;
    background-color: var(--wa-color-surface-default);
  }

  .marker:first-of-type,
  .marker:last-of-type {
    display: none;
  }

  .horizontal .marker {
    top: calc(50% - var(--marker-height) / 2);
    left: calc(var(--position) - var(--marker-width) / 2);
  }

  .vertical .marker {
    top: calc(var(--position) - var(--marker-height) / 2);
    left: calc(50% - var(--marker-width) / 2);
  }

  /* Marker labels */
  #references {
    position: relative;

    slot {
      display: flex;
      justify-content: space-between;
      height: 100%;
    }

    ::slotted(*) {
      color: var(--wa-color-text-quiet);
      font-size: 0.875em;
      line-height: 1;
    }
  }

  .horizontal {
    #references {
      margin-block-start: 0.5em;
    }
  }

  .vertical {
    display: flex;
    margin-inline: auto;

    #track {
      order: 1;
    }

    #references {
      order: 2;
      width: min-content;
      margin-inline-start: 0.75em;

      slot {
        flex-direction: column;
      }
    }
  }

  .vertical #references slot {
    flex-direction: column;
  }
`;function*M(e=document.activeElement){e!=null&&(yield e,`shadowRoot`in e&&e.shadowRoot&&e.shadowRoot.mode!==`closed`&&(yield*M(e.shadowRoot.activeElement)))}function N(e,t){let n=e.metaKey||e.ctrlKey||e.shiftKey||e.altKey;e.key===`Enter`&&!n&&setTimeout(()=>{!e.defaultPrevented&&!e.isComposing&&L(t)})}var P=new Map([[`input`,!0],[`wa-input`,!0],[`wa-tag-input`,!0],[`wa-number-input`,!0],[`wa-otp-input`,!0],[`wa-slider`,!0]]),F=new Map([[`button`,!1],[`checkbox`,!1],[`color`,!1],[`date`,!1],[`datetime-local`,!1],[`email`,!0],[`file`,!1],[`hidden`,!1],[`image`,!1],[`month`,!1],[`number`,!0],[`password`,!0],[`radio`,!1],[`range`,!1],[`reset`,!0],[`search`,!0],[`submit`,!1],[`tel`,!0],[`text`,!0],[`time`,!1],[`url`,!0],[`week`,!1]]),I=e=>{let t=e?.localName;if(!t||!P.get(t))return!1;if(t!==`input`&&t!==`wa-input`)return!0;let n=e.type;return!!F.get(n)};function L(e){let t=null;if(`form`in e&&(t=e.form),!t&&`getForm`in e&&(t=e.getForm()),!t)return;let n=Array.from(t.elements),r=0;for(let e of n)I(e)&&(r+=1);if(r===1){t.requestSubmit(null);return}let i=n.find(e=>e.type===`submit`&&!e.matches(`:disabled`));i&&([`input`,`button`].includes(i.localName)?t.requestSubmit(i):i.click())}var R=typeof window<`u`&&`ontouchstart`in window,z=class{constructor(e,t){this.isActive=!1,this.isDragging=!1,this.handleDragStart=e=>{let t=`touches`in e?e.touches[0].clientX:e.clientX,n=`touches`in e?e.touches[0].clientY:e.clientY;this.isDragging||!R&&e.buttons>1||(this.isDragging=!0,document.addEventListener(`pointerup`,this.handleDragStop),document.addEventListener(`pointermove`,this.handleDragMove),document.addEventListener(`pointercancel`,this.handleDragStop),document.addEventListener(`touchend`,this.handleDragStop),document.addEventListener(`touchmove`,this.handleDragMove),document.addEventListener(`touchcancel`,this.handleDragStop),this.options.start(t,n))},this.handleDragStop=e=>{let t=`changedTouches`in e?e.changedTouches[0].clientX:e.clientX,n=`changedTouches`in e?e.changedTouches[0].clientY:e.clientY;this.isDragging=!1,document.removeEventListener(`pointerup`,this.handleDragStop),document.removeEventListener(`pointermove`,this.handleDragMove),document.removeEventListener(`pointercancel`,this.handleDragStop),document.removeEventListener(`touchend`,this.handleDragStop),document.removeEventListener(`touchmove`,this.handleDragMove),document.removeEventListener(`touchcancel`,this.handleDragStop),this.options.stop(t,n)},this.handleDragMove=e=>{let t=`touches`in e?e.touches[0].clientX:e.clientX,n=`touches`in e?e.touches[0].clientY:e.clientY;window.getSelection()?.removeAllRanges(),this.options.move(t,n)},this.element=e,this.options={start:()=>void 0,stop:()=>void 0,move:()=>void 0,...t},this.start()}start(){this.isActive||=(this.element.addEventListener(`pointerdown`,this.handleDragStart),R&&this.element.addEventListener(`touchstart`,this.handleDragStart),!0)}stop(){document.removeEventListener(`pointerup`,this.handleDragStop),document.removeEventListener(`pointermove`,this.handleDragMove),document.removeEventListener(`pointercancel`,this.handleDragStop),document.removeEventListener(`touchend`,this.handleDragStop),document.removeEventListener(`touchmove`,this.handleDragMove),document.removeEventListener(`touchcancel`,this.handleDragStop),this.element.removeEventListener(`pointerdown`,this.handleDragStart),R&&this.element.removeEventListener(`touchstart`,this.handleDragStart),this.isActive=!1,this.isDragging=!1}toggle(e){(e===void 0?!this.isActive:e)?this.start():this.stop()}};function B(e,t,n){let r=(e-t)/n;return Math.abs(r-Math.round(r))>1e-9}var V=()=>({observedAttributes:[`min`,`max`,`step`],checkValidity(e){let t={message:``,isValid:!0,invalidKeys:[]},n=(e,t,n,r)=>{if(typeof document>`u`)return``;let i=document.createElement(`input`);return i.type=`range`,i.min=String(t),i.max=String(n),i.step=String(r),i.value=String(e),i.checkValidity(),i.validationMessage};if(e.isRange){let r=e.minValue,i=e.maxValue;if(r<e.min)return t.isValid=!1,t.invalidKeys.push(`rangeUnderflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be greater than or equal to ${e.min}.`,t;if(i>e.max)return t.isValid=!1,t.invalidKeys.push(`rangeOverflow`),t.message=n(i,e.min,e.max,e.step)||`Value must be less than or equal to ${e.max}.`,t;if(e.step&&e.step!==1){let a=B(r,e.min,e.step),o=B(i,e.min,e.step);if(a||o)return t.isValid=!1,t.invalidKeys.push(`stepMismatch`),t.message=n(a?r:i,e.min,e.max,e.step)||`Value must be a multiple of ${e.step}.`,t}}else{let r=e.value;if(r<e.min)return t.isValid=!1,t.invalidKeys.push(`rangeUnderflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be greater than or equal to ${e.min}.`,t;if(r>e.max)return t.isValid=!1,t.invalidKeys.push(`rangeOverflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be less than or equal to ${e.max}.`,t;if(e.step&&e.step!==1&&B(r,e.min,e.step))return t.isValid=!1,t.invalidKeys.push(`stepMismatch`),t.message=n(r,e.min,e.max,e.step)||`Value must be a multiple of ${e.step}.`,t}return t}}),H=class extends d{constructor(){super(...arguments),this.draggableThumbMin=null,this.draggableThumbMax=null,this.hasSlotController=new r(this,`hint`,`label`),this.localize=new u(this),this.activeThumb=null,this.lastTrackPosition=null,this.label=``,this.hint=``,this.minValue=0,this.maxValue=50,this.defaultValue=this.getAttribute(`value`)==null?this.minValue:Number(this.getAttribute(`value`)),this._value=null,this.range=!1,this.disabled=!1,this.readonly=!1,this.orientation=`horizontal`,this.size=`m`,this.min=0,this.max=100,this.step=1,this.tooltipDistance=8,this.tooltipPlacement=`top`,this.withMarkers=!1,this.withTooltip=!1,this.withLabel=!1,this.withHint=!1}static get validators(){return[...super.validators,V()]}get focusableAnchor(){return this.isRange&&this.thumbMin||this.slider}get validationTarget(){return this.focusableAnchor}get value(){return this.valueHasChanged?k(this._value??this.minValue??0,this.min,this.max):k(this._value??this.defaultValue,this.min,this.max)}set value(e){e=Number(e)??this.minValue,this._value!==e&&(this.valueHasChanged=!0,this._value=e)}get isRange(){return this.range}handleSizeChange(){m(this.localName,this.size)}firstUpdated(e){super.firstUpdated(e),this.isRange?(this.draggableThumbMin=new z(this.thumbMin,{start:()=>{this.activeThumb=`min`,this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.minValue,this.customStates.set(`dragging`,!0),this.showRangeTooltips()},move:(e,t)=>{this.setThumbValueFromCoordinates(e,t,`min`)},stop:()=>{this.minValue!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}}),this.draggableThumbMax=new z(this.thumbMax,{start:()=>{this.activeThumb=`max`,this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.maxValue,this.customStates.set(`dragging`,!0),this.showRangeTooltips()},move:(e,t)=>{this.setThumbValueFromCoordinates(e,t,`max`)},stop:()=>{this.maxValue!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}}),this.draggableTrack=new z(this.track,{start:(e,t)=>{if(this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.activeThumb)this.valueWhenDraggingStarted=this.activeThumb===`min`?this.minValue:this.maxValue;else{let n=this.getValueFromCoordinates(e,t),r=Math.abs(n-this.minValue),i=Math.abs(n-this.maxValue);if(r===i){if(n>this.maxValue)this.activeThumb=`max`;else if(n<this.minValue)this.activeThumb=`min`;else{let n=this.localize.dir()===`rtl`,r=this.orientation===`vertical`,i=r?t:e,a=this.lastTrackPosition||i;this.lastTrackPosition=i;let o=i>a!==n&&!r||i<a&&r;this.activeThumb=o?`max`:`min`}}else this.activeThumb=r<=i?`min`:`max`;this.valueWhenDraggingStarted=this.activeThumb===`min`?this.minValue:this.maxValue}this.customStates.set(`dragging`,!0),this.setThumbValueFromCoordinates(e,t,this.activeThumb),this.showRangeTooltips()},move:(e,t)=>{this.activeThumb&&this.setThumbValueFromCoordinates(e,t,this.activeThumb)},stop:()=>{this.activeThumb&&(this.activeThumb===`min`?this.minValue:this.maxValue)!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}})):this.draggableTrack=new z(this.slider,{start:(e,t)=>{this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.value,this.customStates.set(`dragging`,!0),this.setValueFromCoordinates(e,t),this.showTooltip()},move:(e,t)=>{this.setValueFromCoordinates(e,t)},stop:()=>{this.value!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideTooltip(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0}})}willUpdate(e){this.isRange&&(e.has(`minValue`)||e.has(`maxValue`)||e.has(`min`)||e.has(`max`))&&(this.minValue=k(this.minValue,this.min,this.maxValue),this.maxValue=k(this.maxValue,this.minValue,this.max)),super.willUpdate(e)}updated(e){if(this.isRange&&(e.has(`minValue`)||e.has(`maxValue`))&&this.updateFormValue(),e.has(`disabled`)||e.has(`readonly`)){let e=!(this.disabled||this.readonly);this.isRange&&(this.draggableThumbMin&&this.draggableThumbMin.toggle(e),this.draggableThumbMax&&this.draggableThumbMax.toggle(e)),this.draggableTrack&&this.draggableTrack.toggle(e)}super.updated(e)}formDisabledCallback(e){this.disabled=e}formResetCallback(){this.isRange?(this.minValue=parseFloat(this.getAttribute(`min-value`)??String(this.min)),this.maxValue=parseFloat(this.getAttribute(`max-value`)??String(this.max))):(this._value=null,this.defaultValue=this.defaultValue??parseFloat(this.getAttribute(`value`)??String(this.min))),this.valueHasChanged=!1,this.hasInteracted=!1,super.formResetCallback()}clampAndRoundToStep(e){let t=(String(this.step).split(`.`)[1]||``).replace(/0+$/g,``).length,n=Number(this.step),r=Number(this.min),i=Number(this.max);return e=Math.round(e/n)*n,e=k(e,r,i),parseFloat(e.toFixed(t))}getPercentageFromValue(e){return(e-this.min)/(this.max-this.min)*100}getValueFromCoordinates(e,t){let n=this.localize.dir()===`rtl`,r=this.orientation===`vertical`,{top:i,right:a,bottom:o,left:s,height:c,width:l}=this.trackBoundingClientRect,u=r?t:e,d=r?{start:i,end:o,size:c}:{start:s,end:a,size:l},f=(r||n?d.end-u:u-d.start)/d.size;return this.clampAndRoundToStep(this.min+(this.max-this.min)*f)}handleBlur(){this.isRange?requestAnimationFrame(()=>{let e=this.shadowRoot?.activeElement;e!==this.thumbMin&&e!==this.thumbMax&&this.hideRangeTooltips()}):this.hideTooltip(),this.customStates.set(`focused`,!1),this.dispatchEvent(new FocusEvent(`blur`,{bubbles:!0,composed:!0}))}handleFocus(e){let t=e.target;this.isRange?(t===this.thumbMin?this.activeThumb=`min`:t===this.thumbMax&&(this.activeThumb=`max`),this.showRangeTooltips()):this.showTooltip(),this.customStates.set(`focused`,!0),this.dispatchEvent(new FocusEvent(`focus`,{bubbles:!0,composed:!0}))}handleKeyDown(e){let t=this.localize.dir()===`rtl`,n=e.target;if(this.disabled||this.readonly||this.isRange&&(n===this.thumbMin?this.activeThumb=`min`:n===this.thumbMax&&(this.activeThumb=`max`),!this.activeThumb))return;let r=this.isRange?this.activeThumb===`min`?this.minValue:this.maxValue:this.value,i=r;switch(e.key){case`ArrowUp`:case t?`ArrowLeft`:`ArrowRight`:e.preventDefault(),i=this.clampAndRoundToStep(r+this.step);break;case`ArrowDown`:case t?`ArrowRight`:`ArrowLeft`:e.preventDefault(),i=this.clampAndRoundToStep(r-this.step);break;case`Home`:e.preventDefault(),i=this.isRange&&this.activeThumb===`min`?this.min:this.isRange?this.minValue:this.min;break;case`End`:e.preventDefault(),i=this.isRange&&this.activeThumb===`max`?this.max:this.isRange?this.maxValue:this.max;break;case`PageUp`:e.preventDefault();let n=Math.max(r+(this.max-this.min)/10,r+this.step);i=this.clampAndRoundToStep(n);break;case`PageDown`:e.preventDefault();let a=Math.min(r-(this.max-this.min)/10,r-this.step);i=this.clampAndRoundToStep(a);break;case`Enter`:N(e,this);return}i!==r&&(this.isRange?(this.activeThumb===`min`?i>this.maxValue?(this.maxValue=i,this.minValue=i):this.minValue=Math.max(this.min,i):i<this.minValue?(this.minValue=i,this.maxValue=i):this.maxValue=Math.min(this.max,i),this.updateFormValue()):this.value=k(i,this.min,this.max),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0)}handleLabelPointerDown(e){e.preventDefault(),this.disabled||(this.isRange?this.thumbMin?.focus():this.slider.focus())}setValueFromCoordinates(e,t){let n=this.value;this.value=this.getValueFromCoordinates(e,t),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0}))})}setThumbValueFromCoordinates(e,t,n){let r=this.getValueFromCoordinates(e,t),i=n===`min`?this.minValue:this.maxValue;n===`min`?r>this.maxValue?(this.maxValue=r,this.minValue=r):this.minValue=Math.max(this.min,r):r<this.minValue?(this.minValue=r,this.maxValue=r):this.maxValue=Math.min(this.max,r),i!==(n===`min`?this.minValue:this.maxValue)&&(this.updateFormValue(),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0}))}))}showTooltip(){this.withTooltip&&this.tooltip&&(this.tooltip.open=!0)}hideTooltip(){this.withTooltip&&this.tooltip&&(this.tooltip.open=!1)}showRangeTooltips(){if(!this.withTooltip)return;let e=this.shadowRoot?.getElementById(`tooltip-thumb-min`),t=this.shadowRoot?.getElementById(`tooltip-thumb-max`);this.activeThumb===`min`?(e&&(e.open=!0),t&&(t.open=!1)):this.activeThumb===`max`&&(t&&(t.open=!0),e&&(e.open=!1))}hideRangeTooltips(){if(!this.withTooltip)return;let e=this.shadowRoot?.getElementById(`tooltip-thumb-min`),t=this.shadowRoot?.getElementById(`tooltip-thumb-max`);e&&(e.open=!1),t&&(t.open=!1)}updateFormValue(e){if(this.isRange){let e=new FormData;e.append(this.name||``,String(this.minValue)),e.append(this.name||``,String(this.maxValue)),this.setValue(e,e)}else super.updateFormValue(e)}focus(){this.isRange?this.thumbMin?.focus():this.slider.focus()}blur(){if(this.isRange){for(let e of M())if(e===this.thumbMin){this.thumbMin.blur();break}else if(e===this.thumbMax){this.thumbMax.blur();break}}else this.slider.blur()}stepDown(){if(this.isRange){let e=this.clampAndRoundToStep(this.minValue-this.step);this.minValue=k(e,this.min,this.maxValue),this.updateFormValue()}else{let e=this.clampAndRoundToStep(this.value-this.step);this.value=e}}stepUp(){if(this.isRange){let e=this.clampAndRoundToStep(this.maxValue+this.step);this.maxValue=k(e,this.minValue,this.max),this.updateFormValue()}else{let e=this.clampAndRoundToStep(this.value+this.step);this.value=e}}render(){let t=this.hasSlotController.test(`label`,`withLabel`),n=this.hasSlotController.test(`hint`,`withHint`),r=this.label?!0:!!t,i=this.hint?!0:!!n,a=this.hasSlotController.test(`reference`),o=l({xs:this.size===`xs`,s:this.size===`s`||this.size===`small`,m:this.size===`m`||this.size===`medium`,l:this.size===`l`||this.size===`large`,xl:this.size===`xl`,small:this.size===`small`||this.size===`s`,medium:this.size===`medium`||this.size===`m`,large:this.size===`large`||this.size===`l`,horizontal:this.orientation===`horizontal`,vertical:this.orientation===`vertical`,disabled:this.disabled}),s=[];if(this.withMarkers)for(let e=this.min;e<=this.max;e+=this.step)s.push(this.getPercentageFromValue(e));let c=e`
      <label
        id="label"
        part="label"
        for=${this.isRange?`thumb-min`:`text-box`}
        class=${l({vh:!r,"has-label":r})}
        @pointerdown=${this.handleLabelPointerDown}
      >
        <slot name="label">${this.label}</slot>
      </label>
    `,u=e`
      <div
        id="hint"
        part="hint"
        class=${l({"has-slotted":i})}
      >
        <slot name="hint">${this.hint}</slot>
      </div>
    `,d=this.withMarkers?e`
          <div id="markers" part="markers">
            ${s.map(t=>e`<span part="marker" class="marker" style=${g({"--position":`${t}%`})}></span>`)}
          </div>
        `:``,f=a?e`
          <div id="references" part="references" aria-hidden="true">
            <slot name="reference"></slot>
          </div>
        `:``,p=(t,n)=>this.withTooltip?e`
            <wa-tooltip
              id=${`tooltip${t===`thumb`?``:`-`+t}`}
              part="tooltip"
              exportparts="
                base:tooltip__base,
                tooltip:tooltip__tooltip,
                body:tooltip__body,
                arrow:tooltip__arrow
              "
              trigger="manual"
              distance=${this.tooltipDistance}
              placement=${this.tooltipPlacement}
              for=${t}
              activation="manual"
              dir=${this.localize.dir()}
            >
              <span aria-hidden="true">
                ${typeof this.valueFormatter==`function`?this.valueFormatter(n):this.localize.number(n)}
              </span>
            </wa-tooltip>
          `:``;if(this.isRange){let t=k(this.getPercentageFromValue(this.minValue),0,100),n=k(this.getPercentageFromValue(this.maxValue),0,100);return e`
        ${c}

        <div id="slider" part="slider" class=${o}>
          <div id="track" part="track">
            <div
              id="indicator"
              part="indicator"
              style=${g({"--start":`${Math.min(t,n)}%`,"--end":`${Math.max(t,n)}%`})}
            ></div>

            ${d}

            <span
              id="thumb-min"
              part="thumb thumb-min"
              style=${g({"--position":`${t}%`})}
              role="slider"
              aria-valuemin=${this.min}
              aria-valuenow=${this.minValue}
              aria-valuetext=${typeof this.valueFormatter==`function`?this.valueFormatter(this.minValue):this.localize.number(this.minValue)}
              aria-valuemax=${this.max}
              aria-label="${this.label?`${this.label} (minimum value)`:`Minimum value`}"
              aria-orientation=${this.orientation}
              aria-disabled=${this.disabled?`true`:`false`}
              aria-readonly=${this.readonly?`true`:`false`}
              tabindex=${this.disabled?-1:0}
              @blur=${this.handleBlur}
              @focus=${this.handleFocus}
              @keydown=${this.handleKeyDown}
            ></span>

            <span
              id="thumb-max"
              part="thumb thumb-max"
              style=${g({"--position":`${n}%`})}
              role="slider"
              aria-valuemin=${this.min}
              aria-valuenow=${this.maxValue}
              aria-valuetext=${typeof this.valueFormatter==`function`?this.valueFormatter(this.maxValue):this.localize.number(this.maxValue)}
              aria-valuemax=${this.max}
              aria-label="${this.label?`${this.label} (maximum value)`:`Maximum value`}"
              aria-orientation=${this.orientation}
              aria-disabled=${this.disabled?`true`:`false`}
              aria-readonly=${this.readonly?`true`:`false`}
              tabindex=${this.disabled?-1:0}
              @blur=${this.handleBlur}
              @focus=${this.handleFocus}
              @keydown=${this.handleKeyDown}
            ></span>
          </div>

          ${f} ${u}
        </div>

        ${p(`thumb-min`,this.minValue)} ${p(`thumb-max`,this.maxValue)}
      `}{let t=k(this.getPercentageFromValue(this.value),0,100),n=k(this.getPercentageFromValue(typeof this.indicatorOffset==`number`?this.indicatorOffset:this.min),0,100);return e`
        ${c}

        <div
          id="slider"
          part="slider"
          class=${o}
          role="slider"
          aria-disabled=${this.disabled?`true`:`false`}
          aria-readonly=${this.disabled?`true`:`false`}
          aria-orientation=${this.orientation}
          aria-valuemin=${this.min}
          aria-valuenow=${this.value}
          aria-valuetext=${typeof this.valueFormatter==`function`?this.valueFormatter(this.value):this.localize.number(this.value)}
          aria-valuemax=${this.max}
          aria-labelledby="label"
          aria-describedby="hint"
          tabindex=${this.disabled?-1:0}
          @blur=${this.handleBlur}
          @focus=${this.handleFocus}
          @keydown=${this.handleKeyDown}
        >
          <div id="track" part="track">
            <div
              id="indicator"
              part="indicator"
              style=${g({"--start":`${n}%`,"--end":`${t}%`})}
            ></div>

            ${d}
            <span id="thumb" part="thumb" style=${g({"--position":`${t}%`})}></span>
          </div>

          ${f} ${u}
        </div>

        ${p(`thumb`,this.value)}
      `}}};H.formAssociated=!0,H.observeSlots=!0,H.css=[c,h,j],o([f(`#slider`)],H.prototype,`slider`,2),o([f(`#thumb`)],H.prototype,`thumb`,2),o([f(`#thumb-min`)],H.prototype,`thumbMin`,2),o([f(`#thumb-max`)],H.prototype,`thumbMax`,2),o([f(`#track`)],H.prototype,`track`,2),o([f(`#tooltip`)],H.prototype,`tooltip`,2),o([i()],H.prototype,`label`,2),o([i({attribute:`hint`})],H.prototype,`hint`,2),o([i({reflect:!0})],H.prototype,`name`,2),o([i({type:Number,attribute:`min-value`})],H.prototype,`minValue`,2),o([i({type:Number,attribute:`max-value`})],H.prototype,`maxValue`,2),o([i({attribute:`value`,reflect:!0,type:Number})],H.prototype,`defaultValue`,2),o([s()],H.prototype,`value`,1),o([i({type:Boolean,reflect:!0})],H.prototype,`range`,2),o([i({type:Boolean})],H.prototype,`disabled`,2),o([i({type:Boolean,reflect:!0})],H.prototype,`readonly`,2),o([i({reflect:!0})],H.prototype,`orientation`,2),o([i({reflect:!0})],H.prototype,`size`,2),o([p(`size`)],H.prototype,`handleSizeChange`,1),o([i({attribute:`indicator-offset`,type:Number})],H.prototype,`indicatorOffset`,2),o([i({type:Number})],H.prototype,`min`,2),o([i({type:Number})],H.prototype,`max`,2),o([i({type:Number})],H.prototype,`step`,2),o([i({type:Boolean})],H.prototype,`autofocus`,2),o([i({attribute:`tooltip-distance`,type:Number})],H.prototype,`tooltipDistance`,2),o([i({attribute:`tooltip-placement`,reflect:!0})],H.prototype,`tooltipPlacement`,2),o([i({attribute:`with-markers`,type:Boolean})],H.prototype,`withMarkers`,2),o([i({attribute:`with-tooltip`,type:Boolean})],H.prototype,`withTooltip`,2),o([i({attribute:`with-label`,type:Boolean})],H.prototype,`withLabel`,2),o([i({attribute:`with-hint`,type:Boolean})],H.prototype,`withHint`,2),o([i({attribute:!1})],H.prototype,`valueFormatter`,2),H=o([n(`wa-slider`)],H);var U=t`
  :host {
    --max-width: 30ch;

    /** These styles are added so we don't interfere in the DOM. */
    display: inline-block;
    position: absolute;

    /** Defaults for inherited CSS properties */
    color: var(--wa-tooltip-content-color);
    font-size: var(--wa-tooltip-font-size);
    line-height: var(--wa-tooltip-line-height);
    text-align: start;
    white-space: normal;
  }

  .tooltip {
    --arrow-size: var(--wa-tooltip-arrow-size);
    --arrow-color: var(--wa-tooltip-background-color);
  }

  .tooltip::part(popup) {
    z-index: 1000;
  }

  .tooltip[placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .tooltip[placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  .tooltip[placement^='left']::part(popup) {
    transform-origin: right;
  }

  .tooltip[placement^='right']::part(popup) {
    transform-origin: left;
  }

  .body {
    display: block;
    width: max-content;
    max-width: var(--max-width);
    border-radius: var(--wa-tooltip-border-radius);
    background-color: var(--wa-tooltip-background-color);
    border: var(--wa-tooltip-border-width) var(--wa-tooltip-border-style) var(--wa-tooltip-border-color);
    padding: 0.25em 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  .tooltip {
    --popup-border-width: var(--wa-tooltip-border-width);

    /* Inset box-shadow, not a border: Safari seams a clip-path edge that runs along a border. */
    &::part(arrow) {
      box-shadow: inset calc(-1 * var(--wa-tooltip-border-width)) calc(-1 * var(--wa-tooltip-border-width)) 0 0
        var(--wa-tooltip-border-color);
    }
  }
`;function W(e,t){for(;t;){if(t===e)return!0;t=t instanceof Element&&t.assignedSlot?t.assignedSlot:t.parentNode?t.parentNode:t instanceof ShadowRoot?t.host:null}return!1}var G=class extends a{constructor(){super(...arguments),this.dismissedByPress=!1,this.placement=`top`,this.disabled=!1,this.distance=8,this.open=!1,this.skidding=0,this.showDelay=150,this.hideDelay=0,this.trigger=`hover focus`,this.withoutArrow=!1,this.for=null,this.anchor=null,this.eventController=new AbortController,this.handleBlur=()=>{this.dismissedByPress=!1,this.hasTrigger(`focus`)&&this.hide()},this.handleClick=()=>{this.hasTrigger(`click`)?this.open?this.hide():this.show():this.hasTrigger(`manual`)||this.lightDismiss()},this.handleFocus=()=>{this.dismissedByPress||this.hasTrigger(`focus`)&&this.show()},this.handleMouseDown=()=>{this.hasTrigger(`click`)||this.hasTrigger(`manual`)||this.lightDismiss()},this.handleDocumentKeyDown=e=>{this.hasTrigger(`manual`)||e.key===`Escape`&&this.open&&S(this)&&(e.preventDefault(),e.stopPropagation(),this.hide())},this.handleDocumentClick=e=>{this.hasTrigger(`manual`)||this.anchor&&e.composedPath().includes(this.anchor)||this.hide()},this.handleMouseOver=()=>{this.dismissedByPress||this.hasTrigger(`hover`)&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>this.show(),this.showDelay))},this.handleMouseOut=e=>{let t=e.relatedTarget,n=!!(t&&this.anchor&&W(this.anchor,t)),r=!!(t&&W(this,t));n||r||(this.dismissedByPress=!1,this.hasTrigger(`hover`)&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>{this.hide()},this.hideDelay)))}}connectedCallback(){super.connectedCallback(),typeof document<`u`&&(this.eventController.signal.aborted&&(this.eventController=new AbortController),this.addEventListener(`mouseout`,this.handleMouseOut),this.dismissedByPress=!1,this.open&&(this.open=!1,this.updateComplete.then(()=>{this.open=!0})),this.id||=A(`wa-tooltip-`),this.for&&this.anchor?(this.anchor=null,this.handleForChange()):this.for&&this.handleForChange())}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`click`,this.handleDocumentClick),v(this),this.eventController.abort(),this.anchor&&this.removeFromAriaLabelledBy(this.anchor,this.id)}firstUpdated(e){this.body.hidden=!this.open,this.open&&(this.popup.active=!0,this.popup.reposition()),super.firstUpdated(e)}lightDismiss(){clearTimeout(this.hoverTimeout),this.dismissedByPress=!0,this.hide()}hasTrigger(e){return this.trigger.split(` `).includes(e)}addToAriaLabelledBy(e,t){let n=(e.getAttribute(`aria-labelledby`)||``).split(/\s+/).filter(Boolean);n.includes(t)||(n.push(t),e.setAttribute(`aria-labelledby`,n.join(` `)))}removeFromAriaLabelledBy(e,t){let n=(e.getAttribute(`aria-labelledby`)||``).split(/\s+/).filter(Boolean).filter(e=>e!==t);n.length>0?e.setAttribute(`aria-labelledby`,n.join(` `)):e.removeAttribute(`aria-labelledby`)}async handleOpenChange(){if(this.open){if(this.disabled)return;let e=new b;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.hasTrigger(`manual`)||(document.addEventListener(`keydown`,this.handleDocumentKeyDown,{signal:this.eventController.signal}),document.addEventListener(`click`,this.handleDocumentClick,{signal:this.eventController.signal}),w(this)),this.body.hidden=!1,this.popup.active=!0,await C(this.popup.popup,`show-with-scale`),this.popup.reposition(),this.dispatchEvent(new x)}else{let e=new y;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`click`,this.handleDocumentClick),v(this),await C(this.popup.popup,`hide-with-scale`),this.popup.active=!1,this.body.hidden=!0,this.dispatchEvent(new E)}}handleForChange(){let e=this.getRootNode?.();if(!e)return;let t=this.for?e.getElementById?.(this.for):null,n=this.anchor;if(t===n)return;this.dismissedByPress=!1;let{signal:r}=this.eventController;t&&(this.addToAriaLabelledBy(t,this.id),t.addEventListener(`blur`,this.handleBlur,{capture:!0,signal:r}),t.addEventListener(`focus`,this.handleFocus,{capture:!0,signal:r}),t.addEventListener(`click`,this.handleClick,{signal:r}),t.addEventListener(`mousedown`,this.handleMouseDown,{signal:r}),t.addEventListener(`mouseover`,this.handleMouseOver,{signal:r}),t.addEventListener(`mouseout`,this.handleMouseOut,{signal:r})),n&&(this.removeFromAriaLabelledBy(n,this.id),n.removeEventListener(`blur`,this.handleBlur,{capture:!0}),n.removeEventListener(`focus`,this.handleFocus,{capture:!0}),n.removeEventListener(`click`,this.handleClick),n.removeEventListener(`mousedown`,this.handleMouseDown),n.removeEventListener(`mouseover`,this.handleMouseOver),n.removeEventListener(`mouseout`,this.handleMouseOut)),this.anchor=t}async handleOptionsChange(){this.hasUpdated&&(await this.updateComplete,this.popup.reposition())}handleDisabledChange(){this.disabled&&this.open&&this.hide()}async show(){if(!this.open)return this.open=!0,_(this,`wa-after-show`)}async hide(){if(this.open)return this.open=!1,_(this,`wa-after-hide`)}render(){return e`
      <wa-popup
        part="base tooltip"
        exportparts="
          popup:base__popup,
          arrow:base__arrow
        "
        class=${l({tooltip:!0,"tooltip-open":this.open})}
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        flip
        shift
        ?arrow=${!this.withoutArrow}
        hover-bridge
        .anchor=${this.anchor}
      >
        <div part="body" class="body">
          <slot></slot>
        </div>
      </wa-popup>
    `}};G.css=U,G.dependencies={"wa-popup":T},o([f(`slot:not([name])`)],G.prototype,`defaultSlot`,2),o([f(`.body`)],G.prototype,`body`,2),o([f(`wa-popup`)],G.prototype,`popup`,2),o([i()],G.prototype,`placement`,2),o([i({type:Boolean,reflect:!0})],G.prototype,`disabled`,2),o([i({type:Number})],G.prototype,`distance`,2),o([i({type:Boolean,reflect:!0})],G.prototype,`open`,2),o([i({type:Number})],G.prototype,`skidding`,2),o([i({attribute:`show-delay`,type:Number})],G.prototype,`showDelay`,2),o([i({attribute:`hide-delay`,type:Number})],G.prototype,`hideDelay`,2),o([i()],G.prototype,`trigger`,2),o([i({attribute:`without-arrow`,type:Boolean,reflect:!0})],G.prototype,`withoutArrow`,2),o([i()],G.prototype,`for`,2),o([s()],G.prototype,`anchor`,2),o([p(`open`,{waitUntilFirstUpdate:!0})],G.prototype,`handleOpenChange`,1),o([p(`for`)],G.prototype,`handleForChange`,1),o([p([`distance`,`placement`,`skidding`])],G.prototype,`handleOptionsChange`,1),o([p(`disabled`)],G.prototype,`handleDisabledChange`,1),G=o([n(`wa-tooltip`)],G);export{A as n,k as t};