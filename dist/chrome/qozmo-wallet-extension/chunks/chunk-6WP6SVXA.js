import{c as S6}from"./chunk-OTXMMK6X.js";import{$a as V1,A as X2,Aa as W1,B as I3,C as U3,Ca as s8,D as Y2,E as g4,F as B6,Fa as y4,G as B,H as d1,Ha as o8,I as o2,Ia as t8,J as P2,Ja as f8,K as M2,L as z1,M as v1,Ma as m8,N as G6,O as K,P as $6,Pa as j1,Q as V6,R as C4,S as M1,Sa as N4,T as h1,Ta as u8,U as X6,Ua as p8,V as Y6,Va as g1,W as K6,Wa as G3,Xa as d8,Y as J6,Ya as z8,Za as G1,_ as Q6,_a as $1,a as S,ab as v8,b as p4,ba as Z6,bb as M8,c as s1,ca as a8,cb as L1,d as M6,db as w4,e as C6,eb as k4,fa as c8,fb as X,g as R3,ga as S4,gb as h8,ha as e8,hb as x1,ia as r8,ib as b1,j as k6,ja as l8,jb as t2,ka as n8,kb as A4,lb as g8,m as z4,mb as C1,o as z2,oa as i8,p as A6,q as T6,r as E6,s as v4,u as P6,v as w2,w as M4,x as h4,y as F6,ya as K2,z as m1,za as F2}from"./chunk-ANYV3IQC.js";import{$a as b6,A as p2,B as y2,Ba as o1,C as F,D as y3,Dc as b4,E as N3,Ec as T2,F as w3,Fc as q6,G as d2,Gc as W6,H as i1,Hc as j6,Ia as L6,Ib as L4,Jc as p1,L as k3,M as l2,N as A3,O as N2,P as T3,Q as E3,R as u4,Rc as E2,Va as x6,X as D,Y,Yb as s2,ac as k2,ba as n2,cb as H3,fb as D3,fc as A2,g as m4,gb as y6,gc as O3,h as O1,hb as N6,hc as _3,i as H,jb as t1,jc as R6,k as f6,kb as w6,l as m6,m as u6,mb as f1,mc as H6,nb as i2,oa as P3,ob as V2,oc as D6,p as p6,pb as v2,pc as u1,q as d6,qc as x4,r as z6,rc as I6,sc as q3,tc as W3,ua as d4,uc as j3,va as h6,vc as q1,w as _1,wa as F3,wc as q,x as a2,xc as U6,y as v6,ya as g6,yc as O6,z as $2,za as B3,zc as _6}from"./chunk-TNPKSFVZ.js";import{a as f4,b as t6,c as U1}from"./chunk-DCANE7XH.js";var P8=f4(N=>{"use strict";var X3=Symbol.for("react.transitional.element"),k9=Symbol.for("react.portal"),A9=Symbol.for("react.fragment"),T9=Symbol.for("react.strict_mode"),E9=Symbol.for("react.profiler"),P9=Symbol.for("react.consumer"),F9=Symbol.for("react.context"),B9=Symbol.for("react.forward_ref"),R9=Symbol.for("react.suspense"),H9=Symbol.for("react.memo"),S8=Symbol.for("react.lazy"),D9=Symbol.for("react.activity"),I9=Symbol.for("react.view_transition"),L8=Symbol.iterator;function U9(a){return a===null||typeof a!="object"?null:(a=L8&&a[L8]||a["@@iterator"],typeof a=="function"?a:null)}var y8={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},N8=Object.assign,w8={};function y1(a,c,e){this.props=a,this.context=c,this.refs=w8,this.updater=e||y8}y1.prototype.isReactComponent={};y1.prototype.setState=function(a,c){if(typeof a!="object"&&typeof a!="function"&&a!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,a,c,"setState")};y1.prototype.forceUpdate=function(a){this.updater.enqueueForceUpdate(this,a,"forceUpdate")};function k8(){}k8.prototype=y1.prototype;function Y3(a,c,e){this.props=a,this.context=c,this.refs=w8,this.updater=e||y8}var K3=Y3.prototype=new k8;K3.constructor=Y3;N8(K3,y1.prototype);K3.isPureReactComponent=!0;var x8=Array.isArray;function V3(){}var I={H:null,A:null,T:null,S:null},A8=Object.prototype.hasOwnProperty;function J3(a,c,e){var r=e.ref;return{$$typeof:X3,type:a,key:c,ref:r!==void 0?r:null,props:e}}function O9(a,c){return J3(a.type,c,a.props)}function Q3(a){return typeof a=="object"&&a!==null&&a.$$typeof===X3}function _9(a){var c={"=":"=0",":":"=2"};return"$"+a.replace(/[=:]/g,function(e){return c[e]})}var b8=/\/+/g;function $3(a,c){return typeof a=="object"&&a!==null&&a.key!=null?_9(""+a.key):c.toString(36)}function q9(a){switch(a.status){case"fulfilled":return a.value;case"rejected":throw a.reason;default:switch(typeof a.status=="string"?a.then(V3,V3):(a.status="pending",a.then(function(c){a.status==="pending"&&(a.status="fulfilled",a.value=c)},function(c){a.status==="pending"&&(a.status="rejected",a.reason=c)})),a.status){case"fulfilled":return a.value;case"rejected":throw a.reason}}throw a}function S1(a,c,e,r,l){var n=typeof a;(n==="undefined"||n==="boolean")&&(a=null);var i=!1;if(a===null)i=!0;else switch(n){case"bigint":case"string":case"number":i=!0;break;case"object":switch(a.$$typeof){case X3:case k9:i=!0;break;case S8:return i=a._init,S1(i(a._payload),c,e,r,l)}}if(i)return l=l(a),i=r===""?"."+$3(a,0):r,x8(l)?(e="",i!=null&&(e=i.replace(b8,"$&/")+"/"),S1(l,c,e,"",function(t){return t})):l!=null&&(Q3(l)&&(l=O9(l,e+(l.key==null||a&&a.key===l.key?"":(""+l.key).replace(b8,"$&/")+"/")+i)),c.push(l)),1;i=0;var s=r===""?".":r+":";if(x8(a))for(var o=0;o<a.length;o++)r=a[o],n=s+$3(r,o),i+=S1(r,c,e,n,l);else if(o=U9(a),typeof o=="function")for(a=o.call(a),o=0;!(r=a.next()).done;)r=r.value,n=s+$3(r,o++),i+=S1(r,c,e,n,l);else if(n==="object"){if(typeof a.then=="function")return S1(q9(a),c,e,r,l);throw c=String(a),Error("Objects are not valid as a React child (found: "+(c==="[object Object]"?"object with keys {"+Object.keys(a).join(", ")+"}":c)+"). If you meant to render a collection of children, use an array instead.")}return i}function T4(a,c,e){if(a==null)return a;var r=[],l=0;return S1(a,r,"","",function(n){return c.call(e,n,l++)}),r}function W9(a){if(a._status===-1){var c=a._result,e=c();e.then(function(r){(a._status===0||a._status===-1)&&(a._status=1,a._result=r,e.status===void 0&&(e.status="fulfilled",e.value=r))},function(r){(a._status===0||a._status===-1)&&(a._status=2,a._result=r,e.status===void 0&&(e.status="rejected",e.reason=r))}),a._status===-1&&(a._status=0,a._result=e)}if(a._status===1)return a._result.default;throw a._result}var C8=typeof reportError=="function"?reportError:function(a){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var c=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof a=="object"&&a!==null&&typeof a.message=="string"?String(a.message):String(a),error:a});if(!window.dispatchEvent(c))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",a);return}console.error(a)};function T8(a){var c=I.T,e={};e.types=c!==null?c.types:null,I.T=e;try{var r=a(),l=I.S;l!==null&&l(e,r),typeof r=="object"&&r!==null&&typeof r.then=="function"&&r.then(V3,C8)}catch(n){C8(n)}finally{c!==null&&e.types!==null&&(c.types=e.types),I.T=c}}function E8(a){var c=I.T;if(c!==null){var e=c.types;e===null?c.types=[a]:e.indexOf(a)===-1&&e.push(a)}else T8(E8.bind(null,a))}var j9={map:T4,forEach:function(a,c,e){T4(a,function(){c.apply(this,arguments)},e)},count:function(a){var c=0;return T4(a,function(){c++}),c},toArray:function(a){return T4(a,function(c){return c})||[]},only:function(a){if(!Q3(a))throw Error("React.Children.only expected to receive a single React element child.");return a}};N.Activity=D9;N.Children=j9;N.Component=y1;N.Fragment=A9;N.Profiler=E9;N.PureComponent=Y3;N.StrictMode=T9;N.Suspense=R9;N.ViewTransition=I9;N.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=I;N.__COMPILER_RUNTIME={__proto__:null,c:function(a){return I.H.useMemoCache(a)}};N.addTransitionType=E8;N.cache=function(a){return function(){return a.apply(null,arguments)}};N.cacheSignal=function(){return null};N.cloneElement=function(a,c,e){if(a==null)throw Error("The argument must be a React element, but you passed "+a+".");var r=N8({},a.props),l=a.key;if(c!=null)for(n in c.key!==void 0&&(l=""+c.key),c)!A8.call(c,n)||n==="key"||n==="__self"||n==="__source"||n==="ref"&&c.ref===void 0||(r[n]=c[n]);var n=arguments.length-2;if(n===1)r.children=e;else if(1<n){for(var i=Array(n),s=0;s<n;s++)i[s]=arguments[s+2];r.children=i}return J3(a.type,l,r)};N.createContext=function(a){return a={$$typeof:F9,_currentValue:a,_currentValue2:a,_threadCount:0,Provider:null,Consumer:null},a.Provider=a,a.Consumer={$$typeof:P9,_context:a},a};N.createElement=function(a,c,e){var r,l={},n=null;if(c!=null)for(r in c.key!==void 0&&(n=""+c.key),c)A8.call(c,r)&&r!=="key"&&r!=="__self"&&r!=="__source"&&(l[r]=c[r]);var i=arguments.length-2;if(i===1)l.children=e;else if(1<i){for(var s=Array(i),o=0;o<i;o++)s[o]=arguments[o+2];l.children=s}if(a&&a.defaultProps)for(r in i=a.defaultProps,i)l[r]===void 0&&(l[r]=i[r]);return J3(a,n,l)};N.createRef=function(){return{current:null}};N.forwardRef=function(a){return{$$typeof:B9,render:a}};N.isValidElement=Q3;N.lazy=function(a){return{$$typeof:S8,_payload:{_status:-1,_result:a},_init:W9}};N.memo=function(a,c){return{$$typeof:H9,type:a,compare:c===void 0?null:c}};N.startTransition=T8;N.unstable_useCacheRefresh=function(){return I.H.useCacheRefresh()};N.use=function(a){return I.H.use(a)};N.useActionState=function(a,c,e){return I.H.useActionState(a,c,e)};N.useCallback=function(a,c){return I.H.useCallback(a,c)};N.useContext=function(a){return I.H.useContext(a)};N.useDebugValue=function(){};N.useDeferredValue=function(a,c){return I.H.useDeferredValue(a,c)};N.useEffect=function(a,c){return I.H.useEffect(a,c)};N.useEffectEvent=function(a){return I.H.useEffectEvent(a)};N.useId=function(){return I.H.useId()};N.useImperativeHandle=function(a,c,e){return I.H.useImperativeHandle(a,c,e)};N.useInsertionEffect=function(a,c){return I.H.useInsertionEffect(a,c)};N.useLayoutEffect=function(a,c){return I.H.useLayoutEffect(a,c)};N.useMemo=function(a,c){return I.H.useMemo(a,c)};N.useOptimistic=function(a,c){return I.H.useOptimistic(a,c)};N.useReducer=function(a,c,e){return I.H.useReducer(a,c,e)};N.useRef=function(a){return I.H.useRef(a)};N.useState=function(a){return I.H.useState(a)};N.useSyncExternalStore=function(a,c,e){return I.H.useSyncExternalStore(a,c,e)};N.useTransition=function(){return I.H.useTransition()};N.version="19.3.1"});var Z3=f4((fi,F8)=>{"use strict";F8.exports=P8()});var Ya=f4(z3=>{"use strict";var Nn=Symbol.for("react.transitional.element"),wn=Symbol.for("react.fragment");function Xa(a,c,e){var r=null;if(e!==void 0&&(r=""+e),c.key!==void 0&&(r=""+c.key),"key"in c){e={};for(var l in c)l!=="key"&&(e[l]=c[l])}else e=c;return c=e.ref,{$$typeof:Nn,type:a,key:r,ref:c!==void 0?c:null,props:e}}z3.Fragment=wn;z3.jsx=Xa;z3.jsxs=Xa});var v3=f4((ih,Ka)=>{"use strict";Ka.exports=Ya()});function n0(a,c){(c==null||c>a.length)&&(c=a.length);for(var e=0,r=Array(c);e<c;e++)r[e]=a[e];return r}function G9(a){if(Array.isArray(a))return a}function $9(a){if(Array.isArray(a))return n0(a)}function V9(a,c){if(!(a instanceof c))throw new TypeError("Cannot call a class as a function")}function B8(a,c){for(var e=0;e<c.length;e++){var r=c[e];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(a,u5(r.key),r)}}function X9(a,c,e){return c&&B8(a.prototype,c),e&&B8(a,e),Object.defineProperty(a,"prototype",{writable:!1}),a}function R4(a,c){var e=typeof Symbol<"u"&&a[Symbol.iterator]||a["@@iterator"];if(!e){if(Array.isArray(a)||(e=L0(a))||c&&a&&typeof a.length=="number"){e&&(a=e);var r=0,l=function(){};return{s:l,n:function(){return r>=a.length?{done:!0}:{done:!1,value:a[r++]}},e:function(o){throw o},f:l}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}var n,i=!0,s=!1;return{s:function(){e=e.call(a)},n:function(){var o=e.next();return i=o.done,o},e:function(o){s=!0,n=o},f:function(){try{i||e.return==null||e.return()}finally{if(s)throw n}}}}function C(a,c,e){return(c=u5(c))in a?Object.defineProperty(a,c,{value:e,enumerable:!0,configurable:!0,writable:!0}):a[c]=e,a}function Y9(a){if(typeof Symbol<"u"&&a[Symbol.iterator]!=null||a["@@iterator"]!=null)return Array.from(a)}function K9(a,c){var e=a==null?null:typeof Symbol<"u"&&a[Symbol.iterator]||a["@@iterator"];if(e!=null){var r,l,n,i,s=[],o=!0,t=!1;try{if(n=(e=e.call(a)).next,c===0){if(Object(e)!==e)return;o=!1}else for(;!(o=(r=n.call(e)).done)&&(s.push(r.value),s.length!==c);o=!0);}catch(f){t=!0,l=f}finally{try{if(!o&&e.return!=null&&(i=e.return(),Object(i)!==i))return}finally{if(t)throw l}}return s}}function J9(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function Q9(){throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function R8(a,c){var e=Object.keys(a);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(a);c&&(r=r.filter(function(l){return Object.getOwnPropertyDescriptor(a,l).enumerable})),e.push.apply(e,r)}return e}function v(a){for(var c=1;c<arguments.length;c++){var e=arguments[c]!=null?arguments[c]:{};c%2?R8(Object(e),!0).forEach(function(r){C(a,r,e[r])}):Object.getOwnPropertyDescriptors?Object.defineProperties(a,Object.getOwnPropertyDescriptors(e)):R8(Object(e)).forEach(function(r){Object.defineProperty(a,r,Object.getOwnPropertyDescriptor(e,r))})}return a}function _4(a,c){return G9(a)||K9(a,c)||L0(a,c)||J9()}function e2(a){return $9(a)||Y9(a)||L0(a)||Q9()}function Z9(a,c){if(typeof a!="object"||!a)return a;var e=a[Symbol.toPrimitive];if(e!==void 0){var r=e.call(a,c||"default");if(typeof r!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return(c==="string"?String:Number)(a)}function u5(a){var c=Z9(a,"string");return typeof c=="symbol"?c:c+""}function I4(a){"@babel/helpers - typeof";return I4=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(c){return typeof c}:function(c){return c&&typeof Symbol=="function"&&c.constructor===Symbol&&c!==Symbol.prototype?"symbol":typeof c},I4(a)}function L0(a,c){if(a){if(typeof a=="string")return n0(a,c);var e={}.toString.call(a).slice(8,-1);return e==="Object"&&a.constructor&&(e=a.constructor.name),e==="Map"||e==="Set"?Array.from(a):e==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?n0(a,c):void 0}}var H8=function(){},x0={},p5={},d5=null,z5={mark:H8,measure:H8};try{typeof window<"u"&&(x0=window),typeof document<"u"&&(p5=document),typeof MutationObserver<"u"&&(d5=MutationObserver),typeof performance<"u"&&(z5=performance)}catch{}var ac=x0.navigator||{},D8=ac.userAgent,I8=D8===void 0?"":D8,R2=x0,U=p5,U8=d5,E4=z5,mi=!!R2.document,L2=!!U.documentElement&&!!U.head&&typeof U.addEventListener=="function"&&typeof U.createElement=="function",v5=~I8.indexOf("MSIE")||~I8.indexOf("Trident/"),P4,cc=/fa(k|kd|s|r|l|t|d|dr|dl|dt|b|slr|slpr|wsb|tl|ns|nds|es|gt|jr|jfr|jdr|usb|ufsb|udsb|cr|ss|sr|sl|st|sds|sdr|sdl|sdt|sldr|slpdr|pr|ms|vs)?[\-\ ]/,ec=/Font ?Awesome ?([567 ]*)(Solid|Regular|Light|Thin|Duotone|Brands|Free|Pro|Sharp Duotone|Sharp|Kit|Notdog Duo|Notdog|Chisel|Etch|Graphite|Thumbprint|Jelly Fill|Jelly Duo|Jelly|Utility|Utility Fill|Utility Duo|Slab Press|Slab|Slab Duo|Slab Press Duo|Pixel|Mosaic|Vellum|Whiteboard)?.*/i,M5={classic:{fa:"solid",fas:"solid","fa-solid":"solid",far:"regular","fa-regular":"regular",fal:"light","fa-light":"light",fat:"thin","fa-thin":"thin",fab:"brands","fa-brands":"brands"},duotone:{fa:"solid",fad:"solid","fa-solid":"solid","fa-duotone":"solid",fadr:"regular","fa-regular":"regular",fadl:"light","fa-light":"light",fadt:"thin","fa-thin":"thin"},sharp:{fa:"solid",fass:"solid","fa-solid":"solid",fasr:"regular","fa-regular":"regular",fasl:"light","fa-light":"light",fast:"thin","fa-thin":"thin"},"sharp-duotone":{fa:"solid",fasds:"solid","fa-solid":"solid",fasdr:"regular","fa-regular":"regular",fasdl:"light","fa-light":"light",fasdt:"thin","fa-thin":"thin"},slab:{"fa-regular":"regular",faslr:"regular"},"slab-press":{"fa-regular":"regular",faslpr:"regular"},"slab-duo":{"fa-regular":"regular",fasldr:"regular"},"slab-press-duo":{"fa-regular":"regular",faslpdr:"regular"},thumbprint:{"fa-light":"light",fatl:"light"},vellum:{"fa-solid":"solid",favs:"solid"},pixel:{"fa-regular":"regular",fapr:"regular"},mosaic:{"fa-solid":"solid",fams:"solid"},whiteboard:{"fa-semibold":"semibold",fawsb:"semibold"},notdog:{"fa-solid":"solid",fans:"solid"},"notdog-duo":{"fa-solid":"solid",fands:"solid"},etch:{"fa-solid":"solid",faes:"solid"},graphite:{"fa-thin":"thin",fagt:"thin"},jelly:{"fa-regular":"regular",fajr:"regular"},"jelly-fill":{"fa-regular":"regular",fajfr:"regular"},"jelly-duo":{"fa-regular":"regular",fajdr:"regular"},chisel:{"fa-regular":"regular",facr:"regular"},utility:{"fa-semibold":"semibold",fausb:"semibold"},"utility-duo":{"fa-semibold":"semibold",faudsb:"semibold"},"utility-fill":{"fa-semibold":"semibold",faufsb:"semibold"}},rc={GROUP:"duotone-group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},h5=["fa-classic","fa-duotone","fa-sharp","fa-sharp-duotone","fa-thumbprint","fa-whiteboard","fa-notdog","fa-notdog-duo","fa-chisel","fa-etch","fa-graphite","fa-jelly","fa-jelly-fill","fa-jelly-duo","fa-slab","fa-slab-press","fa-slab-press-duo","fa-slab-duo","fa-mosaic","fa-pixel","fa-vellum","fa-utility","fa-utility-duo","fa-utility-fill"],j="classic",Q1="duotone",g5="sharp",L5="sharp-duotone",x5="chisel",b5="etch",C5="graphite",S5="jelly",y5="jelly-duo",N5="jelly-fill",w5="mosaic",k5="notdog",A5="notdog-duo",T5="pixel",E5="slab",P5="slab-duo",F5="slab-press",B5="slab-press-duo",R5="thumbprint",H5="utility",D5="utility-duo",I5="utility-fill",U5="vellum",O5="whiteboard",lc="Classic",nc="Duotone",ic="Sharp",sc="Sharp Duotone",oc="Chisel",tc="Etch",fc="Graphite",mc="Jelly",uc="Jelly Duo",pc="Jelly Fill",dc="Mosaic",zc="Notdog",vc="Notdog Duo",Mc="Pixel",hc="Slab",gc="Slab Duo",Lc="Slab Press",xc="Slab Press Duo",bc="Thumbprint",Cc="Utility",Sc="Utility Duo",yc="Utility Fill",Nc="Vellum",wc="Whiteboard",_5=[j,Q1,g5,L5,x5,b5,C5,S5,y5,N5,w5,k5,A5,T5,E5,P5,F5,B5,R5,H5,D5,I5,U5,O5],ui=(P4={},C(C(C(C(C(C(C(C(C(C(P4,j,lc),Q1,nc),g5,ic),L5,sc),x5,oc),b5,tc),C5,fc),S5,mc),y5,uc),N5,pc),C(C(C(C(C(C(C(C(C(C(P4,w5,dc),k5,zc),A5,vc),T5,Mc),E5,hc),P5,gc),F5,Lc),B5,xc),R5,bc),H5,Cc),C(C(C(C(P4,D5,Sc),I5,yc),U5,Nc),O5,wc)),kc={classic:{900:"fas",400:"far",normal:"far",300:"fal",100:"fat"},duotone:{900:"fad",400:"fadr",300:"fadl",100:"fadt"},sharp:{900:"fass",400:"fasr",300:"fasl",100:"fast"},"sharp-duotone":{900:"fasds",400:"fasdr",300:"fasdl",100:"fasdt"},slab:{400:"faslr"},"slab-press":{400:"faslpr"},"slab-duo":{400:"fasldr"},"slab-press-duo":{400:"faslpdr"},vellum:{900:"favs"},mosaic:{900:"fams"},pixel:{400:"fapr"},whiteboard:{600:"fawsb"},thumbprint:{300:"fatl"},notdog:{900:"fans"},"notdog-duo":{900:"fands"},etch:{900:"faes"},graphite:{100:"fagt"},chisel:{400:"facr"},jelly:{400:"fajr"},"jelly-fill":{400:"fajfr"},"jelly-duo":{400:"fajdr"},utility:{600:"fausb"},"utility-duo":{600:"faudsb"},"utility-fill":{600:"faufsb"}},Ac={"Font Awesome 7 Free":{900:"fas",400:"far"},"Font Awesome 7 Pro":{900:"fas",400:"far",normal:"far",300:"fal",100:"fat"},"Font Awesome 7 Brands":{400:"fab",normal:"fab"},"Font Awesome 7 Duotone":{900:"fad",400:"fadr",normal:"fadr",300:"fadl",100:"fadt"},"Font Awesome 7 Sharp":{900:"fass",400:"fasr",normal:"fasr",300:"fasl",100:"fast"},"Font Awesome 7 Sharp Duotone":{900:"fasds",400:"fasdr",normal:"fasdr",300:"fasdl",100:"fasdt"},"Font Awesome 7 Jelly":{400:"fajr",normal:"fajr"},"Font Awesome 7 Jelly Fill":{400:"fajfr",normal:"fajfr"},"Font Awesome 7 Jelly Duo":{400:"fajdr",normal:"fajdr"},"Font Awesome 7 Slab":{400:"faslr",normal:"faslr"},"Font Awesome 7 Slab Press":{400:"faslpr",normal:"faslpr"},"Font Awesome 7 Slab Duo":{400:"fasldr",normal:"fasldr"},"Font Awesome 7 Slab Press Duo":{400:"faslpdr",normal:"faslpdr"},"Font Awesome 7 Pixel":{400:"fapr",normal:"fapr"},"Font Awesome 7 Mosaic":{900:"fams",normal:"fams"},"Font Awesome 7 Vellum":{900:"favs",normal:"favs"},"Font Awesome 7 Thumbprint":{300:"fatl",normal:"fatl"},"Font Awesome 7 Notdog":{900:"fans",normal:"fans"},"Font Awesome 7 Notdog Duo":{900:"fands",normal:"fands"},"Font Awesome 7 Etch":{900:"faes",normal:"faes"},"Font Awesome 7 Graphite":{100:"fagt",normal:"fagt"},"Font Awesome 7 Chisel":{400:"facr",normal:"facr"},"Font Awesome 7 Whiteboard":{600:"fawsb",normal:"fawsb"},"Font Awesome 7 Utility":{600:"fausb",normal:"fausb"},"Font Awesome 7 Utility Duo":{600:"faudsb",normal:"faudsb"},"Font Awesome 7 Utility Fill":{600:"faufsb",normal:"faufsb"}},Tc=new Map([["classic",{defaultShortPrefixId:"fas",defaultStyleId:"solid",styleIds:["solid","regular","light","thin","brands"],futureStyleIds:[],defaultFontWeight:900}],["duotone",{defaultShortPrefixId:"fad",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["sharp",{defaultShortPrefixId:"fass",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["sharp-duotone",{defaultShortPrefixId:"fasds",defaultStyleId:"solid",styleIds:["solid","regular","light","thin"],futureStyleIds:[],defaultFontWeight:900}],["chisel",{defaultShortPrefixId:"facr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["etch",{defaultShortPrefixId:"faes",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["graphite",{defaultShortPrefixId:"fagt",defaultStyleId:"thin",styleIds:["thin"],futureStyleIds:[],defaultFontWeight:100}],["jelly",{defaultShortPrefixId:"fajr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["jelly-duo",{defaultShortPrefixId:"fajdr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["jelly-fill",{defaultShortPrefixId:"fajfr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["mosaic",{defaultShortPrefixId:"fams",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["notdog",{defaultShortPrefixId:"fans",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["notdog-duo",{defaultShortPrefixId:"fands",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["pixel",{defaultShortPrefixId:"fapr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["slab",{defaultShortPrefixId:"faslr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["slab-duo",{defaultShortPrefixId:"fasldr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["slab-press",{defaultShortPrefixId:"faslpr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["slab-press-duo",{defaultShortPrefixId:"faslpdr",defaultStyleId:"regular",styleIds:["regular"],futureStyleIds:[],defaultFontWeight:400}],["thumbprint",{defaultShortPrefixId:"fatl",defaultStyleId:"light",styleIds:["light"],futureStyleIds:[],defaultFontWeight:300}],["utility",{defaultShortPrefixId:"fausb",defaultStyleId:"semibold",styleIds:["semibold"],futureStyleIds:[],defaultFontWeight:600}],["utility-duo",{defaultShortPrefixId:"faudsb",defaultStyleId:"semibold",styleIds:["semibold"],futureStyleIds:[],defaultFontWeight:600}],["utility-fill",{defaultShortPrefixId:"faufsb",defaultStyleId:"semibold",styleIds:["semibold"],futureStyleIds:[],defaultFontWeight:600}],["vellum",{defaultShortPrefixId:"favs",defaultStyleId:"solid",styleIds:["solid"],futureStyleIds:[],defaultFontWeight:900}],["whiteboard",{defaultShortPrefixId:"fawsb",defaultStyleId:"semibold",styleIds:["semibold"],futureStyleIds:[],defaultFontWeight:600}]]),Ec={chisel:{regular:"facr"},classic:{brands:"fab",light:"fal",regular:"far",solid:"fas",thin:"fat"},duotone:{light:"fadl",regular:"fadr",solid:"fad",thin:"fadt"},etch:{solid:"faes"},graphite:{thin:"fagt"},jelly:{regular:"fajr"},"jelly-duo":{regular:"fajdr"},"jelly-fill":{regular:"fajfr"},mosaic:{solid:"fams"},notdog:{solid:"fans"},"notdog-duo":{solid:"fands"},pixel:{regular:"fapr"},sharp:{light:"fasl",regular:"fasr",solid:"fass",thin:"fast"},"sharp-duotone":{light:"fasdl",regular:"fasdr",solid:"fasds",thin:"fasdt"},slab:{regular:"faslr"},"slab-duo":{regular:"fasldr"},"slab-press":{regular:"faslpr"},"slab-press-duo":{regular:"faslpdr"},thumbprint:{light:"fatl"},utility:{semibold:"fausb"},"utility-duo":{semibold:"faudsb"},"utility-fill":{semibold:"faufsb"},vellum:{solid:"favs"},whiteboard:{semibold:"fawsb"}},q5=["fak","fa-kit","fakd","fa-kit-duotone"],O8={kit:{fak:"kit","fa-kit":"kit"},"kit-duotone":{fakd:"kit-duotone","fa-kit-duotone":"kit-duotone"}},Pc=["kit"],Fc="kit",Bc="kit-duotone",Rc="Kit",Hc="Kit Duotone",pi=C(C({},Fc,Rc),Bc,Hc),Dc={kit:{"fa-kit":"fak"},"kit-duotone":{"fa-kit-duotone":"fakd"}},Ic={"Font Awesome Kit":{400:"fak",normal:"fak"},"Font Awesome Kit Duotone":{400:"fakd",normal:"fakd"}},Uc={kit:{fak:"fa-kit"},"kit-duotone":{fakd:"fa-kit-duotone"}},_8={kit:{kit:"fak"},"kit-duotone":{"kit-duotone":"fakd"}},F4,B4={GROUP:"duotone-group",SWAP_OPACITY:"swap-opacity",PRIMARY:"primary",SECONDARY:"secondary"},Oc=["fa-classic","fa-duotone","fa-sharp","fa-sharp-duotone","fa-thumbprint","fa-whiteboard","fa-notdog","fa-notdog-duo","fa-chisel","fa-etch","fa-graphite","fa-jelly","fa-jelly-fill","fa-jelly-duo","fa-slab","fa-slab-press","fa-slab-press-duo","fa-slab-duo","fa-mosaic","fa-pixel","fa-vellum","fa-utility","fa-utility-duo","fa-utility-fill"],_c="classic",qc="duotone",Wc="sharp",jc="sharp-duotone",Gc="chisel",$c="etch",Vc="graphite",Xc="jelly",Yc="jelly-duo",Kc="jelly-fill",Jc="mosaic",Qc="notdog",Zc="notdog-duo",ae="pixel",ce="slab",ee="slab-duo",re="slab-press",le="slab-press-duo",ne="thumbprint",ie="utility",se="utility-duo",oe="utility-fill",te="vellum",fe="whiteboard",me="Classic",ue="Duotone",pe="Sharp",de="Sharp Duotone",ze="Chisel",ve="Etch",Me="Graphite",he="Jelly",ge="Jelly Duo",Le="Jelly Fill",xe="Mosaic",be="Notdog",Ce="Notdog Duo",Se="Pixel",ye="Slab",Ne="Slab Duo",we="Slab Press",ke="Slab Press Duo",Ae="Thumbprint",Te="Utility",Ee="Utility Duo",Pe="Utility Fill",Fe="Vellum",Be="Whiteboard",di=(F4={},C(C(C(C(C(C(C(C(C(C(F4,_c,me),qc,ue),Wc,pe),jc,de),Gc,ze),$c,ve),Vc,Me),Xc,he),Yc,ge),Kc,Le),C(C(C(C(C(C(C(C(C(C(F4,Jc,xe),Qc,be),Zc,Ce),ae,Se),ce,ye),ee,Ne),re,we),le,ke),ne,Ae),ie,Te),C(C(C(C(F4,se,Ee),oe,Pe),te,Fe),fe,Be)),Re="kit",He="kit-duotone",De="Kit",Ie="Kit Duotone",zi=C(C({},Re,De),He,Ie),Ue={classic:{"fa-brands":"fab","fa-duotone":"fad","fa-light":"fal","fa-regular":"far","fa-solid":"fas","fa-thin":"fat"},duotone:{"fa-regular":"fadr","fa-light":"fadl","fa-thin":"fadt"},sharp:{"fa-solid":"fass","fa-regular":"fasr","fa-light":"fasl","fa-thin":"fast"},"sharp-duotone":{"fa-solid":"fasds","fa-regular":"fasdr","fa-light":"fasdl","fa-thin":"fasdt"},slab:{"fa-regular":"faslr"},"slab-press":{"fa-regular":"faslpr"},"slab-duo":{"fa-regular":"fasldr"},"slab-press-duo":{"fa-regular":"faslpdr"},pixel:{"fa-regular":"fapr"},mosaic:{"fa-solid":"fams"},vellum:{"fa-solid":"favs"},whiteboard:{"fa-semibold":"fawsb"},thumbprint:{"fa-light":"fatl"},notdog:{"fa-solid":"fans"},"notdog-duo":{"fa-solid":"fands"},etch:{"fa-solid":"faes"},graphite:{"fa-thin":"fagt"},jelly:{"fa-regular":"fajr"},"jelly-fill":{"fa-regular":"fajfr"},"jelly-duo":{"fa-regular":"fajdr"},chisel:{"fa-regular":"facr"},utility:{"fa-semibold":"fausb"},"utility-duo":{"fa-semibold":"faudsb"},"utility-fill":{"fa-semibold":"faufsb"}},Oe={classic:["fas","far","fal","fat","fad"],duotone:["fadr","fadl","fadt"],sharp:["fass","fasr","fasl","fast"],"sharp-duotone":["fasds","fasdr","fasdl","fasdt"],slab:["faslr"],"slab-press":["faslpr"],"slab-duo":["fasldr"],"slab-press-duo":["faslpdr"],pixel:["fapr"],mosaic:["fams"],vellum:["favs"],whiteboard:["fawsb"],thumbprint:["fatl"],notdog:["fans"],"notdog-duo":["fands"],etch:["faes"],graphite:["fagt"],jelly:["fajr"],"jelly-fill":["fajfr"],"jelly-duo":["fajdr"],chisel:["facr"],utility:["fausb"],"utility-duo":["faudsb"],"utility-fill":["faufsb"]},i0={classic:{fab:"fa-brands",fad:"fa-duotone",fal:"fa-light",far:"fa-regular",fas:"fa-solid",fat:"fa-thin"},duotone:{fadr:"fa-regular",fadl:"fa-light",fadt:"fa-thin"},sharp:{fass:"fa-solid",fasr:"fa-regular",fasl:"fa-light",fast:"fa-thin"},"sharp-duotone":{fasds:"fa-solid",fasdr:"fa-regular",fasdl:"fa-light",fasdt:"fa-thin"},slab:{faslr:"fa-regular"},"slab-press":{faslpr:"fa-regular"},"slab-duo":{fasldr:"fa-regular"},"slab-press-duo":{faslpdr:"fa-regular"},pixel:{fapr:"fa-regular"},mosaic:{fams:"fa-solid"},vellum:{favs:"fa-solid"},whiteboard:{fawsb:"fa-semibold"},thumbprint:{fatl:"fa-light"},notdog:{fans:"fa-solid"},"notdog-duo":{fands:"fa-solid"},etch:{faes:"fa-solid"},graphite:{fagt:"fa-thin"},jelly:{fajr:"fa-regular"},"jelly-fill":{fajfr:"fa-regular"},"jelly-duo":{fajdr:"fa-regular"},chisel:{facr:"fa-regular"},utility:{fausb:"fa-semibold"},"utility-duo":{faudsb:"fa-semibold"},"utility-fill":{faufsb:"fa-semibold"}},_e=["fa-solid","fa-regular","fa-light","fa-thin","fa-duotone","fa-brands","fa-semibold"],W5=["fa","fas","far","fal","fat","fad","fadr","fadl","fadt","fab","fass","fasr","fasl","fast","fasds","fasdr","fasdl","fasdt","faslr","faslpr","fasldr","faslpdr","fapr","fams","favs","fawsb","fatl","fans","fands","faes","fagt","fajr","fajfr","fajdr","facr","fausb","faudsb","faufsb"].concat(Oc,_e),qe=["solid","regular","light","thin","duotone","brands","semibold"],j5=[1,2,3,4,5,6,7,8,9,10],We=j5.concat([11,12,13,14,15,16,17,18,19,20]),je=["aw","fw","pull-left","pull-right"],Ge=[].concat(e2(Object.keys(Oe)),qe,je,["2xs","xs","sm","lg","xl","2xl","beat","beat-fade","border","bounce","buzz","canvas-square","canvas-roomy","fade","flip-360","flip-both","flip-horizontal","flip-vertical","flip","float","inverse","jello","layers","layers-bottom-left","layers-bottom-right","layers-counter","layers-text","layers-top-left","layers-top-right","li","pull-end","pull-start","pulse","rotate-180","rotate-270","rotate-90","rotate-by","shake","spin-pulse","spin-reverse","spin","spin-snap","spin-snap-4","spin-snap-8","stack-1x","stack-2x","stack","swing","ul","wag","width-auto","width-fixed",B4.GROUP,B4.SWAP_OPACITY,B4.PRIMARY,B4.SECONDARY]).concat(j5.map(function(a){return"".concat(a,"x")})).concat(We.map(function(a){return"w-".concat(a)})),$e={"Font Awesome 5 Free":{900:"fas",400:"far"},"Font Awesome 5 Pro":{900:"fas",400:"far",normal:"far",300:"fal"},"Font Awesome 5 Brands":{400:"fab",normal:"fab"},"Font Awesome 5 Duotone":{900:"fad"}},h2="___FONT_AWESOME___",s0=16,G5="fa",$5="svg-inline--fa",Q2="data-fa-i2svg",o0="data-fa-pseudo-element",Ve="data-fa-pseudo-element-pending",b0="data-prefix",C0="data-icon",q8="fontawesome-i2svg",Xe="async",Ye=["HTML","HEAD","STYLE","SCRIPT"],V5=["::before","::after",":before",":after"],X5=(function(){try{return!0}catch{return!1}})();function Z1(a){return new Proxy(a,{get:function(e,r){return r in e?e[r]:e[j]}})}var Y5=v({},M5);Y5[j]=v(v(v(v({},{"fa-duotone":"duotone"}),M5[j]),O8.kit),O8["kit-duotone"]);var Ke=Z1(Y5),t0=v({},Ec);t0[j]=v(v(v(v({},{duotone:"fad"}),t0[j]),_8.kit),_8["kit-duotone"]);var W8=Z1(t0),f0=v({},i0);f0[j]=v(v({},f0[j]),Uc.kit);var S0=Z1(f0),m0=v({},Ue);m0[j]=v(v({},m0[j]),Dc.kit);var vi=Z1(m0),Je=cc,K5="fa-layers-text",Qe=ec,Ze=v({},kc),Mi=Z1(Ze),ar=["class","data-prefix","data-icon","data-fa-transform","data-fa-mask"],a0=rc,cr=[].concat(e2(Pc),e2(Ge)),Y1=R2.FontAwesomeConfig||{};function er(a){var c=U.querySelector("script["+a+"]");if(c)return c.getAttribute(a)}function rr(a){return a===""?!0:a==="false"?!1:a==="true"?!0:a}U&&typeof U.querySelector=="function"&&(j8=[["data-family-prefix","familyPrefix"],["data-css-prefix","cssPrefix"],["data-family-default","familyDefault"],["data-style-default","styleDefault"],["data-replacement-class","replacementClass"],["data-auto-replace-svg","autoReplaceSvg"],["data-auto-add-css","autoAddCss"],["data-search-pseudo-elements","searchPseudoElements"],["data-search-pseudo-elements-warnings","searchPseudoElementsWarnings"],["data-search-pseudo-elements-full-scan","searchPseudoElementsFullScan"],["data-observe-mutations","observeMutations"],["data-mutate-approach","mutateApproach"],["data-keep-original-source","keepOriginalSource"],["data-measure-performance","measurePerformance"],["data-show-missing-icons","showMissingIcons"]],j8.forEach(function(a){var c=_4(a,2),e=c[0],r=c[1],l=rr(er(e));l!=null&&(Y1[r]=l)}));var j8,J5={styleDefault:"solid",familyDefault:j,cssPrefix:G5,replacementClass:$5,autoReplaceSvg:!0,autoAddCss:!0,searchPseudoElements:!1,searchPseudoElementsWarnings:!0,searchPseudoElementsFullScan:!1,observeMutations:!0,mutateApproach:"async",keepOriginalSource:!0,measurePerformance:!1,showMissingIcons:!0};Y1.familyPrefix&&(Y1.cssPrefix=Y1.familyPrefix);var k1=v(v({},J5),Y1);k1.autoReplaceSvg||(k1.observeMutations=!1);var b={};Object.keys(J5).forEach(function(a){Object.defineProperty(b,a,{enumerable:!0,set:function(e){k1[a]=e,K1.forEach(function(r){return r(b)})},get:function(){return k1[a]}})});Object.defineProperty(b,"familyPrefix",{enumerable:!0,set:function(c){k1.cssPrefix=c,K1.forEach(function(e){return e(b)})},get:function(){return k1.cssPrefix}});R2.FontAwesomeConfig=b;var K1=[];function lr(a){return K1.push(a),function(){K1.splice(K1.indexOf(a),1)}}var B2=s0,f2={size:16,x:0,y:0,rotate:0,flipX:!1,flipY:!1};function nr(a){if(!(!a||!L2)){var c=U.createElement("style");c.setAttribute("type","text/css"),c.innerHTML=a;for(var e=U.head.childNodes,r=null,l=e.length-1;l>-1;l--){var n=e[l],i=(n.tagName||"").toUpperCase();["STYLE","LINK"].indexOf(i)>-1&&(r=n)}return U.head.insertBefore(c,r),a}}var ir="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";function G8(){for(var a=12,c="";a-- >0;)c+=ir[Math.random()*62|0];return c}function A1(a){for(var c=[],e=(a||[]).length>>>0;e--;)c[e]=a[e];return c}function y0(a){return a.classList?A1(a.classList):(a.getAttribute("class")||"").split(" ").filter(function(c){return c})}function Q5(a){return"".concat(a).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function sr(a){return Object.keys(a||{}).reduce(function(c,e){return c+"".concat(e,'="').concat(Q5(a[e]),'" ')},"").trim()}function q4(a){return Object.keys(a||{}).reduce(function(c,e){return c+"".concat(e,": ").concat(a[e].trim(),";")},"")}function N0(a){return a.size!==f2.size||a.x!==f2.x||a.y!==f2.y||a.rotate!==f2.rotate||a.flipX||a.flipY}function or(a){var c=a.transform,e=a.containerWidth,r=a.iconWidth,l={transform:"translate(".concat(e/2," 256)")},n="translate(".concat(c.x*32,", ").concat(c.y*32,") "),i="scale(".concat(c.size/16*(c.flipX?-1:1),", ").concat(c.size/16*(c.flipY?-1:1),") "),s="rotate(".concat(c.rotate," 0 0)"),o={transform:"".concat(n," ").concat(i," ").concat(s)},t={transform:"translate(".concat(r/2*-1," -256)")};return{outer:l,inner:o,path:t}}function tr(a){var c=a.transform,e=a.width,r=e===void 0?s0:e,l=a.height,n=l===void 0?s0:l,i=a.startCentered,s=i===void 0?!1:i,o="";return s&&v5?o+="translate(".concat(c.x/B2-r/2,"em, ").concat(c.y/B2-n/2,"em) "):s?o+="translate(calc(-50% + ".concat(c.x/B2,"em), calc(-50% + ").concat(c.y/B2,"em)) "):o+="translate(".concat(c.x/B2,"em, ").concat(c.y/B2,"em) "),o+="scale(".concat(c.size/B2*(c.flipX?-1:1),", ").concat(c.size/B2*(c.flipY?-1:1),") "),o+="rotate(".concat(c.rotate,"deg) "),o}var fr=`:root, :host {
  --fa-font-solid: normal 900 1em/1 'Font Awesome 7 Free';
  --fa-font-regular: normal 400 1em/1 'Font Awesome 7 Free';
  --fa-font-light: normal 300 1em/1 'Font Awesome 7 Pro';
  --fa-font-thin: normal 100 1em/1 'Font Awesome 7 Pro';
  --fa-font-duotone: normal 900 1em/1 'Font Awesome 7 Duotone';
  --fa-font-duotone-regular: normal 400 1em/1 'Font Awesome 7 Duotone';
  --fa-font-duotone-light: normal 300 1em/1 'Font Awesome 7 Duotone';
  --fa-font-duotone-thin: normal 100 1em/1 'Font Awesome 7 Duotone';
  --fa-font-brands: normal 400 1em/1 'Font Awesome 7 Brands';
  --fa-font-sharp-solid: normal 900 1em/1 'Font Awesome 7 Sharp';
  --fa-font-sharp-regular: normal 400 1em/1 'Font Awesome 7 Sharp';
  --fa-font-sharp-light: normal 300 1em/1 'Font Awesome 7 Sharp';
  --fa-font-sharp-thin: normal 100 1em/1 'Font Awesome 7 Sharp';
  --fa-font-sharp-duotone-solid: normal 900 1em/1 'Font Awesome 7 Sharp Duotone';
  --fa-font-sharp-duotone-regular: normal 400 1em/1 'Font Awesome 7 Sharp Duotone';
  --fa-font-sharp-duotone-light: normal 300 1em/1 'Font Awesome 7 Sharp Duotone';
  --fa-font-sharp-duotone-thin: normal 100 1em/1 'Font Awesome 7 Sharp Duotone';
  --fa-font-slab-regular: normal 400 1em/1 'Font Awesome 7 Slab';
  --fa-font-slab-press-regular: normal 400 1em/1 'Font Awesome 7 Slab Press';
  --fa-font-slab-duo-regular: normal 400 1em/1 'Font Awesome 7 Slab Duo';
  --fa-font-slab-press-duo-regular: normal 400 1em/1 'Font Awesome 7 Slab Press Duo';
  --fa-font-pixel-regular: normal 400 1em/1 'Font Awesome 7 Pixel';
  --fa-font-mosaic-solid: normal 900 1em/1 'Font Awesome 7 Mosaic';
  --fa-font-vellum-solid: normal 900 1em/1 'Font Awesome 7 Vellum';
  --fa-font-whiteboard-semibold: normal 600 1em/1 'Font Awesome 7 Whiteboard';
  --fa-font-thumbprint-light: normal 300 1em/1 'Font Awesome 7 Thumbprint';
  --fa-font-notdog-solid: normal 900 1em/1 'Font Awesome 7 Notdog';
  --fa-font-notdog-duo-solid: normal 900 1em/1 'Font Awesome 7 Notdog Duo';
  --fa-font-etch-solid: normal 900 1em/1 'Font Awesome 7 Etch';
  --fa-font-graphite-thin: normal 100 1em/1 'Font Awesome 7 Graphite';
  --fa-font-jelly-regular: normal 400 1em/1 'Font Awesome 7 Jelly';
  --fa-font-jelly-fill-regular: normal 400 1em/1 'Font Awesome 7 Jelly Fill';
  --fa-font-jelly-duo-regular: normal 400 1em/1 'Font Awesome 7 Jelly Duo';
  --fa-font-chisel-regular: normal 400 1em/1 'Font Awesome 7 Chisel';
  --fa-font-utility-semibold: normal 600 1em/1 'Font Awesome 7 Utility';
  --fa-font-utility-duo-semibold: normal 600 1em/1 'Font Awesome 7 Utility Duo';
  --fa-font-utility-fill-semibold: normal 600 1em/1 'Font Awesome 7 Utility Fill';
}

.svg-inline--fa {
  box-sizing: content-box;
  display: var(--fa-display, inline-block);
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
  width: var(--fa-width, 1.25em);
}
.svg-inline--fa.fa-2xs {
  vertical-align: 0.1em;
}
.svg-inline--fa.fa-xs {
  vertical-align: 0em;
}
.svg-inline--fa.fa-sm {
  vertical-align: -0.0714285714em;
}
.svg-inline--fa.fa-lg {
  vertical-align: -0.2em;
}
.svg-inline--fa.fa-xl {
  vertical-align: -0.25em;
}
.svg-inline--fa.fa-2xl {
  vertical-align: -0.3125em;
}
.svg-inline--fa.fa-pull-left,
.svg-inline--fa .fa-pull-start {
  float: inline-start;
  margin-inline-end: var(--fa-pull-margin, 0.3em);
}
.svg-inline--fa.fa-pull-right,
.svg-inline--fa .fa-pull-end {
  float: inline-end;
  margin-inline-start: var(--fa-pull-margin, 0.3em);
}
.svg-inline--fa.fa-li {
  width: var(--fa-li-width, 2em);
  inset-inline-start: calc(-1 * var(--fa-li-width, 2em));
  inset-block-start: 0.25em; /* syncing vertical alignment with Web Font rendering */
}

.fa-layers-counter, .fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: var(--fa-width, 1.25em);
}
.fa-layers .svg-inline--fa {
  inset: 0;
  margin: auto;
  position: absolute;
  transform-origin: center center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: var(--fa-counter-background-color, #ff253a);
  border-radius: var(--fa-counter-border-radius, 1em);
  box-sizing: border-box;
  color: var(--fa-inverse, #fff);
  line-height: var(--fa-counter-line-height, 1);
  max-width: var(--fa-counter-max-width, 5em);
  min-width: var(--fa-counter-min-width, 1.5em);
  overflow: hidden;
  padding: var(--fa-counter-padding, 0.25em 0.5em);
  right: var(--fa-right, 0);
  text-overflow: ellipsis;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-counter-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: var(--fa-bottom, 0);
  right: var(--fa-right, 0);
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: var(--fa-bottom, 0);
  left: var(--fa-left, 0);
  right: auto;
  top: auto;
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: bottom left;
}

.fa-layers-top-right {
  top: var(--fa-top, 0);
  right: var(--fa-right, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top right;
}

.fa-layers-top-left {
  left: var(--fa-left, 0);
  right: auto;
  top: var(--fa-top, 0);
  transform: scale(var(--fa-layers-scale, 0.25));
  transform-origin: top left;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-2xs {
  font-size: calc(10 / 16 * 1em); /* converts a 10px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 10 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 10 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-xs {
  font-size: calc(12 / 16 * 1em); /* converts a 12px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 12 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 12 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-sm {
  font-size: calc(14 / 16 * 1em); /* converts a 14px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 14 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 14 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-lg {
  font-size: calc(20 / 16 * 1em); /* converts a 20px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 20 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 20 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-xl {
  font-size: calc(24 / 16 * 1em); /* converts a 24px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 24 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 24 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-2xl {
  font-size: calc(32 / 16 * 1em); /* converts a 32px size into an em-based value that's relative to the scale's 16px base */
  line-height: calc(1 / 32 * 1em); /* sets the line-height of the icon back to that of it's parent */
  vertical-align: calc((6 / 32 - 0.375) * 1em); /* vertically centers the icon taking into account the surrounding text's descender */
}

.fa-width-auto {
  --fa-width: auto;
}

.fa-fw,
.fa-width-fixed {
  --fa-width: 1.25em;
}

.fa-canvas-square {
  padding-block: 0.125em;
  margin-block-end: -0.125em;
}

.fa-canvas-roomy {
  padding-block: 0.25em;
  padding-inline: 0.125em;
  margin-block-end: -0.25em;
  box-sizing: content-box;
}

.fa-ul {
  list-style-type: none;
  margin-inline-start: var(--fa-li-margin, 2.5em);
  padding-inline-start: 0;
}
.fa-ul > li {
  position: relative;
}

.fa-li {
  inset-inline-start: calc(-1 * var(--fa-li-width, 2em));
  position: absolute;
  text-align: center;
  width: var(--fa-li-width, 2em);
  line-height: inherit;
}

/* Heads Up: Bordered Icons will not be supported in the future!
  - This feature will be deprecated in the next major release of Font Awesome (v8)!
  - You may continue to use it in this version *v7), but it will not be supported in Font Awesome v8.
*/
/* Notes:
* --@{v.$css-prefix}-border-width = 1/16 by default (to render as ~1px based on a 16px default font-size)
* --@{v.$css-prefix}-border-padding =
  ** 3/16 for vertical padding (to give ~2px of vertical whitespace around an icon considering it's vertical alignment)
  ** 4/16 for horizontal padding (to give ~4px of horizontal whitespace around an icon)
*/
.fa-border {
  border-color: var(--fa-border-color, #eee);
  border-radius: var(--fa-border-radius, 0.1em);
  border-style: var(--fa-border-style, solid);
  border-width: var(--fa-border-width, 0.0625em);
  box-sizing: var(--fa-border-box-sizing, content-box);
  padding: var(--fa-border-padding, 0.1875em 0.25em);
}

.fa-pull-left,
.fa-pull-start {
  float: inline-start;
  margin-inline-end: var(--fa-pull-margin, 0.3em);
}

.fa-pull-right,
.fa-pull-end {
  float: inline-end;
  margin-inline-start: var(--fa-pull-margin, 0.3em);
}

.fa-beat {
  animation-name: fa-beat;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-bounce {
  animation-name: fa-bounce;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
}

.fa-fade {
  animation-name: fa-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-beat-fade {
  animation-name: fa-beat-fade;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-flip {
  animation-name: fa-flip;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1.5s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-flip-360 {
  animation-name: fa-flip-360;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-shake {
  animation-name: fa-shake;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 0.75s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
}

.fa-spin {
  animation-name: fa-spin;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-reverse {
  --fa-animation-direction: reverse;
}

.fa-pulse,
.fa-spin-pulse {
  animation-name: fa-spin;
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, steps(8));
}

.fa-spin-snap {
  animation-name: fa-spin-snap;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 3s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-snap-4 {
  animation-name: fa-spin-snap-4;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 2.4s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-spin-snap-8 {
  animation-name: fa-spin-snap-8;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 4s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-buzz {
  animation-name: fa-buzz;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 0.6s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, linear);
}

.fa-wag {
  animation-name: fa-wag;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 0.9s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-out);
  transform-origin: bottom center;
}

.fa-float {
  animation-name: fa-float;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 3s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-in-out);
  will-change: transform;
}

.fa-swing {
  animation-name: fa-swing;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 1.2s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-out);
  transform-origin: top center;
}

.fa-jello {
  animation-name: fa-jello;
  animation-delay: var(--fa-animation-delay, 0s);
  animation-direction: var(--fa-animation-direction, normal);
  animation-duration: var(--fa-animation-duration, 0.9s);
  animation-iteration-count: var(--fa-animation-iteration-count, infinite);
  animation-timing-function: var(--fa-animation-timing, ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .fa-beat,
  .fa-bounce,
  .fa-fade,
  .fa-beat-fade,
  .fa-flip,
  .fa-flip-360,
  .fa-pulse,
  .fa-shake,
  .fa-spin,
  .fa-spin-pulse,
  .fa-buzz,
  .fa-float,
  .fa-jello,
  .fa-spin-snap,
  .fa-spin-snap-4,
  .fa-spin-snap-8,
  .fa-swing,
  .fa-wag {
    animation: none !important;
    transition: none !important;
  }
}
@keyframes fa-beat {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(calc(1.25 * var(--fa-beat-scale, 1.25)));
  }
  45% {
    transform: scale(calc(1.22 * var(--fa-beat-scale, 1.22)));
  }
  65% {
    transform: scale(calc(1.25 * var(--fa-beat-scale, 1.25)));
  }
  90% {
    transform: scale(1);
  }
}
@keyframes fa-bounce {
  0% {
    transform: scale(1, 1) translateY(0);
    animation-timing-function: var(--fa-animation-timing);
  }
  14% {
    transform: scale(var(--fa-bounce-start-scale-x, 1.06), var(--fa-bounce-start-scale-y, 0.94)) translateY(var(--fa-bounce-anticipation, 3px));
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
  }
  32% {
    transform: scale(var(--fa-bounce-jump-scale-x, 0.94), var(--fa-bounce-jump-scale-y, 1.12)) translateY(calc(-1 * var(--fa-bounce-height, 0.5em)));
    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
  }
  52% {
    transform: scale(1, 1) translateY(calc(-1 * var(--fa-bounce-height, 0.5em) * 1.1));
    animation-timing-function: cubic-bezier(0.5, 0, 1, 0.5);
  }
  70% {
    transform: scale(var(--fa-bounce-land-scale-x, 1.06), var(--fa-bounce-land-scale-y, 0.92)) translateY(0);
    animation-timing-function: cubic-bezier(0.33, 0.33, 0.66, 1);
  }
  85% {
    transform: scale(0.98, 1.04) translateY(calc(-2px * var(--fa-bounce-rebound, 1)));
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
  }
  100% {
    transform: scale(1, 1) translateY(0);
  }
}
@keyframes fa-fade {
  0% {
    opacity: 1;
    transform: scale(1);
    animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
  }
  40% {
    opacity: var(--fa-fade-opacity, 0.4);
    transform: scale(0.98);
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes fa-beat-fade {
  0% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
    animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
  }
  25% {
    opacity: calc(var(--fa-beat-fade-opacity, 0.4) + 0.4);
    transform: scale(var(--fa-beat-fade-scale, 1.28));
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  45% {
    opacity: 1;
    transform: scale(var(--fa-beat-fade-scale, 1.25));
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  65% {
    opacity: calc(var(--fa-beat-fade-opacity, 0.4) + 0.4);
    transform: scale(var(--fa-beat-fade-scale, 1.28));
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  100% {
    opacity: var(--fa-beat-fade-opacity, 0.4);
    transform: scale(1);
  }
}
@keyframes fa-flip {
  0% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), 0deg);
    animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
  }
  8% {
    transform: perspective(2em) scale(var(--fa-flip-anticipation-scale, 0.95)) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), 0deg);
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
  }
  35% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * 0.6));
    animation-timing-function: linear;
  }
  65% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * 0.5));
    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
  }
  92% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * var(--fa-flip-overshoot, 1.04)));
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
  }
  100% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -360deg));
  }
}
@keyframes fa-flip-360 {
  0% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), 0deg);
    animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
  }
  8% {
    transform: perspective(2em) scale(var(--fa-flip-anticipation-scale, 0.95)) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), 0deg);
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
  }
  50% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * 0.6));
    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
  }
  80% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), calc(var(--fa-flip-angle, -360deg) * var(--fa-flip-overshoot, 1.04)));
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
  }
  100% {
    transform: perspective(2em) scale(1) rotate3d(var(--fa-flip-x, 0), var(--fa-flip-y, 1), var(--fa-flip-z, 0), var(--fa-flip-angle, -360deg));
  }
}
@keyframes fa-shake {
  0% {
    transform: rotate(0deg);
    animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
  }
  8% {
    transform: rotate(35deg) translateX(1px);
    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
  }
  20% {
    transform: rotate(-22deg) translateX(-1px);
    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
  }
  35% {
    transform: rotate(15deg) translateX(1px);
    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
  }
  50% {
    transform: rotate(-9deg);
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  65% {
    transform: rotate(5deg);
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  78% {
    transform: rotate(-3deg);
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  90% {
    transform: rotate(1deg);
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes fa-spin-snap {
  0% {
    transform: rotate(0deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  12% {
    transform: rotate(60deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  16.67% {
    transform: rotate(60deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  28.67% {
    transform: rotate(120deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  33.33% {
    transform: rotate(120deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  45.33% {
    transform: rotate(180deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: rotate(180deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  62% {
    transform: rotate(240deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  66.67% {
    transform: rotate(240deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  78.67% {
    transform: rotate(300deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  83.33% {
    transform: rotate(300deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  95.33% {
    transform: rotate(360deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes fa-spin-snap-4 {
  0% {
    transform: rotate(0deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  15% {
    transform: rotate(90deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  25% {
    transform: rotate(90deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  40% {
    transform: rotate(180deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: rotate(180deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  65% {
    transform: rotate(270deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  75% {
    transform: rotate(270deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  90% {
    transform: rotate(360deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes fa-spin-snap-8 {
  0% {
    transform: rotate(0deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  9% {
    transform: rotate(45deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  12.5% {
    transform: rotate(45deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  21.5% {
    transform: rotate(90deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  25% {
    transform: rotate(90deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  34% {
    transform: rotate(135deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  37.5% {
    transform: rotate(135deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  46.5% {
    transform: rotate(180deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: rotate(180deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  59% {
    transform: rotate(225deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  62.5% {
    transform: rotate(225deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  71.5% {
    transform: rotate(270deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  75% {
    transform: rotate(270deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  84% {
    transform: rotate(315deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  87.5% {
    transform: rotate(315deg);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
  96.5% {
    transform: rotate(360deg);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  100% {
    transform: rotate(360deg);
  }
}
@keyframes fa-buzz {
  0% {
    transform: translateX(0) rotate(0deg);
    animation-timing-function: cubic-bezier(0.1, 0, 0.9, 1);
  }
  5% {
    transform: translateX(var(--fa-buzz-distance, 4px)) rotate(0.5deg);
  }
  10% {
    transform: translateX(calc(-1 * var(--fa-buzz-distance, 4px))) rotate(-0.5deg);
  }
  15% {
    transform: translateX(var(--fa-buzz-distance, 4px)) rotate(0.3deg);
  }
  20% {
    transform: translateX(calc(-1 * var(--fa-buzz-distance, 4px))) rotate(-0.3deg);
  }
  25% {
    transform: translateX(calc(var(--fa-buzz-distance, 4px) * 0.7)) rotate(0.2deg);
  }
  30% {
    transform: translateX(calc(-1 * var(--fa-buzz-distance, 4px) * 0.7)) rotate(-0.2deg);
  }
  35% {
    transform: translateX(calc(var(--fa-buzz-distance, 4px) * 0.4)) rotate(0.1deg);
  }
  40% {
    transform: translateX(0) rotate(0deg);
  }
  100% {
    transform: translateX(0) rotate(0deg);
  }
}
@keyframes fa-wag {
  0% {
    transform: rotate(0deg);
    animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
  }
  12% {
    transform: rotate(var(--fa-wag-angle, 12deg));
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  24% {
    transform: rotate(2deg);
    animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
  }
  36% {
    transform: rotate(calc(var(--fa-wag-angle, 12deg) * 0.85));
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  48% {
    transform: rotate(1deg);
    animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
  }
  58% {
    transform: rotate(calc(var(--fa-wag-angle, 12deg) * 0.6));
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  68% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-float {
  0% {
    transform: translateY(0) translateX(0) rotate(0deg) scale(var(--fa-float-squash-x, 1.02), var(--fa-float-squash-y, 0.98));
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
  }
  15% {
    transform: translateY(calc(-0.4 * var(--fa-float-height, 6px))) translateX(var(--fa-float-drift, 1px)) rotate(var(--fa-float-tilt, 1deg)) scale(1, 1);
    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
  }
  35% {
    transform: translateY(calc(-1 * var(--fa-float-height, 6px))) translateX(0) rotate(0deg) scale(var(--fa-float-stretch-x, 0.98), var(--fa-float-stretch-y, 1.03));
    animation-timing-function: cubic-bezier(0.5, 0, 0.5, 0);
  }
  50% {
    transform: translateY(calc(-0.92 * var(--fa-float-height, 6px))) translateX(calc(-0.5 * var(--fa-float-drift, 1px))) rotate(calc(-0.5 * var(--fa-float-tilt, 1deg))) scale(0.995, 1.01);
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
  }
  70% {
    transform: translateY(calc(-0.3 * var(--fa-float-height, 6px))) translateX(calc(-1 * var(--fa-float-drift, 1px))) rotate(calc(-1 * var(--fa-float-tilt, 1deg))) scale(1, 1);
    animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
  }
  90% {
    transform: translateY(calc(0.05 * var(--fa-float-height, 6px))) translateX(0) rotate(0deg) scale(var(--fa-float-squash-x, 1.02), var(--fa-float-squash-y, 0.98));
    animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
  }
  100% {
    transform: translateY(0) translateX(0) rotate(0deg) scale(var(--fa-float-squash-x, 1.02), var(--fa-float-squash-y, 0.98));
  }
}
@keyframes fa-swing {
  0% {
    transform: rotate(0deg);
    animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
  }
  8% {
    transform: rotate(var(--fa-swing-angle, 22deg));
    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
  }
  18% {
    transform: rotate(calc(-1 * var(--fa-swing-angle, 22deg) * 0.85));
    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
  }
  28% {
    transform: rotate(calc(var(--fa-swing-angle, 22deg) * 0.65));
    animation-timing-function: cubic-bezier(0.35, 0, 0.65, 1);
  }
  38% {
    transform: rotate(calc(-1 * var(--fa-swing-angle, 22deg) * 0.45));
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  48% {
    transform: rotate(calc(var(--fa-swing-angle, 22deg) * 0.25));
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  56% {
    transform: rotate(calc(-1 * var(--fa-swing-angle, 22deg) * 0.1));
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  64% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
@keyframes fa-jello {
  0% {
    transform: scale(1, 1);
    animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
  }
  12% {
    transform: scale(var(--fa-jello-scale-x, 1.15), calc(2 - var(--fa-jello-scale-x, 1.15)));
    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
  }
  24% {
    transform: scale(calc(2 - var(--fa-jello-scale-y, 1.12)), var(--fa-jello-scale-y, 1.12));
    animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
  }
  36% {
    transform: scale(calc(1 + (var(--fa-jello-scale-x, 1.15) - 1) * 0.5), calc(2 - (1 + (var(--fa-jello-scale-x, 1.15) - 1) * 0.5)));
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  48% {
    transform: scale(calc(2 - (1 + (var(--fa-jello-scale-y, 1.12) - 1) * 0.3)), calc(1 + (var(--fa-jello-scale-y, 1.12) - 1) * 0.3));
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }
  58% {
    transform: scale(1.02, 0.98);
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
  68% {
    transform: scale(1, 1);
  }
  100% {
    transform: scale(1, 1);
  }
}
.fa-rotate-90 {
  transform: rotate(90deg);
}

.fa-rotate-180 {
  transform: rotate(180deg);
}

.fa-rotate-270 {
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  transform: scale(-1, 1);
}

.fa-flip-vertical {
  transform: scale(1, -1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1, -1);
}

.fa-rotate-by {
  transform: rotate(var(--fa-rotate-angle, 0));
}

.svg-inline--fa .fa-primary {
  fill: var(--fa-primary-color, currentColor);
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: var(--fa-secondary-color, currentColor);
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: black;
}

.svg-inline--fa.fa-inverse {
  fill: var(--fa-inverse, #fff);
}

.fa-stack {
  display: inline-block;
  height: 2em;
  line-height: 2em;
  position: relative;
  vertical-align: middle;
  width: 2.5em;
}

.fa-inverse {
  color: var(--fa-inverse, #fff);
}

.svg-inline--fa.fa-stack-1x {
  --fa-width: 1.25em;
  height: 1em;
  width: var(--fa-width);
}
.svg-inline--fa.fa-stack-2x {
  --fa-width: 2.5em;
  height: 2em;
  width: var(--fa-width);
}

.fa-stack-1x,
.fa-stack-2x {
  inset: 0;
  margin: auto;
  position: absolute;
  z-index: var(--fa-stack-z-index, auto);
}`;function Z5(){var a=G5,c=$5,e=b.cssPrefix,r=b.replacementClass,l=fr;if(e!==a||r!==c){var n=new RegExp("\\.".concat(a,"\\-"),"g"),i=new RegExp("\\--".concat(a,"\\-"),"g"),s=new RegExp("\\.".concat(c),"g");l=l.replace(n,".".concat(e,"-")).replace(i,"--".concat(e,"-")).replace(s,".".concat(r))}return l}var $8=!1;function c0(){b.autoAddCss&&!$8&&(nr(Z5()),$8=!0)}var mr={mixout:function(){return{dom:{css:Z5,insertCss:c0}}},hooks:function(){return{beforeDOMElementCreation:function(){c0()},beforeI2svg:function(){c0()}}}},g2=R2||{};g2[h2]||(g2[h2]={});g2[h2].styles||(g2[h2].styles={});g2[h2].hooks||(g2[h2].hooks={});g2[h2].shims||(g2[h2].shims=[]);var c2=g2[h2],a7=[],c7=function(){U.removeEventListener("DOMContentLoaded",c7),U4=1,a7.map(function(c){return c()})},U4=!1;L2&&(U4=(U.documentElement.doScroll?/^loaded|^c/:/^loaded|^i|^c/).test(U.readyState),U4||U.addEventListener("DOMContentLoaded",c7));function ur(a){L2&&(U4?setTimeout(a,0):a7.push(a))}function a4(a){var c=a.tag,e=a.attributes,r=e===void 0?{}:e,l=a.children,n=l===void 0?[]:l;return typeof a=="string"?Q5(a):"<".concat(c," ").concat(sr(r),">").concat(n.map(a4).join(""),"</").concat(c,">")}function V8(a,c,e){if(a&&a[c]&&a[c][e])return{prefix:c,iconName:e,icon:a[c][e]}}var pr=function(c,e){return function(r,l,n,i){return c.call(e,r,l,n,i)}},e0=function(c,e,r,l){var n=Object.keys(c),i=n.length,s=l!==void 0?pr(e,l):e,o,t,f;for(r===void 0?(o=1,f=c[n[0]]):(o=0,f=r);o<i;o++)t=n[o],f=s(f,c[t],t,c);return f};function e7(a){return e2(a).length!==1?null:a.codePointAt(0).toString(16)}function X8(a){return Object.keys(a).reduce(function(c,e){var r=a[e],l=!!r.icon;return l?c[r.iconName]=r.icon:c[e]=r,c},{})}function u0(a,c){var e=arguments.length>2&&arguments[2]!==void 0?arguments[2]:{},r=e.skipHooks,l=r===void 0?!1:r,n=X8(c);typeof c2.hooks.addPack=="function"&&!l?c2.hooks.addPack(a,X8(c)):c2.styles[a]=v(v({},c2.styles[a]||{}),n),a==="fas"&&u0("fa",c)}var J1=c2.styles,dr=c2.shims,r7=Object.keys(S0),zr=r7.reduce(function(a,c){return a[c]=Object.keys(S0[c]),a},{}),w0=null,l7={},n7={},i7={},s7={},o7={};function vr(a){return~cr.indexOf(a)}function Mr(a,c){var e=c.split("-"),r=e[0],l=e.slice(1).join("-");return r===a&&l!==""&&!vr(l)?l:null}var t7=function(){var c=function(n){return e0(J1,function(i,s,o){return i[o]=e0(s,n,{}),i},{})};l7=c(function(l,n,i){if(n[3]&&(l[n[3]]=i),n[2]){var s=n[2].filter(function(o){return typeof o=="number"});s.forEach(function(o){l[o.toString(16)]=i})}return l}),n7=c(function(l,n,i){if(l[i]=i,n[2]){var s=n[2].filter(function(o){return typeof o=="string"});s.forEach(function(o){l[o]=i})}return l}),o7=c(function(l,n,i){var s=n[2];return l[i]=i,s.forEach(function(o){l[o]=i}),l});var e="far"in J1||b.autoFetchSvg,r=e0(dr,function(l,n){var i=n[0],s=n[1],o=n[2];return s==="far"&&!e&&(s="fas"),typeof i=="string"&&(l.names[i]={prefix:s,iconName:o}),typeof i=="number"&&(l.unicodes[i.toString(16)]={prefix:s,iconName:o}),l},{names:{},unicodes:{}});i7=r.names,s7=r.unicodes,w0=W4(b.styleDefault,{family:b.familyDefault})};lr(function(a){w0=W4(a.styleDefault,{family:b.familyDefault})});t7();function k0(a,c){return(l7[a]||{})[c]}function hr(a,c){return(n7[a]||{})[c]}function J2(a,c){return(o7[a]||{})[c]}function f7(a){return i7[a]||{prefix:null,iconName:null}}function gr(a){var c=s7[a],e=k0("fas",a);return c||(e?{prefix:"fas",iconName:e}:null)||{prefix:null,iconName:null}}function H2(){return w0}var m7=function(){return{prefix:null,iconName:null,rest:[]}};function Lr(a){var c=j,e=r7.reduce(function(r,l){return r[l]="".concat(b.cssPrefix,"-").concat(l),r},{});return _5.forEach(function(r){(a.includes(e[r])||a.some(function(l){return zr[r].includes(l)}))&&(c=r)}),c}function W4(a){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},e=c.family,r=e===void 0?j:e,l=Ke[r][a];if(r===Q1&&!a)return"fad";var n=W8[r][a]||W8[r][l],i=a in c2.styles?a:null,s=n||i||null;return s}function xr(a){var c=[],e=null;return a.forEach(function(r){var l=Mr(b.cssPrefix,r);l?e=l:r&&c.push(r)}),{iconName:e,rest:c}}function Y8(a){return a.sort().filter(function(c,e,r){return r.indexOf(c)===e})}var K8=W5.concat(q5);function j4(a){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},e=c.skipLookups,r=e===void 0?!1:e,l=null,n=Y8(a.filter(function(p){return K8.includes(p)})),i=Y8(a.filter(function(p){return!K8.includes(p)})),s=n.filter(function(p){return l=p,!h5.includes(p)}),o=_4(s,1),t=o[0],f=t===void 0?null:t,m=Lr(n),u=v(v({},xr(i)),{},{prefix:W4(f,{family:m})});return v(v(v({},u),yr({values:a,family:m,styles:J1,config:b,canonical:u,givenPrefix:l})),br(r,l,u))}function br(a,c,e){var r=e.prefix,l=e.iconName;if(a||!r||!l)return{prefix:r,iconName:l};var n=c==="fa"?f7(l):{},i=J2(r,l);return l=n.iconName||i||l,r=n.prefix||r,r==="far"&&!J1.far&&J1.fas&&!b.autoFetchSvg&&(r="fas"),{prefix:r,iconName:l}}var Cr=_5.filter(function(a){return a!==j||a!==Q1}),Sr=Object.keys(i0).filter(function(a){return a!==j}).map(function(a){return Object.keys(i0[a])}).flat();function yr(a){var c=a.values,e=a.family,r=a.canonical,l=a.givenPrefix,n=l===void 0?"":l,i=a.styles,s=i===void 0?{}:i,o=a.config,t=o===void 0?{}:o,f=e===Q1,m=c.includes("fa-duotone")||c.includes("fad"),u=t.familyDefault==="duotone",p=r.prefix==="fad"||r.prefix==="fa-duotone";if(!f&&(m||u||p)&&(r.prefix="fad"),(c.includes("fa-brands")||c.includes("fab"))&&(r.prefix="fab"),!r.prefix&&Cr.includes(e)){var d=Object.keys(s).find(function(z){return Sr.includes(z)});if(d||t.autoFetchSvg){var h=Tc.get(e).defaultShortPrefixId;r.prefix=h,r.iconName=J2(r.prefix,r.iconName)||r.iconName}}return(r.prefix==="fa"||n==="fa")&&(r.prefix=H2()||"fas"),r}var Nr=(function(){function a(){V9(this,a),this.definitions={}}return X9(a,[{key:"add",value:function(){for(var e=this,r=arguments.length,l=new Array(r),n=0;n<r;n++)l[n]=arguments[n];var i=l.reduce(this._pullDefinitions,{});Object.keys(i).forEach(function(s){e.definitions[s]=v(v({},e.definitions[s]||{}),i[s]),u0(s,i[s]);var o=S0[j][s];o&&u0(o,i[s]),t7()})}},{key:"reset",value:function(){this.definitions={}}},{key:"_pullDefinitions",value:function(e,r){var l=r.prefix&&r.iconName&&r.icon?{0:r}:r;return Object.keys(l).map(function(n){var i=l[n],s=i.prefix,o=i.iconName,t=i.icon,f=t[2];e[s]||(e[s]={}),f.length>0&&f.forEach(function(m){typeof m=="string"&&(e[s][m]=t)}),e[s][o]=t}),e}}])})(),J8=[],N1={},w1={},wr=Object.keys(w1);function kr(a,c){var e=c.mixoutsTo;return J8=a,N1={},Object.keys(w1).forEach(function(r){wr.indexOf(r)===-1&&delete w1[r]}),J8.forEach(function(r){var l=r.mixout?r.mixout():{};if(Object.keys(l).forEach(function(i){typeof l[i]=="function"&&(e[i]=l[i]),I4(l[i])==="object"&&Object.keys(l[i]).forEach(function(s){e[i]||(e[i]={}),e[i][s]=l[i][s]})}),r.hooks){var n=r.hooks();Object.keys(n).forEach(function(i){N1[i]||(N1[i]=[]),N1[i].push(n[i])})}r.provides&&r.provides(w1)}),e}function p0(a,c){for(var e=arguments.length,r=new Array(e>2?e-2:0),l=2;l<e;l++)r[l-2]=arguments[l];var n=N1[a]||[];return n.forEach(function(i){c=i.apply(null,[c].concat(r))}),c}function Z2(a){for(var c=arguments.length,e=new Array(c>1?c-1:0),r=1;r<c;r++)e[r-1]=arguments[r];var l=N1[a]||[];l.forEach(function(n){n.apply(null,e)})}function D2(){var a=arguments[0],c=Array.prototype.slice.call(arguments,1);return w1[a]?w1[a].apply(null,c):void 0}function d0(a){a.prefix==="fa"&&(a.prefix="fas");var c=a.iconName,e=a.prefix||H2();if(c)return c=J2(e,c)||c,V8(u7.definitions,e,c)||V8(c2.styles,e,c)}var u7=new Nr,Ar=function(){b.autoReplaceSvg=!1,b.observeMutations=!1,Z2("noAuto")},Tr={i2svg:function(){var c=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};return L2?(Z2("beforeI2svg",c),D2("pseudoElements2svg",c),D2("i2svg",c)):Promise.reject(new Error("Operation requires a DOM of some kind."))},watch:function(){var c=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},e=c.autoReplaceSvgRoot;b.autoReplaceSvg===!1&&(b.autoReplaceSvg=!0),b.observeMutations=!0,ur(function(){Pr({autoReplaceSvgRoot:e}),Z2("watch",c)})}},Er={icon:function(c){if(c===null)return null;if(I4(c)==="object"&&c.prefix&&c.iconName)return{prefix:c.prefix,iconName:J2(c.prefix,c.iconName)||c.iconName};if(Array.isArray(c)&&c.length===2){var e=c[1].indexOf("fa-")===0?c[1].slice(3):c[1],r=W4(c[0]);return{prefix:r,iconName:J2(r,e)||e}}if(typeof c=="string"&&(c.indexOf("".concat(b.cssPrefix,"-"))>-1||c.match(Je))){var l=j4(c.split(" "),{skipLookups:!0});return{prefix:l.prefix||H2(),iconName:J2(l.prefix,l.iconName)||l.iconName}}if(typeof c=="string"){var n=H2();return{prefix:n,iconName:J2(n,c)||c}}}},J={noAuto:Ar,config:b,dom:Tr,parse:Er,library:u7,findIconDefinition:d0,toHtml:a4},Pr=function(){var c=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{},e=c.autoReplaceSvgRoot,r=e===void 0?U:e;(Object.keys(c2.styles).length>0||b.autoFetchSvg)&&L2&&b.autoReplaceSvg&&J.dom.i2svg({node:r})};function G4(a,c){return Object.defineProperty(a,"abstract",{get:c}),Object.defineProperty(a,"html",{get:function(){return a.abstract.map(function(r){return a4(r)})}}),Object.defineProperty(a,"node",{get:function(){if(L2){var r=U.createElement("div");return r.innerHTML=a.html,r.children}}}),a}function Fr(a){var c=a.children,e=a.main,r=a.mask,l=a.attributes,n=a.styles,i=a.transform;if(N0(i)&&e.found&&!r.found){var s=e.width,o=e.height,t={x:s/o/2,y:.5};l.style=q4(v(v({},n),{},{"transform-origin":"".concat(t.x+i.x/16,"em ").concat(t.y+i.y/16,"em")}))}return[{tag:"svg",attributes:l,children:c}]}function Br(a){var c=a.prefix,e=a.iconName,r=a.children,l=a.attributes,n=a.symbol,i=n===!0?"".concat(c,"-").concat(b.cssPrefix,"-").concat(e):n;return[{tag:"svg",attributes:{style:"display: none;"},children:[{tag:"symbol",attributes:v(v({},l),{},{id:i}),children:r}]}]}function Rr(a){var c=["aria-label","aria-labelledby","title","role"];return c.some(function(e){return e in a})}function A0(a){var c=a.icons,e=c.main,r=c.mask,l=a.prefix,n=a.iconName,i=a.transform,s=a.symbol,o=a.maskId,t=a.extra,f=a.watchable,m=f===void 0?!1:f,u=r.found?r:e,p=u.width,d=u.height,h=[b.replacementClass,n?"".concat(b.cssPrefix,"-").concat(n):""].filter(function(k){return t.classes.indexOf(k)===-1}).filter(function(k){return k!==""||!!k}).concat(t.classes).join(" "),z={children:[],attributes:v(v({},t.attributes),{},{"data-prefix":l,"data-icon":n,class:h,role:t.attributes.role||"img",viewBox:"0 0 ".concat(p," ").concat(d)})};!Rr(t.attributes)&&!t.attributes["aria-hidden"]&&(z.attributes["aria-hidden"]="true"),m&&(z.attributes[Q2]="");var g=v(v({},z),{},{prefix:l,iconName:n,main:e,mask:r,maskId:o,transform:i,symbol:s,styles:v({},t.styles)}),L=r.found&&e.found?D2("generateAbstractMask",g)||{children:[],attributes:{}}:D2("generateAbstractIcon",g)||{children:[],attributes:{}},M=L.children,x=L.attributes;return g.children=M,g.attributes=x,s?Br(g):Fr(g)}function Q8(a){var c=a.content,e=a.width,r=a.height,l=a.transform,n=a.extra,i=a.watchable,s=i===void 0?!1:i,o=v(v({},n.attributes),{},{class:n.classes.join(" ")});s&&(o[Q2]="");var t=v({},n.styles);N0(l)&&(t.transform=tr({transform:l,startCentered:!0,width:e,height:r}),t["-webkit-transform"]=t.transform);var f=q4(t);f.length>0&&(o.style=f);var m=[];return m.push({tag:"span",attributes:o,children:[c]}),m}function Hr(a){var c=a.content,e=a.extra,r=v(v({},e.attributes),{},{class:e.classes.join(" ")}),l=q4(e.styles);l.length>0&&(r.style=l);var n=[];return n.push({tag:"span",attributes:r,children:[c]}),n}var r0=c2.styles;function z0(a){var c=a[0],e=a[1],r=a.slice(4),l=_4(r,1),n=l[0],i=null;return Array.isArray(n)?i={tag:"g",attributes:{class:"".concat(b.cssPrefix,"-").concat(a0.GROUP)},children:[{tag:"path",attributes:{class:"".concat(b.cssPrefix,"-").concat(a0.SECONDARY),fill:"currentColor",d:n[0]}},{tag:"path",attributes:{class:"".concat(b.cssPrefix,"-").concat(a0.PRIMARY),fill:"currentColor",d:n[1]}}]}:i={tag:"path",attributes:{fill:"currentColor",d:n}},{found:!0,width:c,height:e,icon:i}}var Dr={found:!1,width:512,height:512};function Ir(a,c){!X5&&!b.showMissingIcons&&a&&console.error('Icon with name "'.concat(a,'" and prefix "').concat(c,'" is missing.'))}function v0(a,c){var e=c;return c==="fa"&&b.styleDefault!==null&&(c=H2()),new Promise(function(r,l){if(e==="fa"){var n=f7(a)||{};a=n.iconName||a,c=n.prefix||c}if(a&&c&&r0[c]&&r0[c][a]){var i=r0[c][a];return r(z0(i))}Ir(a,c),r(v(v({},Dr),{},{icon:b.showMissingIcons&&a?D2("missingIconAbstract")||{}:{}}))})}var Z8=function(){},M0=b.measurePerformance&&E4&&E4.mark&&E4.measure?E4:{mark:Z8,measure:Z8},X1='FA "7.3.1"',Ur=function(c){return M0.mark("".concat(X1," ").concat(c," begins")),function(){return p7(c)}},p7=function(c){M0.mark("".concat(X1," ").concat(c," ends")),M0.measure("".concat(X1," ").concat(c),"".concat(X1," ").concat(c," begins"),"".concat(X1," ").concat(c," ends"))},T0={begin:Ur,end:p7},H4=function(){};function a5(a){var c=a.getAttribute?a.getAttribute(Q2):null;return typeof c=="string"}function Or(a){var c=a.getAttribute?a.getAttribute(b0):null,e=a.getAttribute?a.getAttribute(C0):null;return c&&e}function _r(a){return a&&a.classList&&a.classList.contains&&a.classList.contains(b.replacementClass)}function qr(){if(b.autoReplaceSvg===!0)return D4.replace;var a=D4[b.autoReplaceSvg];return a||D4.replace}function Wr(a){return U.createElementNS("http://www.w3.org/2000/svg",a)}function jr(a){return U.createElement(a)}function d7(a){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},e=c.ceFn,r=e===void 0?a.tag==="svg"?Wr:jr:e;if(typeof a=="string")return U.createTextNode(a);var l=r(a.tag);Object.keys(a.attributes||[]).forEach(function(i){l.setAttribute(i,a.attributes[i])});var n=a.children||[];return n.forEach(function(i){l.appendChild(d7(i,{ceFn:r}))}),l}function Gr(a){var c=" ".concat(a.outerHTML," ");return c="".concat(c,"Font Awesome fontawesome.com "),c}var D4={replace:function(c){var e=c[0];if(e.parentNode)if(c[1].forEach(function(l){e.parentNode.insertBefore(d7(l),e)}),e.getAttribute(Q2)===null&&b.keepOriginalSource){var r=U.createComment(Gr(e));e.parentNode.replaceChild(r,e)}else e.remove()},nest:function(c){var e=c[0],r=c[1];if(~y0(e).indexOf(b.replacementClass))return D4.replace(c);var l=new RegExp("".concat(b.cssPrefix,"-.*"));if(delete r[0].attributes.id,r[0].attributes.class){var n=r[0].attributes.class.split(" ").reduce(function(s,o){return o===b.replacementClass||o.match(l)?s.toSvg.push(o):s.toNode.push(o),s},{toNode:[],toSvg:[]});r[0].attributes.class=n.toSvg.join(" "),n.toNode.length===0?e.removeAttribute("class"):e.setAttribute("class",n.toNode.join(" "))}var i=r.map(function(s){return a4(s)}).join(`
`);e.setAttribute(Q2,""),e.innerHTML=i}};function c5(a){a()}function z7(a,c){var e=typeof c=="function"?c:H4;if(a.length===0)e();else{var r=c5;b.mutateApproach===Xe&&(r=R2.requestAnimationFrame||c5),r(function(){var l=qr(),n=T0.begin("mutate");a.map(l),n(),e()})}}var E0=!1;function v7(){E0=!0}function h0(){E0=!1}var O4=null;function e5(a){if(U8&&b.observeMutations){var c=a.treeCallback,e=c===void 0?H4:c,r=a.nodeCallback,l=r===void 0?H4:r,n=a.pseudoElementsCallback,i=n===void 0?H4:n,s=a.observeMutationsRoot,o=s===void 0?U:s;O4=new U8(function(t){if(!E0){var f=H2();A1(t).forEach(function(m){if(m.type==="childList"&&m.addedNodes.length>0&&!a5(m.addedNodes[0])&&(b.searchPseudoElements&&i(m.target),e(m.target)),m.type==="attributes"&&m.target.parentNode&&b.searchPseudoElements&&i([m.target],!0),m.type==="attributes"&&a5(m.target)&&~ar.indexOf(m.attributeName))if(m.attributeName==="class"&&Or(m.target)){var u=j4(y0(m.target)),p=u.prefix,d=u.iconName;m.target.setAttribute(b0,p||f),d&&m.target.setAttribute(C0,d)}else _r(m.target)&&l(m.target)})}}),L2&&O4.observe(o,{childList:!0,attributes:!0,characterData:!0,subtree:!0})}}function $r(){O4&&O4.disconnect()}function Vr(a){var c=a.getAttribute("style"),e=[];return c&&(e=c.split(";").reduce(function(r,l){var n=l.split(":"),i=n[0],s=n.slice(1);return i&&s.length>0&&(r[i]=s.join(":").trim()),r},{})),e}function Xr(a){var c=a.getAttribute("data-prefix"),e=a.getAttribute("data-icon"),r=a.innerText!==void 0?a.innerText.trim():"",l=j4(y0(a));return l.prefix||(l.prefix=H2()),c&&e&&(l.prefix=c,l.iconName=e),l.iconName&&l.prefix||(l.prefix&&r.length>0&&(l.iconName=hr(l.prefix,a.innerText)||k0(l.prefix,e7(a.innerText))),!l.iconName&&b.autoFetchSvg&&a.firstChild&&a.firstChild.nodeType===Node.TEXT_NODE&&(l.iconName=a.firstChild.data)),l}function Yr(a){var c=A1(a.attributes).reduce(function(e,r){return e.name!=="class"&&e.name!=="style"&&(e[r.name]=r.value),e},{});return c}function Kr(){return{iconName:null,prefix:null,transform:f2,symbol:!1,mask:{iconName:null,prefix:null,rest:[]},maskId:null,extra:{classes:[],styles:{},attributes:{}}}}function r5(a){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{styleParser:!0},e=Xr(a),r=e.iconName,l=e.prefix,n=e.rest,i=Yr(a),s=p0("parseNodeAttributes",{},a),o=c.styleParser?Vr(a):[];return v({iconName:r,prefix:l,transform:f2,mask:{iconName:null,prefix:null,rest:[]},maskId:null,symbol:!1,extra:{classes:n,styles:o,attributes:i}},s)}var Jr=c2.styles;function M7(a){var c=b.autoReplaceSvg==="nest"?r5(a,{styleParser:!1}):r5(a);return~c.extra.classes.indexOf(K5)?D2("generateLayersText",a,c):D2("generateSvgReplacementMutation",a,c)}function Qr(){return[].concat(e2(q5),e2(W5))}function l5(a){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;if(!L2)return Promise.resolve();var e=U.documentElement.classList,r=function(m){return e.add("".concat(q8,"-").concat(m))},l=function(m){return e.remove("".concat(q8,"-").concat(m))},n=b.autoFetchSvg?Qr():h5.concat(Object.keys(Jr));n.includes("fa")||n.push("fa");var i=[".".concat(K5,":not([").concat(Q2,"])")].concat(n.map(function(f){return".".concat(f,":not([").concat(Q2,"])")})).join(", ");if(i.length===0)return Promise.resolve();var s=[];try{s=A1(a.querySelectorAll(i))}catch{}if(s.length>0)r("pending"),l("complete");else return Promise.resolve();var o=T0.begin("onTree"),t=s.reduce(function(f,m){try{var u=M7(m);u&&f.push(u)}catch(p){X5||p.name==="MissingIcon"&&console.error(p)}return f},[]);return new Promise(function(f,m){Promise.all(t).then(function(u){z7(u,function(){r("active"),r("complete"),l("pending"),typeof c=="function"&&c(),o(),f()})}).catch(function(u){o(),m(u)})})}function Zr(a){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:null;M7(a).then(function(e){e&&z7([e],c)})}function al(a){return function(c){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=(c||{}).icon?c:d0(c||{}),l=e.mask;return l&&(l=(l||{}).icon?l:d0(l||{})),a(r,v(v({},e),{},{mask:l}))}}var cl=function(c){var e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},r=e.transform,l=r===void 0?f2:r,n=e.symbol,i=n===void 0?!1:n,s=e.mask,o=s===void 0?null:s,t=e.maskId,f=t===void 0?null:t,m=e.classes,u=m===void 0?[]:m,p=e.attributes,d=p===void 0?{}:p,h=e.styles,z=h===void 0?{}:h;if(c){var g=c.prefix,L=c.iconName,M=c.icon;return G4(v({type:"icon"},c),function(){return Z2("beforeDOMElementCreation",{iconDefinition:c,params:e}),A0({icons:{main:z0(M),mask:o?z0(o.icon):{found:!1,width:null,height:null,icon:{}}},prefix:g,iconName:L,transform:v(v({},f2),l),symbol:i,maskId:f,extra:{attributes:d,styles:z,classes:u}})})}},el={mixout:function(){return{icon:al(cl)}},hooks:function(){return{mutationObserverCallbacks:function(e){return e.treeCallback=l5,e.nodeCallback=Zr,e}}},provides:function(c){c.i2svg=function(e){var r=e.node,l=r===void 0?U:r,n=e.callback,i=n===void 0?function(){}:n;return l5(l,i)},c.generateSvgReplacementMutation=function(e,r){var l=r.iconName,n=r.prefix,i=r.transform,s=r.symbol,o=r.mask,t=r.maskId,f=r.extra;return new Promise(function(m,u){Promise.all([v0(l,n),o.iconName?v0(o.iconName,o.prefix):Promise.resolve({found:!1,width:512,height:512,icon:{}})]).then(function(p){var d=_4(p,2),h=d[0],z=d[1];m([e,A0({icons:{main:h,mask:z},prefix:n,iconName:l,transform:i,symbol:s,maskId:t,extra:f,watchable:!0})])}).catch(u)})},c.generateAbstractIcon=function(e){var r=e.children,l=e.attributes,n=e.main,i=e.transform,s=e.styles,o=q4(s);o.length>0&&(l.style=o);var t;return N0(i)&&(t=D2("generateAbstractTransformGrouping",{main:n,transform:i,containerWidth:n.width,iconWidth:n.width})),r.push(t||n.icon),{children:r,attributes:l}}}},rl={mixout:function(){return{layer:function(e){var r=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},l=r.classes,n=l===void 0?[]:l;return G4({type:"layer"},function(){Z2("beforeDOMElementCreation",{assembler:e,params:r});var i=[];return e(function(s){Array.isArray(s)?s.map(function(o){i=i.concat(o.abstract)}):i=i.concat(s.abstract)}),[{tag:"span",attributes:{class:["".concat(b.cssPrefix,"-layers")].concat(e2(n)).join(" ")},children:i}]})}}}},ll={mixout:function(){return{counter:function(e){var r=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},l=r.title,n=l===void 0?null:l,i=r.classes,s=i===void 0?[]:i,o=r.attributes,t=o===void 0?{}:o,f=r.styles,m=f===void 0?{}:f;return G4({type:"counter",content:e},function(){return Z2("beforeDOMElementCreation",{content:e,params:r}),Hr({content:e.toString(),title:n,extra:{attributes:t,styles:m,classes:["".concat(b.cssPrefix,"-layers-counter")].concat(e2(s))}})})}}}},nl={mixout:function(){return{text:function(e){var r=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},l=r.transform,n=l===void 0?f2:l,i=r.classes,s=i===void 0?[]:i,o=r.attributes,t=o===void 0?{}:o,f=r.styles,m=f===void 0?{}:f;return G4({type:"text",content:e},function(){return Z2("beforeDOMElementCreation",{content:e,params:r}),Q8({content:e,transform:v(v({},f2),n),extra:{attributes:t,styles:m,classes:["".concat(b.cssPrefix,"-layers-text")].concat(e2(s))}})})}}},provides:function(c){c.generateLayersText=function(e,r){var l=r.transform,n=r.extra,i=null,s=null;if(v5){var o=parseInt(getComputedStyle(e).fontSize,10),t=e.getBoundingClientRect();i=t.width/o,s=t.height/o}return Promise.resolve([e,Q8({content:e.innerHTML,width:i,height:s,transform:l,extra:n,watchable:!0})])}}},h7=new RegExp('"',"ug"),n5=[1105920,1112319],i5=v(v(v(v({},{FontAwesome:{normal:"fas",400:"fas"}}),Ac),$e),Ic),g0=Object.keys(i5).reduce(function(a,c){return a[c.toLowerCase()]=i5[c],a},{}),il=Object.keys(g0).reduce(function(a,c){var e=g0[c];return a[c]=e[900]||e2(Object.entries(e))[0][1],a},{});function sl(a){var c=a.replace(h7,"");return e7(e2(c)[0]||"")}function ol(a){var c=a.getPropertyValue("font-feature-settings").includes("ss01"),e=a.getPropertyValue("content"),r=e.replace(h7,""),l=r.codePointAt(0),n=l>=n5[0]&&l<=n5[1],i=r.length===2?r[0]===r[1]:!1;return n||i||c}function tl(a,c){var e=a.replace(/^['"]|['"]$/g,"").toLowerCase(),r=parseInt(c),l=isNaN(r)?"normal":r;return(g0[e]||{})[l]||il[e]}function s5(a,c){var e="".concat(Ve).concat(c.replace(":","-"));return new Promise(function(r,l){if(a.getAttribute(e)!==null)return r();var n=A1(a.children),i=n.filter(function(E){return E.getAttribute(o0)===c})[0],s=R2.getComputedStyle(a,c),o=s.getPropertyValue("font-family"),t=o.match(Qe),f=s.getPropertyValue("font-weight"),m=s.getPropertyValue("content");if(i&&!t)return a.removeChild(i),r();if(t&&m!=="none"&&m!==""){var u=s.getPropertyValue("content"),p=tl(o,f),d=sl(u),h=t[0].startsWith("FontAwesome"),z=ol(s),g=k0(p,d),L=g;if(h){var M=gr(d);M.iconName&&M.prefix&&(g=M.iconName,p=M.prefix)}if(g&&!z&&(!i||i.getAttribute(b0)!==p||i.getAttribute(C0)!==L)){a.setAttribute(e,L),i&&a.removeChild(i);var x=Kr(),k=x.extra;k.attributes[o0]=c,v0(g,p).then(function(E){var P=A0(v(v({},x),{},{icons:{main:E,mask:m7()},prefix:p,iconName:L,extra:k,watchable:!0})),A=U.createElementNS("http://www.w3.org/2000/svg","svg");c==="::before"?a.insertBefore(A,a.firstChild):a.appendChild(A),A.outerHTML=P.map(function(w){return a4(w)}).join(`
`),a.removeAttribute(e),r()}).catch(l)}else r()}else r()})}function fl(a){return Promise.all([s5(a,"::before"),s5(a,"::after")])}function ml(a){return a.parentNode!==document.head&&!~Ye.indexOf(a.tagName.toUpperCase())&&!a.getAttribute(o0)&&(!a.parentNode||a.parentNode.tagName!=="svg")}var ul=function(c){return!!c&&V5.some(function(e){return c.includes(e)})},pl=function(c){if(!c)return[];var e=new Set,r=c.split(/,(?![^()]*\))/).map(function(o){return o.trim()});r=r.flatMap(function(o){return o.includes("(")?o:o.split(",").map(function(t){return t.trim()})});var l=R4(r),n;try{for(l.s();!(n=l.n()).done;){var i=n.value;if(ul(i)){var s=V5.reduce(function(o,t){return o.replace(t,"")},i);s!==""&&s!=="*"&&e.add(s)}}}catch(o){l.e(o)}finally{l.f()}return e};function o5(a){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!1;if(L2){var e;if(c)e=a;else if(b.searchPseudoElementsFullScan)e=a.querySelectorAll("*");else{var r=new Set,l=R4(document.styleSheets),n;try{for(l.s();!(n=l.n()).done;){var i=n.value;try{var s=R4(i.cssRules),o;try{for(s.s();!(o=s.n()).done;){var t=o.value,f=pl(t.selectorText),m=R4(f),u;try{for(m.s();!(u=m.n()).done;){var p=u.value;r.add(p)}}catch(h){m.e(h)}finally{m.f()}}}catch(h){s.e(h)}finally{s.f()}}catch(h){b.searchPseudoElementsWarnings&&console.warn("Font Awesome: cannot parse stylesheet: ".concat(i.href," (").concat(h.message,`)
If it declares any Font Awesome CSS pseudo-elements, they will not be rendered as SVG icons. Add crossorigin="anonymous" to the <link>, enable searchPseudoElementsFullScan for slower but more thorough DOM parsing, or suppress this warning by setting searchPseudoElementsWarnings to false.`))}}}catch(h){l.e(h)}finally{l.f()}if(!r.size)return;var d=Array.from(r).join(", ");try{e=a.querySelectorAll(d)}catch{}}return new Promise(function(h,z){var g=A1(e).filter(ml).map(fl),L=T0.begin("searchPseudoElements");v7(),Promise.all(g).then(function(){L(),h0(),h()}).catch(function(){L(),h0(),z()})})}}var dl={hooks:function(){return{mutationObserverCallbacks:function(e){return e.pseudoElementsCallback=o5,e}}},provides:function(c){c.pseudoElements2svg=function(e){var r=e.node,l=r===void 0?U:r;b.searchPseudoElements&&o5(l)}}},t5=!1,zl={mixout:function(){return{dom:{unwatch:function(){v7(),t5=!0}}}},hooks:function(){return{bootstrap:function(){e5(p0("mutationObserverCallbacks",{}))},noAuto:function(){$r()},watch:function(e){var r=e.observeMutationsRoot;t5?h0():e5(p0("mutationObserverCallbacks",{observeMutationsRoot:r}))}}}},f5=function(c){var e={size:16,x:0,y:0,flipX:!1,flipY:!1,rotate:0};return c.toLowerCase().split(" ").reduce(function(r,l){var n=l.toLowerCase().split("-"),i=n[0],s=n.slice(1).join("-");if(i&&s==="h")return r.flipX=!0,r;if(i&&s==="v")return r.flipY=!0,r;if(s=parseFloat(s),isNaN(s))return r;switch(i){case"grow":r.size=r.size+s;break;case"shrink":r.size=r.size-s;break;case"left":r.x=r.x-s;break;case"right":r.x=r.x+s;break;case"up":r.y=r.y-s;break;case"down":r.y=r.y+s;break;case"rotate":r.rotate=r.rotate+s;break}return r},e)},vl={mixout:function(){return{parse:{transform:function(e){return f5(e)}}}},hooks:function(){return{parseNodeAttributes:function(e,r){var l=r.getAttribute("data-fa-transform");return l&&(e.transform=f5(l)),e}}},provides:function(c){c.generateAbstractTransformGrouping=function(e){var r=e.main,l=e.transform,n=e.containerWidth,i=e.iconWidth,s={transform:"translate(".concat(n/2," 256)")},o="translate(".concat(l.x*32,", ").concat(l.y*32,") "),t="scale(".concat(l.size/16*(l.flipX?-1:1),", ").concat(l.size/16*(l.flipY?-1:1),") "),f="rotate(".concat(l.rotate," 0 0)"),m={transform:"".concat(o," ").concat(t," ").concat(f)},u={transform:"translate(".concat(i/2*-1," -256)")},p={outer:s,inner:m,path:u};return{tag:"g",attributes:v({},p.outer),children:[{tag:"g",attributes:v({},p.inner),children:[{tag:r.icon.tag,children:r.icon.children,attributes:v(v({},r.icon.attributes),p.path)}]}]}}}},l0={x:0,y:0,width:"100%",height:"100%"};function m5(a){var c=arguments.length>1&&arguments[1]!==void 0?arguments[1]:!0;return a.attributes&&(a.attributes.fill||c)&&(a.attributes.fill="black"),a}function Ml(a){return a.tag==="g"?a.children:[a]}var hl={hooks:function(){return{parseNodeAttributes:function(e,r){var l=r.getAttribute("data-fa-mask"),n=l?j4(l.split(" ").map(function(i){return i.trim()})):m7();return n.prefix||(n.prefix=H2()),e.mask=n,e.maskId=r.getAttribute("data-fa-mask-id"),e}}},provides:function(c){c.generateAbstractMask=function(e){var r=e.children,l=e.attributes,n=e.main,i=e.mask,s=e.maskId,o=e.transform,t=n.width,f=n.icon,m=i.width,u=i.icon,p=or({transform:o,containerWidth:m,iconWidth:t}),d={tag:"rect",attributes:v(v({},l0),{},{fill:"white"})},h=f.children?{children:f.children.map(m5)}:{},z={tag:"g",attributes:v({},p.inner),children:[m5(v({tag:f.tag,attributes:v(v({},f.attributes),p.path)},h))]},g={tag:"g",attributes:v({},p.outer),children:[z]},L="mask-".concat(s||G8()),M="clip-".concat(s||G8()),x={tag:"mask",attributes:v(v({},l0),{},{id:L,maskUnits:"userSpaceOnUse",maskContentUnits:"userSpaceOnUse"}),children:[d,g]},k={tag:"defs",children:[{tag:"clipPath",attributes:{id:M},children:Ml(u)},x]};return r.push(k,{tag:"rect",attributes:v({fill:"currentColor","clip-path":"url(#".concat(M,")"),mask:"url(#".concat(L,")")},l0)}),{children:r,attributes:l}}}},gl={provides:function(c){var e=!1;R2.matchMedia&&(e=R2.matchMedia("(prefers-reduced-motion: reduce)").matches),c.missingIconAbstract=function(){var r=[],l={fill:"currentColor"},n={attributeType:"XML",repeatCount:"indefinite",dur:"2s"};r.push({tag:"path",attributes:v(v({},l),{},{d:"M156.5,447.7l-12.6,29.5c-18.7-9.5-35.9-21.2-51.5-34.9l22.7-22.7C127.6,430.5,141.5,440,156.5,447.7z M40.6,272H8.5 c1.4,21.2,5.4,41.7,11.7,61.1L50,321.2C45.1,305.5,41.8,289,40.6,272z M40.6,240c1.4-18.8,5.2-37,11.1-54.1l-29.5-12.6 C14.7,194.3,10,216.7,8.5,240H40.6z M64.3,156.5c7.8-14.9,17.2-28.8,28.1-41.5L69.7,92.3c-13.7,15.6-25.5,32.8-34.9,51.5 L64.3,156.5z M397,419.6c-13.9,12-29.4,22.3-46.1,30.4l11.9,29.8c20.7-9.9,39.8-22.6,56.9-37.6L397,419.6z M115,92.4 c13.9-12,29.4-22.3,46.1-30.4l-11.9-29.8c-20.7,9.9-39.8,22.6-56.8,37.6L115,92.4z M447.7,355.5c-7.8,14.9-17.2,28.8-28.1,41.5 l22.7,22.7c13.7-15.6,25.5-32.9,34.9-51.5L447.7,355.5z M471.4,272c-1.4,18.8-5.2,37-11.1,54.1l29.5,12.6 c7.5-21.1,12.2-43.5,13.6-66.8H471.4z M321.2,462c-15.7,5-32.2,8.2-49.2,9.4v32.1c21.2-1.4,41.7-5.4,61.1-11.7L321.2,462z M240,471.4c-18.8-1.4-37-5.2-54.1-11.1l-12.6,29.5c21.1,7.5,43.5,12.2,66.8,13.6V471.4z M462,190.8c5,15.7,8.2,32.2,9.4,49.2h32.1 c-1.4-21.2-5.4-41.7-11.7-61.1L462,190.8z M92.4,397c-12-13.9-22.3-29.4-30.4-46.1l-29.8,11.9c9.9,20.7,22.6,39.8,37.6,56.9 L92.4,397z M272,40.6c18.8,1.4,36.9,5.2,54.1,11.1l12.6-29.5C317.7,14.7,295.3,10,272,8.5V40.6z M190.8,50 c15.7-5,32.2-8.2,49.2-9.4V8.5c-21.2,1.4-41.7,5.4-61.1,11.7L190.8,50z M442.3,92.3L419.6,115c12,13.9,22.3,29.4,30.5,46.1 l29.8-11.9C470,128.5,457.3,109.4,442.3,92.3z M397,92.4l22.7-22.7c-15.6-13.7-32.8-25.5-51.5-34.9l-12.6,29.5 C370.4,72.1,384.4,81.5,397,92.4z"})});var i=v(v({},n),{},{attributeName:"opacity"}),s={tag:"circle",attributes:v(v({},l),{},{cx:"256",cy:"364",r:"28"}),children:[]};return e||s.children.push({tag:"animate",attributes:v(v({},n),{},{attributeName:"r",values:"28;14;28;28;14;28;"})},{tag:"animate",attributes:v(v({},i),{},{values:"1;0;1;1;0;1;"})}),r.push(s),r.push({tag:"path",attributes:v(v({},l),{},{opacity:"1",d:"M263.7,312h-16c-6.6,0-12-5.4-12-12c0-71,77.4-63.9,77.4-107.8c0-20-17.8-40.2-57.4-40.2c-29.1,0-44.3,9.6-59.2,28.7 c-3.9,5-11.1,6-16.2,2.4l-13.1-9.2c-5.6-3.9-6.9-11.8-2.6-17.2c21.2-27.2,46.4-44.7,91.2-44.7c52.3,0,97.4,29.8,97.4,80.2 c0,67.6-77.4,63.5-77.4,107.8C275.7,306.6,270.3,312,263.7,312z"}),children:e?[]:[{tag:"animate",attributes:v(v({},i),{},{values:"1;0;0;0;0;1;"})}]}),e||r.push({tag:"path",attributes:v(v({},l),{},{opacity:"0",d:"M232.5,134.5l7,168c0.3,6.4,5.6,11.5,12,11.5h9c6.4,0,11.7-5.1,12-11.5l7-168c0.3-6.8-5.2-12.5-12-12.5h-23 C237.7,122,232.2,127.7,232.5,134.5z"}),children:[{tag:"animate",attributes:v(v({},i),{},{values:"0;0;1;1;0;0;"})}]}),{tag:"g",attributes:{class:"missing"},children:r}}}},Ll={hooks:function(){return{parseNodeAttributes:function(e,r){var l=r.getAttribute("data-fa-symbol"),n=l===null?!1:l===""?!0:l;return e.symbol=n,e}}}},xl=[mr,el,rl,ll,nl,dl,zl,vl,hl,gl,Ll];kr(xl,{mixoutsTo:J});var hi=J.noAuto,a1=J.config,gi=J.library,Li=J.dom,P0=J.parse,xi=J.findIconDefinition,bi=J.toHtml,g7=J.icon,Ci=J.layer,bl=J.text,Cl=J.counter;var $4=class extends H{constructor(c){super(`Call bundle failed with status: ${c.statusCode}`,{name:"BundleFailedError"}),Object.defineProperty(this,"result",{enumerable:!0,configurable:!0,writable:!0,value:void 0}),this.result=c}};var F0="0x5792579257925792579257925792579257925792579257925792579257925792",B0=F(0,{size:32});async function V4(a,c){let{account:e=a.account,chain:r=a.chain,experimental_fallback:l,experimental_fallbackDelay:n=32,forceAtomic:i=!1,id:s,version:o="2.0.0"}=c,t=e?D(e):null,f=c.capabilities;a.dataSuffix&&!c.capabilities?.dataSuffix&&(typeof a.dataSuffix=="string"?f={...c.capabilities,dataSuffix:{value:a.dataSuffix,optional:!0}}:f={...c.capabilities,dataSuffix:{value:a.dataSuffix.value,...a.dataSuffix.required?{}:{optional:!0}}});let m=c.calls.map(u=>{let p=u,d=p.abi?Y({abi:p.abi,functionName:p.functionName,args:p.args}):p.data;return{data:p.dataSuffix?N2([d??"0x",p.dataSuffix]):d,to:p.to,value:p.value?F(p.value):void 0}});try{let u=await a.request({method:"wallet_sendCalls",params:[{atomicRequired:i,calls:m,capabilities:f,chainId:F(r.id),from:t?.address,id:s,version:o}]},{retryCount:0});return typeof u=="string"?{id:u}:u}catch(u){let p=u;if(l&&(p.name==="MethodNotFoundRpcError"||p.name==="MethodNotSupportedRpcError"||p.name==="UnknownRpcError"||p.details.toLowerCase()==="this request method is not supported"||p.details.toLowerCase().includes("does not exist / is not available")||p.details.toLowerCase().includes("missing or invalid. request()")||p.details.toLowerCase().includes("did not match any variant of untagged enum")||p.details.toLowerCase().includes("account upgraded to unsupported contract")||p.details.toLowerCase().includes("eip-7702 not supported")||p.details.toLowerCase().includes("unsupported wc_ method")||p.details.toLowerCase().includes("feature toggled misconfigured")||p.details.toLowerCase().includes("jsonrpcengine: response has no error or result for request"))){if(f&&Object.values(f).some(g=>!g.optional)){let g="non-optional `capabilities` are not supported on fallback to `eth_sendTransaction`.";throw new x6(new H(g,{details:g}))}if(i&&m.length>1){let z="`forceAtomic` is not supported on fallback to `eth_sendTransaction`.";throw new b6(new H(z,{details:z}))}let d=[];for(let z of m){try{let g=await M1(a,{account:t,chain:r,data:z.data,to:z.to,value:z.value?a2(z.value):void 0});d.push({status:"fulfilled",value:g})}catch(g){d.push({reason:g,status:"rejected"})}n>0&&await new Promise(g=>setTimeout(g,n))}if(d.every(z=>z.status==="rejected"))throw d[0].reason;let h=d.map(z=>z.status==="fulfilled"?z.value:B0);return{id:N2([...h,F(r.id,{size:32}),F0])}}throw P6(u,{...c,account:t,chain:c.chain})}}async function X4(a,c){async function e(f){if(f.endsWith(F0.slice(2))){let u=_1(u4(f,-64,-32)),p=u4(f,0,-64).slice(2).match(/.{1,64}/g),d=await Promise.all(p.map(z=>B0.slice(2)!==z?a.request({method:"eth_getTransactionReceipt",params:[`0x${z}`]},{dedupe:!0}):void 0)),h=d.some(z=>z===null)?100:d.every(z=>z?.status==="0x1")?200:d.every(z=>z?.status==="0x0")?500:600;return{atomic:!1,chainId:$2(u),receipts:d.filter(Boolean),status:h,version:"2.0.0"}}return a.request({method:"wallet_getCallsStatus",params:[f]})}let{atomic:r=!1,chainId:l,receipts:n,version:i="2.0.0",...s}=await e(c.id),[o,t]=(()=>{let f=s.status;return f>=100&&f<200?["pending",f]:f>=200&&f<300?["success",f]:f>=300&&f<700?["failure",f]:f==="CONFIRMED"?["success",200]:f==="PENDING"?["pending",100]:[void 0,f]})();return{...s,atomic:r,chainId:l?$2(l):void 0,receipts:n?.map(f=>({...f,blockNumber:a2(f.blockNumber),gasUsed:a2(f.gasUsed),status:Y6[f.status]}))??[],statusCode:t,status:o,version:i}}var L7=new WeakMap,Sl=0;function x7(a){let c=L7.get(a);return c===void 0&&(c=++Sl,L7.set(a,c)),c}async function Y4(a,c){let{id:e,pollingInterval:r=a.pollingInterval,status:l=({statusCode:h})=>h===200||h>=300,retryCount:n=4,retryDelay:i=({count:h})=>~~(1<<h)*200,timeout:s=6e4,throwOnFailure:o=!1}=c,t=n2(["waitForCallsStatus",a.uid,e,{pollingInterval:r,retryCount:n,retryDelay:typeof c.retryDelay=="function"?["function",x7(c.retryDelay)]:c.retryDelay,status:c.status?x7(c.status):void 0,throwOnFailure:o}]),{promise:f,resolve:m,reject:u}=W6(),p,d=o2(t,{resolve:m,reject:u},h=>{let z=P2(async()=>{let g=L=>{clearTimeout(p),z(),L(),d()};try{let L=await X6(async()=>{let M=await S(a,X4,"getCallsStatus")({id:e});if(o&&M.status==="failure")throw new $4(M);return M},{retryCount:n,delay:i});if(!l(L))return;g(()=>h.resolve(L))}catch(L){g(()=>h.reject(L))}},{interval:r,emitOnBegin:!0});return z});return p=s?setTimeout(()=>{d(),clearTimeout(p),u(new R0({id:e}))},s):void 0,await f.finally(()=>d())}var R0=class extends H{constructor({id:c}){super(`Timed out while waiting for call bundle with id "${c}" to be confirmed.`,{name:"WaitForCallsStatusTimeoutError"})}};var K4=256,J4;function Q4(a=11){if(!J4||K4+a>256*2){J4="",K4=0;for(let c=0;c<256;c++)J4+=(256+Math.random()*256|0).toString(16).substring(1)}return J4.substring(K4,K4+++a)}function Z4(a){let{batch:c,chain:e,ccipRead:r,dataSuffix:l,key:n="base",name:i="Base Client",tokens:s,type:o="base"}=a,t=a.experimental_blockTag??(typeof e?.experimental_preconfirmationTime=="number"?"pending":void 0),f=e?.blockTime??12e3,m=Math.min(Math.max(Math.floor(f/2),500),4e3),u=a.pollingInterval??m,p=a.cacheTime??Math.min(u,Math.floor(f/2)),d=a.account?D(a.account):void 0,{config:h,request:z,value:g}=a.transport({account:d,chain:e,pollingInterval:u}),L={...h,...g},M={account:d,batch:c,cacheTime:p,ccipRead:r,chain:e,dataSuffix:l,key:n,name:i,pollingInterval:u,request:z,tokens:s,transport:L,type:o,uid:Q4(),...t?{experimental_blockTag:t}:{}};return S7(M)}var b7=new WeakSet,yl=0;function S7(a){function c(r,l){return n=>{let i=n(r);for(let f in a)f!=="scope"&&delete i[f];let s={...r,...i};for(let f in i){let m=r[f],u=i[f];C7(m)&&C7(u)&&(s[f]={...m,...u})}let o=[...l,n],{scope:t}=s;return Object.assign(s,{extend:c(s,o),scope:typeof t=="function"&&b7.has(t)?e(o):t})}}function e(r){let l=new WeakMap,n=(i={})=>{let s=i.signal&&l.get(i.signal);if(s)return s;let o=`scope.${yl++}`,t=new AbortController,{signal:f}=i;f?.aborted?t.abort(f.reason):f?.addEventListener("abort",()=>t.abort(f.reason),{once:!0});let m=(p,d)=>a.request(p,{...d,signal:d?.signal??t.signal,uid:d?.uid??o}),u=r.reduce((p,d)=>p.extend(d),S7({...a,request:m,uid:o}));return f&&l.set(f,u),u};return b7.add(n),n}return Object.assign(a,{extend:c(a,[]),scope:e([])})}function C7(a){if(typeof a!="object"||a===null)return!1;let c=Object.getPrototypeOf(a);return c===Object.prototype||c===null}function m2(a,c){let e=(r={})=>c(a,r);for(let r of["call","calls","callWithPeriod","estimateGas","prepare","prepareRecipient","predict","simulate"])if(Object.hasOwn(c,r)){let l=c[r];e[r]=(n={})=>l.length===1?l(n):l(a,n)}for(let r of["extractEvent","extractEvents"])Object.hasOwn(c,r)&&(e[r]=c[r]);return e}function T1(a){if(!(a instanceof H))return!1;let c=a.walk(e=>e instanceof F3);return c instanceof F3?c.data?.errorName==="HttpError"||c.data?.errorName==="ResolverError"||c.data?.errorName==="ResolverNotContract"||c.data?.errorName==="ResolverNotFound"||c.data?.errorName==="ReverseAddressMismatch"||c.data?.errorName==="UnsupportedResolverProfile":!1}function a3(a){if(a.length!==66||a.indexOf("[")!==0||a.indexOf("]")!==65)return null;let c=`0x${a.slice(1,65)}`;return m4(c)?c:null}function c4(a){let c=new Uint8Array(32).fill(0);if(!a)return y2(c);let e=a.split(".");for(let r=e.length-1;r>=0;r-=1){let l=a3(e[r]),n=l?N3(l):i1(d2(e[r]),"bytes");c=i1(N2([c,n]),"bytes")}return y2(c)}function y7(a){return`[${a.slice(2)}]`}function N7(a){let c=new Uint8Array(32).fill(0);return a?a3(a)||i1(d2(a)):y2(c)}function E1(a){let c=a.replace(/^\.|\.$/gm,"");if(c.length===0)return new Uint8Array(1);let e=new Uint8Array(d2(c).byteLength+2),r=0,l=c.split(".");for(let n=0;n<l.length;n++){let i=d2(l[n]);i.byteLength>255&&(i=d2(y7(N7(l[n])))),e[r]=i.length,e.set(i,r+1),r+=i.length+1}return e.byteLength!==r+1?e.slice(0,r+1):e}async function w7(a,c){let{blockNumber:e,blockTag:r,coinType:l,name:n,gatewayUrls:i,strict:s}=c,{chain:o}=a,t=(()=>{if(c.universalResolverAddress)return c.universalResolverAddress;if(!o)throw new Error("client chain not configured. universalResolverAddress is required.");return T2({blockNumber:e,chain:o,contract:"ensUniversalResolver"})})(),f=o?.ensTlds;if(f&&!f.some(u=>n.endsWith(u)))return null;let m=l!=null?[c4(n),BigInt(l)]:[c4(n)];try{let u=Y({abi:W3,functionName:"addr",args:m}),p={address:t,abi:x4,functionName:"resolveWithGateways",args:[p2(E1(n)),u,i??[p1]],blockNumber:e,blockTag:r},h=await S(a,B,"readContract")(p);if(h[0]==="0x")return null;let z=Nl({coinType:l,data:h[0],args:m});return z==="0x"||_1(z)==="0x00"?null:z}catch(u){if(s)throw u;if(T1(u))return null;throw u}}function Nl({coinType:a,data:c,args:e}){try{return v2({abi:W3,args:e,functionName:"addr",data:c})}catch(r){if(a==null)throw r;let l=_1(c);if(O1(l)===20)return l2(l);throw r}}var c3=class extends H{constructor({data:c}){super("Unable to extract image from metadata. The metadata may be malformed or invalid.",{metaMessages:["- Metadata must be a JSON object with at least an `image`, `image_url` or `image_data` property.","",`Provided data: ${JSON.stringify(c)}`],name:"EnsAvatarInvalidMetadataError"})}},I2=class extends H{constructor({reason:c}){super(`ENS NFT avatar URI is invalid. ${c}`,{name:"EnsAvatarInvalidNftUriError"})}},P1=class extends H{constructor({uri:c}){super(`Unable to resolve ENS avatar URI "${c}". The URI may be malformed, invalid, or does not respond with a valid image.`,{name:"EnsAvatarUriResolutionError"})}},e3=class extends H{constructor({namespace:c}){super(`ENS NFT avatar namespace "${c}" is not supported. Must be "erc721" or "erc1155".`,{name:"EnsAvatarUnsupportedNamespaceError"})}};var kl=/(?<protocol>https?:\/\/[^/]*|ipfs:\/|ipns:\/|ar:\/)?(?<root>\/)?(?<subpath>ipfs\/|ipns\/)?(?<target>[\w\-.]+)(?<subtarget>\/.*)?/,Al=/^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})(\/(?<target>[\w\-.]+))?(?<subtarget>\/.*)?$/,Tl=/^data:([a-zA-Z\-/+]*);base64,([^"].*)/,El=/^data:([a-zA-Z\-/+]*)?(;[a-zA-Z0-9].*?)?(,)/;async function Pl(a){try{let c=await fetch(a,{method:"HEAD"});return c.status===200?c.headers.get("content-type")?.startsWith("image/"):!1}catch(c){return typeof c=="object"&&typeof c.response<"u"||!Object.hasOwn(globalThis,"Image")?!1:new Promise(e=>{let r=new Image;r.onload=()=>{e(!0)},r.onerror=()=>{e(!1)},r.src=a})}}function k7(a,c){return a?a.endsWith("/")?a.slice(0,-1):a:c}function H0({uri:a,gatewayUrls:c}){let e=Tl.test(a);if(e)return{uri:a,isOnChain:!0,isEncoded:e};let r=k7(c?.ipfs,"https://ipfs.io"),l=k7(c?.arweave,"https://arweave.net"),n=a.match(kl),{protocol:i,subpath:s,target:o,subtarget:t=""}=n?.groups||{},f=i==="ipns:/"||s==="ipns/",m=i==="ipfs:/"||s==="ipfs/"||Al.test(a);if(a.startsWith("http")&&!f&&!m){let p=a;return c?.arweave&&(p=a.replace(/https:\/\/arweave.net/g,c?.arweave)),{uri:p,isOnChain:!1,isEncoded:!1}}if((f||m)&&o)return{uri:`${r}/${f?"ipns":"ipfs"}/${o}${t}`,isOnChain:!1,isEncoded:!1};if(i==="ar:/"&&o)return{uri:`${l}/${o}${t||""}`,isOnChain:!1,isEncoded:!1};let u=a.replace(El,"");if(u.startsWith("<svg")&&(u=`data:image/svg+xml;base64,${J6(u)}`),u.startsWith("data:")||u.startsWith("{"))return{uri:u,isOnChain:!0,isEncoded:!1};throw new P1({uri:a})}function D0(a){if(typeof a!="object"||!("image"in a)&&!("image_url"in a)&&!("image_data"in a))throw new c3({data:a});return a.image||a.image_url||a.image_data}async function A7({gatewayUrls:a,uri:c}){try{let e=await fetch(c).then(l=>l.json());return await r3({gatewayUrls:a,uri:D0(e)})}catch{throw new P1({uri:c})}}async function r3({gatewayUrls:a,uri:c}){let{uri:e,isOnChain:r}=H0({uri:c,gatewayUrls:a});if(r||await Pl(e))return e;throw new P1({uri:c})}function T7(a){let c=a;c.startsWith("did:nft:")&&(c=c.replace("did:nft:","").replace(/_/g,"/"));let[e,r,l]=c.split("/"),[n,i]=e.split(":"),[s,o]=r.split(":");if(!n||n.toLowerCase()!=="eip155")throw new I2({reason:"Only EIP-155 supported"});if(!i)throw new I2({reason:"Chain ID not found"});if(!o)throw new I2({reason:"Contract address not found"});if(!l)throw new I2({reason:"Token ID not found"});if(!s)throw new I2({reason:"ERC namespace not found"});return{chainID:Number.parseInt(i,10),namespace:s.toLowerCase(),contractAddress:o,tokenID:l}}async function E7(a,{nft:c}){if(c.namespace==="erc721")return B(a,{address:c.contractAddress,abi:[{name:"tokenURI",type:"function",stateMutability:"view",inputs:[{name:"tokenId",type:"uint256"}],outputs:[{name:"",type:"string"}]}],functionName:"tokenURI",args:[BigInt(c.tokenID)]});if(c.namespace==="erc1155")return B(a,{address:c.contractAddress,abi:[{name:"uri",type:"function",stateMutability:"view",inputs:[{name:"_id",type:"uint256"}],outputs:[{name:"",type:"string"}]}],functionName:"uri",args:[BigInt(c.tokenID)]});throw new e3({namespace:c.namespace})}function P7({nft:a,uri:c}){let e=a.namespace==="erc1155"?F(BigInt(a.tokenID),{size:32}).slice(2):a.tokenID;return c.replace(/(?:0x)?{id}/,e)}async function F7(a,{gatewayUrls:c,record:e}){return/eip155:/i.test(e)?Fl(a,{gatewayUrls:c,record:e}):r3({uri:e,gatewayUrls:c})}async function Fl(a,{gatewayUrls:c,record:e}){let r=T7(e),l=await E7(a,{nft:r}),{uri:n,isOnChain:i,isEncoded:s}=H0({uri:l,gatewayUrls:c});if(i&&(n.includes("data:application/json;base64,")||n.startsWith("{"))){let o=s?Q6(n.replace("data:application/json;base64,","").replace(/\s/g,"")):n,t=JSON.parse(o);return r3({uri:D0(t),gatewayUrls:c})}return A7({gatewayUrls:c,uri:P7({nft:r,uri:n})})}async function l3(a,c){let{blockNumber:e,blockTag:r,key:l,name:n,gatewayUrls:i,strict:s}=c,{chain:o}=a,t=(()=>{if(c.universalResolverAddress)return c.universalResolverAddress;if(!o)throw new Error("client chain not configured. universalResolverAddress is required.");return T2({blockNumber:e,chain:o,contract:"ensUniversalResolver"})})(),f=o?.ensTlds;if(f&&!f.some(m=>n.endsWith(m)))return null;try{let m={address:t,abi:x4,args:[p2(E1(n)),Y({abi:q3,functionName:"text",args:[c4(n),l]}),i??[p1]],functionName:"resolveWithGateways",blockNumber:e,blockTag:r},p=await S(a,B,"readContract")(m);if(p[0]==="0x")return null;let d=v2({abi:q3,functionName:"text",data:p[0]});return d===""?null:d}catch(m){if(s)throw m;if(T1(m))return null;throw m}}async function B7(a,{blockNumber:c,blockTag:e,assetGatewayUrls:r,name:l,gatewayUrls:n,strict:i,universalResolverAddress:s}){let o=await S(a,l3,"getEnsText")({blockNumber:c,blockTag:e,key:"avatar",name:l,universalResolverAddress:s,gatewayUrls:n,strict:i});if(!o)return null;try{return await F7(a,{record:o,gatewayUrls:r})}catch{return null}}async function R7(a,c){let{address:e,blockNumber:r,blockTag:l,coinType:n=60n,gatewayUrls:i,strict:s}=c,{chain:o}=a,t=(()=>{if(c.universalResolverAddress)return c.universalResolverAddress;if(!o)throw new Error("client chain not configured. universalResolverAddress is required.");return T2({blockNumber:r,chain:o,contract:"ensUniversalResolver"})})();try{let f={address:t,abi:I6,args:[e,n,i??[p1]],functionName:"reverseWithGateways",blockNumber:r,blockTag:l},m=S(a,B,"readContract"),[u]=await m(f);return u||null}catch(f){if(s)throw f;if(T1(f))return null;throw f}}async function H7(a,c){let{blockNumber:e,blockTag:r,name:l}=c,{chain:n}=a,i=(()=>{if(c.universalResolverAddress)return c.universalResolverAddress;if(!n)throw new Error("client chain not configured. universalResolverAddress is required.");return T2({blockNumber:e,chain:n,contract:"ensUniversalResolver"})})(),s=n?.ensTlds;if(s&&!s.some(t=>l.endsWith(t)))throw new Error(`${l} is not a valid ENS TLD (${s?.join(", ")}) for chain "${n.name}" (id: ${n.id}).`);let[o]=await S(a,B,"readContract")({address:i,abi:[{inputs:[{type:"bytes"}],name:"findResolver",outputs:[{type:"address"},{type:"bytes32"},{type:"uint256"}],stateMutability:"view",type:"function"}],functionName:"findResolver",args:[p2(E1(l))],blockNumber:e,blockTag:r});return o}async function D7(a,c){let{account:e=a.account,blockNumber:r,blockTag:l="latest",blobs:n,data:i,gas:s,gasPrice:o,maxFeePerBlobGas:t,maxFeePerGas:f,maxPriorityFeePerGas:m,to:u,value:p,...d}=c,h=e?D(e):void 0;try{f1(c);let g=(typeof r=="bigint"?F(r):void 0)||l,L=a.chain?.formatters?.transactionRequest?.format,x=(L||t1)({...N6(d,{format:L}),account:h,blobs:n,data:i,gas:s,gasPrice:o,maxFeePerBlobGas:t,maxFeePerGas:f,maxPriorityFeePerGas:m,to:u,value:p},"createAccessList"),k=await a.request({method:"eth_createAccessList",params:[x,g]});if(k.error)throw new H(k.error,{details:k.error});return{accessList:k.accessList,gasUsed:BigInt(k.gasUsed)}}catch(z){throw q6(z,{...c,account:h,chain:a.chain})}}async function I7(a){let c=s1(a,{method:"eth_newBlockFilter"}),e=await a.request({method:"eth_newBlockFilter"});return{id:e,request:c(e),type:"block"}}async function n3(a,{address:c,args:e,event:r,events:l,fromBlock:n,strict:i,toBlock:s}={}){let o=l??(r?[r]:void 0),t=s1(a,{method:"eth_newFilter"}),f=[];o&&(f=[o.flatMap(p=>p4({abi:[p],eventName:p.name,args:e}))],r&&(f=f[0]));let m=await a.request({method:"eth_newFilter",params:[{address:c,fromBlock:typeof n=="bigint"?F(n):n,toBlock:typeof s=="bigint"?F(s):s,...f.length?{topics:f}:{}}]});return{abi:o,args:e,eventName:r?r.name:void 0,fromBlock:n,id:m,request:t(m),strict:!!i,toBlock:s,type:"event"}}async function i3(a){let c=s1(a,{method:"eth_newPendingTransactionFilter"}),e=await a.request({method:"eth_newPendingTransactionFilter"});return{id:e,request:c(e),type:"transaction"}}async function U7(a,{address:c,blockHash:e,blockNumber:r,blockTag:l=a.experimental_blockTag??"latest",requireCanonical:n}){let i=i2({blockHash:e,blockNumber:r,blockTag:l,requireCanonical:n});if(a.batch?.multicall&&a.chain?.contracts?.multicall3){let o=a.chain.contracts.multicall3.address,t=Y({abi:u1,functionName:"getEthBalance",args:[c]}),{data:f}=await S(a,E2,"call")({to:o,data:t,blockHash:e,blockNumber:r,blockTag:l,requireCanonical:n});return v2({abi:u1,functionName:"getEthBalance",args:[c],data:f||"0x"})}let s=await a.request({method:"eth_getBalance",params:[c,i]});return BigInt(s)}async function O7(a){let c=await a.request({method:"eth_blobBaseFee"});return BigInt(c)}async function _7(a,{blockHash:c,blockNumber:e,blockTag:r=a.experimental_blockTag??"latest"}={}){let l=e!==void 0?F(e):void 0,n=await a.request({method:"eth_getBlockReceipts",params:[c||l||r]},{dedupe:!!(c||l)});if(!n)throw new k6({blockHash:c,blockNumber:e});let i=a.chain?.formatters?.transactionReceipt?.format||K6;return n.map(s=>i(s,"getBlockReceipts"))}async function q7(a,{blockHash:c,blockNumber:e,blockTag:r="latest"}={}){let l=e!==void 0?F(e):void 0,n;return c?n=await a.request({method:"eth_getBlockTransactionCountByHash",params:[c]},{dedupe:!0}):n=await a.request({method:"eth_getBlockTransactionCountByNumber",params:[l||r]},{dedupe:!!l}),$2(n)}async function c1(a,{address:c,blockHash:e,blockNumber:r,blockTag:l="latest",requireCanonical:n}){let i=i2({blockHash:e,blockNumber:r,blockTag:l,requireCanonical:n}),s=await a.request({method:"eth_getCode",params:[c,i]},{dedupe:typeof r=="bigint"||e!==void 0});if(s!=="0x")return s}async function W7(a,{address:c,blockNumber:e,blockTag:r="latest"}){let l=await c1(a,{address:c,...e!==void 0?{blockNumber:e}:{blockTag:r}});if(l&&O1(l)===23&&l.startsWith("0xef0100"))return l2(E3(l,3,23))}var s3=class extends H{constructor({address:c}){super(`No EIP-712 domain found on contract "${c}".`,{metaMessages:["Ensure that:",`- The contract is deployed at the address "${c}".`,"- `eip712Domain()` function exists on the contract.","- `eip712Domain()` function matches signature to ERC-5267 specification."],name:"Eip712DomainNotFoundError"})}};async function j7(a,c){let{address:e,factory:r,factoryData:l}=c;try{let[n,i,s,o,t,f,m]=await S(a,B,"readContract")({abi:Bl,address:e,functionName:"eip712Domain",factory:r,factoryData:l});return{domain:{name:i,version:s,chainId:Number(o),verifyingContract:t,salt:f},extensions:m,fields:n}}catch(n){let i=n;throw i.name==="ContractFunctionExecutionError"&&i.cause.name==="ContractFunctionZeroDataError"?new s3({address:e}):i}}var Bl=[{inputs:[],name:"eip712Domain",outputs:[{name:"fields",type:"bytes1"},{name:"name",type:"string"},{name:"version",type:"string"},{name:"chainId",type:"uint256"},{name:"verifyingContract",type:"address"},{name:"salt",type:"bytes32"},{name:"extensions",type:"uint256[]"}],stateMutability:"view",type:"function"}];function G7(a){return{baseFeePerGas:a.baseFeePerGas.map(c=>BigInt(c)),gasUsedRatio:a.gasUsedRatio,oldestBlock:BigInt(a.oldestBlock),reward:a.reward?.map(c=>c.map(e=>BigInt(e)))}}async function $7(a,{blockCount:c,blockNumber:e,blockTag:r="latest",rewardPercentiles:l}){let n=typeof e=="bigint"?F(e):void 0,i=await a.request({method:"eth_feeHistory",params:[F(c),n||r,l]},{dedupe:!!n});return G7(i)}async function V7(a,{filter:c}){let e=c.strict??!1,l=(await c.request({method:"eth_getFilterLogs",params:[c.id]})).map(n=>X2(n));return c.abi?Y2({abi:c.abi,eventName:c.eventName,logs:l,strict:e}):l}var e4={};t6(e4,{InvalidWrappedSignatureError:()=>t3,assert:()=>f3,from:()=>_l,magicBytes:()=>U0,suffixParameters:()=>O0,unwrap:()=>J7,validate:()=>Wl,wrap:()=>ql});function X7(a,c={}){return typeof a.chainId=="string"?Hl(a):{...a,...c.signature}}function Hl(a){let{address:c,chainId:e,nonce:r}=a,l=f8(a);return y4({r:l.r,s:l.s}),K7(l.yParity),{address:c,chainId:Number(e),nonce:BigInt(r),...l}}function Y7(a){return Dl(a,{presign:!0})}function Dl(a,c={}){let{presign:e}=c;return i8(s2("0x05",s8(Il(e?{address:a.address,chainId:a.chainId,nonce:a.nonce}:a))))}function Il(a){let{address:c,chainId:e,nonce:r,r:l,s:n,yParity:i}=a,s=o8({r:l,s:n});return s&&typeof i<"u"&&K7(i),[e?k2(e):"0x",c,r?k2(r):"0x",...s?[i?k2(i,{size:1}):"0x",s.r===0n?"0x":_3(k2(s.r)),s.s===0n?"0x":_3(k2(s.s))]:[]]}function K7(a){if(!(Number.isInteger(a)&&a>=0&&a<256))throw new H6({max:"255",min:"0",signed:!1,size:1,value:`${a}`})}var U0="0x8010801080108010801080108010801080108010801080108010801080108010",O0=W1("(uint256 chainId, address delegation, uint256 nonce, uint8 yParity, uint256 r, uint256 s), address to, bytes data");function f3(a){if(typeof a=="string"){if(A2(a,-32)!==U0)throw new t3(a)}else y4(a.authorization)}function _l(a){return typeof a=="string"?J7(a):a}function J7(a){f3(a);let c=R6(A2(a,-64,-32)),e=A2(a,-c-64,-64),r=A2(a,0,-c-64),[l,n,i]=K2(O0,e);return{authorization:X7({address:l.delegation,chainId:Number(l.chainId),nonce:l.nonce,yParity:l.yParity,r:l.r,s:l.s}),signature:r,...i&&i!=="0x"?{data:i,to:n}:{}}}function ql(a){let{data:c,signature:e}=a;f3(a);let r=m8({payload:Y7(a.authorization),signature:t8(a.authorization)}),l=F2(O0,[{...a.authorization,delegation:a.authorization.address,chainId:BigInt(a.authorization.chainId)},a.to??r,c??"0x"]),n=k2(O3(l),{size:32});return s2(e,l,n,U0)}function Wl(a){try{return f3(a),!0}catch{return!1}}var t3=class extends L4{constructor(c){super(`Value \`${c}\` is an invalid ERC-8010 wrapped signature.`),Object.defineProperty(this,"name",{enumerable:!0,configurable:!0,writable:!0,value:"SignatureErc8010.InvalidWrappedSignatureError"})}};function jl(a){return a.map(c=>({...c,value:BigInt(c.value)}))}function Q7(a){return{...a,balance:a.balance?BigInt(a.balance):void 0,nonce:a.nonce?$2(a.nonce):void 0,storageProof:a.storageProof?jl(a.storageProof):void 0}}async function Z7(a,{address:c,blockHash:e,blockNumber:r,blockTag:l="latest",requireCanonical:n,storageKeys:i}){let s=i2({blockHash:e,blockNumber:r,blockTag:l,requireCanonical:n}),o=await a.request({method:"eth_getProof",params:[c,i,s]});return Q7(o)}async function aa(a,{hash:c}){let e=await a.request({method:"eth_getRawTransactionByHash",params:[c]},{dedupe:!0});if(!e)throw new P3({hash:c});return e}async function ca(a,{address:c,blockHash:e,blockNumber:r,blockTag:l="latest",requireCanonical:n,slot:i}){let s=i2({blockHash:e,blockNumber:r,blockTag:l,requireCanonical:n});return await a.request({method:"eth_getStorageAt",params:[c,i,s]})}async function ea(a,{blockHash:c,blockNumber:e,blockTag:r="latest",requireCanonical:l,requests:n}){let i=i2({blockHash:c,blockNumber:e,blockTag:r,requireCanonical:l});return a.request({method:"eth_getStorageValues",params:[n,i]})}async function ra(a,{hash:c,transactionReceipt:e}){let[r,l]=await Promise.all([S(a,M2,"getBlockNumber")({}),c?S(a,N4,"getTransaction")({hash:c}):void 0]),n=e?.blockNumber||l?.blockNumber;if(!n)return 0n;let i=r<n?await S(a,M2,"getBlockNumber")({cacheTime:0}):r;return i<n?1n:i-n+1n}async function F1(a,c){let{blockNumber:e,blockTag:r=a.experimental_blockTag??"latest",blocks:l,returnFullTransactions:n,traceTransfers:i,validation:s}=c;try{let o=[];for(let u of l){let p=u.blockOverrides?D6(u.blockOverrides):void 0,d=u.calls.map(z=>{let g=z,L=g.account?D(g.account):void 0,M=g.abi?Y(g):g.data,x={...g,account:L,data:g.dataSuffix?N2([M||"0x",g.dataSuffix]):M,from:g.from??L?.address};return f1(x),t1(x)}),h=u.stateOverrides?w6(u.stateOverrides):void 0;o.push({blockOverrides:p,calls:d,stateOverrides:h})}let f=(typeof e=="bigint"?F(e):void 0)||r;return(await a.request({method:"eth_simulateV1",params:[{blockStateCalls:o,returnFullTransactions:n,traceTransfers:i,validation:s},f]})).map((u,p)=>({...z4(u),calls:u.calls.map((d,h)=>{let{abi:z,args:g,functionName:L,to:M}=l[p].calls[h],x=d.error?.data??d.returnData,k=BigInt(d.gasUsed),E=d.maxUsedGas===void 0?void 0:BigInt(d.maxUsedGas),P=d.logs?.map(O=>X2(O)),A=d.status==="0x1"?"success":"failure",w=z&&A==="success"&&x!=="0x"?v2({abi:z,data:x,functionName:L}):null,R=(()=>{if(A==="success")return;let O;if(x==="0x"?O=new f6:x&&(O=new g6({data:x})),!!O)return C6(O,{abi:z??[],address:M??"0x",args:g,functionName:L??"<unknown>"})})();return{data:x,gasUsed:k,logs:P,...E===void 0?{}:{maxUsedGas:E},status:A,...A==="success"?{result:w}:{error:R}}})}))}catch(o){let t=o,f=y6(t,{});throw f instanceof D3?t:f}}function na(...a){let[c,e]=(()=>{if(Array.isArray(a[0])){let[n,i]=a;return[Gl(n),i]}return a})(),{bytecode:r,args:l}=e;return s2(r,c.inputs?.length&&l?.length?F2(c.inputs,l):"0x")}function ia(a){return g1(a)}function Gl(a){let c=a.find(e=>e.type==="constructor");if(!c)throw new G1({name:"constructor"});return c}function sa(a,c={}){return g1(a,c)}function oa(a){return z8(a)}function ta(...a){let[c,e,r={}]=(()=>{if(Array.isArray(a[0])){let[n,i,s,o]=a;return[_0(n,i),s,o]}return a})(),l=K2(c.outputs,e,r);if(!(l&&Object.keys(l).length===0))return l&&Object.keys(l).length===1?Array.isArray(l)?l[0]:Object.values(l)[0]:l}function U2(...a){let[c,e=[]]=(()=>{if(Array.isArray(a[0])){let[t,f,m]=a;return[_0(t,f,{args:m}),m]}let[s,o]=a;return[s,o]})(),{overloads:r}=c,l=r?_0([c,...r],c.name,{args:e}):c,n=Xl(l),i=e.length>0?F2(l.inputs,e):void 0;return i?s2(n,i):n}function e1(a,c={}){return g1(a,c)}function _0(a,c,e){let r=G3(a,c,e);if(r.type!=="function")throw new G1({name:c,type:"function"});return r}function Xl(a){return d8(a)}var Kl="0x6080604052348015600e575f80fd5b5061016d8061001c5f395ff3fe608060405234801561000f575f80fd5b5060043610610029575f3560e01c8063f8b2cb4f1461002d575b5f80fd5b610047600480360381019061004291906100db565b61005d565b604051610054919061011e565b60405180910390f35b5f8173ffffffffffffffffffffffffffffffffffffffff16319050919050565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6100aa82610081565b9050919050565b6100ba816100a0565b81146100c4575f80fd5b50565b5f813590506100d5816100b1565b92915050565b5f602082840312156100f0576100ef61007d565b5b5f6100fd848285016100c7565b91505092915050565b5f819050919050565b61011881610106565b82525050565b5f6020820190506101315f83018461010f565b9291505056fea26469706673582212203b9fe929fe995c7cf9887f0bdba8a36dd78e8b73f149b17d2d9ad7cd09d2dc6264736f6c634300081a0033",va="0x608060405234801561000f575f5ffd5b5060043610610029575f3560e01c8063fd00430c1461002d575b5f5ffd5b6100476004803603810190610042919061012b565b610049565b005b80825f375f5f825f865afa610060573d5f5f3e3d5ffd5b3d5f5f3e3d5ff35b5f5ffd5b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f61009982610070565b9050919050565b6100a98161008f565b81146100b3575f5ffd5b50565b5f813590506100c4816100a0565b92915050565b5f5ffd5b5f5ffd5b5f5ffd5b5f5f83601f8401126100eb576100ea6100ca565b5b8235905067ffffffffffffffff811115610108576101076100ce565b5b602083019150836001820283011115610124576101236100d2565b5b9250929050565b5f5f5f6040848603121561014257610141610068565b5b5f61014f868287016100b6565b935050602084013567ffffffffffffffff8111156101705761016f61006c565b5b61017c868287016100d6565b9250925050925092509256fea2646970667358221220635ed99185cacf3f2acba6921f23687c969cec2bbaf5f9ad599f507e6e105e6964736f6c63430008230033",r4=1000000n,Jl=0x00000000000000000000000000000000deadbeefn,Ql=oa(sa("event Transfer(address indexed from, address indexed to, uint256 value)")),fa=e1("function balanceOf(address) returns (uint256)"),ma=e1("function decimals() returns (uint256)"),ua=e1("function tokenURI(uint256) returns (string)"),pa=e1("function symbol() returns (string)"),Zl=e1("function query(address target, bytes data)");async function Ma(a,c){let{blockNumber:e,blockTag:r,calls:l,stateOverrides:n,traceAssetChanges:i,traceTransfers:s,validation:o}=c,t=c.account?D(c.account):void 0;if(i&&!t)throw new H("`account` is required when `traceAssetChanges` is true");let f=t?na(ia("constructor(bytes, bytes)"),{bytecode:U6,args:[Kl,U2(e1("function getBalance(address)"),[t.address])]}):void 0,m=r??a.experimental_blockTag??"latest",u=e;if(i&&typeof u!="bigint"&&m!=="earliest"&&m!=="pending")if(m==="latest")u=await M2(a,{cacheTime:0});else{let y=await z2(a,{blockTag:m});if(typeof y.number!="bigint")throw new H(`Block tag \`${m}\` did not resolve to a number.`);u=y.number}let p=typeof u=="bigint"?{blockNumber:u}:{blockTag:m},d=i?await F1(a,{...p,blocks:[{calls:l.map(y=>({...y,from:t.address})),stateOverrides:n}],traceTransfers:s,validation:o}):void 0,h=d?[...new Set([...an(d[0].calls.flatMap(y=>y.logs??[]),t.address),...c.calls.map(y=>y.to?.toLowerCase())])].filter(y=>!!y&&y!==$1&&y!==V1):[],z=cn([...t?[t.address]:[],...h,...n?.map(({address:y})=>y)??[]]),g=[{address:z,code:va}],[L,M]=await Promise.all([i?Promise.all([za(a,{account:t.address,...p,data:f,stateOverride:n}),...h.map(y=>za(a,{account:t.address,address:y,...p,data:U2(fa,[t.address]),staticCallAddress:z,stateOverride:n}))]):[],F1(a,{...p,blocks:[{calls:[...l,{to:V1}].map(y=>({...y,from:t?.address})),stateOverrides:n},...i?[{calls:[{data:f}]},{calls:h.map(y=>({to:z,gas:r4,data:l4(y,U2(fa,[t.address]))})),stateOverrides:g},{calls:h.map(y=>({to:z,gas:r4,data:l4(y,U2(ma))})),stateOverrides:g},{calls:h.map(y=>({to:z,gas:r4,data:l4(y,U2(ua,[0n]))})),stateOverrides:g},{calls:h.map(y=>({to:z,gas:r4,data:l4(y,U2(pa))})),stateOverrides:g}]:[]],traceTransfers:s,validation:o})]),x=M[0],[k,E,P,A,w]=i?M.slice(1):[],{calls:R,...O}=x,$=R.slice(0,-1),V=L.map(y=>da(y)?a2(y.data):null),Z=k?.calls??[],_=E?.calls??[],l6=[...Z,..._].map(y=>da(y)?a2(y.data):null),b9=(P?.calls??[]).map(y=>q0(y,ma)),C9=(w?.calls??[]).map(y=>q0(y,pa)),S9=(A?.calls??[]).map(y=>q0(y,ua)),n6=[];for(let[y,C3]of l6.entries()){let i6=V[y],s6=L[y],S3=typeof i6=="bigint"?i6:y>0&&s6?.status==="success"&&s6.data==="0x"?0n:null;if(typeof C3!="bigint"||typeof S3!="bigint")continue;let o6=b9[y-1],y9=C9[y-1],N9=S9[y-1],w9=y===0?{address:$1,decimals:18,symbol:"ETH"}:{address:h[y-1],decimals:N9||o6?Number(o6??1):void 0,symbol:y9??void 0};n6.push({token:w9,value:{pre:S3,post:C3,diff:C3-S3}})}return{assetChanges:n6,block:O,results:$}}function l4(a,c){return U2(Zl,[a,c])}function an(a,c){let e=z6(c.toLowerCase(),{size:32});return a.filter(r=>r.topics[0]?.toLowerCase()!==Ql||r.address.toLowerCase()===$1?!1:r.topics[1]?.toLowerCase()===e||r.topics[2]?.toLowerCase()===e).map(r=>r.address.toLowerCase())}function da(a){return a.status==="success"&&/^0x[\da-f]{64}$/i.test(a.data)}function q0(a,c){if(a.status==="failure"||a.data==="0x")return null;try{return ta(c,a.data)}catch{return null}}async function za(a,c){let{account:e,address:r,blockNumber:l,blockTag:n,data:i,staticCallAddress:s,stateOverride:o}=c;try{return{data:(await E2({...a,ccipRead:!1},{account:r?V1:e,data:r?l4(r,i):i,stateOverride:r&&s?[...o??[],{address:s,code:va}]:o,...r?{gas:r4,to:s}:{},...typeof l=="bigint"?{blockNumber:l}:{blockTag:n}})).data??"0x",status:"success"}}catch(t){if(!(t instanceof d4)||!(t.cause instanceof H3))throw t;return{data:"0x",status:"failure"}}}function cn(a){let c=new Set(a.map(r=>r.toLowerCase())),e=Jl;for(;c.has(`0x${e.toString(16).padStart(40,"0")}`);)e++;return`0x${e.toString(16).padStart(40,"0")}`}var n4={};t6(n4,{InvalidWrappedSignatureError:()=>m3,assert:()=>j0,from:()=>ln,magicBytes:()=>W0,universalSignatureValidatorAbi:()=>rn,universalSignatureValidatorBytecode:()=>en,unwrap:()=>ha,validate:()=>sn,wrap:()=>nn});var W0="0x6492649264926492649264926492649264926492649264926492649264926492",en="0x608060405234801561001057600080fd5b5060405161069438038061069483398101604081905261002f9161051e565b600061003c848484610048565b9050806000526001601ff35b60007f64926492649264926492649264926492649264926492649264926492649264926100748361040c565b036101e7576000606080848060200190518101906100929190610577565b60405192955090935091506000906001600160a01b038516906100b69085906105dd565b6000604051808303816000865af19150503d80600081146100f3576040519150601f19603f3d011682016040523d82523d6000602084013e6100f8565b606091505b50509050876001600160a01b03163b60000361016057806101605760405162461bcd60e51b815260206004820152601e60248201527f5369676e617475726556616c696461746f723a206465706c6f796d656e74000060448201526064015b60405180910390fd5b604051630b135d3f60e11b808252906001600160a01b038a1690631626ba7e90610190908b9087906004016105f9565b602060405180830381865afa1580156101ad573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101d19190610633565b6001600160e01b03191614945050505050610405565b6001600160a01b0384163b1561027a57604051630b135d3f60e11b808252906001600160a01b03861690631626ba7e9061022790879087906004016105f9565b602060405180830381865afa158015610244573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102689190610633565b6001600160e01b031916149050610405565b81516041146102df5760405162461bcd60e51b815260206004820152603a602482015260008051602061067483398151915260448201527f3a20696e76616c6964207369676e6174757265206c656e6774680000000000006064820152608401610157565b6102e7610425565b5060208201516040808401518451859392600091859190811061030c5761030c61065d565b016020015160f81c9050601b811480159061032b57508060ff16601c14155b1561038c5760405162461bcd60e51b815260206004820152603b602482015260008051602061067483398151915260448201527f3a20696e76616c6964207369676e617475726520762076616c756500000000006064820152608401610157565b60408051600081526020810180835289905260ff83169181019190915260608101849052608081018390526001600160a01b0389169060019060a0016020604051602081039080840390855afa1580156103ea573d6000803e3d6000fd5b505050602060405103516001600160a01b0316149450505050505b9392505050565b600060208251101561041d57600080fd5b508051015190565b60405180606001604052806003906020820280368337509192915050565b6001600160a01b038116811461045857600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561048c578181015183820152602001610474565b50506000910152565b600082601f8301126104a657600080fd5b81516001600160401b038111156104bf576104bf61045b565b604051601f8201601f19908116603f011681016001600160401b03811182821017156104ed576104ed61045b565b60405281815283820160200185101561050557600080fd5b610516826020830160208701610471565b949350505050565b60008060006060848603121561053357600080fd5b835161053e81610443565b6020850151604086015191945092506001600160401b0381111561056157600080fd5b61056d86828701610495565b9150509250925092565b60008060006060848603121561058c57600080fd5b835161059781610443565b60208501519093506001600160401b038111156105b357600080fd5b6105bf86828701610495565b604086015190935090506001600160401b0381111561056157600080fd5b600082516105ef818460208701610471565b9190910192915050565b828152604060208201526000825180604084015261061e816060850160208701610471565b601f01601f1916919091016060019392505050565b60006020828403121561064557600080fd5b81516001600160e01b03198116811461040557600080fd5b634e487b7160e01b600052603260045260246000fdfe5369676e617475726556616c696461746f72237265636f7665725369676e6572",rn=[{inputs:[{name:"_signer",type:"address"},{name:"_hash",type:"bytes32"},{name:"_signature",type:"bytes"}],stateMutability:"nonpayable",type:"constructor"},{inputs:[{name:"_signer",type:"address"},{name:"_hash",type:"bytes32"},{name:"_signature",type:"bytes"}],outputs:[{type:"bool"}],stateMutability:"nonpayable",type:"function",name:"isValidSig"}];function j0(a){if(A2(a,-32)!==W0)throw new m3(a)}function ln(a){return typeof a=="string"?ha(a):a}function ha(a){j0(a);let[c,e,r]=K2(W1("address, bytes, bytes"),a);return{data:e,signature:r,to:c}}function nn(a){let{data:c,signature:e,to:r}=a;return s2(F2(W1("address, bytes, bytes"),[r,c,e]),W0)}function sn(a){try{return j0(a),!0}catch{return!1}}var m3=class extends L4{constructor(c){super(`Value \`${c}\` is an invalid ERC-6492 wrapped signature.`),Object.defineProperty(this,"name",{enumerable:!0,configurable:!0,writable:!0,value:"SignatureErc6492.InvalidWrappedSignatureError"})}};function ga({r:a,s:c,to:e="hex",v:r,yParity:l}){let n=(()=>{if(l===0||l===1)return l;if(r&&(r===27n||r===28n||r>=35n))return r%2n===0n?1:0;throw new Error("Invalid `v` or `yParity` value")})(),i=`0x${new S6.Signature(a2(a),a2(c)).toCompactHex()}${n===0?"1b":"1c"}`;return e==="hex"?i:w3(i)}async function O2(a,c){let{address:e,chain:r=a.chain,hash:l,erc6492VerifierAddress:n=c.universalSignatureVerifierAddress??r?.contracts?.erc6492Verifier?.address,multicallAddress:i=c.multicallAddress??r?.contracts?.multicall3?.address,mode:s="auto"}=c;if(r?.verifyHash)return await r.verifyHash(a,c);let o=(()=>{let t=c.signature;return m4(t)?t:typeof t=="object"&&"r"in t&&"s"in t?ga(t):y2(t)})();try{if(s==="eoa")try{if(V2(l2(e),await R3({hash:l,signature:o})))return!0}catch{}return e4.validate(o)?await on(a,{...c,multicallAddress:i,signature:o}):await tn(a,{...c,verifierAddress:n,signature:o})}catch(t){if(s!=="eoa")try{if(V2(l2(e),await R3({hash:l,signature:o})))return!0}catch{}if(t instanceof x2)return!1;throw t}}async function on(a,c){let{address:e,blockHash:r,blockNumber:l,blockTag:n,hash:i,multicallAddress:s,requireCanonical:o}=c,{authorization:t,data:f,signature:m,to:u}=e4.unwrap(c.signature);if(await c1(a,{address:e,blockHash:r,blockNumber:l,blockTag:n,requireCanonical:o})===T3(["0xef0100",t.address]))return await fn(a,{...c,signature:m});let d={address:t.address,chainId:Number(t.chainId),nonce:Number(t.nonce),r:F(t.r,{size:32}),s:F(t.s,{size:32}),yParity:t.yParity};if(!await Z6({address:e,authorization:d}))throw new x2;let z=await S(a,B,"readContract")({...s?{address:s}:{code:_6},authorizationList:[d],abi:u1,blockHash:r,blockNumber:l,blockTag:"pending",functionName:"aggregate3",requireCanonical:o,args:[[...f?[{allowFailure:!0,target:u??e,callData:f}]:[],{allowFailure:!0,target:e,callData:Y({abi:j3,functionName:"isValidSignature",args:[i,m]})}]]});if(z[z.length-1]?.returnData?.startsWith("0x1626ba7e"))return!0;throw new x2}async function tn(a,c){let{address:e,factory:r,factoryData:l,hash:n,signature:i,verifierAddress:s,...o}=c,t=await(async()=>!r&&!l||n4.validate(i)?i:n4.wrap({data:l,signature:i,to:r}))(),f=s?{to:s,data:Y({abi:q1,functionName:"isValidSig",args:[e,n,t]}),...o}:{data:b4({abi:q1,args:[e,n,t],bytecode:O6}),...o},{data:m}=await S(a,E2,"call")(f).catch(u=>{throw u instanceof d4?new x2:u});if(v6(m??"0x0"))return!0;throw new x2}async function fn(a,c){let{address:e,blockHash:r,blockNumber:l,blockTag:n,hash:i,requireCanonical:s,signature:o}=c;if((await S(a,B,"readContract")({address:e,abi:j3,args:[i,o],blockHash:r,blockNumber:l,blockTag:n,functionName:"isValidSignature",requireCanonical:s}).catch(f=>{throw f instanceof h6?new x2:f})).startsWith("0x1626ba7e"))return!0;throw new x2}var x2=class extends Error{};async function La(a,{address:c,message:e,factory:r,factoryData:l,signature:n,...i}){let s=S4(e);return S(a,O2,"verifyHash")({address:c,factory:r,factoryData:l,hash:s,signature:n,...i})}async function xa(a,c){let{address:e,factory:r,factoryData:l,signature:n,message:i,primaryType:s,types:o,domain:t,...f}=c,m=n8({message:i,primaryType:s,types:o,domain:t});return S(a,O2,"verifyHash")({address:e,factory:r,factoryData:l,hash:m,signature:n,...f})}var mn=["size","totalDifficulty","transactions","uncles","withdrawals"];function ba(a,{onBlockHeader:c,onError:e}){let r,l=n2(["watchBlockHeaders",a.uid]);return o2(l,{onBlockHeader:c,onError:e},n=>{let i=!0,s=!1,o=()=>i=!1;return(async()=>{try{let t=(()=>{if(a.transport.type==="fallback"){let m=a.transport.transports.find(u=>u.config.type==="webSocket"||u.config.type==="ipc");return m?m.value:a.transport}return a.transport})(),{unsubscribe:f}=await t.subscribe({params:["newHeads"],onData(m){if(!i)return;let u=(a.chain?.formatters?.block?.format||z4)(m.result,"watchBlockHeaders");for(let p of mn)delete u[p];n.onBlockHeader(u,r),r=u},onError(m){s&&n.onError?.(m)}});s=!0,o=f,i||o()}catch(t){n.onError?.(t)}})(),()=>o()})}function Ca(a,{blockTag:c=a.experimental_blockTag??"latest",emitMissed:e,emitOnBegin:r=!1,onBlock:l,onError:n,includeTransactions:i,poll:s,pollingInterval:o=a.pollingInterval}){let t=typeof s<"u"?s:!(a.transport.type==="webSocket"||a.transport.type==="ipc"||a.transport.type==="fallback"&&(a.transport.transports[0].config.type==="webSocket"||a.transport.transports[0].config.type==="ipc")),f=i??!1,m=a.chain?.blockTime,u=e??((c==="latest"||c==="pending")&&m!==void 0&&o>m/2),p=e===void 0?100:Number.POSITIVE_INFINITY,d;return t?(()=>{let g=n2(["watchBlocks",a.uid,c,u,r,f,p,o]);return o2(g,{onBlock:l,onError:n},L=>P2(async()=>{try{let M=await S(a,z2,"getBlock")({blockTag:c,includeTransactions:f});if(M.number!==null&&d?.number!=null){if(M.number===d.number)return;let x=Number(M.number-d.number)-1;if(x>0&&x<=p&&u){let E=d.number+1n;for(let P=0;P<x;P+=10){let A=await Promise.all(Array.from({length:Math.min(10,x-P)},(w,R)=>S(a,z2,"getBlock")({blockNumber:E+BigInt(P+R),includeTransactions:f})));for(let w of A)L.onBlock(w,d),d=w}}}(d?.number==null||c==="pending"&&M?.number==null||M.number!==null&&M.number>d.number)&&(L.onBlock(M,d),d=M)}catch(M){L.onError?.(M)}},{emitOnBegin:r,interval:o}))})():(()=>{let g=!0,L=!0,M=()=>g=!1;return(async()=>{try{r&&S(a,z2,"getBlock")({blockTag:c,includeTransactions:f}).then(E=>{g&&L&&(l(E,void 0),L=!1)}).catch(n);let x=(()=>{if(a.transport.type==="fallback"){let E=a.transport.transports.find(P=>P.config.type==="webSocket"||P.config.type==="ipc");return E?E.value:a.transport}return a.transport})(),{unsubscribe:k}=await x.subscribe({params:["newHeads"],async onData(E){if(!g)return;let P=await S(a,z2,"getBlock")({blockNumber:E.result?.number,includeTransactions:f}).catch(()=>{});g&&(l(P,d),L=!1,d=P)},onError(E){n?.(E)}});M=k,g||M()}catch(x){n?.(x)}})(),()=>M()})()}function Sa(a,{address:c,args:e,batch:r=!0,event:l,events:n,fromBlock:i,onError:s,onLogs:o,poll:t,pollingInterval:f=a.pollingInterval,strict:m}){let u=typeof t<"u"?t:typeof i=="bigint"?!0:!(a.transport.type==="webSocket"||a.transport.type==="ipc"||a.transport.type==="fallback"&&(a.transport.transports[0].config.type==="webSocket"||a.transport.transports[0].config.type==="ipc")),p=m??!1;return u?(()=>{let z=n2(["watchEvent",c,e,r,a.uid,l,n,f,p,i]);return o2(z,{onLogs:o,onError:s},g=>{let L=!0,M=i===void 0?void 0:i-1n,x,k=!1,E=w=>{if(w.length!==0)if(r)g.onLogs(w);else for(let R of w)g.onLogs([R])},P=(w,R)=>S(a,g4,"getLogs")({address:c,args:e,event:l,events:n,fromBlock:w,strict:p,toBlock:R}),A=P2(async()=>{if(!k){try{x=await S(a,n3,"createEventFilter")({address:c,args:e,event:l,events:n,strict:p,fromBlock:i})}catch{}if(k=!0,x)return}try{if(x){let O=await S(a,z1,"getFilterChanges")({filter:x});E(O);return}let w=await S(a,M2,"getBlockNumber")({});M??=w;let R=w-M;for(;M<w;){let O=M+1n,$=M+R,V=$<w?$:w,Z=await P(O,V).catch(_=>{if(O===V||!un(_))throw _});if(!L)return;if(!Z){R=(V-O+1n)/2n;continue}M=V,E(Z)}}catch(w){x&&w instanceof L6&&(k=!1),g.onError?.(w)}},{emitOnBegin:!0,interval:f});return async()=>{L=!1,x&&await S(a,v1,"uninstallFilter")({filter:x}),A()}})})():(()=>{let z=!0,g=()=>z=!1;return(async()=>{try{let L=(()=>{if(a.transport.type==="fallback"){let E=a.transport.transports.find(P=>P.config.type==="webSocket"||P.config.type==="ipc");return E?E.value:a.transport}return a.transport})(),M=n??(l?[l]:void 0),x=[];M&&(x=[M.flatMap(P=>p4({abi:[P],eventName:P.name,args:e}))],l&&(x=x[0]));let{unsubscribe:k}=await L.subscribe({params:["logs",{address:c,topics:x}],onData(E){if(!z)return;let P=E.result;try{let{eventName:A,args:w}=I3({abi:M??[],data:P.data,topics:P.topics,strict:p}),R=X2(P,{args:w,eventName:A});o([R])}catch(A){if((M||m)&&(A instanceof U3||A instanceof m6||A instanceof u6))return;let w,R;if(A instanceof p6||A instanceof d6){if(m)return;w=A.abiItem.name,R=A.abiItem.inputs?.some($=>!("name"in $&&$.name))}let O=X2(P,{args:R?[]:{},eventName:w});o([O])}},onError(E){s?.(E)}});g=k,z||g()}catch(L){s?.(L)}})(),()=>g()})()}function un(a){if(!(a instanceof H))return!0;let c=a.walk(e=>e instanceof B3||e instanceof o1);return c?c instanceof o1&&c.code===429||c instanceof B3&&c.status===void 0?!1:c.status!==401&&c.status!==403&&c.status!==429:!0}function ya(a,{batch:c=!0,onError:e,onTransactions:r,poll:l,pollingInterval:n=a.pollingInterval}){return(typeof l<"u"?l:a.transport.type!=="webSocket"&&a.transport.type!=="ipc")?(()=>{let t=n2(["watchPendingTransactions",a.uid,c,n]);return o2(t,{onTransactions:r,onError:e},f=>{let m,u=P2(async()=>{try{if(!m)try{m=await S(a,i3,"createPendingTransactionFilter")({});return}catch(d){throw u(),d}let p=await S(a,z1,"getFilterChanges")({filter:m});if(p.length===0)return;if(c)f.onTransactions(p);else for(let d of p)f.onTransactions([d])}catch(p){f.onError?.(p)}},{emitOnBegin:!0,interval:n});return async()=>{m&&await S(a,v1,"uninstallFilter")({filter:m}),u()}})})():(()=>{let t=!0,f=()=>t=!1;return(async()=>{try{let{unsubscribe:m}=await a.transport.subscribe({params:["newPendingTransactions"],onData(u){if(!t)return;let p=u.result;r([p])},onError(u){e?.(u)}});f=m,t||f()}catch(m){e?.(m)}})(),()=>f()})()}var pn=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;function dn(a){return pn.test(a)?!Number.isNaN(new Date(a).getTime()):!1}function G0(a){return dn(a)?new Date(a):new Date(Number.NaN)}function Na(a){let{scheme:c,statement:e,...r}=a.match(zn)?.groups??{},{chainId:l,expirationTime:n,issuedAt:i,notBefore:s,requestId:o,resources:t,...f}=a.match(vn)?.groups??{},m=t?.split(`
- `).slice(1);return{...r,...f,...l?{chainId:Number(l)}:{},...n?{expirationTime:G0(n)}:{},...i?{issuedAt:G0(i)}:{},...s?{notBefore:G0(s)}:{},...o?{requestId:o}:{},...m?{resources:m}:{},...c?{scheme:c}:{},...e?{statement:e}:{}}}var zn=/^(?:(?<scheme>[a-zA-Z][a-zA-Z0-9+\-.]*):\/\/)?(?<domain>[a-zA-Z0-9+-.]*(?::[0-9]{1,5})?) (?:wants you to sign in with your Ethereum account:\n)(?<address>0x[a-fA-F0-9]{40})\n\n(?:(?<statement>.*)\n\n)?/,vn=/(?:URI: (?<uri>.+))\n(?:Version: (?<version>.+))\n(?:Chain ID: (?<chainId>\d+))\n(?:Nonce: (?<nonce>[a-zA-Z0-9]+))\n(?:Issued At: (?<issuedAt>.+))(?:\nExpiration Time: (?<expirationTime>.+))?(?:\nNot Before: (?<notBefore>.+))?(?:\nRequest ID: (?<requestId>.*))?(?:\nResources:(?<resources>(?:\n- .+)*))?/;function wa(a){let{address:c,domain:e,message:r,nonce:l,scheme:n,time:i=new Date}=a;if(e&&r.domain!==e||l&&r.nonce!==l||n&&r.scheme!==n||Number.isNaN(i.getTime())||r.expirationTime&&(Number.isNaN(r.expirationTime.getTime())||i>=r.expirationTime)||r.notBefore&&(Number.isNaN(r.notBefore.getTime())||i<r.notBefore))return!1;try{if(!r.address||!A3(r.address,{strict:!1})||c&&!V2(r.address,c))return!1}catch{return!1}return!0}async function ka(a,c){let{address:e,domain:r,message:l,nonce:n,scheme:i,signature:s,time:o=new Date,...t}=c,f=Na(l);if(!f.address||!wa({address:e,domain:r,message:f,nonce:n,scheme:i,time:o}))return!1;let u=S4(l);return O2(a,{address:f.address,hash:u,signature:s,...t})}async function b2(a,c){return b2.inner(h1,a,c)}(function(a){async function c(i,s,o){return await i(s,{...o,...a.call(s,o)})}a.inner=c;function e(i,s){return t2(Mn(i,s))}Object.defineProperty(a,"call",{configurable:!0,enumerable:!0,value:e,writable:!0});async function r(i,s){return m1(i,{...b1(s),...a.call(i,s)})}a.estimateGas=r;async function l(i,s){return d1(i,{...b1(s),...a.call(i,s)})}a.simulate=l;function n(i){let[s]=Y2({abi:q,logs:i,eventName:"Approval",strict:!0});if(!s)throw new Error("`Approval` event not found.");return s}a.extractEvent=n})(b2||(b2={}));function Mn(a,c){let{amount:e,spender:r,token:l}=c,{address:n,decimals:i}=X(a,{token:l});return{abi:q,address:n,args:[r,w4(e,i)],functionName:"approve"}}async function $0(a,c){let{amount:e,token:r,throwOnReceiptRevert:l=!0}=c,{decimals:n}=X(a,{token:r}),i=k4(e,n),s=await b2.inner(C1,a,{...c,throwOnReceiptRevert:l}),{args:o}=b2.extractEvent(s.logs);return{...o,...i===void 0?{}:{decimals:i,formatted:j1(o.value,i)},receipt:s}}async function B1(a,c){let{account:e,decimals:r,spender:l,token:n,...i}=c,[s,{decimals:o}]=await Promise.all([B(a,{...i,...B1.call(a,{account:e,spender:l,token:n})}),x1(a,{decimals:r,token:n})]);return L1(s,o)}(function(a){function c(e,r){return t2({address:X(e,r).address,abi:q,functionName:"allowance",args:[r.account,r.spender]})}Object.defineProperty(a,"call",{configurable:!0,enumerable:!0,value:c,writable:!0})})(B1||(B1={}));async function R1(a,c){let{account:e=a.account,decimals:r,token:l,...n}=c;if(!e)throw new K;let i=D(e).address,[s,{decimals:o}]=await Promise.all([B(a,{...n,...R1.call(a,{account:i,token:l})}),x1(a,{decimals:r,token:l})]);return L1(s,o)}(function(a){function c(e,r){let l=r.account??e.account;if(!l)throw new K;let n=D(l).address;return t2({address:X(e,r).address,abi:q,functionName:"balanceOf",args:[n]})}Object.defineProperty(a,"call",{configurable:!0,enumerable:!0,value:c,writable:!0})})(R1||(R1={}));async function V0(a,c){let{token:e,...r}=c,{address:l}=X(a,{token:e}),n=h8(a,e),[i,s,o]=await Promise.all([n?.decimals??B(a,{...r,abi:q,address:l,functionName:"decimals"}),n?.name??B(a,{...r,abi:q,address:l,functionName:"name"}),n?.symbol??B(a,{...r,abi:q,address:l,functionName:"symbol"})]);return{decimals:i,name:s,symbol:o}}async function H1(a,c){let{decimals:e,token:r,...l}=c,[n,{decimals:i}]=await Promise.all([B(a,{...l,...H1.call(a,{token:r})}),x1(a,{decimals:e,token:r})]);return L1(n,i)}(function(a){function c(e,r){return t2({address:X(e,r).address,abi:q,args:[],functionName:"totalSupply"})}Object.defineProperty(a,"call",{configurable:!0,enumerable:!0,value:c,writable:!0})})(H1||(H1={}));async function C2(a,c){return C2.inner(h1,a,c)}(function(a){async function c(i,s,o){return await i(s,{...o,...a.call(s,o)})}a.inner=c;function e(i,s){return t2(hn(i,s))}Object.defineProperty(a,"call",{configurable:!0,enumerable:!0,value:e,writable:!0});async function r(i,s){return m1(i,{...b1(s),...a.call(i,s)})}a.estimateGas=r;async function l(i,s){return d1(i,{...b1(s),...a.call(i,s)})}a.simulate=l;function n(i){let[s]=Y2({abi:q,logs:i,eventName:"Transfer",strict:!0});if(!s)throw new Error("`Transfer` event not found.");return s}a.extractEvent=n})(C2||(C2={}));function hn(a,c){let{amount:e,from:r,to:l,token:n}=c,{address:i,decimals:s}=X(a,{token:n}),o=w4(e,s);return r?{abi:q,address:i,args:[r,l,o],functionName:"transferFrom"}:{abi:q,address:i,args:[l,o],functionName:"transfer"}}async function X0(a,c){let{amount:e,token:r,throwOnReceiptRevert:l=!0}=c,{decimals:n}=X(a,{token:r}),i=k4(e,n),s=await C2.inner(C1,a,{...c,throwOnReceiptRevert:l}),{args:o}=C2.extractEvent(s.logs);return{...o,...i===void 0?{}:{decimals:i,formatted:j1(o.value,i)},receipt:s}}function Aa(a){return{call:c=>E2(a,c),createAccessList:c=>D7(a,c),createBlockFilter:()=>I7(a),createContractEventFilter:c=>M6(a,c),createEventFilter:c=>n3(a,c),createPendingTransactionFilter:()=>i3(a),estimateContractGas:c=>m1(a,c),estimateGas:c=>F6(a,c),getBalance:c=>U7(a,c),getBlobBaseFee:()=>O7(a),getBlock:c=>z2(a,c),getBlockNumber:c=>M2(a,c),getBlockReceipts:c=>_7(a,c),getBlockTransactionCount:c=>q7(a,c),getBytecode:c=>c1(a,c),getChainId:()=>w2(a),getCode:c=>c1(a,c),getContractEvents:c=>B6(a,c),getDelegation:c=>W7(a,c),getEip712Domain:c=>j7(a,c),getEnsAddress:c=>w7(a,c),getEnsAvatar:c=>B7(a,c),getEnsName:c=>R7(a,c),getEnsResolver:c=>H7(a,c),getEnsText:c=>l3(a,c),getFeeHistory:c=>$7(a,c),estimateFeesPerGas:c=>E6(a,c),getFilterChanges:c=>z1(a,c),getFilterLogs:c=>V7(a,c),getGasPrice:()=>A6(a),getLogs:c=>g4(a,c),getProof:c=>Z7(a,c),estimateMaxPriorityFeePerGas:c=>T6(a,c),fillTransaction:c=>M4(a,c),getRawTransaction:c=>aa(a,c),getStorageAt:c=>ca(a,c),getStorageValues:c=>ea(a,c),getTransaction:c=>N4(a,c),getTransactionConfirmations:c=>ra(a,c),getTransactionCount:c=>v4(a,c),getTransactionReceipt:c=>u8(a,c),multicall:c=>p8(a,c),prepareTransactionRequest:c=>h4(a,c),readContract:c=>B(a,c),sendRawTransaction:c=>C4(a,c),sendRawTransactionSync:c=>A4(a,c),simulate:c=>F1(a,c),simulateBlocks:c=>F1(a,c),simulateCalls:c=>Ma(a,c),simulateContract:c=>d1(a,c),verifyHash:c=>O2(a,c),verifyMessage:c=>La(a,c),verifySiweMessage:c=>ka(a,c),verifyTypedData:c=>xa(a,c),uninstallFilter:c=>v1(a,c),waitForTransactionReceipt:c=>M8(a,c),watchBlockHeaders:c=>ba(a,c),watchBlocks:c=>Ca(a,c),watchBlockNumber:c=>v8(a,c),watchContractEvent:c=>G6(a,c),watchEvent:c=>Sa(a,c),watchPendingTransactions:c=>ya(a,c),token:gn(a)}}function gn(a){return{getAllowance:m2(a,B1),getBalance:m2(a,R1),getMetadata:m2(a,V0),getTotalSupply:m2(a,H1)}}function Ln(a){let{key:c="public",name:e="Public Client"}=a;return Z4({...a,key:c,name:e,type:"publicClient"}).extend(Aa)}async function Ta(a,{chain:c}){let{id:e,name:r,nativeCurrency:l,rpcUrls:n,blockExplorers:i}=c;await a.request({method:"wallet_addEthereumChain",params:[{chainId:F(e),chainName:r,nativeCurrency:l,rpcUrls:n.default.http,blockExplorerUrls:i?Object.values(i).map(({url:s})=>s):void 0}]},{dedupe:!0,retryCount:0})}function Ea(a,c){let{abi:e,args:r,bytecode:l,...n}=c,i=b4({abi:e,args:r,bytecode:l});return M1(a,{...n,...n.authorizationList?{to:null}:{},data:i})}async function Pa(a){return a.account?.type==="local"?[a.account.address]:(await a.request({method:"eth_accounts"},{dedupe:!0})).map(e=>k3(e))}async function Fa(a,c={}){let{account:e=a.account,chainId:r}=c,l=e?D(e):void 0,n=r?[l?.address,[F(r)]]:[l?.address],i=await a.request({method:"wallet_getCapabilities",params:n}),s={};for(let[o,t]of Object.entries(i)){s[Number(o)]={};for(let[f,m]of Object.entries(t))f==="addSubAccount"&&(f="unstable_addSubAccount"),s[Number(o)][f]=m}return typeof r=="number"?s[r]:s}async function Ba(a){return await a.request({method:"wallet_getPermissions"},{dedupe:!0})}async function u3(a,c){let{account:e=a.account,chainId:r,nonce:l}=c;if(!e)throw new K({docsPath:"/docs/eip7702/prepareAuthorization"});let n=D(e),i=(()=>{if(c.executor)return c.executor==="self"?c.executor:D(c.executor)})(),s={address:c.contractAddress??c.address,chainId:r,nonce:l};return typeof s.chainId>"u"&&(s.chainId=a.chain?.id??await S(a,w2,"getChainId")({})),typeof s.nonce>"u"&&(s.nonce=await S(a,v4,"getTransactionCount")({address:n.address,blockTag:"pending"}),(i==="self"||i?.address&&V2(i.address,n.address))&&(s.nonce+=1)),s}async function Ra(a){return(await a.request({method:"eth_requestAccounts"},{dedupe:!0,retryCount:0})).map(e=>l2(e))}async function Ha(a,c){return a.request({method:"wallet_requestPermissions",params:[c]},{retryCount:0})}async function Da(a,c){let{chain:e=a.chain}=c,r=c.timeout??Math.max((e?.blockTime??0)*3,5e3),l=await S(a,V4,"sendCalls")(c);return await S(a,Y4,"waitForCallsStatus")({...c,id:l.id,timeout:r})}async function Ia(a,c){let{id:e}=c;await a.request({method:"wallet_showCallsStatus",params:[e]})}async function Ua(a,c){let{account:e=a.account}=c;if(!e)throw new K({docsPath:"/docs/eip7702/signAuthorization"});let r=D(e);if(!r.signAuthorization)throw new $6({docsPath:"/docs/eip7702/signAuthorization",metaMessages:["The `signAuthorization` Action does not support JSON-RPC Accounts."],type:r.type});let l=await u3(a,c);return r.signAuthorization(l)}async function Oa(a,{account:c=a.account,message:e}){if(!c)throw new K({docsPath:"/docs/actions/wallet/signMessage"});let r=D(c);if(r.signMessage)return r.signMessage({message:e});let l=typeof e=="string"?y3(e):e.raw instanceof Uint8Array?p2(e.raw):e.raw;return a.request({method:"personal_sign",params:[l,r.address]},{retryCount:0})}async function _a(a,c){let{account:e=a.account,chain:r=a.chain,...l}=c;if(!e)throw new K({docsPath:"/docs/actions/wallet/signTransaction"});let n=D(e);f1({account:n,...c});let i=await S(a,w2,"getChainId")({});r!==null&&V6({currentChainId:i,chain:r});let o=(r?.formatters||a.chain?.formatters)?.transactionRequest?.format||t1;return n.signTransaction?n.signTransaction({...l,account:n,chainId:i},{serializer:a.chain?.serializers?.transaction}):await a.request({method:"eth_signTransaction",params:[{...o({...l,account:n},"signTransaction"),chainId:F(i),from:n.address}]},{retryCount:0})}async function qa(a,c){let{account:e=a.account,domain:r,message:l,primaryType:n}=c;if(!e)throw new K({docsPath:"/docs/actions/wallet/signTypedData"});let i=D(e),s={EIP712Domain:l8({domain:r}),...c.types};if(r8({domain:r,message:l,primaryType:n,types:s}),i.signTypedData)return i.signTypedData({domain:r,message:l,primaryType:n,types:s});let o=e8({domain:r,message:l,primaryType:n,types:s});return a.request({method:"eth_signTypedData_v4",params:[i.address,o]},{retryCount:0})}async function Wa(a,{id:c}){await a.request({method:"wallet_switchEthereumChain",params:[{chainId:F(c)}]},{retryCount:0})}async function ja(a,c){return await a.request({method:"wallet_watchAsset",params:c},{retryCount:0})}function Ga(a){return{addChain:c=>Ta(a,c),deployContract:c=>Ea(a,c),fillTransaction:c=>M4(a,c),getAddresses:()=>Pa(a),getCallsStatus:c=>X4(a,c),getCapabilities:c=>Fa(a,c),getChainId:()=>w2(a),getPermissions:()=>Ba(a),prepareAuthorization:c=>u3(a,c),prepareTransactionRequest:c=>h4(a,c),requestAddresses:()=>Ra(a),requestPermissions:c=>Ha(a,c),sendCalls:c=>V4(a,c),sendCallsSync:c=>Da(a,c),sendRawTransaction:c=>C4(a,c),sendRawTransactionSync:c=>A4(a,c),sendTransaction:c=>M1(a,c),sendTransactionSync:c=>g8(a,c),showCallsStatus:c=>Ia(a,c),signAuthorization:c=>Ua(a,c),signMessage:c=>Oa(a,c),signTransaction:c=>_a(a,c),signTypedData:c=>qa(a,c),switchChain:c=>Wa(a,c),waitForCallsStatus:c=>Y4(a,c),watchAsset:c=>ja(a,c),writeContract:c=>h1(a,c),writeContractSync:c=>C1(a,c),token:{approve:m2(a,b2),approveSync:m2(a,$0),transfer:m2(a,C2),transferSync:m2(a,X0)}}}function xn(a){let{key:c="wallet",name:e="Wallet Client",transport:r}=a;return Z4({...a,key:c,name:e,transport:r,type:"walletClient"}).extend(Ga)}function p3({key:a,methods:c,name:e,request:r,retryCount:l=3,retryDelay:n=150,timeout:i,type:s},o){let t=Q4();return{config:{key:a,methods:c,name:e,request:r,retryCount:l,retryDelay:n,timeout:i,type:s},request:a8(r,{methods:c,retryCount:l,retryDelay:n,uid:t}),value:o}}function bn(a,c={}){let{key:e="custom",methods:r,name:l="Custom Provider",retryDelay:n}=c;return({retryCount:i})=>p3({key:e,methods:r,name:l,request:a.request.bind(a),retryCount:c.retryCount??i,retryDelay:n,type:"custom"})}var d3=class extends H{constructor(){super("No URL was provided to the Transport. Please provide a valid RPC URL to the Transport.",{docsPath:"/docs/clients/intro",name:"UrlRequiredError"})}};var Cn=0,$a=new WeakMap;function Sn(a){if(!a)return"default";let c=$a.get(a);if(c!==void 0)return c;let e=Cn++;return $a.set(a,e),e}function yn(a,c={}){let{batch:e,fetchFn:r,fetchOptions:l,key:n="http",maxResponseBodySize:i,methods:s,name:o="HTTP JSON-RPC",onFetchRequest:t,onFetchResponse:f,retryDelay:m,raw:u}=c;return({chain:p,retryCount:d,timeout:h})=>{let{batchSize:z=1e3,wait:g=0}=typeof e=="object"?e:{},L=c.retryCount??d,M=h??c.timeout??1e4,x=a||p?.rpcUrls.default.http[0];if(!x)throw new d3;let k=c8(x,{fetchFn:r,fetchOptions:l,maxResponseBodySize:i,onRequest:t,onResponse:f,timeout:M});return p3({key:n,methods:s,name:o,async request({method:E,params:P},A){let w={method:E,params:P},R=A?.signal?{signal:A.signal}:void 0,{schedule:O}=j6({id:`${x}.${Sn(A?.signal)}`,wait:g,shouldSplitBatch(_){return _.length>z},fn:_=>k.request({body:_,fetchOptions:R}),sort:(_,T)=>_.id-T.id}),$=async _=>e?O(_):[await k.request({body:_,fetchOptions:R})],[{error:V,result:Z}]=await $(w).catch(_=>{if(u&&_ instanceof o1)return[{error:_.cause,result:void 0}];throw _});if(u)return{error:V,result:Z};if(V)throw new o1({body:w,error:V,url:x});return Z},retryCount:L,retryDelay:m,timeout:M,type:"http"},{fetchOptions:l,url:x})}}var NM={prefix:"fas",iconName:"rotate",icon:[512,512,[128260,"sync-alt"],"f2f1","M480.1 192l7.9 0c13.3 0 24-10.7 24-24l0-144c0-9.7-5.8-18.5-14.8-22.2S477.9 .2 471 7L419.3 58.8C375 22.1 318 0 256 0 127 0 20.3 95.4 2.6 219.5 .1 237 12.2 253.2 29.7 255.7s33.7-9.7 36.2-27.1C79.2 135.5 159.3 64 256 64 300.4 64 341.2 79 373.7 104.3L327 151c-6.9 6.9-8.9 17.2-5.2 26.2S334.3 192 344 192l136.1 0zm29.4 100.5c2.5-17.5-9.7-33.7-27.1-36.2s-33.7 9.7-36.2 27.1c-13.3 93-93.4 164.5-190.1 164.5-44.4 0-85.2-15-117.7-40.3L185 361c6.9-6.9 8.9-17.2 5.2-26.2S177.7 320 168 320L24 320c-13.3 0-24 10.7-24 24L0 488c0 9.7 5.8 18.5 14.8 22.2S34.1 511.8 41 505l51.8-51.8C137 489.9 194 512 256 512 385 512 491.7 416.6 509.4 292.5z"]};var wM={prefix:"fas",iconName:"wallet",icon:[512,512,[],"f555","M64 32C28.7 32 0 60.7 0 96L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64L72 128c-13.3 0-24-10.7-24-24S58.7 80 72 80l384 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L64 32zM416 256a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"]};var kM={prefix:"fas",iconName:"magnifying-glass",icon:[512,512,[128269,"search"],"f002","M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416 93.1 416 0 322.9 0 208S93.1 0 208 0 416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"]};var AM={prefix:"fas",iconName:"key",icon:[512,512,[128273],"f084","M336 352c97.2 0 176-78.8 176-176S433.2 0 336 0 160 78.8 160 176c0 18.7 2.9 36.8 8.3 53.7L7 391c-4.5 4.5-7 10.6-7 17l0 80c0 13.3 10.7 24 24 24l80 0c13.3 0 24-10.7 24-24l0-40 40 0c13.3 0 24-10.7 24-24l0-40 40 0c6.4 0 12.5-2.5 17-7l33.3-33.3c16.9 5.4 35 8.3 53.7 8.3zM376 96a40 40 0 1 1 0 80 40 40 0 1 1 0-80z"]};var TM={prefix:"fas",iconName:"eye",icon:[576,512,[128065],"f06e","M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z"]};var EM={prefix:"fas",iconName:"table-columns",icon:[448,512,["columns"],"f0db","M0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zm64 64l0 256 128 0 0-256-128 0zm320 0l-128 0 0 256 128 0 0-256z"]};var PM={prefix:"fas",iconName:"circle-plus",icon:[512,512,["plus-circle"],"f055","M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM232 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"]};var FM={prefix:"fas",iconName:"link",icon:[576,512,[128279,"chain"],"f0c1","M419.5 96c-16.6 0-32.7 4.5-46.8 12.7-15.8-16-34.2-29.4-54.5-39.5 28.2-24 64.1-37.2 101.3-37.2 86.4 0 156.5 70 156.5 156.5 0 41.5-16.5 81.3-45.8 110.6l-71.1 71.1c-29.3 29.3-69.1 45.8-110.6 45.8-86.4 0-156.5-70-156.5-156.5 0-1.5 0-3 .1-4.5 .5-17.7 15.2-31.6 32.9-31.1s31.6 15.2 31.1 32.9c0 .9 0 1.8 0 2.6 0 51.1 41.4 92.5 92.5 92.5 24.5 0 48-9.7 65.4-27.1l71.1-71.1c17.3-17.3 27.1-40.9 27.1-65.4 0-51.1-41.4-92.5-92.5-92.5zM275.2 173.3c-1.9-.8-3.8-1.9-5.5-3.1-12.6-6.5-27-10.2-42.1-10.2-24.5 0-48 9.7-65.4 27.1L91.1 258.2c-17.3 17.3-27.1 40.9-27.1 65.4 0 51.1 41.4 92.5 92.5 92.5 16.5 0 32.6-4.4 46.7-12.6 15.8 16 34.2 29.4 54.6 39.5-28.2 23.9-64 37.2-101.3 37.2-86.4 0-156.5-70-156.5-156.5 0-41.5 16.5-81.3 45.8-110.6l71.1-71.1c29.3-29.3 69.1-45.8 110.6-45.8 86.6 0 156.5 70.6 156.5 156.9 0 1.3 0 2.6 0 3.9-.4 17.7-15.1 31.6-32.8 31.2s-31.6-15.1-31.2-32.8c0-.8 0-1.5 0-2.3 0-33.7-18-63.3-44.8-79.6z"]};var BM={prefix:"fas",iconName:"gear",icon:[512,512,[9881,"cog"],"f013","M195.1 9.5C198.1-5.3 211.2-16 226.4-16l59.8 0c15.2 0 28.3 10.7 31.3 25.5L332 79.5c14.1 6 27.3 13.7 39.3 22.8l67.8-22.5c14.4-4.8 30.2 1.2 37.8 14.4l29.9 51.8c7.6 13.2 4.9 29.8-6.5 39.9L447 233.3c.9 7.4 1.3 15 1.3 22.7s-.5 15.3-1.3 22.7l53.4 47.5c11.4 10.1 14 26.8 6.5 39.9l-29.9 51.8c-7.6 13.1-23.4 19.2-37.8 14.4l-67.8-22.5c-12.1 9.1-25.3 16.7-39.3 22.8l-14.4 69.9c-3.1 14.9-16.2 25.5-31.3 25.5l-59.8 0c-15.2 0-28.3-10.7-31.3-25.5l-14.4-69.9c-14.1-6-27.2-13.7-39.3-22.8L73.5 432.3c-14.4 4.8-30.2-1.2-37.8-14.4L5.8 366.1c-7.6-13.2-4.9-29.8 6.5-39.9l53.4-47.5c-.9-7.4-1.3-15-1.3-22.7s.5-15.3 1.3-22.7L12.3 185.8c-11.4-10.1-14-26.8-6.5-39.9L35.7 94.1c7.6-13.2 23.4-19.2 37.8-14.4l67.8 22.5c12.1-9.1 25.3-16.7 39.3-22.8L195.1 9.5zM256.3 336a80 80 0 1 0 -.6-160 80 80 0 1 0 .6 160z"]};var RM={prefix:"fas",iconName:"arrow-up",icon:[384,512,[8593],"f062","M214.6 9.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 109.3 160 480c0 17.7 14.3 32 32 32s32-14.3 32-32l0-370.7 105.4 105.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"]};var HM={prefix:"fas",iconName:"trash-can",icon:[448,512,[61460,"trash-alt"],"f2ed","M136.7 5.9C141.1-7.2 153.3-16 167.1-16l113.9 0c13.8 0 26 8.8 30.4 21.9L320 32 416 32c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 8.7-26.1zM32 144l384 0 0 304c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-304zm88 64c-13.3 0-24 10.7-24 24l0 192c0 13.3 10.7 24 24 24s24-10.7 24-24l0-192c0-13.3-10.7-24-24-24zm104 0c-13.3 0-24 10.7-24 24l0 192c0 13.3 10.7 24 24 24s24-10.7 24-24l0-192c0-13.3-10.7-24-24-24zm104 0c-13.3 0-24 10.7-24 24l0 192c0 13.3 10.7 24 24 24s24-10.7 24-24l0-192c0-13.3-10.7-24-24-24z"]};var DM={prefix:"fas",iconName:"check",icon:[448,512,[10003,10004],"f00c","M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z"]};var IM={prefix:"fas",iconName:"spinner",icon:[512,512,[],"f110","M208 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm0 416a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM48 208a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm368 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM75 369.1A48 48 0 1 1 142.9 437 48 48 0 1 1 75 369.1zM75 75A48 48 0 1 1 142.9 142.9 48 48 0 1 1 75 75zM437 369.1A48 48 0 1 1 369.1 437 48 48 0 1 1 437 369.1z"]};var UM={prefix:"fas",iconName:"sliders",icon:[512,512,["sliders-h"],"f1de","M32 64C14.3 64 0 78.3 0 96s14.3 32 32 32l86.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 128c17.7 0 32-14.3 32-32s-14.3-32-32-32L265.3 64C253 35.7 224.8 16 192 16s-61 19.7-73.3 48L32 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l246.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48l54.7 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-54.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 224zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l54.7 0c12.3 28.3 40.5 48 73.3 48s61-19.7 73.3-48L480 448c17.7 0 32-14.3 32-32s-14.3-32-32-32l-246.7 0c-12.3-28.3-40.5-48-73.3-48s-61 19.7-73.3 48L32 384z"]};var OM={prefix:"fas",iconName:"server",icon:[448,512,[],"f233","M64 32C28.7 32 0 60.7 0 96l0 64c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-64c0-35.3-28.7-64-64-64L64 32zm216 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64l0 64c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-64c0-35.3-28.7-64-64-64L64 288zm216 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"]};var _M={prefix:"fas",iconName:"arrow-right",icon:[512,512,[8594],"f061","M502.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L402.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l370.7 0-105.4 105.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"]};var Va={prefix:"fas",iconName:"xmark",icon:[384,512,[128473,10005,10006,10060,215,"close","multiply","remove","times"],"f00d","M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"]};var qM={prefix:"fas",iconName:"droplet",icon:[384,512,[128167,"tint"],"f043","M192 512C86 512 0 426 0 320 0 228.8 130.2 45.9 166.6-3.5 172.5-11.5 181.8-16 191.8-16l.4 0c10 0 19.3 4.5 25.2 12.5 36.4 49.4 166.6 232.3 166.6 323.5 0 106-86 192-192 192zM112 312c0-13.3-10.7-24-24-24s-24 10.7-24 24c0 75.1 60.9 136 136 136 13.3 0 24-10.7 24-24s-10.7-24-24-24c-48.6 0-88-39.4-88-88z"]};var WM={prefix:"fas",iconName:"circle-check",icon:[512,512,[61533,"check-circle"],"f058","M256 512a256 256 0 1 1 0-512 256 256 0 1 1 0 512zM374 145.7c-10.7-7.8-25.7-5.4-33.5 5.3L221.1 315.2 169 263.1c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l72 72c5 5 11.8 7.5 18.8 7s13.4-4.1 17.5-9.8L379.3 179.2c7.8-10.7 5.4-25.7-5.3-33.5z"]};var jM={prefix:"fas",iconName:"clock-rotate-left",icon:[576,512,["history"],"f1da","M288 64c106 0 192 86 192 192S394 448 288 448c-65.2 0-122.9-32.5-157.6-82.3-10.1-14.5-30.1-18-44.6-7.9s-18 30.1-7.9 44.6C124.1 468.6 201 512 288 512 429.4 512 544 397.4 544 256S429.4 0 288 0C202.3 0 126.5 42.1 80 106.7L80 80c0-17.7-14.3-32-32-32S16 62.3 16 80l0 112c0 17.7 14.3 32 32 32l24.6 0c.5 0 1 0 1.5 0l86 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-38.3 0C154.9 102.6 217 64 288 64zm24 88c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1z"]};var GM={prefix:"fas",iconName:"lock",icon:[384,512,[128274],"f023","M128 96l0 64 128 0 0-64c0-35.3-28.7-64-64-64s-64 28.7-64 64zM64 160l0-64C64 25.3 121.3-32 192-32S320 25.3 320 96l0 64c35.3 0 64 28.7 64 64l0 224c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 224c0-35.3 28.7-64 64-64z"]};var $M={prefix:"fas",iconName:"circle-nodes",icon:[512,512,[],"e4e2","M418.4 157.9c35.3-8.3 61.6-40 61.6-77.9 0-44.2-35.8-80-80-80-43.4 0-78.7 34.5-80 77.5L136.2 151.1C121.7 136.8 101.9 128 80 128 35.8 128 0 163.8 0 208s35.8 80 80 80c12.2 0 23.8-2.7 34.1-7.6L259.7 407.8c-2.4 7.6-3.7 15.8-3.7 24.2 0 44.2 35.8 80 80 80s80-35.8 80-80c0-27.7-14-52.1-35.4-66.4l37.8-207.7zM156.3 232.2c2.2-6.9 3.5-14.2 3.7-21.7l183.8-73.5c3.6 3.5 7.4 6.7 11.6 9.5L317.6 354.1c-5.5 1.3-10.8 3.1-15.8 5.5L156.3 232.2z"]};var VM={prefix:"fas",iconName:"download",icon:[448,512,[],"f019","M256 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 210.7-41.4-41.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 242.7 256 32zM64 320c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-46.9 0-56.6 56.6c-31.2 31.2-81.9 31.2-113.1 0L110.9 320 64 320zm304 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"]};var XM={prefix:"fas",iconName:"shield-halved",icon:[512,512,["shield-alt"],"f3ed","M256 0c4.6 0 9.2 1 13.4 2.9L457.8 82.8c22 9.3 38.4 31 38.3 57.2-.5 99.2-41.3 280.7-213.6 363.2-16.7 8-36.1 8-52.8 0-172.4-82.5-213.1-264-213.6-363.2-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.9 1 251.4 0 256 0zm0 66.8l0 378.1c138-66.8 175.1-214.8 176-303.4l-176-74.6 0 0z"]};var YM={prefix:"fas",iconName:"arrow-left",icon:[512,512,[8592],"f060","M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288 480 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-370.7 0 105.4-105.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"]};var KM={prefix:"fas",iconName:"shuffle",icon:[512,512,[128256,"random"],"f074","M403.8 34.4c12-5 25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64c-9.2 9.2-22.9 11.9-34.9 6.9S384 204.9 384 192l0-32-32 0c-10.1 0-19.6 4.7-25.6 12.8l-32.4 43.2-40-53.3 21.2-28.3C293.3 110.2 321.8 96 352 96l32 0 0-32c0-12.9 7.8-24.6 19.8-29.6zM154 296l40 53.3-21.2 28.3C154.7 401.8 126.2 416 96 416l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c10.1 0 19.6-4.7 25.6-12.8L154 296zM438.6 470.6c-9.2 9.2-22.9 11.9-34.9 6.9S384 460.9 384 448l0-32-32 0c-30.2 0-58.7-14.2-76.8-38.4L121.6 172.8c-6-8.1-15.5-12.8-25.6-12.8l-64 0c-17.7 0-32-14.3-32-32S14.3 96 32 96l64 0c30.2 0 58.7 14.2 76.8 38.4L326.4 339.2c6 8.1 15.5 12.8 25.6 12.8l32 0 0-32c0-12.9 7.8-24.6 19.8-29.6s25.7-2.2 34.9 6.9l64 64c6 6 9.4 14.1 9.4 22.6s-3.4 16.6-9.4 22.6l-64 64z"]};var JM={prefix:"fas",iconName:"plus",icon:[448,512,[10133,61543,"add"],"2b","M256 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 160-160 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l160 0 0 160c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160 160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-160 0 0-160z"]};var QM={prefix:"fas",iconName:"copy",icon:[448,512,[],"f0c5","M192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-200.6c0-17.4-7.1-34.1-19.7-46.2L370.6 17.8C358.7 6.4 342.8 0 326.3 0L192 0zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-16-64 0 0 16-192 0 0-256 16 0 0-64-16 0z"]};var ZM={prefix:"fas",iconName:"eye-slash",icon:[576,512,[],"f070","M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM204.5 138.7c23.5-16.8 52.4-26.7 83.5-26.7 79.5 0 144 64.5 144 144 0 31.1-9.9 59.9-26.7 83.5l-34.7-34.7c12.7-21.4 17-47.7 10.1-73.7-13.7-51.2-66.4-81.6-117.6-67.9-8.6 2.3-16.7 5.7-24 10l-34.7-34.7zM325.3 395.1c-11.9 3.2-24.4 4.9-37.3 4.9-79.5 0-144-64.5-144-144 0-12.9 1.7-25.4 4.9-37.3L69.4 139.2c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6l-64.2-64.2z"]};var ah={prefix:"fas",iconName:"arrow-up-right-from-square",icon:[512,512,["external-link"],"f08e","M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l82.7 0-201.4 201.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3 448 192c0 17.7 14.3 32 32 32s32-14.3 32-32l0-160c0-17.7-14.3-32-32-32L320 0zM80 96C35.8 96 0 131.8 0 176L0 432c0 44.2 35.8 80 80 80l256 0c44.2 0 80-35.8 80-80l0-80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 80c0 8.8-7.2 16-16 16L80 448c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l80 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 96z"]};var ch={prefix:"fas",iconName:"arrow-down",icon:[384,512,[8595],"f063","M169.4 502.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 402.7 224 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 370.7-105.4-105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"]};var eh={prefix:"fas",iconName:"bars",icon:[448,512,["navicon"],"f0c9","M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"]};var rh={prefix:"fas",iconName:"book-open",icon:[512,512,[128214,128366],"f518","M256 141.3l0 309.3 .5-.2C311.1 427.7 369.7 416 428.8 416l19.2 0 0-320-19.2 0c-42.2 0-84.1 8.4-123.1 24.6-16.8 7-33.4 13.9-49.7 20.7zM230.9 61.5L256 72 281.1 61.5C327.9 42 378.1 32 428.8 32L464 32c26.5 0 48 21.5 48 48l0 352c0 26.5-21.5 48-48 48l-35.2 0c-50.7 0-100.9 10-147.7 29.5l-12.8 5.3c-7.9 3.3-16.7 3.3-24.6 0l-12.8-5.3C184.1 490 133.9 480 83.2 480L48 480c-26.5 0-48-21.5-48-48L0 80C0 53.5 21.5 32 48 32l35.2 0c50.7 0 100.9 10 147.7 29.5z"]};var S2=U1(Z3());var r1=U1(Z3(),1);var kn=U1(v3(),1);function An(a){return a=a-0,a===a}function a9(a){return An(a)?a:(a=a.replace(/[_-]+(.)?/g,(c,e)=>e?e.toUpperCase():""),a.charAt(0).toLowerCase()+a.slice(1))}var Tn=(a,c)=>r1.default.createElement("stop",{key:`${c}-${a.offset}`,offset:a.offset,stopColor:a.color,...a.opacity!==void 0&&{stopOpacity:a.opacity}});function En(a){return a.charAt(0).toUpperCase()+a.slice(1)}var D1=new Map,Pn=1e3;function Fn(a){if(D1.has(a))return D1.get(a);let c={},e=0,r=a.length;for(;e<r;){let l=a.indexOf(";",e),n=l===-1?r:l,i=a.slice(e,n).trim();if(i){let s=i.indexOf(":");if(s>0){let o=i.slice(0,s).trim(),t=i.slice(s+1).trim();if(o&&t){let f=a9(o);c[f.startsWith("webkit")?En(f):f]=t}}}e=n+1}if(D1.size===Pn){let l=D1.keys().next().value;l&&D1.delete(l)}return D1.set(a,c),c}function c9(a,c,e={}){if(typeof c=="string")return c;let r=(c.children||[]).map(m=>{let u=m;return("fill"in e||e.gradientFill)&&m.tag==="path"&&"fill"in m.attributes&&(u={...m,attributes:{...m.attributes,fill:void 0}}),c9(a,u)}),l=c.attributes||{},n={};for(let[m,u]of Object.entries(l))switch(!0){case m==="class":{n.className=u;break}case m==="style":{n.style=Fn(String(u));break}case m.startsWith("aria-"):case m.startsWith("data-"):{n[m.toLowerCase()]=u;break}default:n[a9(m)]=u}let{style:i,role:s,"aria-label":o,gradientFill:t,...f}=e;if(i&&(n.style=n.style?{...n.style,...i}:i),s&&(n.role=s),o&&(n["aria-label"]=o,n["aria-hidden"]="false"),t){n.fill=`url(#${t.id})`;let{type:m,stops:u=[],...p}=t;r.unshift(a(m==="linear"?"linearGradient":"radialGradient",{...p,id:t.id},u.map(Tn)))}return a(c.tag,{...n,...f},...r)}var Bn=c9.bind(null,r1.default.createElement),Ja=(a,c)=>{let e=(0,r1.useId)();return a||(c?e:void 0)},Rn=class{constructor(a="react-fontawesome"){this.enabled=!1;let c=!1;try{c=typeof process<"u"&&!1}catch{}this.scope=a,this.enabled=c}log(...a){this.enabled&&console.log(`[${this.scope}]`,...a)}warn(...a){this.enabled&&console.warn(`[${this.scope}]`,...a)}error(...a){this.enabled&&console.error(`[${this.scope}]`,...a)}};typeof process<"u"&&process.env?.FA_VERSION;var Hn="searchPseudoElementsFullScan"in a1&&typeof a1.searchPseudoElementsFullScan=="boolean"?"7.0.0":"6.0.0",Dn=Number.parseInt(Hn)>=7,In=()=>Dn,i4="fa",W={beat:"fa-beat",fade:"fa-fade",beatFade:"fa-beat-fade",bounce:"fa-bounce",shake:"fa-shake",spin:"fa-spin",spinPulse:"fa-spin-pulse",spinReverse:"fa-spin-reverse",pulse:"fa-pulse",flip360:"fa-flip-360",buzz:"fa-buzz",float:"fa-float",jello:"fa-jello",spinSnap:"fa-spin-snap",spinSnap4:"fa-spin-snap-4",spinSnap8:"fa-spin-snap-8",swing:"fa-swing",wag:"fa-wag"},Un={left:"fa-pull-left",right:"fa-pull-right"},On={90:"fa-rotate-90",180:"fa-rotate-180",270:"fa-rotate-270"},_n={"2xs":"fa-2xs",xs:"fa-xs",sm:"fa-sm",lg:"fa-lg",xl:"fa-xl","2xl":"fa-2xl","1x":"fa-1x","2x":"fa-2x","3x":"fa-3x","4x":"fa-4x","5x":"fa-5x","6x":"fa-6x","7x":"fa-7x","8x":"fa-8x","9x":"fa-9x","10x":"fa-10x"},Q={border:"fa-border",fixedWidth:"fa-fw",flip:"fa-flip",flipHorizontal:"fa-flip-horizontal",flipVertical:"fa-flip-vertical",inverse:"fa-inverse",rotateBy:"fa-rotate-by",swapOpacity:"fa-swap-opacity",widthAuto:"fa-width-auto",canvasSquare:"fa-canvas-square",canvasRoomy:"fa-canvas-roomy"},qn={default:"fa-layers"};function Wn(a){let c=a1.cssPrefix||a1.familyPrefix||i4;return c===i4?a:a.replace(new RegExp(String.raw`(?<=^|\s)${i4}-`,"g"),`${c}-`)}function jn(a){let{beat:c,fade:e,beatFade:r,bounce:l,shake:n,spin:i,spinPulse:s,spinReverse:o,pulse:t,fixedWidth:f,inverse:m,border:u,flip:p,size:d,rotation:h,pull:z,swapOpacity:g,rotateBy:L,widthAuto:M,canvasSquare:x,canvasRoomy:k,flip360:E,buzz:P,float:A,jello:w,spinSnap:R,spinSnap4:O,spinSnap8:$,swing:V,wag:Z,className:_}=a,T=[];return _&&T.push(..._.split(" ")),c&&T.push(W.beat),e&&T.push(W.fade),r&&T.push(W.beatFade),l&&T.push(W.bounce),n&&T.push(W.shake),i&&T.push(W.spin),o&&T.push(W.spinReverse),s&&T.push(W.spinPulse),t&&T.push(W.pulse),f&&T.push(Q.fixedWidth),m&&T.push(Q.inverse),u&&T.push(Q.border),p===!0&&T.push(Q.flip),(p==="horizontal"||p==="both")&&T.push(Q.flipHorizontal),(p==="vertical"||p==="both")&&T.push(Q.flipVertical),d!=null&&T.push(_n[d]),h!=null&&h!==0&&T.push(On[h]),z!=null&&T.push(Un[z]),g&&T.push(Q.swapOpacity),In()?(L&&T.push(Q.rotateBy),M&&T.push(Q.widthAuto),x&&T.push(Q.canvasSquare),k&&T.push(Q.canvasRoomy),E&&T.push(W.flip360),P&&T.push(W.buzz),A&&T.push(W.float),w&&T.push(W.jello),R&&T.push(W.spinSnap),O&&T.push(W.spinSnap4),$&&T.push(W.spinSnap8),V&&T.push(W.swing),Z&&T.push(W.wag),(a1.cssPrefix||a1.familyPrefix||i4)===i4?T:T.map(Wn)):T}var Gn=a=>typeof a=="object"&&"icon"in a&&!!a.icon;function Qa(a){if(a)return Gn(a)?a:P0.icon(a)}function $n(a){return Object.keys(a)}var Za=new Rn("FontAwesomeIcon"),e9={border:!1,className:"",mask:void 0,maskId:void 0,fixedWidth:!1,inverse:!1,flip:!1,icon:void 0,listItem:!1,pull:void 0,pulse:!1,rotation:void 0,rotateBy:!1,size:void 0,spin:!1,spinPulse:!1,spinReverse:!1,beat:!1,fade:!1,beatFade:!1,bounce:!1,shake:!1,symbol:!1,title:"",titleId:void 0,transform:void 0,swapOpacity:!1,widthAuto:!1,canvasSquare:!1,canvasRoomy:!1,flip360:!1,buzz:!1,float:!1,jello:!1,spinSnap:!1,spinSnap4:!1,spinSnap8:!1,swing:!1,wag:!1},Vn=new Set(Object.keys(e9)),Y0=r1.default.forwardRef((a,c)=>{let e={...e9,...a},{icon:r,mask:l,symbol:n,title:i,titleId:s,maskId:o,transform:t}=e,f=Ja(o,!!l),m=Ja(s,!!i),u=Qa(r);if(!u)return Za.error("Icon lookup is undefined",r),null;let p=jn(e),d=typeof t=="string"?P0.transform(t):t,h=Qa(l),z=g7(u,{...p.length>0&&{classes:p},...d&&{transform:d},...h&&{mask:h},symbol:n,title:i,titleId:m,maskId:f});if(!z)return Za.error("Could not find icon",u),null;let{abstract:g}=z,L={ref:c};for(let M of $n(e))Vn.has(M)||(L[M]=e[M]);return Bn(g[0],L)});Y0.displayName="FontAwesomeIcon";var oh=`${qn.default} ${Q.fixedWidth}`;var G=U1(v3());function Xn({icon:a,size:c=16,className:e=""}){return(0,G.jsx)(Y0,{icon:a,className:`qd-icon ${e}`,style:{width:c,height:c},"aria-hidden":"true"})}function ph({title:a,eyebrow:c,children:e,onClose:r,wide:l=!1,busy:n=!1,className:i="",focusKey:s}){let o=(0,S2.useRef)(null),t=(0,S2.useId)(),f=(0,S2.useRef)(!1),m=(0,S2.useRef)(r);return m.current=r,(0,S2.useEffect)(()=>{let u=document.activeElement,p=document.body.style.overflow;return document.body.style.overflow="hidden",o.current?.showModal(),()=>{document.body.style.overflow=p,u?.isConnected&&u.focus({preventScroll:!0})}},[]),(0,S2.useEffect)(()=>{s!==void 0&&(o.current?.scrollTo({top:0,behavior:"instant"}),o.current?.querySelector("h2")?.focus({preventScroll:!0}))},[s]),(0,G.jsx)("dialog",{ref:o,className:`qd-modal ${l?"qd-modal-wide":""} ${i}`,"aria-labelledby":t,"aria-busy":n,onCancel:u=>{u.preventDefault(),n||m.current()},onPointerDown:u=>{f.current=u.target===u.currentTarget},onClick:u=>{u.target===u.currentTarget&&f.current&&!n&&m.current(),f.current=!1},children:(0,G.jsxs)("div",{className:"qd-modal-body",children:[(0,G.jsxs)("header",{className:"qd-modal-header",children:[(0,G.jsxs)("div",{children:[c&&(0,G.jsx)("p",{className:"qd-eyebrow",children:c}),(0,G.jsx)("h2",{id:t,tabIndex:-1,children:a})]}),(0,G.jsx)("button",{type:"button",className:"qd-icon-button","aria-label":"Close dialog",onClick:r,disabled:n,children:(0,G.jsx)(Xn,{icon:Va,size:19})})]}),e]})})}function dh({title:a,description:c,children:e}){return(0,G.jsxs)("div",{className:"qd-empty",children:[(0,G.jsx)("div",{className:"qd-empty-orbit","aria-hidden":"true",children:(0,G.jsx)("span",{})}),(0,G.jsx)("h3",{children:a}),(0,G.jsx)("p",{children:c}),e]})}function zh({children:a,tone:c="info"}){return(0,G.jsx)("p",{className:`qd-message qd-message-${c}`,role:c==="error"?"alert":"status",children:a})}function vh(a,c){let e=URL.createObjectURL(new Blob([typeof a=="string"?a:JSON.stringify(a,null,2)],{type:"application/json"})),r=document.createElement("a");r.href=e,r.download=c,r.click(),setTimeout(()=>URL.revokeObjectURL(e),1e3)}var Mh=a=>`${a.slice(0,6)}\u2026${a.slice(-4)}`,hh=a=>a instanceof Error?a.message:"Something went wrong. Please try again.";function gh(a,c=18){let e=BigInt(10)**BigInt(c),r=a/e,l=(a%e).toString().padStart(c,"0").slice(0,6).replace(/0+$/,"");return a>BigInt(0)&&r===BigInt(0)&&!l?"<0.000001":`${r.toLocaleString("en-US")}${l?`.${l}`:""}`}function r9(a){return a instanceof Uint8Array||ArrayBuffer.isView(a)&&a.constructor.name==="Uint8Array"&&"BYTES_PER_ELEMENT"in a&&a.BYTES_PER_ELEMENT===1}var M3=a=>a?`"${a}" `:"";function h3(a,c=""){if(typeof a!="number")throw new TypeError(M3(c)+"expected number, got "+typeof a);if(!Number.isSafeInteger(a)||a<0)throw new RangeError(M3(c)+"expected integer >= 0, got "+a);return a}function xh(a,c=""){if(typeof a!="boolean")throw new TypeError(M3(c)+"expected boolean, got type="+typeof a);return a}function _2(a,c,e=""){if(r9(a)&&(c===void 0||a.length===c))return a;c!==void 0&&h3(c,"length");let r=r9(a),l=c!==void 0?` of length ${c}`:"",n=r?`length=${a.length}`:`type=${typeof a}`,i=M3(e)+"expected Uint8Array"+l+", got "+n;throw r?new RangeError(i):new TypeError(i)}function i9(a){if(typeof a!="function"||typeof a.create!="function")throw new TypeError("expected hash wrapped by utils.createHasher");if(h3(a.outputLen),h3(a.blockLen),a.outputLen<1||a.blockLen<1)throw new Error("hash blockLen / outputLen must be >= 1")}var Yn=(a,c)=>{if(a===null||typeof a!="object"||Array.isArray(a))throw new TypeError((c==="object"?"":`"${c}" `)+"expected object, got type="+typeof a)},l9=(a,c)=>{Yn(a,c);let e=Object.getPrototypeOf(a);if(e!==Object.prototype&&e!==null)throw new TypeError(`"${c}" expected plain object`);if(Object.hasOwn(a,"__proto__"))throw new TypeError(`"${c}.__proto__" is not allowed`)};function I1(a,c=!0){if(a.destroyed)throw new Error("hash was destroyed");if(c&&a.finished)throw new Error("digest() was already called")}function g3(a,c){_2(a,void 0,"output");let e=c.outputLen;if(!(a.length>=e))throw new RangeError('"output" expected length >= '+e)}function bh(a){return new Uint32Array(a.buffer,a.byteOffset,Math.floor(a.byteLength/4))}function q2(...a){for(let c=0;c<a.length;c++)a[c].fill(0)}function L3(a){return new DataView(a.buffer,a.byteOffset,a.byteLength)}function r2(a,c){return a<<32-c|a>>>c}function Ch(a,c){return a<<c|a>>>32-c>>>0}var Kn=new Uint8Array(new Uint32Array([287454020]).buffer)[0]===68;function Jn(a){return a<<24&4278190080|a<<8&16711680|a>>>8&65280|a>>>24&255}function Qn(a){for(let c=0;c<a.length;c++)a[c]=Jn(a[c]);return a}var Sh=Kn?a=>a:Qn,s9=typeof Uint8Array.from([]).toHex=="function"&&typeof Uint8Array.fromHex=="function",Zn=Array.from({length:256},(a,c)=>c.toString(16).padStart(2,"0"));function yh(a){if(_2(a),s9)return a.toHex();let c="";for(let e=0;e<a.length;e++)c+=Zn[a[e]];return c}function n9(a){return a>=48&&a<=57?a-48:a>=65&&a<=70?a-55:a>=97&&a<=102?a-87:void 0}function Nh(a){if(typeof a!="string")throw new TypeError("hex string expected, got "+typeof a);if(s9)try{return Uint8Array.fromHex(a)}catch(l){throw l instanceof SyntaxError?new RangeError(l.message):l}let c=a.length,e=c/2;if(c%2)throw new RangeError("hex string expected, got unpadded hex of length "+c);let r=new Uint8Array(e);for(let l=0,n=0;l<e;l++,n+=2){let i=n9(a.charCodeAt(n)),s=n9(a.charCodeAt(n+1));if(i===void 0||s===void 0){let o=a[n]+a[n+1];throw new RangeError('hex string expected, got non-hex character "'+o+'" at index '+n)}r[l]=i*16+s}return r}function ai(a){if(typeof a!="string")throw new TypeError("string expected");let c=new TextEncoder().encode(a);try{return new Uint8Array(c)}finally{q2(c)}}function wh(a,c=""){return typeof a=="string"?ai(a):_2(a,void 0,c)}function kh(...a){let c=0;for(let r=0;r<a.length;r++){let l=a[r];_2(l),c+=l.length}let e=new Uint8Array(c);for(let r=0,l=0;r<a.length;r++){let n=a[r];e.set(n,l),l+=n.length}return e}function ci(a,c,e="opts"){return l9(a,"defaults"),c!==void 0&&l9(c,e),Object.assign(Object.create(null),a,c)}function K0(a,c={}){if(typeof a!="function")throw new TypeError('"hashCons" expected function, got type='+typeof a);c=ci({},c,"info");let e=(l,n)=>a(n).update(l).digest(),r=a(void 0);return e.outputLen=r.outputLen,e.blockLen=r.blockLen,e.canXOF=r.canXOF,e.create=l=>a(l),Object.assign(e,c),Object.freeze(e)}function Ah(a=32){h3(a,"bytesLength");let c=typeof globalThis=="object"?globalThis.crypto:null;if(typeof c?.getRandomValues!="function")throw new Error("crypto.getRandomValues must be defined");if(a>65536)throw new RangeError(`"bytesLength" expected <= 65536, got ${a}`);return c.getRandomValues(new Uint8Array(a))}var J0=a=>({oid:Uint8Array.from([6,9,96,134,72,1,101,3,4,2,a])});var x3=class{oHash;iHash;blockLen;outputLen;canXOF=!1;finished=!1;destroyed=!1;constructor(c,e){if(i9(c),_2(e,void 0,"key"),this.iHash=c.create(),typeof this.iHash.update!="function")throw new Error("expected Hash instance");this.blockLen=this.iHash.blockLen,this.outputLen=this.iHash.outputLen;let r=this.blockLen,l=new Uint8Array(r);l.set(e.length>r?c.create().update(e).digest():e);for(let n=0;n<l.length;n++)l[n]^=54;this.iHash.update(l),this.oHash=c.create();for(let n=0;n<l.length;n++)l[n]^=106;this.oHash.update(l),q2(l)}update(c){return I1(this),this.iHash.update(c),this}digestInto(c){I1(this),g3(c,this),this.finished=!0;let e=c.subarray(0,this.outputLen);this.iHash.digestInto(e),this.oHash.update(e),this.oHash.digestInto(e),this.destroy()}digest(){let c=new Uint8Array(this.oHash.outputLen);return this.digestInto(c),c}_cloneInto(c){c||=Object.create(Object.getPrototypeOf(this),{});let{oHash:e,iHash:r,finished:l,destroyed:n,blockLen:i,outputLen:s,canXOF:o}=this;return c=c,c.finished=l,c.destroyed=n,c.blockLen=i,c.outputLen=s,c.canXOF=o,c.oHash=e._cloneInto(c.oHash),c.iHash=r._cloneInto(c.iHash),c}clone(){return this._cloneInto()}destroy(){this.destroyed=!0,this.oHash.destroy(),this.iHash.destroy()}},Ph=(()=>{let a=((c,e,r)=>new x3(c,e).update(r).digest());return a.create=(c,e)=>new x3(c,e),a})();var b3=BigInt(4294967295),o9=BigInt(32);function ei(a,c=!1){return c?{h:Number(a&b3),l:Number(a>>o9&b3)}:{h:Number(a>>o9&b3)|0,l:Number(a&b3)|0}}function t9(a,c=!1){let e=a.length,r=new Uint32Array(e),l=new Uint32Array(e);for(let n=0;n<e;n++){let{h:i,l:s}=ei(a[n],c);[r[n],l[n]]=[i,s]}return[r,l]}var ri=a=>a/2**32|0,li=a=>a>>>0;function f9(a,c,e,r){let l=ri(e),n=li(e);a.setUint32(c,r?n:l,r),a.setUint32(c+4,r?l:n,r)}var Q0=(a,c,e)=>a>>>e,Z0=(a,c,e)=>a<<32-e|c>>>e,l1=(a,c,e)=>a>>>e|c<<32-e,n1=(a,c,e)=>a<<32-e|c>>>e,s4=(a,c,e)=>a<<64-e|c>>>e-32,o4=(a,c,e)=>a>>>e-32|c<<64-e;function u2(a,c,e,r){let l=(c>>>0)+(r>>>0);return{h:a+e+(l/2**32|0)|0,l:l|0}}var m9=(a,c,e)=>(a>>>0)+(c>>>0)+(e>>>0),u9=(a,c,e,r)=>c+e+r+(a/2**32|0)|0,p9=(a,c,e,r)=>(a>>>0)+(c>>>0)+(e>>>0)+(r>>>0),d9=(a,c,e,r,l)=>c+e+r+l+(a/2**32|0)|0,z9=(a,c,e,r,l)=>(a>>>0)+(c>>>0)+(e>>>0)+(r>>>0)+(l>>>0),v9=(a,c,e,r,l,n)=>c+e+r+l+n+(a/2**32|0)|0;function M9(a,c,e){return a&c^~a&e}function h9(a,c,e){return a&c^a&e^c&e}var t4=class{blockLen;outputLen;canXOF=!1;padOffset;isLE;buffer;view;finished=!1;length=0;pos=0;destroyed=!1;constructor(c,e,r,l){this.blockLen=c,this.outputLen=e,this.padOffset=r,this.isLE=l,this.buffer=new Uint8Array(c),this.view=L3(this.buffer)}update(c){I1(this),_2(c);let{view:e,buffer:r,blockLen:l}=this,n=c.length,i=!1;for(let s=0;s<n;){let o=Math.min(l-this.pos,n-s);if(o===l){let t=L3(c);for(;l<=n-s;s+=l)this.process(t,s);i=!0;continue}r.set(s===0&&o===n?c:c.subarray(s,s+o),this.pos),this.pos+=o,s+=o,this.pos===l&&(this.process(e,0),this.pos=0,i=!0)}return this.length+=c.length,i&&this.roundClean(),this}digestInto(c){I1(this),g3(c,this),this.finished=!0;let{buffer:e,view:r,blockLen:l,isLE:n}=this,{pos:i}=this;e[i++]=128,e.fill(0,i),this.padOffset>l-i&&(this.process(r,0),e.fill(0)),f9(r,l-8,this.length*8,n),this.process(r,0),this.roundClean();let s=c===e?r:L3(c),o=this.outputLen,t=o/4,f=this.get();if(o%4||t>f.length)throw new Error("invalid outputLen");for(let m=0;m<t;m++)s.setUint32(4*m,f[m],n)}digest(){let{buffer:c,outputLen:e}=this;this.digestInto(c);let r=c.slice(0,e);return this.destroy(),r}_cloneIntoMeta(c){let{buffer:e,length:r,finished:l,destroyed:n,pos:i}=this;return c.destroyed=n,c.finished=l,c.length=r,c.pos=i,i&&c.buffer.set(e),c}clone(){return this._cloneInto()}},g9=Uint32Array.from([1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225]);var L9=Uint32Array.from([1779033703,4089235720,3144134277,2227873595,1013904242,4271175723,2773480762,1595750129,1359893119,2917565137,2600822924,725511199,528734635,4215389547,1541459225,327033209]);var ii=Uint32Array.from([1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298]),W2=new Uint32Array(64),a6=class extends t4{A=0;B=0;C=0;D=0;E=0;F=0;G=0;H=0;constructor(c,e){super(64,c,8,!1),this.A=e[0]|0,this.B=e[1]|0,this.C=e[2]|0,this.D=e[3]|0,this.E=e[4]|0,this.F=e[5]|0,this.G=e[6]|0,this.H=e[7]|0}get(){let{A:c,B:e,C:r,D:l,E:n,F:i,G:s,H:o}=this;return[c,e,r,l,n,i,s,o]}set(c,e,r,l,n,i,s,o){this.A=c|0,this.B=e|0,this.C=r|0,this.D=l|0,this.E=n|0,this.F=i|0,this.G=s|0,this.H=o|0}_cloneInto(c){return(c||=new this.constructor).set(...this.get()),this._cloneIntoMeta(c)}process(c,e){for(let m=0;m<16;m++,e+=4)W2[m]=c.getUint32(e,!1);for(let m=16;m<64;m++){let u=W2[m-15],p=W2[m-2],d=r2(u,7)^r2(u,18)^u>>>3,h=r2(p,17)^r2(p,19)^p>>>10;W2[m]=h+W2[m-7]+d+W2[m-16]|0}let{A:r,B:l,C:n,D:i,E:s,F:o,G:t,H:f}=this;for(let m=0;m<64;m++){let u=r2(s,6)^r2(s,11)^r2(s,25),p=f+u+M9(s,o,t)+ii[m]+W2[m]|0,h=(r2(r,2)^r2(r,13)^r2(r,22))+h9(r,l,n)|0;f=t,t=o,o=s,s=i+p|0,i=n,n=l,l=r,r=p+h|0}r=r+this.A|0,l=l+this.B|0,n=n+this.C|0,i=i+this.D|0,s=s+this.E|0,o=o+this.F|0,t=t+this.G|0,f=f+this.H|0,this.set(r,l,n,i,s,o,t,f)}roundClean(){q2(W2)}destroy(){this.destroyed=!0,this.set(0,0,0,0,0,0,0,0),q2(this.buffer)}},c6=class extends a6{constructor(){super(32,g9)}};var x9=t9(["0x428a2f98d728ae22","0x7137449123ef65cd","0xb5c0fbcfec4d3b2f","0xe9b5dba58189dbbc","0x3956c25bf348b538","0x59f111f1b605d019","0x923f82a4af194f9b","0xab1c5ed5da6d8118","0xd807aa98a3030242","0x12835b0145706fbe","0x243185be4ee4b28c","0x550c7dc3d5ffb4e2","0x72be5d74f27b896f","0x80deb1fe3b1696b1","0x9bdc06a725c71235","0xc19bf174cf692694","0xe49b69c19ef14ad2","0xefbe4786384f25e3","0x0fc19dc68b8cd5b5","0x240ca1cc77ac9c65","0x2de92c6f592b0275","0x4a7484aa6ea6e483","0x5cb0a9dcbd41fbd4","0x76f988da831153b5","0x983e5152ee66dfab","0xa831c66d2db43210","0xb00327c898fb213f","0xbf597fc7beef0ee4","0xc6e00bf33da88fc2","0xd5a79147930aa725","0x06ca6351e003826f","0x142929670a0e6e70","0x27b70a8546d22ffc","0x2e1b21385c26c926","0x4d2c6dfc5ac42aed","0x53380d139d95b3df","0x650a73548baf63de","0x766a0abb3c77b2a8","0x81c2c92e47edaee6","0x92722c851482353b","0xa2bfe8a14cf10364","0xa81a664bbc423001","0xc24b8b70d0f89791","0xc76c51a30654be30","0xd192e819d6ef5218","0xd69906245565a910","0xf40e35855771202a","0x106aa07032bbd1b8","0x19a4c116b8d2d0c8","0x1e376c085141ab53","0x2748774cdf8eeb99","0x34b0bcb5e19b48a8","0x391c0cb3c5c95a63","0x4ed8aa4ae3418acb","0x5b9cca4f7763e373","0x682e6ff3d6b2b8a3","0x748f82ee5defb2fc","0x78a5636f43172f60","0x84c87814a1f0ab72","0x8cc702081a6439ec","0x90befffa23631e28","0xa4506cebde82bde9","0xbef9a3f7b2c67915","0xc67178f2e372532b","0xca273eceea26619c","0xd186b8c721c0c207","0xeada7dd6cde0eb1e","0xf57d4f7fee6ed178","0x06f067aa72176fba","0x0a637dc5a2c898a6","0x113f9804bef90dae","0x1b710b35131c471b","0x28db77f523047d84","0x32caab7b40c72493","0x3c9ebe0a15c9bebc","0x431d67c49c100d4c","0x4cc5d4becb3e42b6","0x597f299cfc657e2a","0x5fcb6fab3ad6faec","0x6c44198c4a475817"].map(a=>BigInt(a))),si=x9[0],oi=x9[1],j2=new Uint32Array(80),G2=new Uint32Array(80),e6=class extends t4{Ah=0;Al=0;Bh=0;Bl=0;Ch=0;Cl=0;Dh=0;Dl=0;Eh=0;El=0;Fh=0;Fl=0;Gh=0;Gl=0;Hh=0;Hl=0;constructor(c,e){super(128,c,16,!1),this.Ah=e[0]|0,this.Al=e[1]|0,this.Bh=e[2]|0,this.Bl=e[3]|0,this.Ch=e[4]|0,this.Cl=e[5]|0,this.Dh=e[6]|0,this.Dl=e[7]|0,this.Eh=e[8]|0,this.El=e[9]|0,this.Fh=e[10]|0,this.Fl=e[11]|0,this.Gh=e[12]|0,this.Gl=e[13]|0,this.Hh=e[14]|0,this.Hl=e[15]|0}get(){let{Ah:c,Al:e,Bh:r,Bl:l,Ch:n,Cl:i,Dh:s,Dl:o,Eh:t,El:f,Fh:m,Fl:u,Gh:p,Gl:d,Hh:h,Hl:z}=this;return[c,e,r,l,n,i,s,o,t,f,m,u,p,d,h,z]}set(c,e,r,l,n,i,s,o,t,f,m,u,p,d,h,z){this.Ah=c|0,this.Al=e|0,this.Bh=r|0,this.Bl=l|0,this.Ch=n|0,this.Cl=i|0,this.Dh=s|0,this.Dl=o|0,this.Eh=t|0,this.El=f|0,this.Fh=m|0,this.Fl=u|0,this.Gh=p|0,this.Gl=d|0,this.Hh=h|0,this.Hl=z|0}_cloneInto(c){return(c||=new this.constructor).set(...this.get()),this._cloneIntoMeta(c)}process(c,e){for(let M=0;M<16;M++,e+=4)j2[M]=c.getUint32(e),G2[M]=c.getUint32(e+=4);for(let M=16;M<80;M++){let x=j2[M-15]|0,k=G2[M-15]|0,E=l1(x,k,1)^l1(x,k,8)^Q0(x,k,7),P=n1(x,k,1)^n1(x,k,8)^Z0(x,k,7),A=j2[M-2]|0,w=G2[M-2]|0,R=l1(A,w,19)^s4(A,w,61)^Q0(A,w,6),O=n1(A,w,19)^o4(A,w,61)^Z0(A,w,6),$=p9(P,O,G2[M-7],G2[M-16]),V=d9($,E,R,j2[M-7],j2[M-16]);j2[M]=V|0,G2[M]=$|0}let{Ah:r,Al:l,Bh:n,Bl:i,Ch:s,Cl:o,Dh:t,Dl:f,Eh:m,El:u,Fh:p,Fl:d,Gh:h,Gl:z,Hh:g,Hl:L}=this;for(let M=0;M<80;M++){let x=l1(m,u,14)^l1(m,u,18)^s4(m,u,41),k=n1(m,u,14)^n1(m,u,18)^o4(m,u,41),E=m&p^~m&h,P=u&d^~u&z,A=z9(L,k,P,oi[M],G2[M]),w=v9(A,g,x,E,si[M],j2[M]),R=A|0,O=l1(r,l,28)^s4(r,l,34)^s4(r,l,39),$=n1(r,l,28)^o4(r,l,34)^o4(r,l,39),V=r&n^r&s^n&s,Z=l&i^l&o^i&o;g=h|0,L=z|0,h=p|0,z=d|0,p=m|0,d=u|0,{h:m,l:u}=u2(t|0,f|0,w|0,R|0),t=s|0,f=o|0,s=n|0,o=i|0,n=r|0,i=l|0;let _=m9(R,$,Z);r=u9(_,w,O,V),l=_|0}({h:r,l}=u2(this.Ah|0,this.Al|0,r|0,l|0)),{h:n,l:i}=u2(this.Bh|0,this.Bl|0,n|0,i|0),{h:s,l:o}=u2(this.Ch|0,this.Cl|0,s|0,o|0),{h:t,l:f}=u2(this.Dh|0,this.Dl|0,t|0,f|0),{h:m,l:u}=u2(this.Eh|0,this.El|0,m|0,u|0),{h:p,l:d}=u2(this.Fh|0,this.Fl|0,p|0,d|0),{h,l:z}=u2(this.Gh|0,this.Gl|0,h|0,z|0),{h:g,l:L}=u2(this.Hh|0,this.Hl|0,g|0,L|0),this.set(r,l,n,i,s,o,t,f,m,u,p,d,h,z,g,L)}roundClean(){q2(j2,G2)}destroy(){this.destroyed=!0,q2(this.buffer),this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)}},r6=class extends e6{constructor(){super(64,L9)}};var _h=K0(()=>new c6,J0(1));var qh=K0(()=>new r6,J0(3));export{Z3 as a,a1 as b,Z4 as c,ga as d,Ln as e,u3 as f,xn as g,bn as h,yn as i,NM as j,wM as k,kM as l,AM as m,TM as n,EM as o,PM as p,FM as q,BM as r,RM as s,HM as t,DM as u,IM as v,UM as w,OM as x,_M as y,Va as z,qM as A,WM as B,jM as C,GM as D,$M as E,VM as F,XM as G,YM as H,KM as I,JM as J,QM as K,ZM as L,ah as M,ch as N,eh as O,rh as P,r9 as Q,h3 as R,xh as S,_2 as T,i9 as U,I1 as V,g3 as W,bh as X,q2 as Y,L3 as Z,Ch as _,Sh as $,yh as aa,Nh as ba,wh as ca,kh as da,ci as ea,K0 as fa,Ah as ga,Ph as ha,t9 as ia,t4 as ja,_h as ka,qh as la,v3 as ma,Xn as na,ph as oa,dh as pa,zh as qa,vh as ra,Mh as sa,hh as ta,gh as ua};
/*! For license information please see chunk-6WP6SVXA.js.LEGAL.txt */
