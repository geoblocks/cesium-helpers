import{a as e,u as t}from"./lit-BFn1CURT.js";import{a as n,i as r,n as i,o as a,t as o}from"./card-AeaRol_r.js";import{a as s,d as c}from"./directive-helpers-BiOJKcbC.js";var l=class extends Event{constructor(){super(`wa-show`,{bubbles:!0,cancelable:!0,composed:!0})}},u=class extends Event{constructor(e){super(`wa-hide`,{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}},d=class extends Event{constructor(){super(`wa-after-hide`,{bubbles:!0,cancelable:!1,composed:!0})}},f=class extends Event{constructor(){super(`wa-after-show`,{bubbles:!0,cancelable:!1,composed:!0})}},p=[];function m(e){h(e),p.push(e)}function h(e){for(let t=p.length-1;t>=0;t--)if(p[t]===e){p.splice(t,1);break}}function g(e){return p.length>0&&p[p.length-1]===e}function _(e,t){return new Promise(n=>{function r(i){i.target===e&&(e.removeEventListener(t,r),n())}e.addEventListener(t,r)})}async function v(e,t,n){return e.animate(t,n).finished.catch(()=>{})}function y(e,t){return new Promise(n=>{let r=new AbortController,{signal:i}=r;if(e.classList.contains(t))return;e.classList.add(t);let a=!1,o=()=>{a||(a=!0,e.classList.remove(t),n(),r.abort())};e.addEventListener(`animationend`,o,{once:!0,signal:i}),e.addEventListener(`animationcancel`,o,{once:!0,signal:i}),requestAnimationFrame(()=>{!a&&e.getAnimations().length===0&&o()})})}function b(e){return e=e.toString().toLowerCase(),e.indexOf(`ms`)>-1?parseFloat(e)||0:e.indexOf(`s`)>-1?(parseFloat(e)||0)*1e3:parseFloat(e)||0}var x=class extends Event{constructor(){super(`wa-reposition`,{bubbles:!0,cancelable:!1,composed:!0})}},S=t`
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
`,C=Math.min,w=Math.max,T=Math.round,E=Math.floor,D=e=>({x:e,y:e}),ee={left:`right`,right:`left`,bottom:`top`,top:`bottom`};function te(e,t,n){return w(e,C(t,n))}function O(e,t){return typeof e==`function`?e(t):e}function k(e){return e.split(`-`)[0]}function A(e){return e.split(`-`)[1]}function j(e){return e===`x`?`y`:`x`}function ne(e){return e===`y`?`height`:`width`}function M(e){let t=e[0];return t===`t`||t===`b`?`y`:`x`}function re(e){return j(M(e))}function N(e,t,n){n===void 0&&(n=!1);let r=A(e),i=re(e),a=ne(i),o=i===`x`?r===(n?`end`:`start`)?`right`:`left`:r===`start`?`bottom`:`top`;return t.reference[a]>t.floating[a]&&(o=F(o)),[o,F(o)]}function P(e){let t=F(e);return[ie(e),t,ie(t)]}function ie(e){return e.includes(`start`)?e.replace(`start`,`end`):e.replace(`end`,`start`)}var ae=[`left`,`right`],oe=[`right`,`left`],se=[`top`,`bottom`],ce=[`bottom`,`top`];function le(e,t,n){switch(e){case`top`:case`bottom`:return n?t?oe:ae:t?ae:oe;case`left`:case`right`:return t?se:ce;default:return[]}}function ue(e,t,n,r){let i=A(e),a=le(k(e),n===`start`,r);return i&&(a=a.map(e=>e+`-`+i),t&&(a=a.concat(a.map(ie)))),a}function F(e){let t=k(e);return ee[t]+e.slice(t.length)}function de(e){return{top:e.top??0,right:e.right??0,bottom:e.bottom??0,left:e.left??0}}function fe(e){return typeof e==`number`?{top:e,right:e,bottom:e,left:e}:de(e)}function I(e){let{x:t,y:n,width:r,height:i}=e;return{width:r,height:i,top:n,left:t,right:t+r,bottom:n+i,x:t,y:n}}function pe(e,t,n){let{reference:r,floating:i}=e,a=M(t),o=re(t),s=ne(o),c=k(t),l=a===`y`,u=r.x+r.width/2-i.width/2,d=r.y+r.height/2-i.height/2,f=r[s]/2-i[s]/2,p;switch(c){case`top`:p={x:u,y:r.y-i.height};break;case`bottom`:p={x:u,y:r.y+r.height};break;case`right`:p={x:r.x+r.width,y:d};break;case`left`:p={x:r.x-i.width,y:d};break;default:p={x:r.x,y:r.y}}let m=A(t);return m&&(p[o]+=f*(m===`end`?1:-1)*(n&&l?-1:1)),p}async function me(e,t){t===void 0&&(t={});let{x:n,y:r,platform:i,rects:a,elements:o,strategy:s}=e,{boundary:c=`clippingAncestors`,rootBoundary:l=`viewport`,elementContext:u=`floating`,altBoundary:d=!1,padding:f=0}=O(t,e),p=fe(f),m=o[d?u===`floating`?`reference`:`floating`:u],h=I(await i.getClippingRect({element:await(i.isElement==null?void 0:i.isElement(m))??!0?m:m.contextElement||await(i.getDocumentElement==null?void 0:i.getDocumentElement(o.floating)),boundary:c,rootBoundary:l,strategy:s})),g=u===`floating`?{x:n,y:r,width:a.floating.width,height:a.floating.height}:a.reference,_=await(i.getOffsetParent==null?void 0:i.getOffsetParent(o.floating)),v=await(i.isElement==null?void 0:i.isElement(_))&&await(i.getScale==null?void 0:i.getScale(_))||{x:1,y:1},y=I(i.convertOffsetParentRelativeRectToViewportRelativeRect?await i.convertOffsetParentRelativeRectToViewportRelativeRect({elements:o,rect:g,offsetParent:_,strategy:s}):g);return{top:(h.top-y.top+p.top)/v.y,bottom:(y.bottom-h.bottom+p.bottom)/v.y,left:(h.left-y.left+p.left)/v.x,right:(y.right-h.right+p.right)/v.x}}var he=50,ge=async(e,t,n)=>{let{placement:r=`bottom`,strategy:i=`absolute`,middleware:a=[],platform:o}=n,s=o.detectOverflow?o:{...o,detectOverflow:me},c=await(o.isRTL==null?void 0:o.isRTL(t)),l=await o.getElementRects({reference:e,floating:t,strategy:i}),{x:u,y:d}=pe(l,r,c),f=r,p=0,m={};for(let n=0;n<a.length;n++){let h=a[n];if(!h)continue;let{name:g,fn:_}=h,{x:v,y,data:b,reset:x}=await _({x:u,y:d,initialPlacement:r,placement:f,strategy:i,middlewareData:m,rects:l,platform:s,elements:{reference:e,floating:t}});u=v??u,d=y??d,m[g]={...m[g],...b},x&&p<he&&(p++,typeof x==`object`&&(x.placement&&(f=x.placement),x.rects&&(l=x.rects===!0?await o.getElementRects({reference:e,floating:t,strategy:i}):x.rects),{x:u,y:d}=pe(l,f,c)),n=-1)}return{x:u,y:d,placement:f,strategy:i,middlewareData:m}},_e=e=>({name:`arrow`,options:e,async fn(t){let{x:n,y:r,placement:i,rects:a,platform:o,elements:s,middlewareData:c}=t,{element:l,padding:u=0}=O(e,t)||{};if(l==null)return{};let d=fe(u),f={x:n,y:r},p=re(i),m=ne(p),h=await o.getDimensions(l),g=p===`y`,_=g?`top`:`left`,v=g?`bottom`:`right`,y=g?`clientHeight`:`clientWidth`,b=a.reference[m]+a.reference[p]-f[p]-a.floating[m],x=f[p]-a.reference[p],S=await(o.getOffsetParent==null?void 0:o.getOffsetParent(l)),w=S?S[y]:0;(!w||!await(o.isElement==null?void 0:o.isElement(S)))&&(w=s.floating[y]||a.floating[m]);let T=b/2-x/2,E=w/2-h[m]/2-1,D=C(d[_],E),ee=C(d[v],E),k=w-h[m]-ee,j=w/2-h[m]/2+T,M=te(D,j,k),N=!c.arrow&&A(i)!=null&&j!==M&&a.reference[m]/2-(j<D?D:ee)-h[m]/2<0,P=N?j<D?j-D:j-k:0;return{[p]:f[p]+P,data:{[p]:M,centerOffset:j-M-P,...N&&{alignmentOffset:P}},reset:N}}}),ve=function(e){return e===void 0&&(e={}),{name:`flip`,options:e,async fn(t){var n;let{placement:r,middlewareData:i,rects:a,initialPlacement:o,platform:s,elements:c}=t,{mainAxis:l=!0,crossAxis:u=!0,fallbackPlacements:d,fallbackStrategy:f=`bestFit`,fallbackAxisSideDirection:p=`none`,flipAlignment:m=!0,...h}=O(e,t);if((n=i.arrow)!=null&&n.alignmentOffset)return{};let g=k(r),_=M(o),v=k(o)===o,y=await(s.isRTL==null?void 0:s.isRTL(c.floating)),b=d||(v||!m?[F(o)]:P(o)),x=p!==`none`;!d&&x&&b.push(...ue(o,m,p,y));let S=[o,...b],C=await s.detectOverflow(t,h),w=[],T=i.flip?.overflows||[];if(l&&w.push(C[g]),u){let e=N(r,a,y);w.push(C[e[0]],C[e[1]])}if(T=[...T,{placement:r,overflows:w}],!w.every(e=>e<=0)){let e=(i.flip?.index||0)+1,t=S[e];if(t&&(u!==`alignment`||_===M(t)||T.every(e=>M(e.placement)!==_||e.overflows[0]>0)))return{data:{index:e,overflows:T},reset:{placement:t}};let n=T.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0]?.placement;if(!n)switch(f){case`bestFit`:{let e=T.filter(e=>{if(x){let t=M(e.placement);return t===_||t===`y`}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0]?.[0];e&&(n=e);break}case`initialPlacement`:n=o}if(r!==n)return{reset:{placement:n}}}return{}}}},ye=new Set([`left`,`top`]);async function be(e,t){let{placement:n,platform:r,elements:i}=e,a=await(r.isRTL==null?void 0:r.isRTL(i.floating)),o=k(n),s=A(n),c=M(n)===`y`,l=ye.has(o)?-1:1,u=a&&c?-1:1,d=O(t,e),{mainAxis:f,crossAxis:p,alignmentAxis:m}=typeof d==`number`?{mainAxis:d,crossAxis:0,alignmentAxis:null}:{mainAxis:d.mainAxis||0,crossAxis:d.crossAxis||0,alignmentAxis:d.alignmentAxis};return s&&typeof m==`number`&&(p=s===`end`?m*-1:m),c?{x:p*u,y:f*l}:{x:f*l,y:p*u}}var xe=function(e){return e===void 0&&(e=0),{name:`offset`,options:e,async fn(t){var n;let{x:r,y:i,placement:a,middlewareData:o}=t,s=await be(t,e);return a===o.offset?.placement&&(n=o.arrow)!=null&&n.alignmentOffset?{}:{x:r+s.x,y:i+s.y,data:{...s,placement:a}}}}},Se=function(e){return e===void 0&&(e={}),{name:`shift`,options:e,async fn(t){let{x:n,y:r,placement:i,platform:a}=t,{mainAxis:o=!0,crossAxis:s=!1,limiter:c={fn:e=>{let{x:t,y:n}=e;return{x:t,y:n}}},...l}=O(e,t),u={x:n,y:r},d=await a.detectOverflow(t,l),f=M(i),p=j(f),m=u[p],h=u[f],g=(e,t)=>te(t+d[e===`y`?`top`:`left`],t,t-d[e===`y`?`bottom`:`right`]);o&&(m=g(p,m)),s&&(h=g(f,h));let _=c.fn({...t,[p]:m,[f]:h});return{..._,data:{x:_.x-n,y:_.y-r,enabled:{[p]:o,[f]:s}}}}}},Ce=function(e){return e===void 0&&(e={}),{name:`size`,options:e,async fn(t){let{placement:n,rects:r,platform:i,elements:a}=t,{apply:o=()=>{},...s}=O(e,t),c=await i.detectOverflow(t,s),l=k(n),u=A(n),d=M(n)===`y`,{width:f,height:p}=r.floating,m,h;l===`top`||l===`bottom`?(m=l,h=u===(await(i.isRTL==null?void 0:i.isRTL(a.floating))?`start`:`end`)?`left`:`right`):(h=l,m=u===`end`?`top`:`bottom`);let g=p-c.top-c.bottom,_=f-c.left-c.right,v=C(p-c[m],g),y=C(f-c[h],_),b=t.middlewareData.shift,x=!b,S=v,T=y;b!=null&&b.enabled.x&&(T=_),b!=null&&b.enabled.y&&(S=g),x&&!u&&(d?T=f-2*w(c.left,c.right):S=p-2*w(c.top,c.bottom)),await o({...t,availableWidth:T,availableHeight:S});let E=await i.getDimensions(a.floating);return f!==E.width||p!==E.height?{reset:{rects:!0}}:{}}}};function L(){return typeof window<`u`}function R(e){return we(e)?(e.nodeName||``).toLowerCase():`#document`}function z(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function B(e){return((we(e)?e.ownerDocument:e.document)||window.document)?.documentElement}function we(e){return L()?e instanceof Node||e instanceof z(e).Node:!1}function V(e){return L()?e instanceof Element||e instanceof z(e).Element:!1}function H(e){return L()?e instanceof HTMLElement||e instanceof z(e).HTMLElement:!1}function Te(e){return!L()||typeof ShadowRoot>`u`?!1:e instanceof ShadowRoot||e instanceof z(e).ShadowRoot}function U(e){let{overflow:t,overflowX:n,overflowY:r,display:i}=J(e);return/auto|scroll|overlay|hidden|clip/.test(t+r+n)&&i!==`inline`&&i!==`contents`}function Ee(e){return/^(table|td|th)$/.test(R(e))}function W(e){try{if(e.matches(`:popover-open`))return!0}catch{}try{return e.matches(`:modal`)}catch{return!1}}var De=/transform|translate|scale|rotate|perspective|filter/,Oe=/paint|layout|strict|content/,G=e=>!!e&&e!==`none`,ke;function K(e){let t=V(e)?J(e):e;return G(t.transform)||G(t.translate)||G(t.scale)||G(t.rotate)||G(t.perspective)||!je()&&(G(t.backdropFilter)||G(t.filter))||De.test(t.willChange||``)||Oe.test(t.contain||``)}function Ae(e){let t=Y(e);for(;H(t)&&!q(t);){if(K(t))return t;if(W(t))return null;t=Y(t)}return null}function je(){return ke??=typeof CSS<`u`&&CSS.supports&&CSS.supports(`-webkit-backdrop-filter`,`none`),ke}function q(e){return/^(html|body|#document)$/.test(R(e))}function J(e){return z(e).getComputedStyle(e)}function Me(e){return V(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function Y(e){if(R(e)===`html`)return e;let t=e.assignedSlot||e.parentNode||Te(e)&&e.host||B(e);return Te(t)?t.host:t}function Ne(e){let t=Y(e);return q(t)?(e.ownerDocument||e).body:H(t)&&U(t)?t:Ne(t)}function X(e,t,n){t===void 0&&(t=[]),n===void 0&&(n=!0);let r=Ne(e),i=r===e.ownerDocument?.body,a=z(r);if(i){let e=Pe(a);return t.concat(a,a.visualViewport||[],U(r)?r:[],e&&n?X(e):[])}return t.concat(r,X(r,[],n))}function Pe(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Fe(e){let t=J(e),n=parseFloat(t.width)||0,r=parseFloat(t.height)||0,i=H(e),a=i?e.offsetWidth:n,o=i?e.offsetHeight:r,s=T(n)!==a||T(r)!==o;return s&&(n=a,r=o),{width:n,height:r,$:s}}function Ie(e){return V(e)?e:e.contextElement}function Z(e){let t=Ie(e);if(!H(t))return D(1);let n=t.getBoundingClientRect(),{width:r,height:i,$:a}=Fe(t),o=(a?T(n.width):n.width)/r,s=(a?T(n.height):n.height)/i;return(!o||!Number.isFinite(o))&&(o=1),(!s||!Number.isFinite(s))&&(s=1),{x:o,y:s}}var Le=D(0);function Re(e){let t=z(e);return!je()||!t.visualViewport?Le:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function ze(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===z(e)}function Q(e,t,n,r){t===void 0&&(t=!1),n===void 0&&(n=!1);let i=e.getBoundingClientRect(),a=Ie(e),o=D(1);t&&(r?V(r)&&(o=Z(r)):o=Z(e));let s=ze(a,n,r)?Re(a):D(0),c=(i.left+s.x)/o.x,l=(i.top+s.y)/o.y,u=i.width/o.x,d=i.height/o.y;if(a&&r){let e=z(a),t=V(r)?z(r):r,n=e,i=Pe(n);for(;i&&t!==n;){let e=Z(i),t=i.getBoundingClientRect(),r=J(i),a=t.left+(i.clientLeft+parseFloat(r.paddingLeft))*e.x,o=t.top+(i.clientTop+parseFloat(r.paddingTop))*e.y;c*=e.x,l*=e.y,u*=e.x,d*=e.y,c+=a,l+=o,n=z(i),i=Pe(n)}}return I({width:u,height:d,x:c,y:l})}function Be(e,t){let n=Me(e).scrollLeft;return t?t.left+n:Q(B(e)).left+n}function Ve(e,t){let n=e.getBoundingClientRect();return{x:n.left+t.scrollLeft-Be(e,n),y:n.top+t.scrollTop}}function He(e){let{elements:t,rect:n,offsetParent:r,strategy:i}=e,a=i===`fixed`,o=B(r),s=t?W(t.floating):!1;if(r===o||s&&a)return n;let c={scrollLeft:0,scrollTop:0},l=D(1),u=D(0),d=H(r);if((d||!a)&&((R(r)!==`body`||U(o))&&(c=Me(r)),d)){let e=Q(r);l=Z(r),u.x=e.x+r.clientLeft,u.y=e.y+r.clientTop}let f=o&&!d&&!a?Ve(o,c):D(0);return{width:n.width*l.x,height:n.height*l.y,x:n.x*l.x-c.scrollLeft*l.x+u.x+f.x,y:n.y*l.y-c.scrollTop*l.y+u.y+f.y}}function Ue(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function We(e){let t=Me(e),n=e.ownerDocument.body,r=w(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),i=w(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight),a=-t.scrollLeft+Be(e),o=-t.scrollTop;return J(n).direction===`rtl`&&(a+=w(e.clientWidth,n.clientWidth)-r),{width:r,height:i,x:a,y:o}}var Ge=25;function Ke(e,t,n){n===void 0&&(n=`viewport`);let r=n===`layoutViewport`,i=z(e),a=B(e),o=i.visualViewport,s=a.clientWidth,c=a.clientHeight,l=0,u=0;if(o){let e=!je()||t===`fixed`;r?e||(l=-o.offsetLeft,u=-o.offsetTop):(s=o.width,c=o.height,e&&(l=o.offsetLeft,u=o.offsetTop))}if(Be(a)<=0){let e=a.ownerDocument,t=e.body,n=getComputedStyle(t),r=e.compatMode===`CSS1Compat`&&parseFloat(n.marginLeft)+parseFloat(n.marginRight)||0,i=Math.abs(a.clientWidth-t.clientWidth-r),o=getComputedStyle(a).scrollbarGutter===`stable both-edges`?i/2:i;o<=Ge&&(s-=o)}return{width:s,height:c,x:l,y:u}}function qe(e,t){let n=Q(e,!0,t===`fixed`),r=n.top+e.clientTop,i=n.left+e.clientLeft,a=Z(e);return{width:e.clientWidth*a.x,height:e.clientHeight*a.y,x:i*a.x,y:r*a.y}}function Je(e,t,n){let r;if(t===`viewport`||t===`layoutViewport`)r=Ke(e,n,t);else if(t===`document`)r=We(B(e));else if(V(t))r=qe(t,n);else{let n=Re(e);r={x:t.x-n.x,y:t.y-n.y,width:t.width,height:t.height}}return I(r)}function Ye(e,t){let n=t.get(e);if(n)return n;let r=X(e,[],!1).filter(e=>V(e)&&R(e)!==`body`),i=null,a=J(e).position===`fixed`,o=a?Y(e):e;for(;V(o)&&!q(o);){let e=J(o),t=K(o),n=i?i.position:a?`fixed`:``;!t&&(n===`fixed`||n===`absolute`&&e.position===`static`)?r=r.filter(e=>e!==o):i=e,o=Y(o)}return t.set(e,r),r}function Xe(e){let{element:t,boundary:n,rootBoundary:r,strategy:i}=e,a=[...n===`clippingAncestors`?W(t)?[]:Ye(t,this._c):[].concat(n),r],o=Je(t,a[0],i),s=o.top,c=o.right,l=o.bottom,u=o.left;for(let e=1;e<a.length;e++){let n=Je(t,a[e],i);s=w(n.top,s),c=C(n.right,c),l=C(n.bottom,l),u=w(n.left,u)}return{width:c-u,height:l-s,x:u,y:s}}function Ze(e){let{width:t,height:n}=Fe(e);return{width:t,height:n}}function Qe(e,t,n){let r=H(t),i=B(t),a=n===`fixed`,o=Q(e,!0,a,t),s={scrollLeft:0,scrollTop:0},c=D(0);if((r||!a)&&((R(t)!==`body`||U(i))&&(s=Me(t)),r)){let e=Q(t,!0,a,t);c.x=e.x+t.clientLeft,c.y=e.y+t.clientTop}!r&&i&&(c.x=Be(i));let l=i&&!r&&!a?Ve(i,s):D(0);return{x:o.left+s.scrollLeft-c.x-l.x,y:o.top+s.scrollTop-c.y-l.y,width:o.width,height:o.height}}function $e(e){return J(e).position===`static`}function et(e,t){if(!H(e)||J(e).position===`fixed`)return null;if(t)return t(e);let n=e.offsetParent;return B(e)===n&&(n=n.ownerDocument.body),n}function tt(e,t){let n=z(e);if(W(e))return n;if(!H(e)){let t=Y(e);for(;t&&!q(t);){if(V(t)&&!$e(t))return t;t=Y(t)}return n}let r=et(e,t);for(;r&&Ee(r)&&$e(r);)r=et(r,t);return r&&q(r)&&$e(r)&&!K(r)?n:r||Ae(e)||n}var nt=async function(e){let t=this.getOffsetParent||tt,n=this.getDimensions,r=await n(e.floating);return{reference:Qe(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:r.width,height:r.height}}};function rt(e){return J(e).direction===`rtl`}var it={convertOffsetParentRelativeRectToViewportRelativeRect:He,getDocumentElement:B,getClippingRect:Xe,getOffsetParent:tt,getElementRects:nt,getClientRects:Ue,getDimensions:Ze,getScale:Z,isElement:V,isRTL:rt};function at(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function ot(e,t,n){let r=null,i,a=B(e);function o(){var e;clearTimeout(i),(e=r)==null||e.disconnect(),r=null}function s(n,c){n===void 0&&(n=!1),c===void 0&&(c=1),o();let l=e.getBoundingClientRect(),{left:u,top:d,width:f,height:p}=l;if(n||t(),!f||!p)return;let m=E(d),h=E(a.clientWidth-(u+f)),g=E(a.clientHeight-(d+p)),_=E(u),v={rootMargin:-m+`px `+-h+`px `+-g+`px `+-_+`px`,threshold:w(0,C(1,c))||1},y=!0;function b(t){let n=t[0].intersectionRatio;if(!at(l,e.getBoundingClientRect()))return s();if(n!==c){if(!y)return s();n?s(!1,n):i=setTimeout(()=>{s(!1,1e-7)},1e3)}y=!1}try{r=new IntersectionObserver(b,{...v,root:a.ownerDocument})}catch{r=new IntersectionObserver(b,v)}r.observe(e)}let c=z(e),l=()=>s(n);return c.addEventListener(`resize`,l),s(!0),()=>{c.removeEventListener(`resize`,l),o()}}function st(e,t,n,r){r===void 0&&(r={});let{ancestorScroll:i=!0,ancestorResize:a=!0,elementResize:o=typeof ResizeObserver==`function`,layoutShift:s=typeof IntersectionObserver==`function`,animationFrame:c=!1}=r,l=Ie(e),u=i||a?[...l?X(l):[],...t?X(t):[]]:[];u.forEach(e=>{i&&e.addEventListener(`scroll`,n),a&&e.addEventListener(`resize`,n)});let d=l&&s?ot(l,n,a):null,f=-1,p=null;o&&(p=new ResizeObserver(e=>{let[r]=e;r&&r.target===l&&p&&t&&(p.unobserve(t),cancelAnimationFrame(f),f=requestAnimationFrame(()=>{var e;(e=p)==null||e.observe(t)})),n()}),l&&!c&&p.observe(l),t&&p.observe(t));let m,h=c?Q(e):null;c&&g();function g(){let t=Q(e);h&&!at(h,t)&&n(),h=t,m=requestAnimationFrame(g)}return n(),()=>{var e;u.forEach(e=>{i&&e.removeEventListener(`scroll`,n),a&&e.removeEventListener(`resize`,n)}),d?.(),(e=p)==null||e.disconnect(),p=null,c&&cancelAnimationFrame(m)}}var ct=xe,lt=Se,ut=ve,dt=Ce,ft=_e,pt=(e,t,n)=>{let r=new Map,i=n??{},a={...it,...i.platform,_c:r};return ge(e,t,{...i,platform:a})};function mt(e){return gt(e)}function ht(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function gt(e){for(let t=e;t;t=ht(t))if(t instanceof Element&&getComputedStyle(t).display===`none`)return null;for(let t=ht(e);t;t=ht(t)){if(!(t instanceof Element))continue;let e=getComputedStyle(t);if(e.display!==`contents`&&(e.position!==`static`||K(e)||t.tagName===`BODY`))return t}return null}function _t(e){return typeof e==`object`&&!!e&&`getBoundingClientRect`in e&&(`contextElement`in e?e instanceof Element:!0)}var vt=!!globalThis?.HTMLElement?.prototype.hasOwnProperty(`popover`),$=class extends i{constructor(){super(...arguments),this.localize=new s(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement=`top`,this.boundary=`viewport`,this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement=`anchor`,this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements=``,this.flipFallbackStrategy=`best-fit`,this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){let e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),n=this.placement.includes(`top`)||this.placement.includes(`bottom`),r=0,i=0,a=0,o=0,s=0,c=0,l=0,u=0;n?e.top<t.top?(r=e.left,i=e.bottom,a=e.right,o=e.bottom,s=t.left,c=t.top,l=t.right,u=t.top):(r=t.left,i=t.bottom,a=t.right,o=t.bottom,s=e.left,c=e.top,l=e.right,u=e.top):e.left<t.left?(r=e.right,i=e.top,a=t.left,o=t.top,s=e.right,c=e.bottom,l=t.left,u=t.bottom):(r=t.right,i=t.top,a=e.left,o=e.top,s=t.right,c=t.bottom,l=e.left,u=e.bottom),this.style.setProperty(`--hover-bridge-top-left-x`,`${r}px`),this.style.setProperty(`--hover-bridge-top-left-y`,`${i}px`),this.style.setProperty(`--hover-bridge-top-right-x`,`${a}px`),this.style.setProperty(`--hover-bridge-top-right-y`,`${o}px`),this.style.setProperty(`--hover-bridge-bottom-left-x`,`${s}px`),this.style.setProperty(`--hover-bridge-bottom-left-y`,`${c}px`),this.style.setProperty(`--hover-bridge-bottom-right-x`,`${l}px`),this.style.setProperty(`--hover-bridge-bottom-right-y`,`${u}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=vt,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has(`active`)&&(this.active?this.start():this.stop()),e.has(`anchor`)&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor==`string`){let e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchorEl=this.anchor instanceof Element||_t(this.anchor)?this.anchor:this.querySelector(`[slot="anchor"]`);this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){this.anchorEl&&this.active&&this.isConnected&&(this.popup?.showPopover?.(),this.cleanup=st(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute(`data-current-placement`),this.style.removeProperty(`--auto-size-available-width`),this.style.removeProperty(`--auto-size-available-height`),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;let e=[ct({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(dt({apply:({rects:e})=>{let t=this.sync===`width`||this.sync===`both`,n=this.sync===`height`||this.sync===`both`;this.popup.style.width=t?`${e.reference.width}px`:``,this.popup.style.height=n?`${e.reference.height}px`:``}})):(this.popup.style.width=``,this.popup.style.height=``);let t;this.SUPPORTS_POPOVER&&!_t(this.anchor)&&this.boundary===`scroll`&&(t=X(this.anchorEl).filter(e=>e instanceof Element)),this.flip&&e.push(ut({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy===`best-fit`?`bestFit`:`initialPlacement`,padding:this.flipPadding})),this.shift&&e.push(lt({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(dt({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:e,availableHeight:t})=>{this.autoSize===`vertical`||this.autoSize===`both`?this.style.setProperty(`--auto-size-available-height`,`${t}px`):this.style.removeProperty(`--auto-size-available-height`),this.autoSize===`horizontal`||this.autoSize===`both`?this.style.setProperty(`--auto-size-available-width`,`${e}px`):this.style.removeProperty(`--auto-size-available-width`)}})):(this.style.removeProperty(`--auto-size-available-width`),this.style.removeProperty(`--auto-size-available-height`)),this.arrow&&e.push(ft({element:this.arrowEl,padding:this.arrowPadding}));let n=this.SUPPORTS_POPOVER?e=>it.getOffsetParent(e,mt):it.getOffsetParent;pt(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?`absolute`:`fixed`,platform:{...it,getOffsetParent:n}}).then(({x:e,y:t,middlewareData:n,placement:r})=>{let i=this.localize.dir()===`rtl`,a={top:`bottom`,right:`left`,bottom:`top`,left:`right`}[r.split(`-`)[0]];if(this.setAttribute(`data-current-placement`,r),Object.assign(this.popup.style,{left:`${e}px`,top:`${t}px`}),this.arrow){let e=n.arrow.x,t=n.arrow.y,r=``,o=``,s=``,c=``;if(this.arrowPlacement===`start`){let n=typeof e==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``;r=typeof t==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``,o=i?n:``,c=i?``:n}else if(this.arrowPlacement===`end`){let n=typeof e==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``;o=i?``:n,c=i?n:``,s=typeof t==`number`?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:``}else this.arrowPlacement===`center`?(c=typeof e==`number`?`calc(50% - var(--arrow-size-diagonal))`:``,r=typeof t==`number`?`calc(50% - var(--arrow-size-diagonal))`:``):(c=typeof e==`number`?`${e}px`:``,r=typeof t==`number`?`${t}px`:``);Object.assign(this.arrowEl.style,{top:r,right:o,bottom:s,left:c,[a]:`calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))`})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new x)}render(){return e`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${o({"popup-hover-bridge":!0,"popup-hover-bridge-visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        popover="manual"
        part="popup"
        class=${o({popup:!0,"popup-active":this.active,"popup-fixed":!this.SUPPORTS_POPOVER,"popup-has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?e`<div part="arrow" class="arrow" role="presentation"></div>`:``}
      </div>
    `}};$.css=S,a([c(`.popup`)],$.prototype,`popup`,2),a([c(`.arrow`)],$.prototype,`arrowEl`,2),a([r({attribute:!1,type:Boolean})],$.prototype,`SUPPORTS_POPOVER`,2),a([r()],$.prototype,`anchor`,2),a([r({type:Boolean,reflect:!0})],$.prototype,`active`,2),a([r({reflect:!0})],$.prototype,`placement`,2),a([r()],$.prototype,`boundary`,2),a([r({type:Number})],$.prototype,`distance`,2),a([r({type:Number})],$.prototype,`skidding`,2),a([r({type:Boolean})],$.prototype,`arrow`,2),a([r({attribute:`arrow-placement`})],$.prototype,`arrowPlacement`,2),a([r({attribute:`arrow-padding`,type:Number})],$.prototype,`arrowPadding`,2),a([r({type:Boolean})],$.prototype,`flip`,2),a([r({attribute:`flip-fallback-placements`,converter:{fromAttribute:e=>e.split(` `).map(e=>e.trim()).filter(e=>e!==``),toAttribute:e=>e.join(` `)}})],$.prototype,`flipFallbackPlacements`,2),a([r({attribute:`flip-fallback-strategy`})],$.prototype,`flipFallbackStrategy`,2),a([r({type:Object})],$.prototype,`flipBoundary`,2),a([r({attribute:`flip-padding`,type:Number})],$.prototype,`flipPadding`,2),a([r({type:Boolean})],$.prototype,`shift`,2),a([r({type:Object})],$.prototype,`shiftBoundary`,2),a([r({attribute:`shift-padding`,type:Number})],$.prototype,`shiftPadding`,2),a([r({attribute:`auto-size`})],$.prototype,`autoSize`,2),a([r()],$.prototype,`sync`,2),a([r({type:Object})],$.prototype,`autoSizeBoundary`,2),a([r({attribute:`auto-size-padding`,type:Number})],$.prototype,`autoSizePadding`,2),a([r({attribute:`hover-bridge`,type:Boolean})],$.prototype,`hoverBridge`,2),$=a([n(`wa-popup`)],$);export{_ as a,h as c,u as d,l as f,b as i,f as l,v as n,g as o,y as r,m as s,$ as t,d as u};