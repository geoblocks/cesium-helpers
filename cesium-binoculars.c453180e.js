function t(t){return t&&t.__esModule?t.default:t}function e(t,e,n,r){Object.defineProperty(t,e,{get:n,set:r,enumerable:!0,configurable:!0})}var n=globalThis,r={},i={},a=n.parcelRequire94c2;null==a&&((a=function(t){if(t in r)return r[t].exports;if(t in i){var e=i[t];delete i[t];var n={id:t,exports:{}};return r[t]=n,e.call(n.exports,n,n.exports),n.exports}var a=Error("Cannot find module '"+t+"'");throw a.code="MODULE_NOT_FOUND",a}).register=function(t,e){i[t]=e},n.parcelRequire94c2=a);var u=a.register;u("AXvpI",function(n,r){e(n.exports,"default",()=>c);var i=a("bnB1j"),u=a("3pzcG"),f=a("8w8ZH"),o=a("jQJji"),s=a("1vHsR");let h={};h.EPSILON1=.1,h.EPSILON2=.01,h.EPSILON3=.001,h.EPSILON4=1e-4,h.EPSILON5=1e-5,h.EPSILON6=1e-6,h.EPSILON7=1e-7,h.EPSILON8=1e-8,h.EPSILON9=1e-9,h.EPSILON10=1e-10,h.EPSILON11=1e-11,h.EPSILON12=1e-12,h.EPSILON13=1e-13,h.EPSILON14=1e-14,h.EPSILON15=1e-15,h.EPSILON16=1e-16,h.EPSILON17=1e-17,h.EPSILON18=1e-18,h.EPSILON19=1e-19,h.EPSILON20=1e-20,h.EPSILON21=1e-21,h.GRAVITATIONALPARAMETER=3986004418e5,h.SOLAR_RADIUS=6955e5,h.LUNAR_RADIUS=1737400,h.SIXTY_FOUR_KILOBYTES=65536,h.FOUR_GIGABYTES=0x100000000,h.sign=(0,f.default)(Math.sign,function(t){return 0==(t=+t)||t!=t?t:t>0?1:-1}),h.signNotZero=function(t){return t<0?-1:1},h.toSNorm=function(t,e){return e=(0,f.default)(e,255),Math.round((.5*h.clamp(t,-1,1)+.5)*e)},h.fromSNorm=function(t,e){return e=(0,f.default)(e,255),h.clamp(t,0,e)/e*2-1},h.normalize=function(t,e,n){return 0===(n=Math.max(n-e,0))?0:h.clamp((t-e)/n,0,1)},h.sinh=(0,f.default)(Math.sinh,function(t){return(Math.exp(t)-Math.exp(-t))/2}),h.cosh=(0,f.default)(Math.cosh,function(t){return(Math.exp(t)+Math.exp(-t))/2}),h.lerp=function(t,e,n){return(1-n)*t+n*e},h.PI=Math.PI,h.ONE_OVER_PI=1/Math.PI,h.PI_OVER_TWO=Math.PI/2,h.PI_OVER_THREE=Math.PI/3,h.PI_OVER_FOUR=Math.PI/4,h.PI_OVER_SIX=Math.PI/6,h.THREE_PI_OVER_TWO=3*Math.PI/2,h.TWO_PI=2*Math.PI,h.ONE_OVER_TWO_PI=1/(2*Math.PI),h.RADIANS_PER_DEGREE=Math.PI/180,h.DEGREES_PER_RADIAN=180/Math.PI,h.RADIANS_PER_ARCSECOND=h.RADIANS_PER_DEGREE/3600,h.toRadians=function(t){if(!(0,o.default)(t))throw new s.default("degrees is required.");return t*h.RADIANS_PER_DEGREE},h.toDegrees=function(t){if(!(0,o.default)(t))throw new s.default("radians is required.");return t*h.DEGREES_PER_RADIAN},h.convertLongitudeRange=function(t){if(!(0,o.default)(t))throw new s.default("angle is required.");let e=h.TWO_PI,n=t-Math.floor(t/e)*e;return n<-Math.PI?n+e:n>=Math.PI?n-e:n},h.clampToLatitudeRange=function(t){if(!(0,o.default)(t))throw new s.default("angle is required.");return h.clamp(t,-1*h.PI_OVER_TWO,h.PI_OVER_TWO)},h.negativePiToPi=function(t){if(!(0,o.default)(t))throw new s.default("angle is required.");return t>=-h.PI&&t<=h.PI?t:h.zeroToTwoPi(t+h.PI)-h.PI},h.zeroToTwoPi=function(t){if(!(0,o.default)(t))throw new s.default("angle is required.");if(t>=0&&t<=h.TWO_PI)return t;let e=h.mod(t,h.TWO_PI);return Math.abs(e)<h.EPSILON14&&Math.abs(t)>h.EPSILON14?h.TWO_PI:e},h.mod=function(t,e){if(!(0,o.default)(t))throw new s.default("m is required.");if(!(0,o.default)(e))throw new s.default("n is required.");if(0===e)throw new s.default("divisor cannot be 0.");return h.sign(t)===h.sign(e)&&Math.abs(t)<Math.abs(e)?t:(t%e+e)%e},h.equalsEpsilon=function(t,e,n,r){if(!(0,o.default)(t))throw new s.default("left is required.");if(!(0,o.default)(e))throw new s.default("right is required.");n=(0,f.default)(n,0);let i=Math.abs(t-e);return i<=(r=(0,f.default)(r,n))||i<=n*Math.max(Math.abs(t),Math.abs(e))},h.lessThan=function(t,e,n){if(!(0,o.default)(t))throw new s.default("first is required.");if(!(0,o.default)(e))throw new s.default("second is required.");if(!(0,o.default)(n))throw new s.default("absoluteEpsilon is required.");return t-e<-n},h.lessThanOrEquals=function(t,e,n){if(!(0,o.default)(t))throw new s.default("first is required.");if(!(0,o.default)(e))throw new s.default("second is required.");if(!(0,o.default)(n))throw new s.default("absoluteEpsilon is required.");return t-e<n},h.greaterThan=function(t,e,n){if(!(0,o.default)(t))throw new s.default("first is required.");if(!(0,o.default)(e))throw new s.default("second is required.");if(!(0,o.default)(n))throw new s.default("absoluteEpsilon is required.");return t-e>n},h.greaterThanOrEquals=function(t,e,n){if(!(0,o.default)(t))throw new s.default("first is required.");if(!(0,o.default)(e))throw new s.default("second is required.");if(!(0,o.default)(n))throw new s.default("absoluteEpsilon is required.");return t-e>-n};let l=[1];h.factorial=function(t){if("number"!=typeof t||t<0)throw new s.default("A number greater than or equal to 0 is required.");let e=l.length;if(t>=e){let n=l[e-1];for(let r=e;r<=t;r++){let t=n*r;l.push(t),n=t}}return l[t]},h.incrementWrap=function(t,e,n){if(n=(0,f.default)(n,0),!(0,o.default)(t))throw new s.default("n is required.");if(e<=n)throw new s.default("maximumValue must be greater than minimumValue.");return++t>e&&(t=n),t},h.isPowerOfTwo=function(t){if("number"!=typeof t||t<0||t>0xffffffff)throw new s.default("A number between 0 and (2^32)-1 is required.");return 0!==t&&(t&t-1)==0},h.nextPowerOfTwo=function(t){if("number"!=typeof t||t<0||t>0x80000000)throw new s.default("A number between 0 and 2^31 is required.");return--t,t|=t>>1,t|=t>>2,t|=t>>4,t|=t>>8,t|=t>>16,++t},h.previousPowerOfTwo=function(t){if("number"!=typeof t||t<0||t>0xffffffff)throw new s.default("A number between 0 and (2^32)-1 is required.");return t|=t>>1,t|=t>>2,t|=t>>4,t|=t>>8,t|=t>>16,t|=t>>32,t=(t>>>0)-(t>>>1)},h.clamp=function(t,e,n){return(0,u.default).typeOf.number("value",t),(0,u.default).typeOf.number("min",e),(0,u.default).typeOf.number("max",n),t<e?e:t>n?n:t};let d=new(t(i));h.setRandomNumberSeed=function(e){if(!(0,o.default)(e))throw new s.default("seed is required.");d=new(t(i))(e)},h.nextRandomNumber=function(){return d.random()},h.randomBetween=function(t,e){return h.nextRandomNumber()*(e-t)+t},h.acosClamped=function(t){if(!(0,o.default)(t))throw new s.default("value is required.");return Math.acos(h.clamp(t,-1,1))},h.asinClamped=function(t){if(!(0,o.default)(t))throw new s.default("value is required.");return Math.asin(h.clamp(t,-1,1))},h.chordLength=function(t,e){if(!(0,o.default)(t))throw new s.default("angle is required.");if(!(0,o.default)(e))throw new s.default("radius is required.");return 2*e*Math.sin(.5*t)},h.logBase=function(t,e){if(!(0,o.default)(t))throw new s.default("number is required.");if(!(0,o.default)(e))throw new s.default("base is required.");return Math.log(t)/Math.log(e)},h.cbrt=(0,f.default)(Math.cbrt,function(t){let e=Math.pow(Math.abs(t),1/3);return t<0?-e:e}),h.log2=(0,f.default)(Math.log2,function(t){return Math.log(t)*Math.LOG2E}),h.fog=function(t,e){let n=t*e;return 1-Math.exp(-(n*n))},h.fastApproximateAtan=function(t){return(0,u.default).typeOf.number("x",t),t*(-.1784*Math.abs(t)-.0663*t*t+1.0301)},h.fastApproximateAtan2=function(t,e){let n;(0,u.default).typeOf.number("x",t),(0,u.default).typeOf.number("y",e);let r=Math.abs(t),i=Math.max(r,n=Math.abs(e)),a=(n=Math.min(r,n))/i;if(isNaN(a))throw new s.default("either x or y must be nonzero");return r=h.fastApproximateAtan(a),r=Math.abs(e)>Math.abs(t)?h.PI_OVER_TWO-r:r,r=t<0?h.PI-r:r,r=e<0?-r:r};var c=h}),u("bnB1j",function(t,e){var n=function(t){void 0==t&&(t=new Date().getTime()),this.N=624,this.M=397,this.MATRIX_A=0x9908b0df,this.UPPER_MASK=0x80000000,this.LOWER_MASK=0x7fffffff,this.mt=Array(this.N),this.mti=this.N+1,t.constructor==Array?this.init_by_array(t,t.length):this.init_seed(t)};n.prototype.init_seed=function(t){for(this.mt[0]=t>>>0,this.mti=1;this.mti<this.N;this.mti++){var t=this.mt[this.mti-1]^this.mt[this.mti-1]>>>30;this.mt[this.mti]=(((0xffff0000&t)>>>16)*0x6c078965<<16)+(65535&t)*0x6c078965+this.mti,this.mt[this.mti]>>>=0}},n.prototype.init_by_array=function(t,e){var n,r,i;for(this.init_seed(0x12bd6aa),n=1,r=0,i=this.N>e?this.N:e;i;i--){var a=this.mt[n-1]^this.mt[n-1]>>>30;this.mt[n]=(this.mt[n]^(((0xffff0000&a)>>>16)*1664525<<16)+(65535&a)*1664525)+t[r]+r,this.mt[n]>>>=0,n++,r++,n>=this.N&&(this.mt[0]=this.mt[this.N-1],n=1),r>=e&&(r=0)}for(i=this.N-1;i;i--){var a=this.mt[n-1]^this.mt[n-1]>>>30;this.mt[n]=(this.mt[n]^(((0xffff0000&a)>>>16)*0x5d588b65<<16)+(65535&a)*0x5d588b65)-n,this.mt[n]>>>=0,++n>=this.N&&(this.mt[0]=this.mt[this.N-1],n=1)}this.mt[0]=0x80000000},n.prototype.random_int=function(){var t,e,n=[0,this.MATRIX_A];if(this.mti>=this.N){for(this.mti==this.N+1&&this.init_seed(5489),e=0;e<this.N-this.M;e++)t=this.mt[e]&this.UPPER_MASK|this.mt[e+1]&this.LOWER_MASK,this.mt[e]=this.mt[e+this.M]^t>>>1^n[1&t];for(;e<this.N-1;e++)t=this.mt[e]&this.UPPER_MASK|this.mt[e+1]&this.LOWER_MASK,this.mt[e]=this.mt[e+(this.M-this.N)]^t>>>1^n[1&t];t=this.mt[this.N-1]&this.UPPER_MASK|this.mt[0]&this.LOWER_MASK,this.mt[this.N-1]=this.mt[this.M-1]^t>>>1^n[1&t],this.mti=0}return t=this.mt[this.mti++],t^=t>>>11,t^=t<<7&0x9d2c5680,t^=t<<15&0xefc60000,(t^=t>>>18)>>>0},n.prototype.random_int31=function(){return this.random_int()>>>1},n.prototype.random_incl=function(){return this.random_int()*(1/0xffffffff)},n.prototype.random=function(){return this.random_int()*(1/0x100000000)},n.prototype.random_excl=function(){return(this.random_int()+.5)*(1/0x100000000)},n.prototype.random_long=function(){return 1/0x20000000000000*(0x4000000*(this.random_int()>>>5)+(this.random_int()>>>6))},t.exports=n}),u("3pzcG",function(t,n){e(t.exports,"default",()=>o);var r=a("jQJji"),i=a("1vHsR");let u={};function f(t,e,n){return`Expected ${n} to be typeof ${e}, actual typeof was ${t}`}u.typeOf={},u.defined=function(t,e){if(!(0,r.default)(e))throw new i.default(`${t} is required, actual value was undefined`)},u.typeOf.func=function(t,e){if("function"!=typeof e)throw new i.default(f(typeof e,"function",t))},u.typeOf.string=function(t,e){if("string"!=typeof e)throw new i.default(f(typeof e,"string",t))},u.typeOf.number=function(t,e){if("number"!=typeof e)throw new i.default(f(typeof e,"number",t))},u.typeOf.number.lessThan=function(t,e,n){if(u.typeOf.number(t,e),e>=n)throw new i.default(`Expected ${t} to be less than ${n}, actual value was ${e}`)},u.typeOf.number.lessThanOrEquals=function(t,e,n){if(u.typeOf.number(t,e),e>n)throw new i.default(`Expected ${t} to be less than or equal to ${n}, actual value was ${e}`)},u.typeOf.number.greaterThan=function(t,e,n){if(u.typeOf.number(t,e),e<=n)throw new i.default(`Expected ${t} to be greater than ${n}, actual value was ${e}`)},u.typeOf.number.greaterThanOrEquals=function(t,e,n){if(u.typeOf.number(t,e),e<n)throw new i.default(`Expected ${t} to be greater than or equal to ${n}, actual value was ${e}`)},u.typeOf.object=function(t,e){if("object"!=typeof e)throw new i.default(f(typeof e,"object",t))},u.typeOf.bool=function(t,e){if("boolean"!=typeof e)throw new i.default(f(typeof e,"boolean",t))},u.typeOf.bigint=function(t,e){if("bigint"!=typeof e)throw new i.default(f(typeof e,"bigint",t))},u.typeOf.number.equals=function(t,e,n,r){if(u.typeOf.number(t,n),u.typeOf.number(e,r),n!==r)throw new i.default(`${t} must be equal to ${e}, the actual values are ${n} and ${r}`)};var o=u}),u("jQJji",function(t,n){e(t.exports,"default",()=>r);var r=function(t){return null!=t}}),u("1vHsR",function(t,n){e(t.exports,"default",()=>u);var r=a("jQJji");function i(t){let e;this.name="DeveloperError",this.message=t;try{throw Error()}catch(t){e=t.stack}this.stack=e}(0,r.default)(Object.create)&&(i.prototype=Object.create(Error.prototype),i.prototype.constructor=i),i.prototype.toString=function(){let t=`${this.name}: ${this.message}`;return(0,r.default)(this.stack)&&(t+=`
${this.stack.toString()}`),t},i.throwInstantiationError=function(){throw new i("This function defines an interface and should not be called directly.")};var u=i}),u("8w8ZH",function(t,n){function r(t,e){return null!=t?t:e}e(t.exports,"default",()=>i),r.EMPTY_OBJECT=Object.freeze({});var i=r});
//# sourceMappingURL=cesium-binoculars.c453180e.js.map
