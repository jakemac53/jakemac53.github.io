// Compiles a dart2wasm-generated main module from `source` which can then
// instantiatable via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm modules from `bytes` which is then
// instantiatable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export async function instantiate(modulePromise, importObjectPromise) {
  var moduleOrCompiledApp = await modulePromise;
  if (!(moduleOrCompiledApp instanceof CompiledApp)) {
    moduleOrCompiledApp = new CompiledApp(moduleOrCompiledApp);
  }
  const instantiatedApp = await moduleOrCompiledApp.instantiate(await importObjectPromise);
  return instantiatedApp.instantiatedModule;
}

// DEPRECATED: Please use `compile` or `compileStreaming` to get a compiled app,
// use `instantiate` method to get an instantiated app and then call
// `invokeMain` to invoke the main function.
export const invoke = (moduleInstance, ...args) => {
  moduleInstance.exports.$invokeMain(args);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arugments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `load-ids` option is passed. Each load ID maps to one
  //   or more wasm files as specified in the emitted JSON file. It also takes a
  //   callback that should be invoked for each loaded module with 2 arugments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDynamicModule` is a JS function that takes two string names matching,
  //   in order, a wasm file produced by the dart2wasm compiler during dynamic
  //   module compilation and a corresponding js file produced by the same
  //   compilation. It also takes a callback that should be invoked with the
  //   loaded module in a format supported by `WebAssembly.compile` or
  //   `WebAssembly.compileStreaming` and the result of using the JS 'import'
  //   API on the js file path. It should return a Promise that resolves when
  //   all the modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports,
      {loadDeferredModules, loadDynamicModule, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            _1: (decoder, codeUnits) => decoder.decode(codeUnits),
      _2: () => new TextDecoder("utf-8", {fatal: true}),
      _3: () => new TextDecoder("utf-8", {fatal: false}),
      _4: (s) => +s,
      _5: x0 => new Uint8Array(x0),
      _6: (x0,x1,x2) => x0.set(x1,x2),
      _7: (x0,x1) => x0.transferFromImageBitmap(x1),
      _9: (x0,x1,x2) => x0.slice(x1,x2),
      _10: (x0,x1) => x0.decode(x1),
      _11: (x0,x1) => x0.segment(x1),
      _12: () => new TextDecoder(),
      _14: x0 => x0.buffer,
      _15: x0 => x0.wasmMemory,
      _16: () => globalThis.window._flutter_skwasmInstance,
      _17: x0 => x0.rasterStartMilliseconds,
      _18: x0 => x0.rasterEndMilliseconds,
      _19: x0 => x0.imageBitmaps,
      _135: (x0,x1) => x0.appendChild(x1),
      _166: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _167: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _168: (x0,x1) => new OffscreenCanvas(x0,x1),
      _169: x0 => x0.remove(),
      _170: (x0,x1) => x0.append(x1),
      _172: x0 => x0.unlock(),
      _173: x0 => x0.getReader(),
      _174: (x0,x1) => x0.item(x1),
      _175: x0 => x0.next(),
      _176: x0 => x0.now(),
      _177: (x0,x1) => x0.revokeObjectURL(x1),
      _178: x0 => x0.close(),
      _179: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      _180: x0 => new window.ImageDecoder(x0),
      _181: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      _182: (x0,x1) => x0.decode(x1),
      _183: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._183(f,arguments.length,x0) }),
      _184: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _186: (x0,x1) => x0.getModifierState(x1),
      _187: x0 => x0.preventDefault(),
      _188: x0 => x0.stopPropagation(),
      _189: (x0,x1) => x0.removeProperty(x1),
      _190: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._190(f,arguments.length,x0) }),
      _191: x0 => new window.FinalizationRegistry(x0),
      _192: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _194: (x0,x1) => x0.unregister(x1),
      _195: (x0,x1) => x0.prepend(x1),
      _196: x0 => new Intl.Locale(x0),
      _197: (x0,x1) => x0.observe(x1),
      _198: x0 => x0.disconnect(),
      _199: (x0,x1) => x0.getAttribute(x1),
      _200: (x0,x1) => x0.contains(x1),
      _201: (x0,x1) => x0.querySelector(x1),
      _202: (x0,x1) => x0.matchMedia(x1),
      _203: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._203(f,arguments.length,x0) }),
      _204: (x0,x1,x2) => x0.call(x1,x2),
      _205: x0 => x0.blur(),
      _206: x0 => x0.hasFocus(),
      _207: (x0,x1) => x0.removeAttribute(x1),
      _208: (x0,x1,x2) => x0.insertBefore(x1,x2),
      _209: (x0,x1) => x0.hasAttribute(x1),
      _210: (x0,x1) => x0.getModifierState(x1),
      _211: (x0,x1) => x0.createTextNode(x1),
      _212: x0 => x0.getBoundingClientRect(),
      _213: (x0,x1) => x0.replaceWith(x1),
      _214: (x0,x1) => x0.contains(x1),
      _215: (x0,x1) => x0.closest(x1),
      _216: () => new Array(),
      _653: x0 => new Uint8Array(x0),
      _656: () => globalThis.window.flutterConfiguration,
      _658: x0 => x0.assetBase,
      _663: x0 => x0.canvasKitMaximumSurfaces,
      _664: x0 => x0.debugShowSemanticsNodes,
      _665: x0 => x0.hostElement,
      _666: x0 => x0.multiViewEnabled,
      _667: x0 => x0.nonce,
      _669: x0 => x0.fontFallbackBaseUrl,
      _679: x0 => x0.console,
      _680: x0 => x0.devicePixelRatio,
      _681: x0 => x0.document,
      _682: x0 => x0.history,
      _683: x0 => x0.innerHeight,
      _684: x0 => x0.innerWidth,
      _685: x0 => x0.location,
      _686: x0 => x0.navigator,
      _687: x0 => x0.visualViewport,
      _688: x0 => x0.performance,
      _689: x0 => x0.parent,
      _691: x0 => x0.URL,
      _693: (x0,x1) => x0.getComputedStyle(x1),
      _694: x0 => x0.screen,
      _695: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._695(f,arguments.length,x0) }),
      _696: (x0,x1) => x0.requestAnimationFrame(x1),
      _700: (x0,x1) => x0.warn(x1),
      _702: (x0,x1) => x0.debug(x1),
      _703: x0 => globalThis.parseFloat(x0),
      _704: () => globalThis.window,
      _705: () => globalThis.Intl,
      _706: () => globalThis.Symbol,
      _707: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      _709: x0 => x0.clipboard,
      _710: x0 => x0.maxTouchPoints,
      _711: x0 => x0.vendor,
      _712: x0 => x0.language,
      _713: x0 => x0.platform,
      _714: x0 => x0.userAgent,
      _715: (x0,x1) => x0.vibrate(x1),
      _716: x0 => x0.languages,
      _717: x0 => x0.documentElement,
      _718: (x0,x1) => x0.querySelector(x1),
      _719: (x0,x1) => x0.querySelectorAll(x1),
      _721: (x0,x1) => x0.createElement(x1),
      _724: (x0,x1) => x0.createEvent(x1),
      _725: x0 => x0.activeElement,
      _728: x0 => x0.head,
      _729: x0 => x0.body,
      _731: (x0,x1) => { x0.title = x1 },
      _734: x0 => x0.visibilityState,
      _735: () => globalThis.document,
      _736: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._736(f,arguments.length,x0) }),
      _737: (x0,x1) => x0.dispatchEvent(x1),
      _745: x0 => x0.target,
      _747: x0 => x0.timeStamp,
      _748: x0 => x0.type,
      _750: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _757: x0 => x0.firstChild,
      _761: x0 => x0.parentElement,
      _763: (x0,x1) => { x0.textContent = x1 },
      _764: x0 => x0.parentNode,
      _765: x0 => x0.nextSibling,
      _766: (x0,x1) => x0.removeChild(x1),
      _767: x0 => x0.isConnected,
      _775: x0 => x0.clientHeight,
      _776: x0 => x0.clientWidth,
      _777: x0 => x0.offsetHeight,
      _778: x0 => x0.offsetWidth,
      _779: x0 => x0.id,
      _780: (x0,x1) => { x0.id = x1 },
      _783: (x0,x1) => { x0.spellcheck = x1 },
      _784: x0 => x0.tagName,
      _785: x0 => x0.style,
      _787: (x0,x1) => x0.querySelectorAll(x1),
      _788: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _789: x0 => x0.tabIndex,
      _790: (x0,x1) => { x0.tabIndex = x1 },
      _791: (x0,x1) => x0.focus(x1),
      _792: x0 => x0.scrollTop,
      _793: (x0,x1) => { x0.scrollTop = x1 },
      _794: (x0,x1) => { x0.scrollLeft = x1 },
      _795: x0 => x0.scrollLeft,
      _796: x0 => x0.classList,
      _797: (x0,x1) => x0.scrollIntoView(x1),
      _800: (x0,x1) => { x0.className = x1 },
      _802: (x0,x1) => x0.getElementsByClassName(x1),
      _803: x0 => x0.click(),
      _804: (x0,x1) => x0.attachShadow(x1),
      _807: x0 => x0.computedStyleMap(),
      _808: (x0,x1) => x0.get(x1),
      _814: (x0,x1) => x0.getPropertyValue(x1),
      _815: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _816: x0 => x0.offsetLeft,
      _817: x0 => x0.offsetTop,
      _818: x0 => x0.offsetParent,
      _820: (x0,x1) => { x0.name = x1 },
      _821: x0 => x0.content,
      _822: (x0,x1) => { x0.content = x1 },
      _826: (x0,x1) => { x0.src = x1 },
      _827: x0 => x0.naturalWidth,
      _828: x0 => x0.naturalHeight,
      _832: (x0,x1) => { x0.crossOrigin = x1 },
      _834: (x0,x1) => { x0.decoding = x1 },
      _835: x0 => x0.decode(),
      _840: (x0,x1) => { x0.nonce = x1 },
      _845: (x0,x1) => { x0.width = x1 },
      _847: (x0,x1) => { x0.height = x1 },
      _850: (x0,x1) => x0.getContext(x1),
      _918: x0 => x0.width,
      _919: x0 => x0.height,
      _921: (x0,x1) => x0.fetch(x1),
      _922: x0 => x0.status,
      _924: x0 => x0.body,
      _925: x0 => x0.arrayBuffer(),
      _928: x0 => x0.read(),
      _929: x0 => x0.value,
      _930: x0 => x0.done,
      _937: x0 => x0.name,
      _938: x0 => x0.x,
      _939: x0 => x0.y,
      _942: x0 => x0.top,
      _943: x0 => x0.right,
      _944: x0 => x0.bottom,
      _945: x0 => x0.left,
      _955: x0 => x0.height,
      _956: x0 => x0.width,
      _957: x0 => x0.scale,
      _958: (x0,x1) => { x0.value = x1 },
      _961: (x0,x1) => { x0.placeholder = x1 },
      _963: (x0,x1) => { x0.name = x1 },
      _964: x0 => x0.selectionDirection,
      _965: x0 => x0.selectionStart,
      _966: x0 => x0.selectionEnd,
      _969: x0 => x0.value,
      _971: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _972: x0 => x0.readText(),
      _973: (x0,x1) => x0.writeText(x1),
      _975: x0 => x0.altKey,
      _976: x0 => x0.code,
      _977: x0 => x0.ctrlKey,
      _978: x0 => x0.key,
      _979: x0 => x0.keyCode,
      _980: x0 => x0.location,
      _981: x0 => x0.metaKey,
      _982: x0 => x0.repeat,
      _983: x0 => x0.shiftKey,
      _984: x0 => x0.isComposing,
      _986: x0 => x0.state,
      _987: (x0,x1) => x0.go(x1),
      _989: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _990: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _991: x0 => x0.pathname,
      _992: x0 => x0.search,
      _993: x0 => x0.hash,
      _997: x0 => x0.state,
      _1000: (x0,x1) => x0.createObjectURL(x1),
      _1002: x0 => new Blob(x0),
      _1012: x0 => x0.matches,
      _1016: x0 => x0.matches,
      _1020: x0 => x0.relatedTarget,
      _1022: x0 => x0.clientX,
      _1023: x0 => x0.clientY,
      _1024: x0 => x0.offsetX,
      _1025: x0 => x0.offsetY,
      _1028: x0 => x0.button,
      _1029: x0 => x0.buttons,
      _1030: x0 => x0.ctrlKey,
      _1034: x0 => x0.pointerId,
      _1035: x0 => x0.pointerType,
      _1036: x0 => x0.pressure,
      _1037: x0 => x0.tiltX,
      _1038: x0 => x0.tiltY,
      _1039: x0 => x0.getCoalescedEvents(),
      _1042: x0 => x0.deltaX,
      _1043: x0 => x0.deltaY,
      _1044: x0 => x0.wheelDeltaX,
      _1045: x0 => x0.wheelDeltaY,
      _1046: x0 => x0.deltaMode,
      _1053: x0 => x0.changedTouches,
      _1056: x0 => x0.clientX,
      _1057: x0 => x0.clientY,
      _1060: x0 => x0.data,
      _1063: (x0,x1) => { x0.disabled = x1 },
      _1065: (x0,x1) => { x0.type = x1 },
      _1066: (x0,x1) => { x0.max = x1 },
      _1067: (x0,x1) => { x0.min = x1 },
      _1068: x0 => x0.value,
      _1069: (x0,x1) => { x0.value = x1 },
      _1070: x0 => x0.disabled,
      _1071: (x0,x1) => { x0.disabled = x1 },
      _1073: (x0,x1) => { x0.placeholder = x1 },
      _1075: (x0,x1) => { x0.name = x1 },
      _1076: (x0,x1) => { x0.autocomplete = x1 },
      _1078: x0 => x0.selectionDirection,
      _1079: x0 => x0.selectionStart,
      _1081: x0 => x0.selectionEnd,
      _1084: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1085: (x0,x1) => x0.add(x1),
      _1087: (x0,x1) => { x0.noValidate = x1 },
      _1088: (x0,x1) => { x0.method = x1 },
      _1089: (x0,x1) => { x0.action = x1 },
      _1114: x0 => x0.orientation,
      _1115: x0 => x0.width,
      _1116: x0 => x0.height,
      _1117: (x0,x1) => x0.lock(x1),
      _1136: x0 => new ResizeObserver(x0),
      _1139: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1139(f,arguments.length,x0,x1) }),
      _1147: x0 => x0.length,
      _1148: x0 => x0.iterator,
      _1149: x0 => x0.Segmenter,
      _1150: x0 => x0.v8BreakIterator,
      _1151: (x0,x1) => new Intl.Segmenter(x0,x1),
      _1154: x0 => x0.language,
      _1155: x0 => x0.script,
      _1156: x0 => x0.region,
      _1174: x0 => x0.done,
      _1175: x0 => x0.value,
      _1176: x0 => x0.index,
      _1180: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      _1181: (x0,x1) => x0.adoptText(x1),
      _1182: x0 => x0.first(),
      _1183: x0 => x0.next(),
      _1184: x0 => x0.current(),
      _1186: () => globalThis.window.FinalizationRegistry,
      _1197: x0 => x0.hostElement,
      _1198: x0 => x0.viewConstraints,
      _1201: x0 => x0.maxHeight,
      _1202: x0 => x0.maxWidth,
      _1203: x0 => x0.minHeight,
      _1204: x0 => x0.minWidth,
      _1205: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1205(f,arguments.length,x0) }),
      _1206: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1206(f,arguments.length,x0) }),
      _1207: (x0,x1) => ({addView: x0,removeView: x1}),
      _1210: x0 => x0.loader,
      _1211: () => globalThis._flutter,
      _1212: (x0,x1) => x0.didCreateEngineInitializer(x1),
      _1213: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1213(f,arguments.length,x0) }),
      _1214: (module,f) => finalizeWrapper(f, function() { return module.exports._1214(f,arguments.length) }),
      _1215: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      _1218: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1218(f,arguments.length,x0) }),
      _1219: x0 => ({runApp: x0}),
      _1221: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1221(f,arguments.length,x0,x1) }),
      _1222: x0 => new Promise(x0),
      _1223: x0 => x0.length,
      _1224: () => globalThis.window.ImageDecoder,
      _1225: x0 => x0.tracks,
      _1227: x0 => x0.completed,
      _1229: x0 => x0.image,
      _1235: x0 => x0.displayWidth,
      _1236: x0 => x0.displayHeight,
      _1237: x0 => x0.duration,
      _1240: x0 => x0.ready,
      _1241: x0 => x0.selectedTrack,
      _1242: x0 => x0.repetitionCount,
      _1243: x0 => x0.frameCount,
      _1292: x0 => globalThis.URL.revokeObjectURL(x0),
      _1293: x0 => x0.remove(),
      _1294: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      _1295: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      _1296: x0 => globalThis.URL.createObjectURL(x0),
      _1297: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1297(f,arguments.length,x0) }),
      _1298: (x0,x1,x2,x3) => x0.toBlob(x1,x2,x3),
      _1299: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1299(f,arguments.length,x0) }),
      _1300: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1300(f,arguments.length,x0) }),
      _1301: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1301(f,arguments.length,x0) }),
      _1302: (x0,x1) => x0.querySelector(x1),
      _1303: (x0,x1) => x0.createElement(x1),
      _1304: (x0,x1) => x0.append(x1),
      _1305: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1306: (x0,x1) => x0.replaceChildren(x1),
      _1307: x0 => x0.click(),
      _1308: x0 => ({audio: x0}),
      _1309: (x0,x1) => x0.getUserMedia(x1),
      _1310: x0 => x0.getAudioTracks(),
      _1311: x0 => x0.stop(),
      _1312: (x0,x1) => x0.removeTrack(x1),
      _1313: x0 => x0.close(),
      _1314: (x0,x1) => x0.warn(x1),
      _1315: x0 => x0.getSettings(),
      _1316: x0 => ({sampleRate: x0}),
      _1317: x0 => new AudioContext(x0),
      _1318: () => new AudioContext(),
      _1321: (x0,x1) => x0.connect(x1),
      _1322: (x0,x1) => x0.createMediaStreamSource(x1),
      _1323: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1323(f,arguments.length,x0) }),
      _1324: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1324(f,arguments.length,x0) }),
      _1325: (x0,x1) => x0.addModule(x1),
      _1326: x0 => ({parameterData: x0}),
      _1327: (x0,x1,x2) => new AudioWorkletNode(x0,x1,x2),
      _1328: x0 => ({name: x0}),
      _1329: (x0,x1) => x0.query(x1),
      _1335: x0 => x0.disconnect(),
      _1336: x0 => x0.stop(),
      _1337: (x0,x1,x2) => ({mimeType: x0,audioBitsPerSecond: x1,bitsPerSecond: x2}),
      _1338: (x0,x1) => new MediaRecorder(x0,x1),
      _1339: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1339(f,arguments.length,x0) }),
      _1340: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1340(f,arguments.length,x0) }),
      _1341: (x0,x1) => x0.start(x1),
      _1342: x0 => ({type: x0}),
      _1343: (x0,x1) => new Blob(x0,x1),
      _1344: (x0,x1) => globalThis.jsFixWebmDuration(x0,x1),
      _1345: x0 => x0.createAnalyser(),
      _1346: (x0,x1) => x0.getFloatFrequencyData(x1),
      _1347: x0 => globalThis.MediaRecorder.isTypeSupported(x0),
      _1354: x0 => x0.toArray(),
      _1355: x0 => x0.toUint8Array(),
      _1356: x0 => ({serverTimestamps: x0}),
      _1357: x0 => ({source: x0}),
      _1358: x0 => ({merge: x0}),
      _1360: x0 => new firebase_firestore.FieldPath(x0),
      _1361: (x0,x1) => new firebase_firestore.FieldPath(x0,x1),
      _1362: (x0,x1,x2) => new firebase_firestore.FieldPath(x0,x1,x2),
      _1363: (x0,x1,x2,x3) => new firebase_firestore.FieldPath(x0,x1,x2,x3),
      _1364: (x0,x1,x2,x3,x4) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4),
      _1365: (x0,x1,x2,x3,x4,x5) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5),
      _1366: (x0,x1,x2,x3,x4,x5,x6) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6),
      _1367: (x0,x1,x2,x3,x4,x5,x6,x7) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7),
      _1368: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8),
      _1369: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9),
      _1370: () => globalThis.firebase_firestore.documentId(),
      _1371: (x0,x1) => new firebase_firestore.GeoPoint(x0,x1),
      _1372: x0 => globalThis.firebase_firestore.vector(x0),
      _1373: x0 => globalThis.firebase_firestore.Bytes.fromUint8Array(x0),
      _1374: x0 => globalThis.firebase_firestore.writeBatch(x0),
      _1375: (x0,x1) => globalThis.firebase_firestore.collection(x0,x1),
      _1377: (x0,x1) => globalThis.firebase_firestore.doc(x0,x1),
      _1380: x0 => x0.call(),
      _1404: x0 => x0.commit(),
      _1405: (x0,x1) => x0.delete(x1),
      _1409: x0 => globalThis.firebase_firestore.deleteDoc(x0),
      _1410: x0 => globalThis.firebase_firestore.getDoc(x0),
      _1411: x0 => globalThis.firebase_firestore.getDocFromServer(x0),
      _1412: x0 => globalThis.firebase_firestore.getDocFromCache(x0),
      _1413: (x0,x1) => ({includeMetadataChanges: x0,source: x1}),
      _1414: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1414(f,arguments.length,x0) }),
      _1415: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1415(f,arguments.length,x0) }),
      _1416: (x0,x1,x2,x3) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2,x3),
      _1417: (x0,x1,x2) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2),
      _1418: (x0,x1,x2) => globalThis.firebase_firestore.setDoc(x0,x1,x2),
      _1419: (x0,x1) => globalThis.firebase_firestore.setDoc(x0,x1),
      _1420: (x0,x1) => globalThis.firebase_firestore.query(x0,x1),
      _1421: x0 => globalThis.firebase_firestore.getDocs(x0),
      _1422: x0 => globalThis.firebase_firestore.getDocsFromServer(x0),
      _1423: x0 => globalThis.firebase_firestore.getDocsFromCache(x0),
      _1424: x0 => globalThis.firebase_firestore.limit(x0),
      _1425: x0 => globalThis.firebase_firestore.limitToLast(x0),
      _1426: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1426(f,arguments.length,x0) }),
      _1427: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1427(f,arguments.length,x0) }),
      _1428: (x0,x1) => globalThis.firebase_firestore.orderBy(x0,x1),
      _1430: (x0,x1,x2) => globalThis.firebase_firestore.where(x0,x1,x2),
      _1435: (x0,x1) => x0.data(x1),
      _1439: x0 => x0.docChanges(),
      _1456: (x0,x1) => globalThis.firebase_firestore.getFirestore(x0,x1),
      _1458: x0 => globalThis.firebase_firestore.Timestamp.fromMillis(x0),
      _1459: (module,f) => finalizeWrapper(f, function() { return module.exports._1459(f,arguments.length) }),
      _1476: () => globalThis.firebase_firestore.updateDoc,
      _1477: () => globalThis.firebase_firestore.or,
      _1478: () => globalThis.firebase_firestore.and,
      _1483: x0 => x0.path,
      _1486: () => globalThis.firebase_firestore.GeoPoint,
      _1487: x0 => x0.latitude,
      _1488: x0 => x0.longitude,
      _1490: () => globalThis.firebase_firestore.VectorValue,
      _1491: () => globalThis.firebase_firestore.Bytes,
      _1494: x0 => x0.type,
      _1496: x0 => x0.doc,
      _1498: x0 => x0.oldIndex,
      _1500: x0 => x0.newIndex,
      _1502: () => globalThis.firebase_firestore.DocumentReference,
      _1506: x0 => x0.path,
      _1515: x0 => x0.metadata,
      _1516: x0 => x0.ref,
      _1521: x0 => x0.docs,
      _1523: x0 => x0.metadata,
      _1527: () => globalThis.firebase_firestore.Timestamp,
      _1528: x0 => x0.seconds,
      _1529: x0 => x0.nanoseconds,
      _1565: x0 => x0.hasPendingWrites,
      _1567: x0 => x0.fromCache,
      _1574: x0 => x0.source,
      _1579: () => globalThis.firebase_firestore.startAfter,
      _1580: () => globalThis.firebase_firestore.startAt,
      _1581: () => globalThis.firebase_firestore.endBefore,
      _1582: () => globalThis.firebase_firestore.endAt,
      _1586: () => globalThis.window.navigator.userAgent,
      _1592: (x0,x1) => x0.createElement(x1),
      _1598: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1599: () => globalThis.Module_soloud._createWorkerInWasm(),
      _1600: x0 => globalThis.Module_soloud._malloc(x0),
      _1601: (x0,x1,x2) => globalThis.Module_soloud.setValue(x0,x1,x2),
      _1603: x0 => globalThis.Module_soloud._free(x0),
      _1605: (x0,x1,x2,x3) => globalThis.Module_soloud._initEngine(x0,x1,x2,x3),
      _1608: (x0,x1) => globalThis.Module_soloud.getValue(x0,x1),
      _1611: () => globalThis.Module_soloud._dispose(),
      _1612: () => globalThis.Module_soloud._isInited(),
      _1614: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => globalThis.Module_soloud._setBufferStream(x0,x1,x2,x3,x4,x5,x6,x7,x8),
      _1621: (x0,x1,x2) => globalThis.Module_soloud._addAudioDataStream(x0,x1,x2),
      _1622: x0 => globalThis.Module_soloud._setDataIsEnded(x0),
      _1624: (x0,x1,x2,x3,x4) => globalThis.Module_soloud._loadWaveform(x0,x1,x2,x3,x4),
      _1627: (x0,x1) => globalThis.Module_soloud._setWaveformFreq(x0,x1),
      _1634: (x0,x1) => globalThis.Module_soloud._setRelativePlaySpeed(x0,x1),
      _1636: (x0,x1,x2,x3,x4,x5,x6) => globalThis.Module_soloud._play(x0,x1,x2,x3,x4,x5,x6),
      _1637: x0 => globalThis.Module_soloud._stop(x0),
      _1638: x0 => globalThis.Module_soloud._disposeSound(x0),
      _1639: () => globalThis.Module_soloud._disposeAllSound(),
      _1645: () => globalThis.Module_soloud._getVisualizationEnabled(),
      _1661: x0 => globalThis.Module_soloud._getIsValidVoiceHandle(x0),
      _1708: x0 => x0.decode(),
      _1709: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1710: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      _1711: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1711(f,arguments.length,x0) }),
      _1712: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1712(f,arguments.length,x0) }),
      _1713: x0 => x0.send(),
      _1714: () => new XMLHttpRequest(),
      _1717: (x0,x1) => globalThis.firebase_auth.linkWithCredential(x0,x1),
      _1719: (x0,x1) => globalThis.firebase_auth.linkWithPopup(x0,x1),
      _1735: x0 => x0.toJSON(),
      _1736: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1736(f,arguments.length,x0) }),
      _1737: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1737(f,arguments.length,x0) }),
      _1738: (x0,x1,x2) => x0.onAuthStateChanged(x1,x2),
      _1739: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1739(f,arguments.length,x0) }),
      _1740: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1740(f,arguments.length,x0) }),
      _1741: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1741(f,arguments.length,x0) }),
      _1742: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1742(f,arguments.length,x0) }),
      _1743: (x0,x1,x2) => x0.onIdTokenChanged(x1,x2),
      _1747: (x0,x1,x2) => globalThis.firebase_auth.createUserWithEmailAndPassword(x0,x1,x2),
      _1753: (x0,x1,x2) => globalThis.firebase_auth.sendPasswordResetEmail(x0,x1,x2),
      _1755: x0 => globalThis.firebase_auth.signInAnonymously(x0),
      _1757: (x0,x1,x2) => globalThis.firebase_auth.signInWithEmailAndPassword(x0,x1,x2),
      _1760: (x0,x1) => globalThis.firebase_auth.signInWithPopup(x0,x1),
      _1762: x0 => x0.signOut(),
      _1763: (x0,x1) => globalThis.firebase_auth.connectAuthEmulator(x0,x1),
      _1768: (x0,x1) => globalThis.firebase_auth.EmailAuthProvider.credential(x0,x1),
      _1778: () => new firebase_auth.GoogleAuthProvider(),
      _1779: (x0,x1) => x0.addScope(x1),
      _1780: (x0,x1) => x0.setCustomParameters(x1),
      _1786: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromResult(x0),
      _1801: x0 => globalThis.firebase_auth.getAdditionalUserInfo(x0),
      _1802: (x0,x1,x2) => ({errorMap: x0,persistence: x1,popupRedirectResolver: x2}),
      _1803: (x0,x1) => globalThis.firebase_auth.initializeAuth(x0,x1),
      _1809: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromError(x0),
      _1824: () => globalThis.firebase_auth.debugErrorMap,
      _1827: () => globalThis.firebase_auth.browserSessionPersistence,
      _1829: () => globalThis.firebase_auth.browserLocalPersistence,
      _1831: () => globalThis.firebase_auth.indexedDBLocalPersistence,
      _1834: x0 => globalThis.firebase_auth.multiFactor(x0),
      _1835: (x0,x1) => globalThis.firebase_auth.getMultiFactorResolver(x0,x1),
      _1837: x0 => x0.currentUser,
      _1841: x0 => x0.tenantId,
      _1851: x0 => x0.displayName,
      _1852: x0 => x0.email,
      _1853: x0 => x0.phoneNumber,
      _1854: x0 => x0.photoURL,
      _1855: x0 => x0.providerId,
      _1856: x0 => x0.uid,
      _1857: x0 => x0.emailVerified,
      _1858: x0 => x0.isAnonymous,
      _1859: x0 => x0.providerData,
      _1860: x0 => x0.refreshToken,
      _1861: x0 => x0.tenantId,
      _1862: x0 => x0.metadata,
      _1864: x0 => x0.providerId,
      _1865: x0 => x0.signInMethod,
      _1866: x0 => x0.accessToken,
      _1867: x0 => x0.idToken,
      _1868: x0 => x0.secret,
      _1879: x0 => x0.creationTime,
      _1880: x0 => x0.lastSignInTime,
      _1885: x0 => x0.code,
      _1887: x0 => x0.message,
      _1899: x0 => x0.email,
      _1900: x0 => x0.phoneNumber,
      _1901: x0 => x0.tenantId,
      _1924: x0 => x0.user,
      _1927: x0 => x0.providerId,
      _1928: x0 => x0.profile,
      _1929: x0 => x0.username,
      _1930: x0 => x0.isNewUser,
      _1933: () => globalThis.firebase_auth.browserPopupRedirectResolver,
      _1938: x0 => x0.displayName,
      _1939: x0 => x0.enrollmentTime,
      _1940: x0 => x0.factorId,
      _1941: x0 => x0.uid,
      _1943: x0 => x0.hints,
      _1944: x0 => x0.session,
      _1946: x0 => x0.phoneNumber,
      _1958: (x0,x1) => x0.getItem(x1),
      _1963: (x0,x1) => x0.appendChild(x1),
      _1968: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1968(f,arguments.length,x0) }),
      _1969: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1969(f,arguments.length,x0) }),
      _1970: (x0,x1,x2) => globalThis.firebase_app_check.onTokenChanged(x0,x1,x2),
      _1971: x0 => new firebase_app_check.ReCaptchaV3Provider(x0),
      _1972: x0 => new firebase_app_check.ReCaptchaEnterpriseProvider(x0),
      _1973: x0 => ({provider: x0}),
      _1974: (x0,x1) => globalThis.firebase_app_check.initializeAppCheck(x0,x1),
      _1975: (x0,x1,x2) => x0.setItem(x1,x2),
      _1977: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      _1978: (x0,x1) => globalThis.firebase_core.initializeApp(x0,x1),
      _1979: x0 => globalThis.firebase_core.getApp(x0),
      _1980: () => globalThis.firebase_core.getApp(),
      _1981: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      _1983: () => globalThis.firebase_core.SDK_VERSION,
      _1989: x0 => x0.apiKey,
      _1991: x0 => x0.authDomain,
      _1993: x0 => x0.databaseURL,
      _1995: x0 => x0.projectId,
      _1997: x0 => x0.storageBucket,
      _1999: x0 => x0.messagingSenderId,
      _2001: x0 => x0.measurementId,
      _2003: x0 => x0.appId,
      _2005: x0 => x0.name,
      _2006: x0 => x0.options,
      _2009: x0 => x0.token,
      _2013: (x0,x1) => x0.debug(x1),
      _2014: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2014(f,arguments.length,x0) }),
      _2015: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._2015(f,arguments.length,x0,x1) }),
      _2016: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      _2017: (x0,x1,x2) => x0.createPolicy(x1,x2),
      _2018: (x0,x1) => x0.createScriptURL(x1),
      _2019: (x0,x1,x2) => x0.createScript(x1,x2),
      _2020: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2020(f,arguments.length,x0) }),
      _2025: Date.now,
      _2027: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _2028: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _2029: () => typeof dartUseDateNowForTicks !== "undefined",
      _2030: () => 1000 * performance.now(),
      _2031: () => Date.now(),
      _2032: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _2033: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _2034: () => new WeakMap(),
      _2035: (map, o) => map.get(o),
      _2036: (map, o, v) => map.set(o, v),
      _2037: x0 => new WeakRef(x0),
      _2038: x0 => x0.deref(),
      _2045: () => globalThis.WeakRef,
      _2048: s => JSON.stringify(s),
      _2049: s => printToConsole(s),
      _2050: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      _2051: (o, p, r) => o.replaceAll(p, () => r),
      _2052: (o, p, r) => o.replace(p, () => r),
      _2053: Function.prototype.call.bind(String.prototype.toLowerCase),
      _2054: s => s.toUpperCase(),
      _2055: s => s.trim(),
      _2056: s => s.trimLeft(),
      _2057: s => s.trimRight(),
      _2058: (string, times) => string.repeat(times),
      _2059: Function.prototype.call.bind(String.prototype.indexOf),
      _2060: (s, p, i) => s.lastIndexOf(p, i),
      _2061: (string, token) => string.split(token),
      _2062: Object.is,
      _2065: (o, t) => typeof o === t,
      _2066: (o, c) => o instanceof c,
      _2067: o => Object.keys(o),
      _2070: (o,s,v) => o[s] = v,
      _2099: x0 => new Array(x0),
      _2101: x0 => x0.length,
      _2103: (x0,x1) => x0[x1],
      _2104: (x0,x1,x2) => { x0[x1] = x2 },
      _2107: (x0,x1,x2) => new DataView(x0,x1,x2),
      _2109: x0 => new Int8Array(x0),
      _2110: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _2112: x0 => new Uint8ClampedArray(x0),
      _2114: x0 => new Int16Array(x0),
      _2116: x0 => new Uint16Array(x0),
      _2118: x0 => new Int32Array(x0),
      _2120: x0 => new Uint32Array(x0),
      _2122: x0 => new Float32Array(x0),
      _2124: x0 => new Float64Array(x0),
      _2147: () => Symbol("jsBoxedDartObjectProperty"),
      _2148: x0 => x0.random(),
      _2149: (x0,x1) => x0.getRandomValues(x1),
      _2150: () => globalThis.crypto,
      _2151: () => globalThis.Math,
      _2164: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _2165: (handle) => clearTimeout(handle),
      _2166: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _2167: (handle) => clearInterval(handle),
      _2168: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _2169: () => Date.now(),
      _2170: () => new Error().stack,
      _2171: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _2172: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _2173: (x0,x1) => x0.exec(x1),
      _2174: (x0,x1) => x0.test(x1),
      _2175: x0 => x0.pop(),
      _2177: o => o === undefined,
      _2179: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _2181: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _2182: o => o instanceof RegExp,
      _2183: (l, r) => l === r,
      _2184: o => o,
      _2185: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      _2186: o => o,
      _2187: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      _2188: o => o,
      _2189: b => !!b,
      _2190: o => o.length,
      _2192: (o, i) => o[i],
      _2193: f => f.dartFunction,
      _2194: () => ({}),
      _2195: () => [],
      _2197: () => globalThis,
      _2198: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _2199: (o, p) => p in o,
      _2200: (o, p) => o[p],
      _2201: (o, p, v) => o[p] = v,
      _2202: (o, m, a) => o[m].apply(o, a),
      _2204: o => String(o),
      _2205: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      _2206: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2206(f,arguments.length,x0) }),
      _2207: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._2207(f,arguments.length,x0,x1) }),
      _2208: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      _2209: o => [o],
      _2210: (o0, o1) => [o0, o1],
      _2211: (o0, o1, o2) => [o0, o1, o2],
      _2212: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      _2213: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      _2214: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2215: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2216: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2217: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2218: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2219: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2220: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2221: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2222: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2223: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2224: x0 => new ArrayBuffer(x0),
      _2225: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _2226: x0 => x0.input,
      _2227: x0 => x0.index,
      _2228: x0 => x0.groups,
      _2229: x0 => x0.flags,
      _2230: x0 => x0.multiline,
      _2231: x0 => x0.ignoreCase,
      _2232: x0 => x0.unicode,
      _2233: x0 => x0.dotAll,
      _2234: (x0,x1) => { x0.lastIndex = x1 },
      _2235: (o, p) => p in o,
      _2236: (o, p) => o[p],
      _2237: (o, p, v) => o[p] = v,
      _2238: (o, p) => delete o[p],
      _2239: x0 => globalThis.Object.keys(x0),
      _2241: x0 => new Date(x0),
      _2243: x0 => x0.getTime(),
      _2244: x0 => x0.length,
      _2245: x0 => x0.message,
      _2246: x0 => x0.name,
      _2260: (x0,x1) => x0.getAllKeys(x1),
      _2280: (x0,x1) => x0.get(x1),
      _2283: (x0,x1,x2) => x0.put(x1,x2),
      _2293: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2293(f,arguments.length,x0) }),
      _2294: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2294(f,arguments.length,x0) }),
      _2295: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2295(f,arguments.length,x0) }),
      _2296: (x0,x1) => x0.objectStore(x1),
      _2298: (x0,x1) => ({keyPath: x0,autoIncrement: x1}),
      _2299: (x0,x1,x2) => x0.createObjectStore(x1,x2),
      _2300: (x0,x1,x2) => x0.transaction(x1,x2),
      _2301: x0 => x0.close(),
      _2304: (x0,x1,x2) => x0.open(x1,x2),
      _2319: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2319(f,arguments.length,x0) }),
      _2320: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2320(f,arguments.length,x0) }),
      _2321: () => new XMLHttpRequest(),
      _2322: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _2326: x0 => x0.send(),
      _2328: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2328(f,arguments.length,x0) }),
      _2329: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2329(f,arguments.length,x0) }),
      _2330: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _2331: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _2337: (x0,x1) => new WebSocket(x0,x1),
      _2338: (x0,x1) => x0.send(x1),
      _2339: (x0,x1,x2) => x0.close(x1,x2),
      _2341: x0 => x0.close(),
      _2344: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2344(f,arguments.length,x0) }),
      _2347: () => new AbortController(),
      _2348: x0 => x0.abort(),
      _2349: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _2350: (x0,x1) => globalThis.fetch(x0,x1),
      _2351: (x0,x1) => x0.get(x1),
      _2352: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports._2352(f,arguments.length,x0,x1,x2) }),
      _2353: (x0,x1) => x0.forEach(x1),
      _2354: x0 => x0.getReader(),
      _2355: x0 => x0.cancel(),
      _2356: x0 => x0.read(),
      _2357: (x0,x1) => x0.item(x1),
      _2361: () => new FileReader(),
      _2362: (x0,x1) => x0.readAsArrayBuffer(x1),
      _2368: () => globalThis.Module_soloud.wasmWorker,
      _2372: (x0,x1) => x0.append(x1),
      _2373: (x0,x1) => x0.item(x1),
      _2374: x0 => x0.trustedTypes,
      _2375: (x0,x1) => { x0.text = x1 },
      _2376: o => o instanceof Array,
      _2380: a => a.pop(),
      _2381: (a, i) => a.splice(i, 1),
      _2382: (a, s) => a.join(s),
      _2383: (a, s, e) => a.slice(s, e),
      _2385: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _2386: a => a.length,
      _2388: (a, i) => a[i],
      _2389: (a, i, v) => a[i] = v,
      _2391: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      _2392: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _2394: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      _2395: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _2396: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      _2397: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _2398: o => o instanceof Uint8ClampedArray,
      _2399: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _2400: o => o instanceof Uint16Array,
      _2401: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _2402: o => o instanceof Int16Array,
      _2403: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _2404: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      _2405: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _2406: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      _2407: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _2409: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _2410: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      _2411: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _2412: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      _2413: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _2414: (a, i) => a.push(i),
      _2415: (t, s) => t.set(s),
      _2416: l => new DataView(new ArrayBuffer(l)),
      _2417: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _2419: o => o.buffer,
      _2420: o => o.byteOffset,
      _2421: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _2422: (b, o) => new DataView(b, o),
      _2423: (b, o, l) => new DataView(b, o, l),
      _2424: Function.prototype.call.bind(DataView.prototype.getUint8),
      _2425: Function.prototype.call.bind(DataView.prototype.setUint8),
      _2426: Function.prototype.call.bind(DataView.prototype.getInt8),
      _2427: Function.prototype.call.bind(DataView.prototype.setInt8),
      _2428: Function.prototype.call.bind(DataView.prototype.getUint16),
      _2429: Function.prototype.call.bind(DataView.prototype.setUint16),
      _2430: Function.prototype.call.bind(DataView.prototype.getInt16),
      _2431: Function.prototype.call.bind(DataView.prototype.setInt16),
      _2432: Function.prototype.call.bind(DataView.prototype.getUint32),
      _2433: Function.prototype.call.bind(DataView.prototype.setUint32),
      _2434: Function.prototype.call.bind(DataView.prototype.getInt32),
      _2435: Function.prototype.call.bind(DataView.prototype.setInt32),
      _2438: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _2439: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _2440: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _2441: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _2442: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _2443: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _2444: Function.prototype.call.bind(Number.prototype.toString),
      _2445: Function.prototype.call.bind(BigInt.prototype.toString),
      _2446: Function.prototype.call.bind(Number.prototype.toString),
      _2447: (d, digits) => d.toFixed(digits),
      _2453: (x0,x1) => x0.getContext(x1),
      _2469: () => globalThis.document,
      _2471: () => globalThis.console,
      _2476: (x0,x1) => { x0.height = x1 },
      _2478: (x0,x1) => { x0.width = x1 },
      _2480: (x0,x1) => { x0.pointerEvents = x1 },
      _2489: x0 => x0.style,
      _2492: x0 => x0.src,
      _2493: (x0,x1) => { x0.src = x1 },
      _2494: x0 => x0.naturalWidth,
      _2495: x0 => x0.naturalHeight,
      _2510: (x0,x1) => x0.error(x1),
      _2515: x0 => x0.status,
      _2516: (x0,x1) => { x0.responseType = x1 },
      _2518: x0 => x0.response,
      _2567: (x0,x1) => { x0.responseType = x1 },
      _2568: x0 => x0.response,
      _2656: (x0,x1) => { x0.oncancel = x1 },
      _2662: (x0,x1) => { x0.onchange = x1 },
      _2702: (x0,x1) => { x0.onerror = x1 },
      _3075: (x0,x1) => { x0.src = x1 },
      _3086: x0 => x0.width,
      _3088: x0 => x0.height,
      _3572: (x0,x1) => { x0.accept = x1 },
      _3586: x0 => x0.files,
      _3612: (x0,x1) => { x0.multiple = x1 },
      _3630: (x0,x1) => { x0.type = x1 },
      _3880: (x0,x1) => { x0.src = x1 },
      _3882: (x0,x1) => { x0.type = x1 },
      _3890: (x0,x1) => { x0.crossOrigin = x1 },
      _3892: (x0,x1) => { x0.text = x1 },
      _3900: (x0,x1) => { x0.charset = x1 },
      _3924: x0 => x0.width,
      _3925: (x0,x1) => { x0.width = x1 },
      _3926: x0 => x0.height,
      _3927: (x0,x1) => { x0.height = x1 },
      _4348: () => globalThis.window,
      _4392: x0 => x0.location,
      _4411: x0 => x0.navigator,
      _4668: x0 => x0.indexedDB,
      _4673: x0 => x0.trustedTypes,
      _4674: x0 => x0.sessionStorage,
      _4675: x0 => x0.localStorage,
      _4690: x0 => x0.hostname,
      _4784: x0 => x0.mediaDevices,
      _4786: x0 => x0.permissions,
      _4801: x0 => x0.vendor,
      _4851: x0 => x0.data,
      _4888: (x0,x1) => { x0.onmessage = x1 },
      _4959: (x0,x1) => { x0.onmessage = x1 },
      _5226: x0 => x0.readyState,
      _5235: x0 => x0.protocol,
      _5239: (x0,x1) => { x0.binaryType = x1 },
      _5242: x0 => x0.code,
      _5243: x0 => x0.reason,
      _6394: x0 => x0.destination,
      _6398: x0 => x0.state,
      _6399: x0 => x0.audioWorklet,
      _6502: (x0,x1) => { x0.fftSize = x1 },
      _6503: x0 => x0.frequencyBinCount,
      _6505: (x0,x1) => { x0.minDecibels = x1 },
      _6507: (x0,x1) => { x0.maxDecibels = x1 },
      _6509: (x0,x1) => { x0.smoothingTimeConstant = x1 },
      _6763: x0 => x0.port,
      _6902: x0 => x0.type,
      _6903: x0 => x0.target,
      _6943: x0 => x0.signal,
      _6955: x0 => x0.length,
      _7015: () => globalThis.document,
      _7095: x0 => x0.body,
      _7097: x0 => x0.head,
      _7428: x0 => x0.id,
      _7429: (x0,x1) => { x0.id = x1 },
      _7456: x0 => x0.children,
      _8775: x0 => x0.value,
      _8777: x0 => x0.done,
      _8957: x0 => x0.size,
      _8958: x0 => x0.type,
      _8965: x0 => x0.name,
      _8966: x0 => x0.lastModified,
      _8971: x0 => x0.length,
      _8977: x0 => x0.result,
      _9346: x0 => x0.mimeType,
      _9347: x0 => x0.state,
      _9351: (x0,x1) => { x0.onstop = x1 },
      _9353: (x0,x1) => { x0.ondataavailable = x1 },
      _9378: x0 => x0.data,
      _9468: x0 => x0.url,
      _9470: x0 => x0.status,
      _9472: x0 => x0.statusText,
      _9473: x0 => x0.headers,
      _9474: x0 => x0.body,
      _9861: x0 => x0.state,
      _10521: x0 => x0.sampleRate,
      _10533: x0 => x0.channelCount,
      _10923: x0 => x0.result,
      _10924: x0 => x0.error,
      _10929: (x0,x1) => { x0.onsuccess = x1 },
      _10931: (x0,x1) => { x0.onerror = x1 },
      _10951: x0 => x0.name,
      _10970: x0 => x0.name,
      _10972: x0 => x0.keyPath,
      _10975: x0 => x0.autoIncrement,
      _11004: x0 => x0.error,
      _11006: (x0,x1) => { x0.onabort = x1 },
      _11008: (x0,x1) => { x0.oncomplete = x1 },
      _11010: (x0,x1) => { x0.onerror = x1 },
      _13058: x0 => x0.name,
      _13059: x0 => x0.message,
      _13774: () => globalThis.console,
      _13801: x0 => x0.name,
      _13802: x0 => x0.message,
      _13803: x0 => x0.code,
      _13805: x0 => x0.customData,

    };

    const baseImports = {
      dart2wasm: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });
    dartInstance.exports.$setThisModule(dartInstance);

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
