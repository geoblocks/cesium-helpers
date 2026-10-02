import{a as e,u as t}from"./lit-BFn1CURT.js";import{a as n,c as r,i,n as a,o,r as s,s as c,t as l}from"./card-BcpQSzF3.js";import{a as u,c as d,d as f,o as p,s as m}from"./directive-helpers-B0KETb9i.js";import{n as h}from"./switch-PsQ7BZQb.js";import{t as g}from"./style-map-ly-_uhSr.js";function _(e,t){return{top:Math.round(e.getBoundingClientRect().top-t.getBoundingClientRect().top),left:Math.round(e.getBoundingClientRect().left-t.getBoundingClientRect().left)}}function v(e,t){let n=t.getBoundingClientRect();return e.clientX>=n.left&&e.clientX<=n.right&&e.clientY>=n.top&&e.clientY<=n.bottom}var y=new Set;function b(){let e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function x(){let e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,``));return isNaN(e)||!e?0:e}function S(e){if(y.add(e),!document.documentElement.classList.contains(`wa-scroll-lock`)){let e=b()+x(),t=getComputedStyle(document.documentElement).scrollbarGutter;(!t||t===`auto`)&&(t=`stable`),e<2&&(t=``),document.documentElement.style.setProperty(`--wa-scroll-lock-gutter`,t),document.documentElement.classList.add(`wa-scroll-lock`),document.documentElement.style.setProperty(`--wa-scroll-lock-size`,`${e}px`)}}function C(e){y.delete(e),y.size===0&&(document.documentElement.classList.remove(`wa-scroll-lock`),document.documentElement.style.removeProperty(`--wa-scroll-lock-size`))}function w(e,t,n=`vertical`,r=`smooth`){let i=_(e,t),a=i.top+t.scrollTop,o=i.left+t.scrollLeft,s=t.scrollLeft,c=t.scrollLeft+t.offsetWidth,l=t.scrollTop,u=t.scrollTop+t.offsetHeight;(n===`horizontal`||n===`both`)&&(o<s?t.scrollTo({left:o,behavior:r}):o+e.clientWidth>c&&t.scrollTo({left:o-t.offsetWidth+e.clientWidth,behavior:r})),(n===`vertical`||n===`both`)&&(a<l?t.scrollTo({top:a,behavior:r}):a+e.clientHeight>u&&t.scrollTo({top:a-t.offsetHeight+e.clientHeight,behavior:r}))}var T=class extends Event{constructor(){super(`wa-show`,{bubbles:!0,cancelable:!0,composed:!0})}},E=class extends Event{constructor(e){super(`wa-hide`,{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}},ee=class extends Event{constructor(){super(`wa-after-hide`,{bubbles:!0,cancelable:!1,composed:!0})}},te=class extends Event{constructor(){super(`wa-after-show`,{bubbles:!0,cancelable:!1,composed:!0})}},D=[];function O(e){k(e),D.push(e)}function k(e){for(let t=D.length-1;t>=0;t--)if(D[t]===e){D.splice(t,1);break}}function A(e){return D.length>0&&D[D.length-1]===e}async function ne(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function re(e,t){return new Promise(n=>{let r=new AbortController,{signal:i}=r;if(e.classList.contains(t))return;e.classList.add(t);let a=!1,o=()=>{a||(a=!0,e.classList.remove(t),n(),r.abort())};e.addEventListener(`animationend`,o,{once:!0,signal:i}),e.addEventListener(`animationcancel`,o,{once:!0,signal:i}),requestAnimationFrame(()=>{!a&&e.getAnimations().length===0&&o()})})}function ie(e){return e=e.toString().toLowerCase(),e.indexOf(`ms`)>-1?parseFloat(e)||0:e.indexOf(`s`)>-1?(parseFloat(e)||0)*1e3:parseFloat(e)||0}var ae=`useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict`,oe=(e=21)=>{let t=``,n=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=ae[n[e]&63];return t};function j(e,t,n){return(e=>Object.is(e,-0)?0:e)(e<t?t:e>n?n:e)}function se(e=``){return`${e}${oe()}`}var ce=(e={})=>{let{validationElement:t,validationProperty:n}=e;t||typeof document<`u`&&`createElement`in document&&(t=Object.assign(document.createElement(`input`),{required:!0})),n||=`value`;let r={observedAttributes:[`required`],message:t?.validationMessage,checkValidity(e){let t={message:``,isValid:!0,invalidKeys:[]};return(e.required??e.hasAttribute(`required`))&&(e[n]||(t.message=typeof r.message==`function`?r.message(e):r.message||``,t.isValid=!1,t.invalidKeys.push(`valueMissing`))),t}};return r};function le(e,t){return new Promise(n=>{function r(i){i.target===e&&(e.removeEventListener(t,r),n())}e.addEventListener(t,r)})}var ue=class extends Event{constructor(){super(`wa-reposition`,{bubbles:!0,cancelable:!1,composed:!0})}},de=t`
  :host {
    --arrow-color: black;
    --arrow-size: var(--wa-tooltip-arrow-size);
    --popup-border-width: 0px;
    --show-duration: var(--wa-transition-fast);
    --hide-duration: var(--wa-transition-fast);

    /*
     * These properties are computed to account for the arrow's dimensions after being rotated 45º. The constant
     * 0.7071 is derived from sin(45) to calculate the length of the arrow after rotation.
     *
     * The diamond will be translated inward by --arrow-base-offset, the border thickness, to centralise it on
     * the inner edge of the popup border. This also means we need to increase the size of the arrow by the
     * same amount to compensate.
     *
     * A diamond shaped clipping mask is used to avoid overlap of popup content. This extends slightly inward so
     * the popup border is covered with no sub-pixel rounding artifacts. The diamond corners are mitred at 22.5º
     * to properly merge any arrow border with the popup border. The constant 1.4142 is derived from 1 + tan(22.5).
     *
     */
    --arrow-base-offset: var(--popup-border-width);
    --arrow-size-diagonal: calc((var(--arrow-size) + var(--arrow-base-offset)) * 0.7071);
    --arrow-padding-offset: calc(var(--arrow-size-diagonal) - var(--arrow-size));
    --arrow-size-div: calc(var(--arrow-size-diagonal) * 2);
    --arrow-clipping-corner: calc(var(--arrow-base-offset) * 1.4142);

    display: contents;
  }

  .popup {
    position: absolute;
    isolation: isolate;
    max-width: var(--auto-size-available-width, none);
    max-height: var(--auto-size-available-height, none);

    /* Clear UA styles for [popover] */
    :where(&) {
      inset: unset;
      padding: unset;
      margin: unset;
      width: unset;
      height: unset;
      color: unset;
      background: unset;
      border: unset;
      overflow: unset;
    }
  }

  .popup-fixed {
    position: fixed;
  }

  .popup:not(.popup-active) {
    display: none;
  }

  .arrow {
    position: absolute;
    width: var(--arrow-size-div);
    height: var(--arrow-size-div);
    background: var(--arrow-color);
    z-index: 3;
    clip-path: polygon(
      var(--arrow-clipping-corner) 100%,
      var(--arrow-base-offset) calc(100% - var(--arrow-base-offset)),
      calc(var(--arrow-base-offset) - 2px) calc(100% - var(--arrow-base-offset)),
      calc(100% - var(--arrow-base-offset)) calc(var(--arrow-base-offset) - 2px),
      calc(100% - var(--arrow-base-offset)) var(--arrow-base-offset),
      100% var(--arrow-clipping-corner),
      100% 100%
    );
    rotate: 45deg;
  }

  :host([data-current-placement|='left']) .arrow {
    rotate: -45deg;
  }

  :host([data-current-placement|='right']) .arrow {
    rotate: 135deg;
  }

  :host([data-current-placement|='bottom']) .arrow {
    rotate: 225deg;
  }

  /* Hover bridge */
  .popup-hover-bridge:not(.popup-hover-bridge-visible) {
    display: none;
  }

  .popup-hover-bridge {
    position: fixed;
    z-index: 899;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--hover-bridge-top-left-x, 0) var(--hover-bridge-top-left-y, 0),
      var(--hover-bridge-top-right-x, 0) var(--hover-bridge-top-right-y, 0),
      var(--hover-bridge-bottom-right-x, 0) var(--hover-bridge-bottom-right-y, 0),
      var(--hover-bridge-bottom-left-x, 0) var(--hover-bridge-bottom-left-y, 0)
    );
  }

  /* Built-in animations */
  .show {
    animation: show var(--show-duration) ease;
  }

  .hide {
    animation: show var(--hide-duration) ease reverse;
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .show-with-scale {
    animation: show-with-scale var(--show-duration) ease;
  }

  .hide-with-scale {
    animation: show-with-scale var(--hide-duration) ease reverse;
  }

  @keyframes show-with-scale {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }
`,M=Math.min,N=Math.max,fe=Math.round,pe=Math.floor,P=e=>({x:e,y:e}),me={left:`right`,right:`left`,bottom:`top`,top:`bottom`};function he(e,t,n){return N(e,M(t,n))}function F(e,t){return typeof e==`function`?e(t):e}function I(e){return e.split(`-`)[0]}function L(e){return e.split(`-`)[1]}function ge(e){return e===`x`?`y`:`x`}function _e(e){return e===`y`?`height`:`width`}function R(e){let t=e[0];return t===`t`||t===`b`?`y`:`x`}function ve(e){return ge(R(e))}function ye(e,t,n){n===void 0&&(n=!1);let r=L(e),i=ve(e),a=_e(i),o=i===`x`?r===(n?`end`:`start`)?`right`:`left`:r===`start`?`bottom`:`top`;return t.reference[a]>t.floating[a]&&(o=Oe(o)),[o,Oe(o)]}function be(e){let t=Oe(e);return[xe(e),t,xe(t)]}function xe(e){return e.includes(`start`)?e.replace(`start`,`end`):e.replace(`end`,`start`)}var Se=[`left`,`right`],Ce=[`right`,`left`],we=[`top`,`bottom`],Te=[`bottom`,`top`];function Ee(e,t,n){switch(e){case`top`:case`bottom`:return n?t?Ce:Se:t?Se:Ce;case`left`:case`right`:return t?we:Te;default:return[]}}function De(e,t,n,r){let i=L(e),a=Ee(I(e),n===`start`,r);return i&&(a=a.map(e=>e+`-`+i),t&&(a=a.concat(a.map(xe)))),a}function Oe(e){let t=I(e);return me[t]+e.slice(t.length)}function ke(e){return{top:e.top??0,right:e.right??0,bottom:e.bottom??0,left:e.left??0}}function Ae(e){return typeof e==`number`?{top:e,right:e,bottom:e,left:e}:ke(e)}function je(e){let{x:t,y:n,width:r,height:i}=e;return{width:r,height:i,top:n,left:t,right:t+r,bottom:n+i,x:t,y:n}}function Me(e,t,n){let{reference:r,floating:i}=e,a=R(t),o=ve(t),s=_e(o),c=I(t),l=a===`y`,u=r.x+r.width/2-i.width/2,d=r.y+r.height/2-i.height/2,f=r[s]/2-i[s]/2,p;switch(c){case`top`:p={x:u,y:r.y-i.height};break;case`bottom`:p={x:u,y:r.y+r.height};break;case`right`:p={x:r.x+r.width,y:d};break;case`left`:p={x:r.x-i.width,y:d};break;default:p={x:r.x,y:r.y}}let m=L(t);return m&&(p[o]+=f*(m===`end`?1:-1)*(n&&l?-1:1)),p}async function Ne(e,t){t===void 0&&(t={});let{x:n,y:r,platform:i,rects:a,elements:o,strategy:s}=e,{boundary:c=`clippingAncestors`,rootBoundary:l=`viewport`,elementContext:u=`floating`,altBoundary:d=!1,padding:f=0}=F(t,e),p=Ae(f),m=o[d?u===`floating`?`reference`:`floating`:u],h=je(await i.getClippingRect({element:await(i.isElement==null?void 0:i.isElement(m))??!0?m:m.contextElement||await(i.getDocumentElement==null?void 0:i.getDocumentElement(o.floating)),boundary:c,rootBoundary:l,strategy:s})),g=u===`floating`?{x:n,y:r,width:a.floating.width,height:a.floating.height}:a.reference,_=await(i.getOffsetParent==null?void 0:i.getOffsetParent(o.floating)),v=await(i.isElement==null?void 0:i.isElement(_))&&await(i.getScale==null?void 0:i.getScale(_))||{x:1,y:1},y=je(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({elements:o,rect:g,offsetParent:_,strategy:s}):g);return{top:(h.top-y.top+p.top)/v.y,bottom:(y.bottom-h.bottom+p.bottom)/v.y,left:(h.left-y.left+p.left)/v.x,right:(y.right-h.right+p.right)/v.x}}var Pe=50,Fe=async(e,t,n)=>{let{placement:r=`bottom`,strategy:i=`absolute`,middleware:a=[],platform:o}=n,s=o.detectOverflow?o:{...o,detectOverflow:Ne},c=await(o.isRTL==null?void 0:o.isRTL(t)),l=await o.getElementRects({reference:e,floating:t,strategy:i}),{x:u,y:d}=Me(l,r,c),f=r,p=0,m={};for(let n=0;n<a.length;n++){let h=a[n];if(!h)continue;let{name:g,fn:_}=h,{x:v,y,data:b,reset:x}=await _({x:u,y:d,initialPlacement:r,placement:f,strategy:i,middlewareData:m,rects:l,platform:s,elements:{reference:e,floating:t}});u=v??u,d=y??d,m[g]={...m[g],...b},x&&p<Pe&&(p++,typeof x==`object`&&(x.placement&&(f=x.placement),x.rects&&(l=x.rects===!0?await o.getElementRects({reference:e,floating:t,strategy:i}):x.rects),{x:u,y:d}=Me(l,f,c)),n=-1)}return{x:u,y:d,placement:f,strategy:i,middlewareData:m}},Ie=e=>({name:`arrow`,options:e,async fn(t){let{x:n,y:r,placement:i,rects:a,platform:o,elements:s,middlewareData:c}=t,{element:l,padding:u=0}=F(e,t)||{};if(l==null)return{};let d=Ae(u),f={x:n,y:r},p=ve(i),m=_e(p),h=await o.getDimensions(l),g=p===`y`,_=g?`top`:`left`,v=g?`bottom`:`right`,y=g?`clientHeight`:`clientWidth`,b=a.reference[m]+a.reference[p]-f[p]-a.floating[m],x=f[p]-a.reference[p],S=await(o.getOffsetParent==null?void 0:o.getOffsetParent(l)),C=S?S[y]:0;(!C||!await(o.isElement==null?void 0:o.isElement(S)))&&(C=s.floating[y]||a.floating[m]);let w=b/2-x/2,T=C/2-h[m]/2-1,E=M(d[_],T),ee=M(d[v],T),te=C-h[m]-ee,D=C/2-h[m]/2+w,O=he(E,D,te),k=!c.arrow&&L(i)!=null&&D!==O&&a.reference[m]/2-(D<E?E:ee)-h[m]/2<0,A=k?D<E?D-E:D-te:0;return{[p]:f[p]+A,data:{[p]:O,centerOffset:D-O-A,...k&&{alignmentOffset:A}},reset:k}}}),Le=function(e){return e===void 0&&(e={}),{name:`flip`,options:e,async fn(t){var n;let{placement:r,middlewareData:i,rects:a,initialPlacement:o,platform:s,elements:c}=t,{mainAxis:l=!0,crossAxis:u=!0,fallbackPlacements:d,fallbackStrategy:f=`bestFit`,fallbackAxisSideDirection:p=`none`,flipAlignment:m=!0,...h}=F(e,t);if((n=i.arrow)!=null&&n.alignmentOffset)return{};let g=I(r),_=R(o),v=I(o)===o,y=await(s.isRTL==null?void 0:s.isRTL(c.floating)),b=d||(v||!m?[Oe(o)]:be(o)),x=p!==`none`;!d&&x&&b.push(...De(o,m,p,y));let S=[o,...b],C=await s.detectOverflow(t,h),w=[],T=i.flip?.overflows||[];if(l&&w.push(C[g]),u){let e=ye(r,a,y);w.push(C[e[0]],C[e[1]])}if(T=[...T,{placement:r,overflows:w}],!w.every(e=>e<=0)){let e=(i.flip?.index||0)+1,t=S[e];if(t&&(u!==`alignment`||_===R(t)||T.every(e=>R(e.placement)!==_||e.overflows[0]>0)))return{data:{index:e,overflows:T},reset:{placement:t}};let n=T.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0]?.placement;if(!n)switch(f){case`bestFit`:{let e=T.filter(e=>{if(x){let t=R(e.placement);return t===_||t===`y`}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0]?.[0];e&&(n=e);break}case`initialPlacement`:n=o}if(r!==n)return{reset:{placement:n}}}return{}}}},Re=new Set([`left`,`top`]);async function ze(e,t){let{placement:n,platform:r,elements:i}=e,a=await(r.isRTL==null?void 0:r.isRTL(i.floating)),o=I(n),s=L(n),c=R(n)===`y`,l=Re.has(o)?-1:1,u=a&&c?-1:1,d=F(t,e),{mainAxis:f,crossAxis:p,alignmentAxis:m}=typeof d==`number`?{mainAxis:d,crossAxis:0,alignmentAxis:null}:{mainAxis:d.mainAxis||0,crossAxis:d.crossAxis||0,alignmentAxis:d.alignmentAxis};return s&&typeof m==`number`&&(p=s===`end`?m*-1:m),c?{x:p*u,y:f*l}:{x:f*l,y:p*u}}var Be=function(e){return e===void 0&&(e=0),{name:`offset`,options:e,async fn(t){var n;let{x:r,y:i,placement:a,middlewareData:o}=t,s=await ze(t,e);return a===o.offset?.placement&&(n=o.arrow)!=null&&n.alignmentOffset?{}:{x:r+s.x,y:i+s.y,data:{...s,placement:a}}}}},Ve=function(e){return e===void 0&&(e={}),{name:`shift`,options:e,async fn(t){let{x:n,y:r,placement:i,platform:a}=t,{mainAxis:o=!0,crossAxis:s=!1,limiter:c={fn:e=>{let{x:t,y:n}=e;return{x:t,y:n}}},...l}=F(e,t),u={x:n,y:r},d=await a.detectOverflow(t,l),f=R(i),p=ge(f),m=u[p],h=u[f],g=(e,t)=>he(t+d[e===`y`?`top`:`left`],t,t-d[e===`y`?`bottom`:`right`]);o&&(m=g(p,m)),s&&(h=g(f,h));let _=c.fn({...t,[p]:m,[f]:h});return{..._,data:{x:_.x-n,y:_.y-r,enabled:{[p]:o,[f]:s}}}}}},He=function(e){return e===void 0&&(e={}),{name:`size`,options:e,async fn(t){let{placement:n,rects:r,platform:i,elements:a}=t,{apply:o=()=>{},...s}=F(e,t),c=await i.detectOverflow(t,s),l=I(n),u=L(n),d=R(n)===`y`,{width:f,height:p}=r.floating,m,h;l===`top`||l===`bottom`?(m=l,h=u===(await(i.isRTL==null?void 0:i.isRTL(a.floating))?`start`:`end`)?`left`:`right`):(h=l,m=u===`end`?`top`:`bottom`);let g=p-c.top-c.bottom,_=f-c.left-c.right,v=M(p-c[m],g),y=M(f-c[h],_),b=t.middlewareData.shift,x=!b,S=v,C=y;b!=null&&b.enabled.x&&(C=_),b!=null&&b.enabled.y&&(S=g),x&&!u&&(d?C=f-2*N(c.left,c.right):S=p-2*N(c.top,c.bottom)),await o({...t,availableWidth:C,availableHeight:S});let w=await i.getDimensions(a.floating);return f!==w.width||p!==w.height?{reset:{rects:!0}}:{}}}};function Ue(){return typeof window<`u`}function z(e){return We(e)?(e.nodeName||``).toLowerCase():`#document`}function B(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function V(e){return((We(e)?e.ownerDocument:e.document)||window.document)?.documentElement}function We(e){return Ue()?e instanceof Node||e instanceof B(e).Node:!1}function H(e){return Ue()?e instanceof Element||e instanceof B(e).Element:!1}function U(e){return Ue()?e instanceof HTMLElement||e instanceof B(e).HTMLElement:!1}function Ge(e){return!Ue()||typeof ShadowRoot>`u`?!1:e instanceof ShadowRoot||e instanceof B(e).ShadowRoot}function Ke(e){let{overflow:t,overflowX:n,overflowY:r,display:i}=K(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+n)&&i!==`inline`&&i!==`contents`}function qe(e){return/^(table|td|th)$/.test(z(e))}function Je(e){try{if(e.matches(`:popover-open`))return!0}catch{}try{return e.matches(`:modal`)}catch{return!1}}var Ye=/transform|translate|scale|rotate|perspective|filter/,Xe=/paint|layout|strict|content/,W=e=>!!e&&e!==`none`,Ze;function Qe(e){let t=H(e)?K(e):e;return W(t.transform)||W(t.translate)||W(t.scale)||W(t.rotate)||W(t.perspective)||!et()&&(W(t.backdropFilter)||W(t.filter))||Ye.test(t.willChange||``)||Xe.test(t.contain||``)}function $e(e){let t=q(e);for(;U(t)&&!G(t);){if(Qe(t))return t;if(Je(t))return null;t=q(t)}return null}function et(){return Ze??=typeof CSS<`u`&&CSS.supports&&CSS.supports(`-webkit-backdrop-filter`,`none`),Ze}function G(e){return/^(html|body|#document)$/.test(z(e))}function K(e){return B(e).getComputedStyle(e)}function tt(e){return H(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function q(e){if(z(e)===`html`)return e;let t=e.assignedSlot||e.parentNode||Ge(e)&&e.host||V(e);return Ge(t)?t.host:t}function nt(e){let t=q(e);return G(t)?(e.ownerDocument||e).body:U(t)&&Ke(t)?t:nt(t)}function J(e,t,n){t===void 0&&(t=[]),n===void 0&&(n=!0);let r=nt(e),i=r===e.ownerDocument?.body,a=B(r);if(i){let e=rt(a);return t.concat(a,a.visualViewport||[],Ke(r)?r:[],e&&n?J(e):[])}return t.concat(r,J(r,[],n))}function rt(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function it(e){let t=K(e),n=parseFloat(t.width)||0,r=parseFloat(t.height)||0,i=U(e),a=i?e.offsetWidth:n,o=i?e.offsetHeight:r,s=fe(n)!==a||fe(r)!==o;return s&&(n=a,r=o),{width:n,height:r,$:s}}function at(e){return H(e)?e:e.contextElement}function Y(e){let t=at(e);if(!U(t))return P(1);let n=t.getBoundingClientRect(),{width:r,height:i,$:a}=it(t),o=(a?fe(n.width):n.width)/r,s=(a?fe(n.height):n.height)/i;return(!o||!Number.isFinite(o))&&(o=1),(!s||!Number.isFinite(s))&&(s=1),{x:o,y:s}}var ot=P(0);function st(e){let t=B(e);return!et()||!t.visualViewport?ot:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function ct(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===B(e)}function X(e,t,n,r){t===void 0&&(t=!1),n===void 0&&(n=!1);let i=e.getBoundingClientRect(),a=at(e),o=P(1);t&&(r?H(r)&&(o=Y(r)):o=Y(e));let s=ct(a,n,r)?st(a):P(0),c=(i.left+s.x)/o.x,l=(i.top+s.y)/o.y,u=i.width/o.x,d=i.height/o.y;if(a&&r){let e=B(a),t=H(r)?B(r):r,n=e,i=rt(n);for(;i&&t!==n;){let e=Y(i),t=i.getBoundingClientRect(),r=K(i),a=t.left+(i.clientLeft+parseFloat(r.paddingLeft))*e.x,o=t.top+(i.clientTop+parseFloat(r.paddingTop))*e.y;c*=e.x,l*=e.y,u*=e.x,d*=e.y,c+=a,l+=o,n=B(i),i=rt(n)}}return je({width:u,height:d,x:c,y:l})}function lt(e,t){let n=tt(e).scrollLeft;return t?t.left+n:X(V(e)).left+n}function ut(e,t){let n=e.getBoundingClientRect();return{x:n.left+t.scrollLeft-lt(e,n),y:n.top+t.scrollTop}}function dt(e){let{elements:t,rect:n,offsetParent:r,strategy:i}=e,a=i===`fixed`,o=V(r),s=t?Je(t.floating):!1;if(r===o||s&&a)return n;let c={scrollLeft:0,scrollTop:0},l=P(1),u=P(0),d=U(r);if((d||!a)&&((z(r)!==`body`||Ke(o))&&(c=tt(r)),d)){let e=X(r);l=Y(r),u.x=e.x+r.clientLeft,u.y=e.y+r.clientTop}let f=o&&!d&&!a?ut(o,c):P(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-c.scrollLeft*l.x+u.x+f.x,y:n.y*l.y-c.scrollTop*l.y+u.y+f.y}}function ft(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function pt(e){let t=tt(e),n=e.ownerDocument.body,r=N(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),i=N(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight),a=-t.scrollLeft+lt(e),o=-t.scrollTop;return K(n).direction===`rtl`&&(a+=N(e.clientWidth,n.clientWidth)-r),{width:r,height:i,x:a,y:o}}var mt=25;function ht(e,t,n){n===void 0&&(n=`viewport`);let r=n===`layoutViewport`,i=B(e),a=V(e),o=i.visualViewport,s=a.clientWidth,c=a.clientHeight,l=0,u=0;if(o){let e=!et()||t===`fixed`;r?e||(l=-o.offsetLeft,u=-o.offsetTop):(s=o.width,c=o.height,e&&(l=o.offsetLeft,u=o.offsetTop))}if(lt(a)<=0){let e=a.ownerDocument,t=e.body,n=getComputedStyle(t),r=e.compatMode===`CSS1Compat`&&parseFloat(n.marginLeft)+parseFloat(n.marginRight)||0,i=Math.abs(a.clientWidth-t.clientWidth-r),o=getComputedStyle(a).scrollbarGutter===`stable both-edges`?i/2:i;o<=mt&&(s-=o)}return{width:s,height:c,x:l,y:u}}function gt(e,t){let n=X(e,!0,t===`fixed`),r=n.top+e.clientTop,i=n.left+e.clientLeft,a=Y(e);return{width:e.clientWidth*a.x,height:e.clientHeight*a.y,x:i*a.x,y:r*a.y}}function _t(e,t,n){let r;if(t===`viewport`||t===`layoutViewport`)r=ht(e,n,t);else if(t===`document`)r=pt(V(e));else if(H(t))r=gt(t,n);else{let n=st(e);r={x:t.x-n.x,y:t.y-n.y,width:t.width,height:t.height}}return je(r)}function vt(e,t){let n=t.get(e);if(n)return n;let r=J(e,[],!1).filter(e=>H(e)&&z(e)!==`body`),i=null,a=K(e).position===`fixed`,o=a?q(e):e;for(;H(o)&&!G(o);){let e=K(o),t=Qe(o),n=i?i.position:a?`fixed`:``;!t&&(n===`fixed`||n===`absolute`&&e.position===`static`)?r=r.filter(e=>e!==o):i=e,o=q(o)}return t.set(e,r),r}function yt(e){let{element:t,boundary:n,rootBoundary:r,strategy:i}=e,a=[...n===`clippingAncestors`?Je(t)?[]:vt(t,this._c):[].concat(n),r],o=_t(t,a[0],i),s=o.top,c=o.right,l=o.bottom,u=o.left;for(let e=1;e<a.length;e++){let n=_t(t,a[e],i);s=N(n.top,s),c=M(n.right,c),l=M(n.bottom,l),u=N(n.left,u)}return{width:c-u,height:l-s,x:u,y:s}}function bt(e){let{width:t,height:n}=it(e);return{width:t,height:n}}function xt(e,t,n){let r=U(t),i=V(t),a=n===`fixed`,o=X(e,!0,a,t),s={scrollLeft:0,scrollTop:0},c=P(0);if((r||!a)&&((z(t)!==`body`||Ke(i))&&(s=tt(t)),r)){let e=X(t,!0,a,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}!r&&i&&(c.x=lt(i));let l=i&&!r&&!a?ut(i,s):P(0);return{x:o.left+s.scrollLeft-c.x-l.x,y:o.top+s.scrollTop-c.y-l.y,width:o.width,height:o.height}}function St(e){return K(e).position===`static`}function Ct(e,t){if(!U(e)||K(e).position===`fixed`)return null;if(t)return t(e);let n=e.offsetParent;return V(e)===n&&(n=n.ownerDocument.body),n}function wt(e,t){let n=B(e);if(Je(e))return n;if(!U(e)){let t=q(e);for(;t&&!G(t);){if(H(t)&&!St(t))return t;t=q(t)}return n}let r=Ct(e,t);for(;r&&qe(r)&&St(r);)r=Ct(r,t);return r&&G(r)&&St(r)&&!Qe(r)?n:r||$e(e)||n}var Tt=async function(e){let t=this.getOffsetParent||wt,n=this.getDimensions,r=await n(e.floating);return{reference:xt(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}};function Et(e){return K(e).direction===`rtl`}var Dt={convertOffsetParentRelativeRectToViewportRelativeRect:dt,getDocumentElement:V,getClippingRect:yt,getOffsetParent:wt,getElementRects:Tt,getClientRects:ft,getDimensions:bt,getScale:Y,isElement:H,isRTL:Et};function Ot(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function kt(e,t,n){let r=null,i,a=V(e);function o(){var e;clearTimeout(i),(e=r)==null||e.disconnect(),r=null}function s(n,c){n===void 0&&(n=!1),c===void 0&&(c=1),o();let l=e.getBoundingClientRect(),{left:u,top:d,width:f,height:p}=l;if(n||t(),!f||!p)return;let m=pe(d),h=pe(a.clientWidth-(u+f)),g=pe(a.clientHeight-(d+p)),_=pe(u),v={rootMargin:-m+`px `+-h+`px `+-g+`px `+-_+`px`,threshold:N(0,M(1,c))||1},y=!0;function b(t){let n=t[0].intersectionRatio;if(!Ot(l,e.getBoundingClientRect()))return s();if(n!==c){if(!y)return s();n?s(!1,n):i=setTimeout(()=>{s(!1,1e-7)},1e3)}y=!1}try{r=new IntersectionObserver(b,{...v,root:a.ownerDocument})}catch{r=new IntersectionObserver(b,v)}r.observe(e)}let c=B(e),l=()=>s(n);return c.addEventListener(`resize`,l),s(!0),()=>{c.removeEventListener(`resize`,l),o()}}function At(e,t,n,r){r===void 0&&(r={});let{ancestorScroll:i=!0,ancestorResize:a=!0,elementResize:o=typeof ResizeObserver==`function`,layoutShift:s=typeof IntersectionObserver==`function`,animationFrame:c=!1}=r,l=at(e),u=i||a?[...l?J(l):[],...t?J(t):[]]:[];u.forEach(e=>{i&&e.addEventListener(`scroll`,n),a&&e.addEventListener(`resize`,n)});let d=l&&s?kt(l,n,a):null,f=-1,p=null;o&&(p=new ResizeObserver(e=>{let[r]=e;r&&r.target===l&&p&&t&&(p.unobserve(t),cancelAnimationFrame(f),f=requestAnimationFrame(()=>{var e;(e=p)==null||e.observe(t)})),n()}),l&&!c&&p.observe(l),t&&p.observe(t));let m,h=c?X(e):null;c&&g();function g(){let t=X(e);h&&!Ot(h,t)&&n(),h=t,m=requestAnimationFrame(g)}return n(),()=>{var e;u.forEach(e=>{i&&e.removeEventListener(`scroll`,n),a&&e.removeEventListener(`resize`,n)}),d?.(),(e=p)==null||e.disconnect(),p=null,c&&cancelAnimationFrame(m)}}var jt=Be,Mt=Ve,Nt=Le,Pt=He,Ft=Ie,It=(e,t,n)=>{let r=new Map,i=n??{},a={...Dt,...i.platform,_c:r};return Fe(e,t,{...i,platform:a})};function Lt(e){return zt(e)}function Rt(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function zt(e){for(let t=e;t;t=Rt(t))if(t instanceof Element&&getComputedStyle(t).display===`none`)return null;for(let t=Rt(e);t;t=Rt(t)){if(!(t instanceof Element))continue;let e=getComputedStyle(t);if(e.display!==`contents`&&(e.position!==`static`||Qe(e)||t.tagName===`BODY`))return t}return null}function Bt(e){return typeof e==`object`&&!!e&&`getBoundingClientRect`in e&&(`contextElement`in e?e instanceof Element:!0)}var Vt=!!globalThis?.HTMLElement?.prototype.hasOwnProperty(`popover`),Z=class extends a{constructor(){super(...arguments),this.localize=new u(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement=`top`,this.boundary=`viewport`,this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement=`anchor`,this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements=``,this.flipFallbackStrategy=`best-fit`,this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){let e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes(`top`)||this.placement.includes(`bottom`),r=0,i=0,a=0,o=0,s=0,c=0,l=0,u=0;n?e.top<t.top?(r=e.left,i=e.bottom,a=e.right,o=e.bottom,s=t.left,c=t.top,l=t.right,u=t.top):(r=t.left,i=t.bottom,a=t.right,o=t.bottom,s=e.left,c=e.top,l=e.right,u=e.top):e.left<t.left?(r=e.right,i=e.top,a=t.left,o=t.top,s=e.right,c=e.bottom,l=t.left,u=t.bottom):(r=t.right,i=t.top,a=e.left,o=e.top,s=t.right,c=t.bottom,l=e.left,u=e.bottom),this.style.setProperty(`--hover-bridge-top-left-x`,`${r}px`),this.style.setProperty(`--hover-bridge-top-left-y`,`${i}px`),this.style.setProperty(`--hover-bridge-top-right-x`,`${a}px`),this.style.setProperty(`--hover-bridge-top-right-y`,`${o}px`),this.style.setProperty(`--hover-bridge-bottom-left-x`,`${s}px`),this.style.setProperty(`--hover-bridge-bottom-left-y`,`${c}px`),this.style.setProperty(`--hover-bridge-bottom-right-x`,`${l}px`),this.style.setProperty(`--hover-bridge-bottom-right-y`,`${u}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=Vt,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has(`active`)&&(this.active?this.start():this.stop()),e.has(`anchor`)&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor==`string`){let e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchorEl=this.anchor instanceof Element||Bt(this.anchor)?this.anchor:this.querySelector(`[slot="anchor"]`);this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){this.anchorEl&&this.active&&this.isConnected&&(this.popup?.showPopover?.(),this.cleanup=At(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute(`data-current-placement`),this.style.removeProperty(`--auto-size-available-width`),this.style.removeProperty(`--auto-size-available-height`),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;let e=[jt({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(Pt({apply:({rects:e})=>{let t=this.sync===`width`||this.sync===`both`,n=this.sync===`height`||this.sync===`both`;this.popup.style.width=t?`${e.reference.width}px`:``,this.popup.style.height=n?`${e.reference.height}px`:``}})):(this.popup.style.width=``,this.popup.style.height=``);let t;this.SUPPORTS_POPOVER&&!Bt(this.anchor)&&this.boundary===`scroll`&&(t=J(this.anchorEl).filter(e=>e instanceof Element)),this.flip&&e.push(Nt({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy===`best-fit`?`bestFit`:`initialPlacement`,padding:this.flipPadding})),this.shift&&e.push(Mt({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(Pt({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:e,availableHeight:t})=>{this.autoSize===`vertical`||this.autoSize===`both`?this.style.setProperty(`--auto-size-available-height`,`${t}px`):this.style.removeProperty(`--auto-size-available-height`),this.autoSize===`horizontal`||this.autoSize===`both`?this.style.setProperty(`--auto-size-available-width`,`${e}px`):this.style.removeProperty(`--auto-size-available-width`)}})):(this.style.removeProperty(`--auto-size-available-width`),this.style.removeProperty(`--auto-size-available-height`)),this.arrow&&e.push(Ft({element:this.arrowEl,padding:this.arrowPadding}));let n=this.SUPPORTS_POPOVER?e=>Dt.getOffsetParent(e,Lt):Dt.getOffsetParent;It(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?`absolute`:`fixed`,platform:{...Dt,getOffsetParent:n}}).then(({x:e,y:t,middlewareData:n,placement:r})=>{let i=this.localize.dir()===`rtl`,a={top:`bottom`,right:`left`,bottom:`top`,left:`right`}[r.split(`-`)[0]];if(this.setAttribute(`data-current-placement`,r),Object.assign(this.popup.style,{left:`${e}px`,top:`${t}px`}),this.arrow){let e=n.arrow.x,t=n.arrow.y,r=``,o=``,s=``,c=``;if(this.arrowPlacement===`start`){let n=typeof e==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``;r=typeof t==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``,o=i?n:``,c=i?``:n}else if(this.arrowPlacement===`end`){let n=typeof e==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``;o=i?``:n,c=i?n:``,s=typeof t==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``}else this.arrowPlacement===`center`?(c=typeof e==`number`?`calc(50% - var(--arrow-size-diagonal))`:``,r=typeof t==`number`?`calc(50% - var(--arrow-size-diagonal))`:``):(c=typeof e==`number`?`${e}px`:``,r=typeof t==`number`?`${t}px`:``);Object.assign(this.arrowEl.style,{top:r,right:o,bottom:s,left:c,[a]:`calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))`})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new ue)}render(){return e`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${l({"popup-hover-bridge":!0,"popup-hover-bridge-visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        popover="manual"
        part="popup"
        class=${l({popup:!0,"popup-active":this.active,"popup-fixed":!this.SUPPORTS_POPOVER,"popup-has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?e`<div part="arrow" class="arrow" role="presentation"></div>`:``}
      </div>
    `}};Z.css=de,o([f(`.popup`)],Z.prototype,`popup`,2),o([f(`.arrow`)],Z.prototype,`arrowEl`,2),o([i({attribute:!1,type:Boolean})],Z.prototype,`SUPPORTS_POPOVER`,2),o([i()],Z.prototype,`anchor`,2),o([i({type:Boolean,reflect:!0})],Z.prototype,`active`,2),o([i({reflect:!0})],Z.prototype,`placement`,2),o([i()],Z.prototype,`boundary`,2),o([i({type:Number})],Z.prototype,`distance`,2),o([i({type:Number})],Z.prototype,`skidding`,2),o([i({type:Boolean})],Z.prototype,`arrow`,2),o([i({attribute:`arrow-placement`})],Z.prototype,`arrowPlacement`,2),o([i({attribute:`arrow-padding`,type:Number})],Z.prototype,`arrowPadding`,2),o([i({type:Boolean})],Z.prototype,`flip`,2),o([i({attribute:`flip-fallback-placements`,converter:{fromAttribute:e=>e.split(` `).map(e=>e.trim()).filter(e=>e!==``),toAttribute:e=>e.join(` `)}})],Z.prototype,`flipFallbackPlacements`,2),o([i({attribute:`flip-fallback-strategy`})],Z.prototype,`flipFallbackStrategy`,2),o([i({type:Object})],Z.prototype,`flipBoundary`,2),o([i({attribute:`flip-padding`,type:Number})],Z.prototype,`flipPadding`,2),o([i({type:Boolean})],Z.prototype,`shift`,2),o([i({type:Object})],Z.prototype,`shiftBoundary`,2),o([i({attribute:`shift-padding`,type:Number})],Z.prototype,`shiftPadding`,2),o([i({attribute:`auto-size`})],Z.prototype,`autoSize`,2),o([i()],Z.prototype,`sync`,2),o([i({type:Object})],Z.prototype,`autoSizeBoundary`,2),o([i({attribute:`auto-size-padding`,type:Number})],Z.prototype,`autoSizePadding`,2),o([i({attribute:`hover-bridge`,type:Boolean})],Z.prototype,`hoverBridge`,2),Z=o([n(`wa-popup`)],Z);var Ht=t`
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
`;function*Ut(e=document.activeElement){e!=null&&(yield e,`shadowRoot`in e&&e.shadowRoot&&e.shadowRoot.mode!==`closed`&&(yield*Ut(e.shadowRoot.activeElement)))}function Wt(e,t){let n=e.metaKey||e.ctrlKey||e.shiftKey||e.altKey;e.key===`Enter`&&!n&&setTimeout(()=>{!e.defaultPrevented&&!e.isComposing&&Jt(t)})}var Gt=new Map([[`input`,!0],[`wa-input`,!0],[`wa-tag-input`,!0],[`wa-number-input`,!0],[`wa-otp-input`,!0],[`wa-slider`,!0]]),Kt=new Map([[`button`,!1],[`checkbox`,!1],[`color`,!1],[`date`,!1],[`datetime-local`,!1],[`email`,!0],[`file`,!1],[`hidden`,!1],[`image`,!1],[`month`,!1],[`number`,!0],[`password`,!0],[`radio`,!1],[`range`,!1],[`reset`,!0],[`search`,!0],[`submit`,!1],[`tel`,!0],[`text`,!0],[`time`,!1],[`url`,!0],[`week`,!1]]),qt=e=>{let t=e?.localName;if(!t||!Gt.get(t))return!1;if(t!==`input`&&t!==`wa-input`)return!0;let n=e.type;return!!Kt.get(n)};function Jt(e){let t=null;if(`form`in e&&(t=e.form),!t&&`getForm`in e&&(t=e.getForm()),!t)return;let n=Array.from(t.elements),r=0;for(let e of n)qt(e)&&(r+=1);if(r===1){t.requestSubmit(null);return}let i=n.find(e=>e.type===`submit`&&!e.matches(`:disabled`));i&&([`input`,`button`].includes(i.localName)?t.requestSubmit(i):i.click())}var Yt=typeof window<`u`&&`ontouchstart`in window,Xt=class{constructor(e,t){this.isActive=!1,this.isDragging=!1,this.handleDragStart=e=>{let t=`touches`in e?e.touches[0].clientX:e.clientX,n=`touches`in e?e.touches[0].clientY:e.clientY;this.isDragging||!Yt&&e.buttons>1||(this.isDragging=!0,document.addEventListener(`pointerup`,this.handleDragStop),document.addEventListener(`pointermove`,this.handleDragMove),document.addEventListener(`pointercancel`,this.handleDragStop),document.addEventListener(`touchend`,this.handleDragStop),document.addEventListener(`touchmove`,this.handleDragMove),document.addEventListener(`touchcancel`,this.handleDragStop),this.options.start(t,n))},this.handleDragStop=e=>{let t=`changedTouches`in e?e.changedTouches[0].clientX:e.clientX,n=`changedTouches`in e?e.changedTouches[0].clientY:e.clientY;this.isDragging=!1,document.removeEventListener(`pointerup`,this.handleDragStop),document.removeEventListener(`pointermove`,this.handleDragMove),document.removeEventListener(`pointercancel`,this.handleDragStop),document.removeEventListener(`touchend`,this.handleDragStop),document.removeEventListener(`touchmove`,this.handleDragMove),document.removeEventListener(`touchcancel`,this.handleDragStop),this.options.stop(t,n)},this.handleDragMove=e=>{let t=`touches`in e?e.touches[0].clientX:e.clientX,n=`touches`in e?e.touches[0].clientY:e.clientY;window.getSelection()?.removeAllRanges(),this.options.move(t,n)},this.element=e,this.options={start:()=>void 0,stop:()=>void 0,move:()=>void 0,...t},this.start()}start(){this.isActive||=(this.element.addEventListener(`pointerdown`,this.handleDragStart),Yt&&this.element.addEventListener(`touchstart`,this.handleDragStart),!0)}stop(){document.removeEventListener(`pointerup`,this.handleDragStop),document.removeEventListener(`pointermove`,this.handleDragMove),document.removeEventListener(`pointercancel`,this.handleDragStop),document.removeEventListener(`touchend`,this.handleDragStop),document.removeEventListener(`touchmove`,this.handleDragMove),document.removeEventListener(`touchcancel`,this.handleDragStop),this.element.removeEventListener(`pointerdown`,this.handleDragStart),Yt&&this.element.removeEventListener(`touchstart`,this.handleDragStart),this.isActive=!1,this.isDragging=!1}toggle(e){(e===void 0?!this.isActive:e)?this.start():this.stop()}};function Zt(e,t,n){let r=(e-t)/n;return Math.abs(r-Math.round(r))>1e-9}var Qt=()=>({observedAttributes:[`min`,`max`,`step`],checkValidity(e){let t={message:``,isValid:!0,invalidKeys:[]},n=(e,t,n,r)=>{if(typeof document>`u`)return``;let i=document.createElement(`input`);return i.type=`range`,i.min=String(t),i.max=String(n),i.step=String(r),i.value=String(e),i.checkValidity(),i.validationMessage};if(e.isRange){let r=e.minValue,i=e.maxValue;if(r<e.min)return t.isValid=!1,t.invalidKeys.push(`rangeUnderflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be greater than or equal to ${e.min}.`,t;if(i>e.max)return t.isValid=!1,t.invalidKeys.push(`rangeOverflow`),t.message=n(i,e.min,e.max,e.step)||`Value must be less than or equal to ${e.max}.`,t;if(e.step&&e.step!==1){let a=Zt(r,e.min,e.step),o=Zt(i,e.min,e.step);if(a||o)return t.isValid=!1,t.invalidKeys.push(`stepMismatch`),t.message=n(a?r:i,e.min,e.max,e.step)||`Value must be a multiple of ${e.step}.`,t}}else{let r=e.value;if(r<e.min)return t.isValid=!1,t.invalidKeys.push(`rangeUnderflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be greater than or equal to ${e.min}.`,t;if(r>e.max)return t.isValid=!1,t.invalidKeys.push(`rangeOverflow`),t.message=n(r,e.min,e.max,e.step)||`Value must be less than or equal to ${e.max}.`,t;if(e.step&&e.step!==1&&Zt(r,e.min,e.step))return t.isValid=!1,t.invalidKeys.push(`stepMismatch`),t.message=n(r,e.min,e.max,e.step)||`Value must be a multiple of ${e.step}.`,t}return t}}),Q=class extends d{constructor(){super(...arguments),this.draggableThumbMin=null,this.draggableThumbMax=null,this.hasSlotController=new r(this,`hint`,`label`),this.localize=new u(this),this.activeThumb=null,this.lastTrackPosition=null,this.label=``,this.hint=``,this.minValue=0,this.maxValue=50,this.defaultValue=this.getAttribute(`value`)==null?this.minValue:Number(this.getAttribute(`value`)),this._value=null,this.range=!1,this.disabled=!1,this.readonly=!1,this.orientation=`horizontal`,this.size=`m`,this.min=0,this.max=100,this.step=1,this.tooltipDistance=8,this.tooltipPlacement=`top`,this.withMarkers=!1,this.withTooltip=!1,this.withLabel=!1,this.withHint=!1}static get validators(){return[...super.validators,Qt()]}get focusableAnchor(){return this.isRange&&this.thumbMin||this.slider}get validationTarget(){return this.focusableAnchor}get value(){return this.valueHasChanged?j(this._value??this.minValue??0,this.min,this.max):j(this._value??this.defaultValue,this.min,this.max)}set value(e){e=Number(e)??this.minValue,this._value!==e&&(this.valueHasChanged=!0,this._value=e)}get isRange(){return this.range}handleSizeChange(){m(this.localName,this.size)}firstUpdated(e){super.firstUpdated(e),this.isRange?(this.draggableThumbMin=new Xt(this.thumbMin,{start:()=>{this.activeThumb=`min`,this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.minValue,this.customStates.set(`dragging`,!0),this.showRangeTooltips()},move:(e,t)=>{this.setThumbValueFromCoordinates(e,t,`min`)},stop:()=>{this.minValue!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}}),this.draggableThumbMax=new Xt(this.thumbMax,{start:()=>{this.activeThumb=`max`,this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.maxValue,this.customStates.set(`dragging`,!0),this.showRangeTooltips()},move:(e,t)=>{this.setThumbValueFromCoordinates(e,t,`max`)},stop:()=>{this.maxValue!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}}),this.draggableTrack=new Xt(this.track,{start:(e,t)=>{if(this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.activeThumb)this.valueWhenDraggingStarted=this.activeThumb===`min`?this.minValue:this.maxValue;else{let n=this.getValueFromCoordinates(e,t),r=Math.abs(n-this.minValue),i=Math.abs(n-this.maxValue);if(r===i){if(n>this.maxValue)this.activeThumb=`max`;else if(n<this.minValue)this.activeThumb=`min`;else{let n=this.localize.dir()===`rtl`,r=this.orientation===`vertical`,i=r?t:e,a=this.lastTrackPosition||i;this.lastTrackPosition=i;let o=i>a!==n&&!r||i<a&&r;this.activeThumb=o?`max`:`min`}}else this.activeThumb=r<=i?`min`:`max`;this.valueWhenDraggingStarted=this.activeThumb===`min`?this.minValue:this.maxValue}this.customStates.set(`dragging`,!0),this.setThumbValueFromCoordinates(e,t,this.activeThumb),this.showRangeTooltips()},move:(e,t)=>{this.activeThumb&&this.setThumbValueFromCoordinates(e,t,this.activeThumb)},stop:()=>{this.activeThumb&&(this.activeThumb===`min`?this.minValue:this.maxValue)!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideRangeTooltips(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0,this.activeThumb=null}})):this.draggableTrack=new Xt(this.slider,{start:(e,t)=>{this.trackBoundingClientRect=this.track.getBoundingClientRect(),this.valueWhenDraggingStarted=this.value,this.customStates.set(`dragging`,!0),this.setValueFromCoordinates(e,t),this.showTooltip()},move:(e,t)=>{this.setValueFromCoordinates(e,t)},stop:()=>{this.value!==this.valueWhenDraggingStarted&&(this.updateComplete.then(()=>{this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0),this.hideTooltip(),this.customStates.set(`dragging`,!1),this.valueWhenDraggingStarted=void 0}})}willUpdate(e){this.isRange&&(e.has(`minValue`)||e.has(`maxValue`)||e.has(`min`)||e.has(`max`))&&(this.minValue=j(this.minValue,this.min,this.maxValue),this.maxValue=j(this.maxValue,this.minValue,this.max)),super.willUpdate(e)}updated(e){if(this.isRange&&(e.has(`minValue`)||e.has(`maxValue`))&&this.updateFormValue(),e.has(`disabled`)||e.has(`readonly`)){let e=!(this.disabled||this.readonly);this.isRange&&(this.draggableThumbMin&&this.draggableThumbMin.toggle(e),this.draggableThumbMax&&this.draggableThumbMax.toggle(e)),this.draggableTrack&&this.draggableTrack.toggle(e)}super.updated(e)}formDisabledCallback(e){this.disabled=e}formResetCallback(){this.isRange?(this.minValue=parseFloat(this.getAttribute(`min-value`)??String(this.min)),this.maxValue=parseFloat(this.getAttribute(`max-value`)??String(this.max))):(this._value=null,this.defaultValue=this.defaultValue??parseFloat(this.getAttribute(`value`)??String(this.min))),this.valueHasChanged=!1,this.hasInteracted=!1,super.formResetCallback()}clampAndRoundToStep(e){let t=(String(this.step).split(`.`)[1]||``).replace(/0+$/g,``).length,n=Number(this.step),r=Number(this.min),i=Number(this.max);return e=Math.round(e/n)*n,e=j(e,r,i),parseFloat(e.toFixed(t))}getPercentageFromValue(e){return(e-this.min)/(this.max-this.min)*100}getValueFromCoordinates(e,t){let n=this.localize.dir()===`rtl`,r=this.orientation===`vertical`,{top:i,right:a,bottom:o,left:s,height:c,width:l}=this.trackBoundingClientRect,u=r?t:e,d=r?{start:i,end:o,size:c}:{start:s,end:a,size:l},f=(r||n?d.end-u:u-d.start)/d.size;return this.clampAndRoundToStep(this.min+(this.max-this.min)*f)}handleBlur(){this.isRange?requestAnimationFrame(()=>{let e=this.shadowRoot?.activeElement;e!==this.thumbMin&&e!==this.thumbMax&&this.hideRangeTooltips()}):this.hideTooltip(),this.customStates.set(`focused`,!1),this.dispatchEvent(new FocusEvent(`blur`,{bubbles:!0,composed:!0}))}handleFocus(e){let t=e.target;this.isRange?(t===this.thumbMin?this.activeThumb=`min`:t===this.thumbMax&&(this.activeThumb=`max`),this.showRangeTooltips()):this.showTooltip(),this.customStates.set(`focused`,!0),this.dispatchEvent(new FocusEvent(`focus`,{bubbles:!0,composed:!0}))}handleKeyDown(e){let t=this.localize.dir()===`rtl`,n=e.target;if(this.disabled||this.readonly||this.isRange&&(n===this.thumbMin?this.activeThumb=`min`:n===this.thumbMax&&(this.activeThumb=`max`),!this.activeThumb))return;let r=this.isRange?this.activeThumb===`min`?this.minValue:this.maxValue:this.value,i=r;switch(e.key){case`ArrowUp`:case t?`ArrowLeft`:`ArrowRight`:e.preventDefault(),i=this.clampAndRoundToStep(r+this.step);break;case`ArrowDown`:case t?`ArrowRight`:`ArrowLeft`:e.preventDefault(),i=this.clampAndRoundToStep(r-this.step);break;case`Home`:e.preventDefault(),i=this.isRange&&this.activeThumb===`min`?this.min:this.isRange?this.minValue:this.min;break;case`End`:e.preventDefault(),i=this.isRange&&this.activeThumb===`max`?this.max:this.isRange?this.maxValue:this.max;break;case`PageUp`:e.preventDefault();let n=Math.max(r+(this.max-this.min)/10,r+this.step);i=this.clampAndRoundToStep(n);break;case`PageDown`:e.preventDefault();let a=Math.min(r-(this.max-this.min)/10,r-this.step);i=this.clampAndRoundToStep(a);break;case`Enter`:Wt(e,this);return}i!==r&&(this.isRange?(this.activeThumb===`min`?i>this.maxValue?(this.maxValue=i,this.minValue=i):this.minValue=Math.max(this.min,i):i<this.minValue?(this.minValue=i,this.maxValue=i):this.maxValue=Math.min(this.max,i),this.updateFormValue()):this.value=j(i,this.min,this.max),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0})),this.dispatchEvent(new Event(`change`,{bubbles:!0,composed:!0}))}),this.hasInteracted=!0)}handleLabelPointerDown(e){e.preventDefault(),this.disabled||(this.isRange?this.thumbMin?.focus():this.slider.focus())}setValueFromCoordinates(e,t){let n=this.value;this.value=this.getValueFromCoordinates(e,t),this.value!==n&&this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0}))})}setThumbValueFromCoordinates(e,t,n){let r=this.getValueFromCoordinates(e,t),i=n===`min`?this.minValue:this.maxValue;n===`min`?r>this.maxValue?(this.maxValue=r,this.minValue=r):this.minValue=Math.max(this.min,r):r<this.minValue?(this.minValue=r,this.maxValue=r):this.maxValue=Math.min(this.max,r),i!==(n===`min`?this.minValue:this.maxValue)&&(this.updateFormValue(),this.updateComplete.then(()=>{this.dispatchEvent(new InputEvent(`input`,{bubbles:!0,composed:!0}))}))}showTooltip(){this.withTooltip&&this.tooltip&&(this.tooltip.open=!0)}hideTooltip(){this.withTooltip&&this.tooltip&&(this.tooltip.open=!1)}showRangeTooltips(){if(!this.withTooltip)return;let e=this.shadowRoot?.getElementById(`tooltip-thumb-min`),t=this.shadowRoot?.getElementById(`tooltip-thumb-max`);this.activeThumb===`min`?(e&&(e.open=!0),t&&(t.open=!1)):this.activeThumb===`max`&&(t&&(t.open=!0),e&&(e.open=!1))}hideRangeTooltips(){if(!this.withTooltip)return;let e=this.shadowRoot?.getElementById(`tooltip-thumb-min`),t=this.shadowRoot?.getElementById(`tooltip-thumb-max`);e&&(e.open=!1),t&&(t.open=!1)}updateFormValue(e){if(this.isRange){let e=new FormData;e.append(this.name||``,String(this.minValue)),e.append(this.name||``,String(this.maxValue)),this.setValue(e,e);return}super.updateFormValue(e)}focus(){this.isRange?this.thumbMin?.focus():this.slider.focus()}blur(){if(this.isRange){for(let e of Ut())if(e===this.thumbMin){this.thumbMin.blur();break}else if(e===this.thumbMax){this.thumbMax.blur();break}}else this.slider.blur()}stepDown(){if(this.isRange){let e=this.clampAndRoundToStep(this.minValue-this.step);this.minValue=j(e,this.min,this.maxValue),this.updateFormValue()}else{let e=this.clampAndRoundToStep(this.value-this.step);this.value=e}}stepUp(){if(this.isRange){let e=this.clampAndRoundToStep(this.maxValue+this.step);this.maxValue=j(e,this.minValue,this.max),this.updateFormValue()}else{let e=this.clampAndRoundToStep(this.value+this.step);this.value=e}}render(){let t=this.hasSlotController.test(`label`,`withLabel`),n=this.hasSlotController.test(`hint`,`withHint`),r=this.label?!0:!!t,i=this.hint?!0:!!n,a=this.hasSlotController.test(`reference`),o=l({xs:this.size===`xs`,s:this.size===`s`||this.size===`small`,m:this.size===`m`||this.size===`medium`,l:this.size===`l`||this.size===`large`,xl:this.size===`xl`,small:this.size===`small`||this.size===`s`,medium:this.size===`medium`||this.size===`m`,large:this.size===`large`||this.size===`l`,horizontal:this.orientation===`horizontal`,vertical:this.orientation===`vertical`,disabled:this.disabled}),s=[];if(this.withMarkers)for(let e=this.min;e<=this.max;e+=this.step)s.push(this.getPercentageFromValue(e));let c=e`
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
          `:``;if(this.isRange){let t=j(this.getPercentageFromValue(this.minValue),0,100),n=j(this.getPercentageFromValue(this.maxValue),0,100);return e`
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
      `}{let t=j(this.getPercentageFromValue(this.value),0,100),n=j(this.getPercentageFromValue(typeof this.indicatorOffset==`number`?this.indicatorOffset:this.min),0,100);return e`
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
      `}}};Q.formAssociated=!0,Q.observeSlots=!0,Q.css=[c,h,Ht],o([f(`#slider`)],Q.prototype,`slider`,2),o([f(`#thumb`)],Q.prototype,`thumb`,2),o([f(`#thumb-min`)],Q.prototype,`thumbMin`,2),o([f(`#thumb-max`)],Q.prototype,`thumbMax`,2),o([f(`#track`)],Q.prototype,`track`,2),o([f(`#tooltip`)],Q.prototype,`tooltip`,2),o([i()],Q.prototype,`label`,2),o([i({attribute:`hint`})],Q.prototype,`hint`,2),o([i({reflect:!0})],Q.prototype,`name`,2),o([i({type:Number,attribute:`min-value`})],Q.prototype,`minValue`,2),o([i({type:Number,attribute:`max-value`})],Q.prototype,`maxValue`,2),o([i({attribute:`value`,reflect:!0,type:Number})],Q.prototype,`defaultValue`,2),o([s()],Q.prototype,`value`,1),o([i({type:Boolean,reflect:!0})],Q.prototype,`range`,2),o([i({type:Boolean})],Q.prototype,`disabled`,2),o([i({type:Boolean,reflect:!0})],Q.prototype,`readonly`,2),o([i({reflect:!0})],Q.prototype,`orientation`,2),o([i({reflect:!0})],Q.prototype,`size`,2),o([p(`size`)],Q.prototype,`handleSizeChange`,1),o([i({attribute:`indicator-offset`,type:Number})],Q.prototype,`indicatorOffset`,2),o([i({type:Number})],Q.prototype,`min`,2),o([i({type:Number})],Q.prototype,`max`,2),o([i({type:Number})],Q.prototype,`step`,2),o([i({type:Boolean})],Q.prototype,`autofocus`,2),o([i({attribute:`tooltip-distance`,type:Number})],Q.prototype,`tooltipDistance`,2),o([i({attribute:`tooltip-placement`,reflect:!0})],Q.prototype,`tooltipPlacement`,2),o([i({attribute:`with-markers`,type:Boolean})],Q.prototype,`withMarkers`,2),o([i({attribute:`with-tooltip`,type:Boolean})],Q.prototype,`withTooltip`,2),o([i({attribute:`with-label`,type:Boolean})],Q.prototype,`withLabel`,2),o([i({attribute:`with-hint`,type:Boolean})],Q.prototype,`withHint`,2),o([i({attribute:!1})],Q.prototype,`valueFormatter`,2),Q=o([n(`wa-slider`)],Q);var $t=t`
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
`;function en(e,t){for(;t;){if(t===e)return!0;t=t instanceof Element&&t.assignedSlot?t.assignedSlot:t.parentNode?t.parentNode:t instanceof ShadowRoot?t.host:null}return!1}var $=class extends a{constructor(){super(...arguments),this.dismissedByPress=!1,this.placement=`top`,this.disabled=!1,this.distance=8,this.open=!1,this.skidding=0,this.showDelay=150,this.hideDelay=0,this.trigger=`hover focus`,this.withoutArrow=!1,this.for=null,this.anchor=null,this.eventController=new AbortController,this.handleBlur=()=>{this.dismissedByPress=!1,this.hasTrigger(`focus`)&&this.hide()},this.handleClick=()=>{if(this.hasTrigger(`click`)){this.open?this.hide():this.show();return}this.hasTrigger(`manual`)||this.lightDismiss()},this.handleFocus=()=>{this.dismissedByPress||this.hasTrigger(`focus`)&&this.show()},this.handleMouseDown=()=>{this.hasTrigger(`click`)||this.hasTrigger(`manual`)||this.lightDismiss()},this.handleDocumentKeyDown=e=>{this.hasTrigger(`manual`)||e.key===`Escape`&&this.open&&A(this)&&(e.preventDefault(),e.stopPropagation(),this.hide())},this.handleDocumentClick=e=>{this.hasTrigger(`manual`)||this.anchor&&e.composedPath().includes(this.anchor)||this.hide()},this.handleMouseOver=()=>{this.dismissedByPress||this.hasTrigger(`hover`)&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>this.show(),this.showDelay))},this.handleMouseOut=e=>{let t=e.relatedTarget,n=!!(t&&this.anchor&&en(this.anchor,t)),r=!!(t&&en(this,t));n||r||(this.dismissedByPress=!1,this.hasTrigger(`hover`)&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>{this.hide()},this.hideDelay)))}}connectedCallback(){super.connectedCallback(),typeof document<`u`&&(this.eventController.signal.aborted&&(this.eventController=new AbortController),this.addEventListener(`mouseout`,this.handleMouseOut),this.dismissedByPress=!1,this.open&&(this.open=!1,this.updateComplete.then(()=>{this.open=!0})),this.id||=se(`wa-tooltip-`),this.for&&this.anchor?(this.anchor=null,this.handleForChange()):this.for&&this.handleForChange())}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`click`,this.handleDocumentClick),k(this),this.eventController.abort(),this.anchor&&this.removeFromAriaLabelledBy(this.anchor,this.id)}firstUpdated(e){this.body.hidden=!this.open,this.open&&(this.popup.active=!0,this.popup.reposition()),super.firstUpdated(e)}lightDismiss(){clearTimeout(this.hoverTimeout),this.dismissedByPress=!0,this.hide()}hasTrigger(e){return this.trigger.split(` `).includes(e)}addToAriaLabelledBy(e,t){let n=(e.getAttribute(`aria-labelledby`)||``).split(/\s+/).filter(Boolean);n.includes(t)||(n.push(t),e.setAttribute(`aria-labelledby`,n.join(` `)))}removeFromAriaLabelledBy(e,t){let n=(e.getAttribute(`aria-labelledby`)||``).split(/\s+/).filter(Boolean).filter(e=>e!==t);n.length>0?e.setAttribute(`aria-labelledby`,n.join(` `)):e.removeAttribute(`aria-labelledby`)}async handleOpenChange(){if(this.open){if(this.disabled)return;let e=new T;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.hasTrigger(`manual`)||(document.addEventListener(`keydown`,this.handleDocumentKeyDown,{signal:this.eventController.signal}),document.addEventListener(`click`,this.handleDocumentClick,{signal:this.eventController.signal}),O(this)),this.body.hidden=!1,this.popup.active=!0,await re(this.popup.popup,`show-with-scale`),this.popup.reposition(),this.dispatchEvent(new te)}else{let e=new E;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!0;return}document.removeEventListener(`keydown`,this.handleDocumentKeyDown),document.removeEventListener(`click`,this.handleDocumentClick),k(this),await re(this.popup.popup,`hide-with-scale`),this.popup.active=!1,this.body.hidden=!0,this.dispatchEvent(new ee)}}handleForChange(){let e=this.getRootNode?.();if(!e)return;let t=this.for?e.getElementById?.(this.for):null,n=this.anchor;if(t===n)return;this.dismissedByPress=!1;let{signal:r}=this.eventController;t&&(this.addToAriaLabelledBy(t,this.id),t.addEventListener(`blur`,this.handleBlur,{capture:!0,signal:r}),t.addEventListener(`focus`,this.handleFocus,{capture:!0,signal:r}),t.addEventListener(`click`,this.handleClick,{signal:r}),t.addEventListener(`mousedown`,this.handleMouseDown,{signal:r}),t.addEventListener(`mouseover`,this.handleMouseOver,{signal:r}),t.addEventListener(`mouseout`,this.handleMouseOut,{signal:r})),n&&(this.removeFromAriaLabelledBy(n,this.id),n.removeEventListener(`blur`,this.handleBlur,{capture:!0}),n.removeEventListener(`focus`,this.handleFocus,{capture:!0}),n.removeEventListener(`click`,this.handleClick),n.removeEventListener(`mousedown`,this.handleMouseDown),n.removeEventListener(`mouseover`,this.handleMouseOver),n.removeEventListener(`mouseout`,this.handleMouseOut)),this.anchor=t}async handleOptionsChange(){this.hasUpdated&&(await this.updateComplete,this.popup.reposition())}handleDisabledChange(){this.disabled&&this.open&&this.hide()}async show(){if(!this.open)return this.open=!0,le(this,`wa-after-show`)}async hide(){if(this.open)return this.open=!1,le(this,`wa-after-hide`)}render(){return e`
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
    `}};$.css=$t,$.dependencies={"wa-popup":Z},o([f(`slot:not([name])`)],$.prototype,`defaultSlot`,2),o([f(`.body`)],$.prototype,`body`,2),o([f(`wa-popup`)],$.prototype,`popup`,2),o([i()],$.prototype,`placement`,2),o([i({type:Boolean,reflect:!0})],$.prototype,`disabled`,2),o([i({type:Number})],$.prototype,`distance`,2),o([i({type:Boolean,reflect:!0})],$.prototype,`open`,2),o([i({type:Number})],$.prototype,`skidding`,2),o([i({attribute:`show-delay`,type:Number})],$.prototype,`showDelay`,2),o([i({attribute:`hide-delay`,type:Number})],$.prototype,`hideDelay`,2),o([i()],$.prototype,`trigger`,2),o([i({attribute:`without-arrow`,type:Boolean,reflect:!0})],$.prototype,`withoutArrow`,2),o([i()],$.prototype,`for`,2),o([s()],$.prototype,`anchor`,2),o([p(`open`,{waitUntilFirstUpdate:!0})],$.prototype,`handleOpenChange`,1),o([p(`for`)],$.prototype,`handleForChange`,1),o([p([`distance`,`placement`,`skidding`])],$.prototype,`handleOptionsChange`,1),o([p(`disabled`)],$.prototype,`handleDisabledChange`,1),$=o([n(`wa-tooltip`)],$);export{w as _,ne as a,A as c,te as d,ee as f,S as g,v as h,se as i,O as l,T as m,ce as n,re as o,E as p,j as r,ie as s,le as t,k as u,C as v};