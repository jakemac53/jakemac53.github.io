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
      _9: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._9(f,arguments.length,x0) }),
      _10: x0 => new window.FinalizationRegistry(x0),
      _11: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      _12: (x0,x1) => x0.unregister(x1),
      _13: (x0,x1,x2) => x0.slice(x1,x2),
      _14: (x0,x1) => x0.decode(x1),
      _15: (x0,x1) => x0.segment(x1),
      _16: () => new TextDecoder(),
      _18: x0 => x0.buffer,
      _19: x0 => x0.wasmMemory,
      _20: () => globalThis.window._flutter_skwasmInstance,
      _21: x0 => x0.rasterStartMilliseconds,
      _22: x0 => x0.rasterEndMilliseconds,
      _23: x0 => x0.imageBitmaps,
      _140: (x0,x1) => x0.appendChild(x1),
      _171: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _172: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      _173: (x0,x1) => new OffscreenCanvas(x0,x1),
      _174: x0 => x0.remove(),
      _175: (x0,x1) => x0.append(x1),
      _177: x0 => x0.unlock(),
      _178: x0 => x0.getReader(),
      _179: (x0,x1) => x0.item(x1),
      _180: x0 => x0.next(),
      _181: x0 => x0.now(),
      _182: (x0,x1) => x0.revokeObjectURL(x1),
      _183: x0 => x0.close(),
      _184: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      _185: x0 => new window.ImageDecoder(x0),
      _186: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      _187: (x0,x1) => x0.decode(x1),
      _188: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._188(f,arguments.length,x0) }),
      _189: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _191: (x0,x1) => x0.getModifierState(x1),
      _192: x0 => x0.preventDefault(),
      _193: x0 => x0.stopPropagation(),
      _194: (x0,x1) => x0.removeProperty(x1),
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
      _213: (x0,x1) => x0.closest(x1),
      _214: () => new Array(),
      _651: x0 => new Uint8Array(x0),
      _654: () => globalThis.window.flutterConfiguration,
      _656: x0 => x0.assetBase,
      _661: x0 => x0.canvasKitMaximumSurfaces,
      _662: x0 => x0.debugShowSemanticsNodes,
      _663: x0 => x0.hostElement,
      _664: x0 => x0.multiViewEnabled,
      _665: x0 => x0.nonce,
      _667: x0 => x0.fontFallbackBaseUrl,
      _677: x0 => x0.console,
      _678: x0 => x0.devicePixelRatio,
      _679: x0 => x0.document,
      _680: x0 => x0.history,
      _681: x0 => x0.innerHeight,
      _682: x0 => x0.innerWidth,
      _683: x0 => x0.location,
      _684: x0 => x0.navigator,
      _685: x0 => x0.visualViewport,
      _686: x0 => x0.performance,
      _687: x0 => x0.parent,
      _689: x0 => x0.URL,
      _691: (x0,x1) => x0.getComputedStyle(x1),
      _692: x0 => x0.screen,
      _693: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._693(f,arguments.length,x0) }),
      _694: (x0,x1) => x0.requestAnimationFrame(x1),
      _698: (x0,x1) => x0.warn(x1),
      _700: (x0,x1) => x0.debug(x1),
      _701: x0 => globalThis.parseFloat(x0),
      _702: () => globalThis.window,
      _703: () => globalThis.Intl,
      _704: () => globalThis.Symbol,
      _705: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      _707: x0 => x0.clipboard,
      _708: x0 => x0.maxTouchPoints,
      _709: x0 => x0.vendor,
      _710: x0 => x0.language,
      _711: x0 => x0.platform,
      _712: x0 => x0.userAgent,
      _713: (x0,x1) => x0.vibrate(x1),
      _714: x0 => x0.languages,
      _715: x0 => x0.documentElement,
      _716: (x0,x1) => x0.querySelector(x1),
      _717: (x0,x1) => x0.querySelectorAll(x1),
      _719: (x0,x1) => x0.createElement(x1),
      _722: (x0,x1) => x0.createEvent(x1),
      _723: x0 => x0.activeElement,
      _726: x0 => x0.head,
      _727: x0 => x0.body,
      _729: (x0,x1) => { x0.title = x1 },
      _732: x0 => x0.visibilityState,
      _733: () => globalThis.document,
      _734: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._734(f,arguments.length,x0) }),
      _735: (x0,x1) => x0.dispatchEvent(x1),
      _743: x0 => x0.target,
      _745: x0 => x0.timeStamp,
      _746: x0 => x0.type,
      _748: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      _755: x0 => x0.firstChild,
      _759: x0 => x0.parentElement,
      _761: (x0,x1) => { x0.textContent = x1 },
      _762: x0 => x0.parentNode,
      _763: x0 => x0.nextSibling,
      _764: (x0,x1) => x0.removeChild(x1),
      _765: x0 => x0.isConnected,
      _773: x0 => x0.clientHeight,
      _774: x0 => x0.clientWidth,
      _775: x0 => x0.offsetHeight,
      _776: x0 => x0.offsetWidth,
      _777: x0 => x0.id,
      _778: (x0,x1) => { x0.id = x1 },
      _781: (x0,x1) => { x0.spellcheck = x1 },
      _782: x0 => x0.tagName,
      _783: x0 => x0.style,
      _786: (x0,x1) => x0.querySelectorAll(x1),
      _787: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _788: x0 => x0.tabIndex,
      _789: (x0,x1) => { x0.tabIndex = x1 },
      _790: (x0,x1) => x0.focus(x1),
      _791: x0 => x0.scrollTop,
      _792: (x0,x1) => { x0.scrollTop = x1 },
      _793: (x0,x1) => { x0.scrollLeft = x1 },
      _794: x0 => x0.scrollLeft,
      _795: x0 => x0.classList,
      _796: (x0,x1) => x0.scrollIntoView(x1),
      _799: (x0,x1) => { x0.className = x1 },
      _801: (x0,x1) => x0.getElementsByClassName(x1),
      _802: x0 => x0.click(),
      _803: (x0,x1) => x0.attachShadow(x1),
      _806: x0 => x0.computedStyleMap(),
      _807: (x0,x1) => x0.get(x1),
      _813: (x0,x1) => x0.getPropertyValue(x1),
      _814: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      _815: x0 => x0.offsetLeft,
      _816: x0 => x0.offsetTop,
      _817: x0 => x0.offsetParent,
      _819: (x0,x1) => { x0.name = x1 },
      _820: x0 => x0.content,
      _821: (x0,x1) => { x0.content = x1 },
      _825: (x0,x1) => { x0.src = x1 },
      _826: x0 => x0.naturalWidth,
      _827: x0 => x0.naturalHeight,
      _831: (x0,x1) => { x0.crossOrigin = x1 },
      _833: (x0,x1) => { x0.decoding = x1 },
      _834: x0 => x0.decode(),
      _839: (x0,x1) => { x0.nonce = x1 },
      _844: (x0,x1) => { x0.width = x1 },
      _846: (x0,x1) => { x0.height = x1 },
      _849: (x0,x1) => x0.getContext(x1),
      _917: x0 => x0.width,
      _918: x0 => x0.height,
      _920: (x0,x1) => x0.fetch(x1),
      _921: x0 => x0.status,
      _923: x0 => x0.body,
      _924: x0 => x0.arrayBuffer(),
      _927: x0 => x0.read(),
      _928: x0 => x0.value,
      _929: x0 => x0.done,
      _936: x0 => x0.name,
      _937: x0 => x0.x,
      _938: x0 => x0.y,
      _941: x0 => x0.top,
      _942: x0 => x0.right,
      _943: x0 => x0.bottom,
      _944: x0 => x0.left,
      _954: x0 => x0.height,
      _955: x0 => x0.width,
      _956: x0 => x0.scale,
      _957: (x0,x1) => { x0.value = x1 },
      _960: (x0,x1) => { x0.placeholder = x1 },
      _962: (x0,x1) => { x0.name = x1 },
      _963: x0 => x0.selectionDirection,
      _964: x0 => x0.selectionStart,
      _965: x0 => x0.selectionEnd,
      _968: x0 => x0.value,
      _970: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _971: x0 => x0.readText(),
      _972: (x0,x1) => x0.writeText(x1),
      _974: x0 => x0.altKey,
      _975: x0 => x0.code,
      _976: x0 => x0.ctrlKey,
      _977: x0 => x0.key,
      _978: x0 => x0.keyCode,
      _979: x0 => x0.location,
      _980: x0 => x0.metaKey,
      _981: x0 => x0.repeat,
      _982: x0 => x0.shiftKey,
      _983: x0 => x0.isComposing,
      _985: x0 => x0.state,
      _986: (x0,x1) => x0.go(x1),
      _988: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      _989: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      _990: x0 => x0.pathname,
      _991: x0 => x0.search,
      _992: x0 => x0.hash,
      _996: x0 => x0.state,
      _999: (x0,x1) => x0.createObjectURL(x1),
      _1001: x0 => new Blob(x0),
      _1011: x0 => x0.matches,
      _1015: x0 => x0.matches,
      _1019: x0 => x0.relatedTarget,
      _1021: x0 => x0.clientX,
      _1022: x0 => x0.clientY,
      _1023: x0 => x0.offsetX,
      _1024: x0 => x0.offsetY,
      _1027: x0 => x0.button,
      _1028: x0 => x0.buttons,
      _1029: x0 => x0.ctrlKey,
      _1033: x0 => x0.pointerId,
      _1034: x0 => x0.pointerType,
      _1035: x0 => x0.pressure,
      _1036: x0 => x0.tiltX,
      _1037: x0 => x0.tiltY,
      _1038: x0 => x0.getCoalescedEvents(),
      _1041: x0 => x0.deltaX,
      _1042: x0 => x0.deltaY,
      _1043: x0 => x0.wheelDeltaX,
      _1044: x0 => x0.wheelDeltaY,
      _1045: x0 => x0.deltaMode,
      _1052: x0 => x0.changedTouches,
      _1055: x0 => x0.clientX,
      _1056: x0 => x0.clientY,
      _1059: x0 => x0.data,
      _1062: (x0,x1) => { x0.disabled = x1 },
      _1064: (x0,x1) => { x0.type = x1 },
      _1065: (x0,x1) => { x0.max = x1 },
      _1066: (x0,x1) => { x0.min = x1 },
      _1067: x0 => x0.value,
      _1068: (x0,x1) => { x0.value = x1 },
      _1069: x0 => x0.disabled,
      _1070: (x0,x1) => { x0.disabled = x1 },
      _1072: (x0,x1) => { x0.placeholder = x1 },
      _1074: (x0,x1) => { x0.name = x1 },
      _1075: (x0,x1) => { x0.autocomplete = x1 },
      _1077: x0 => x0.selectionDirection,
      _1078: x0 => x0.selectionStart,
      _1080: x0 => x0.selectionEnd,
      _1083: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      _1084: (x0,x1) => x0.add(x1),
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
      _1293: x0 => globalThis.URL.revokeObjectURL(x0),
      _1294: x0 => x0.remove(),
      _1295: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      _1296: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      _1297: x0 => globalThis.URL.createObjectURL(x0),
      _1298: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1298(f,arguments.length,x0) }),
      _1299: (x0,x1,x2,x3) => x0.toBlob(x1,x2,x3),
      _1300: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1300(f,arguments.length,x0) }),
      _1301: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1301(f,arguments.length,x0) }),
      _1302: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1302(f,arguments.length,x0) }),
      _1303: (x0,x1) => x0.querySelector(x1),
      _1304: (x0,x1) => x0.createElement(x1),
      _1305: (x0,x1) => x0.append(x1),
      _1306: (x0,x1,x2) => x0.setAttribute(x1,x2),
      _1307: (x0,x1) => x0.replaceChildren(x1),
      _1308: x0 => x0.click(),
      _1309: x0 => ({audio: x0}),
      _1310: (x0,x1) => x0.getUserMedia(x1),
      _1311: x0 => x0.getAudioTracks(),
      _1312: x0 => x0.stop(),
      _1313: (x0,x1) => x0.removeTrack(x1),
      _1314: x0 => x0.close(),
      _1315: (x0,x1) => x0.warn(x1),
      _1316: x0 => x0.getSettings(),
      _1317: x0 => ({sampleRate: x0}),
      _1318: x0 => new AudioContext(x0),
      _1319: () => new AudioContext(),
      _1322: (x0,x1) => x0.connect(x1),
      _1323: (x0,x1) => x0.createMediaStreamSource(x1),
      _1324: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1324(f,arguments.length,x0) }),
      _1325: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1325(f,arguments.length,x0) }),
      _1326: (x0,x1) => x0.addModule(x1),
      _1327: x0 => ({parameterData: x0}),
      _1328: (x0,x1,x2) => new AudioWorkletNode(x0,x1,x2),
      _1336: x0 => x0.disconnect(),
      _1337: x0 => x0.stop(),
      _1338: (x0,x1,x2) => ({mimeType: x0,audioBitsPerSecond: x1,bitsPerSecond: x2}),
      _1339: (x0,x1) => new MediaRecorder(x0,x1),
      _1340: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1340(f,arguments.length,x0) }),
      _1341: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1341(f,arguments.length,x0) }),
      _1342: (x0,x1) => x0.start(x1),
      _1343: x0 => ({type: x0}),
      _1344: (x0,x1) => new Blob(x0,x1),
      _1345: (x0,x1) => globalThis.jsFixWebmDuration(x0,x1),
      _1346: x0 => x0.createAnalyser(),
      _1347: (x0,x1) => x0.getFloatFrequencyData(x1),
      _1348: x0 => globalThis.MediaRecorder.isTypeSupported(x0),
      _1355: x0 => x0.toArray(),
      _1356: x0 => x0.toUint8Array(),
      _1357: x0 => ({serverTimestamps: x0}),
      _1358: x0 => ({source: x0}),
      _1359: x0 => ({merge: x0}),
      _1361: x0 => new firebase_firestore.FieldPath(x0),
      _1362: (x0,x1) => new firebase_firestore.FieldPath(x0,x1),
      _1363: (x0,x1,x2) => new firebase_firestore.FieldPath(x0,x1,x2),
      _1364: (x0,x1,x2,x3) => new firebase_firestore.FieldPath(x0,x1,x2,x3),
      _1365: (x0,x1,x2,x3,x4) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4),
      _1366: (x0,x1,x2,x3,x4,x5) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5),
      _1367: (x0,x1,x2,x3,x4,x5,x6) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6),
      _1368: (x0,x1,x2,x3,x4,x5,x6,x7) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7),
      _1369: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8),
      _1370: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9),
      _1371: () => globalThis.firebase_firestore.documentId(),
      _1372: (x0,x1) => new firebase_firestore.GeoPoint(x0,x1),
      _1373: x0 => globalThis.firebase_firestore.vector(x0),
      _1374: x0 => globalThis.firebase_firestore.Bytes.fromUint8Array(x0),
      _1375: x0 => globalThis.firebase_firestore.writeBatch(x0),
      _1376: (x0,x1) => globalThis.firebase_firestore.collection(x0,x1),
      _1378: (x0,x1) => globalThis.firebase_firestore.doc(x0,x1),
      _1381: x0 => x0.call(),
      _1405: x0 => x0.commit(),
      _1406: (x0,x1) => x0.delete(x1),
      _1410: x0 => globalThis.firebase_firestore.deleteDoc(x0),
      _1411: x0 => globalThis.firebase_firestore.getDoc(x0),
      _1412: x0 => globalThis.firebase_firestore.getDocFromServer(x0),
      _1413: x0 => globalThis.firebase_firestore.getDocFromCache(x0),
      _1414: (x0,x1) => ({includeMetadataChanges: x0,source: x1}),
      _1415: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1415(f,arguments.length,x0) }),
      _1416: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1416(f,arguments.length,x0) }),
      _1417: (x0,x1,x2,x3) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2,x3),
      _1418: (x0,x1,x2) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2),
      _1419: (x0,x1,x2) => globalThis.firebase_firestore.setDoc(x0,x1,x2),
      _1420: (x0,x1) => globalThis.firebase_firestore.setDoc(x0,x1),
      _1421: (x0,x1) => globalThis.firebase_firestore.query(x0,x1),
      _1422: x0 => globalThis.firebase_firestore.getDocs(x0),
      _1423: x0 => globalThis.firebase_firestore.getDocsFromServer(x0),
      _1424: x0 => globalThis.firebase_firestore.getDocsFromCache(x0),
      _1425: x0 => globalThis.firebase_firestore.limit(x0),
      _1426: x0 => globalThis.firebase_firestore.limitToLast(x0),
      _1427: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1427(f,arguments.length,x0) }),
      _1428: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1428(f,arguments.length,x0) }),
      _1429: (x0,x1) => globalThis.firebase_firestore.orderBy(x0,x1),
      _1431: (x0,x1,x2) => globalThis.firebase_firestore.where(x0,x1,x2),
      _1436: (x0,x1) => x0.data(x1),
      _1440: x0 => x0.docChanges(),
      _1457: (x0,x1) => globalThis.firebase_firestore.getFirestore(x0,x1),
      _1459: x0 => globalThis.firebase_firestore.Timestamp.fromMillis(x0),
      _1460: (module,f) => finalizeWrapper(f, function() { return module.exports._1460(f,arguments.length) }),
      _1477: () => globalThis.firebase_firestore.updateDoc,
      _1478: () => globalThis.firebase_firestore.or,
      _1479: () => globalThis.firebase_firestore.and,
      _1484: x0 => x0.path,
      _1487: () => globalThis.firebase_firestore.GeoPoint,
      _1488: x0 => x0.latitude,
      _1489: x0 => x0.longitude,
      _1491: () => globalThis.firebase_firestore.VectorValue,
      _1492: () => globalThis.firebase_firestore.Bytes,
      _1495: x0 => x0.type,
      _1497: x0 => x0.doc,
      _1499: x0 => x0.oldIndex,
      _1501: x0 => x0.newIndex,
      _1503: () => globalThis.firebase_firestore.DocumentReference,
      _1507: x0 => x0.path,
      _1516: x0 => x0.metadata,
      _1517: x0 => x0.ref,
      _1522: x0 => x0.docs,
      _1524: x0 => x0.metadata,
      _1528: () => globalThis.firebase_firestore.Timestamp,
      _1529: x0 => x0.seconds,
      _1530: x0 => x0.nanoseconds,
      _1566: x0 => x0.hasPendingWrites,
      _1568: x0 => x0.fromCache,
      _1575: x0 => x0.source,
      _1580: () => globalThis.firebase_firestore.startAfter,
      _1581: () => globalThis.firebase_firestore.startAt,
      _1582: () => globalThis.firebase_firestore.endBefore,
      _1583: () => globalThis.firebase_firestore.endAt,
      _1592: (x0,x1) => x0.createElement(x1),
      _1598: (x0,x1,x2) => x0.addEventListener(x1,x2),
      _1599: x0 => x0.decode(),
      _1600: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _1601: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      _1602: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1602(f,arguments.length,x0) }),
      _1603: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1603(f,arguments.length,x0) }),
      _1604: x0 => x0.send(),
      _1605: () => new XMLHttpRequest(),
      _1608: (x0,x1) => globalThis.firebase_auth.linkWithCredential(x0,x1),
      _1626: x0 => x0.toJSON(),
      _1627: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1627(f,arguments.length,x0) }),
      _1628: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1628(f,arguments.length,x0) }),
      _1629: (x0,x1,x2) => x0.onAuthStateChanged(x1,x2),
      _1630: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1630(f,arguments.length,x0) }),
      _1631: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1631(f,arguments.length,x0) }),
      _1632: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1632(f,arguments.length,x0) }),
      _1633: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1633(f,arguments.length,x0) }),
      _1634: (x0,x1,x2) => x0.onIdTokenChanged(x1,x2),
      _1638: (x0,x1,x2) => globalThis.firebase_auth.createUserWithEmailAndPassword(x0,x1,x2),
      _1644: (x0,x1,x2) => globalThis.firebase_auth.sendPasswordResetEmail(x0,x1,x2),
      _1646: x0 => globalThis.firebase_auth.signInAnonymously(x0),
      _1648: (x0,x1,x2) => globalThis.firebase_auth.signInWithEmailAndPassword(x0,x1,x2),
      _1653: x0 => x0.signOut(),
      _1654: (x0,x1) => globalThis.firebase_auth.connectAuthEmulator(x0,x1),
      _1659: (x0,x1) => globalThis.firebase_auth.EmailAuthProvider.credential(x0,x1),
      _1677: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromResult(x0),
      _1692: x0 => globalThis.firebase_auth.getAdditionalUserInfo(x0),
      _1693: (x0,x1,x2) => ({errorMap: x0,persistence: x1,popupRedirectResolver: x2}),
      _1694: (x0,x1) => globalThis.firebase_auth.initializeAuth(x0,x1),
      _1700: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromError(x0),
      _1715: () => globalThis.firebase_auth.debugErrorMap,
      _1718: () => globalThis.firebase_auth.browserSessionPersistence,
      _1720: () => globalThis.firebase_auth.browserLocalPersistence,
      _1722: () => globalThis.firebase_auth.indexedDBLocalPersistence,
      _1725: x0 => globalThis.firebase_auth.multiFactor(x0),
      _1726: (x0,x1) => globalThis.firebase_auth.getMultiFactorResolver(x0,x1),
      _1728: x0 => x0.currentUser,
      _1732: x0 => x0.tenantId,
      _1742: x0 => x0.displayName,
      _1743: x0 => x0.email,
      _1744: x0 => x0.phoneNumber,
      _1745: x0 => x0.photoURL,
      _1746: x0 => x0.providerId,
      _1747: x0 => x0.uid,
      _1748: x0 => x0.emailVerified,
      _1749: x0 => x0.isAnonymous,
      _1750: x0 => x0.providerData,
      _1751: x0 => x0.refreshToken,
      _1752: x0 => x0.tenantId,
      _1753: x0 => x0.metadata,
      _1755: x0 => x0.providerId,
      _1756: x0 => x0.signInMethod,
      _1757: x0 => x0.accessToken,
      _1758: x0 => x0.idToken,
      _1759: x0 => x0.secret,
      _1770: x0 => x0.creationTime,
      _1771: x0 => x0.lastSignInTime,
      _1776: x0 => x0.code,
      _1778: x0 => x0.message,
      _1790: x0 => x0.email,
      _1791: x0 => x0.phoneNumber,
      _1792: x0 => x0.tenantId,
      _1815: x0 => x0.user,
      _1818: x0 => x0.providerId,
      _1819: x0 => x0.profile,
      _1820: x0 => x0.username,
      _1821: x0 => x0.isNewUser,
      _1824: () => globalThis.firebase_auth.browserPopupRedirectResolver,
      _1829: x0 => x0.displayName,
      _1830: x0 => x0.enrollmentTime,
      _1831: x0 => x0.factorId,
      _1832: x0 => x0.uid,
      _1834: x0 => x0.hints,
      _1835: x0 => x0.session,
      _1837: x0 => x0.phoneNumber,
      _1849: (x0,x1) => x0.getItem(x1),
      _1854: (x0,x1) => x0.appendChild(x1),
      _1859: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1859(f,arguments.length,x0) }),
      _1860: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1860(f,arguments.length,x0) }),
      _1861: (x0,x1,x2) => globalThis.firebase_app_check.onTokenChanged(x0,x1,x2),
      _1862: x0 => new firebase_app_check.ReCaptchaV3Provider(x0),
      _1863: x0 => new firebase_app_check.ReCaptchaEnterpriseProvider(x0),
      _1864: x0 => ({provider: x0}),
      _1865: (x0,x1) => globalThis.firebase_app_check.initializeAppCheck(x0,x1),
      _1866: (x0,x1,x2) => x0.setItem(x1,x2),
      _1868: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      _1869: (x0,x1) => globalThis.firebase_core.initializeApp(x0,x1),
      _1870: x0 => globalThis.firebase_core.getApp(x0),
      _1871: () => globalThis.firebase_core.getApp(),
      _1872: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      _1874: () => globalThis.firebase_core.SDK_VERSION,
      _1880: x0 => x0.apiKey,
      _1882: x0 => x0.authDomain,
      _1884: x0 => x0.databaseURL,
      _1886: x0 => x0.projectId,
      _1888: x0 => x0.storageBucket,
      _1890: x0 => x0.messagingSenderId,
      _1892: x0 => x0.measurementId,
      _1894: x0 => x0.appId,
      _1896: x0 => x0.name,
      _1897: x0 => x0.options,
      _1900: x0 => x0.token,
      _1904: (x0,x1) => x0.debug(x1),
      _1905: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1905(f,arguments.length,x0) }),
      _1906: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._1906(f,arguments.length,x0,x1) }),
      _1907: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      _1908: (x0,x1,x2) => x0.createPolicy(x1,x2),
      _1909: (x0,x1) => x0.createScriptURL(x1),
      _1910: (x0,x1,x2) => x0.createScript(x1,x2),
      _1911: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._1911(f,arguments.length,x0) }),
      _1916: Date.now,
      _1918: s => new Date(s * 1000).getTimezoneOffset() * 60,
      _1919: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      _1920: () => typeof dartUseDateNowForTicks !== "undefined",
      _1921: () => 1000 * performance.now(),
      _1922: () => Date.now(),
      _1923: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      _1924: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      _1925: () => new WeakMap(),
      _1926: (map, o) => map.get(o),
      _1927: (map, o, v) => map.set(o, v),
      _1928: x0 => new WeakRef(x0),
      _1929: x0 => x0.deref(),
      _1936: () => globalThis.WeakRef,
      _1939: s => JSON.stringify(s),
      _1940: s => printToConsole(s),
      _1941: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      _1942: (o, p, r) => o.replaceAll(p, () => r),
      _1943: (o, p, r) => o.replace(p, () => r),
      _1944: Function.prototype.call.bind(String.prototype.toLowerCase),
      _1945: s => s.toUpperCase(),
      _1946: s => s.trim(),
      _1947: s => s.trimLeft(),
      _1948: s => s.trimRight(),
      _1949: (string, times) => string.repeat(times),
      _1950: Function.prototype.call.bind(String.prototype.indexOf),
      _1951: (s, p, i) => s.lastIndexOf(p, i),
      _1952: (string, token) => string.split(token),
      _1953: Object.is,
      _1956: (o, t) => typeof o === t,
      _1957: (o, c) => o instanceof c,
      _1958: o => Object.keys(o),
      _1990: x0 => new Array(x0),
      _1992: x0 => x0.length,
      _1994: (x0,x1) => x0[x1],
      _1995: (x0,x1,x2) => { x0[x1] = x2 },
      _1998: (x0,x1,x2) => new DataView(x0,x1,x2),
      _2000: x0 => new Int8Array(x0),
      _2001: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      _2003: x0 => new Uint8ClampedArray(x0),
      _2005: x0 => new Int16Array(x0),
      _2007: x0 => new Uint16Array(x0),
      _2009: x0 => new Int32Array(x0),
      _2011: x0 => new Uint32Array(x0),
      _2013: x0 => new Float32Array(x0),
      _2015: x0 => new Float64Array(x0),
      _2039: x0 => x0.random(),
      _2040: (x0,x1) => x0.getRandomValues(x1),
      _2041: () => globalThis.crypto,
      _2042: () => globalThis.Math,
      _2055: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      _2056: (handle) => clearTimeout(handle),
      _2057: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      _2058: (handle) => clearInterval(handle),
      _2059: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      _2060: () => Date.now(),
      _2061: () => new Error().stack,
      _2062: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      _2063: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      _2064: (x0,x1) => x0.exec(x1),
      _2065: (x0,x1) => x0.test(x1),
      _2066: x0 => x0.pop(),
      _2068: o => o === undefined,
      _2070: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      _2072: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      _2073: o => o instanceof RegExp,
      _2074: (l, r) => l === r,
      _2075: o => o,
      _2076: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      _2077: o => o,
      _2078: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      _2079: o => o,
      _2080: b => !!b,
      _2081: o => o.length,
      _2083: (o, i) => o[i],
      _2084: f => f.dartFunction,
      _2085: () => ({}),
      _2086: () => [],
      _2088: () => globalThis,
      _2089: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      _2091: (o, p) => o[p],
      _2092: (o, p, v) => o[p] = v,
      _2093: (o, m, a) => o[m].apply(o, a),
      _2095: o => String(o),
      _2096: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      _2097: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2097(f,arguments.length,x0) }),
      _2098: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports._2098(f,arguments.length,x0,x1) }),
      _2099: o => {
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
      _2100: o => [o],
      _2101: (o0, o1) => [o0, o1],
      _2102: (o0, o1, o2) => [o0, o1, o2],
      _2103: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      _2104: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      _2105: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2106: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2109: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2110: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2111: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2112: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2113: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      _2114: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      _2115: x0 => new ArrayBuffer(x0),
      _2116: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      _2118: x0 => x0.index,
      _2120: x0 => x0.flags,
      _2121: x0 => x0.multiline,
      _2122: x0 => x0.ignoreCase,
      _2123: x0 => x0.unicode,
      _2124: x0 => x0.dotAll,
      _2125: (x0,x1) => { x0.lastIndex = x1 },
      _2126: (o, p) => p in o,
      _2127: (o, p) => o[p],
      _2128: (o, p, v) => o[p] = v,
      _2129: (o, p) => delete o[p],
      _2130: x0 => globalThis.Object.keys(x0),
      _2132: x0 => new Date(x0),
      _2134: x0 => x0.getTime(),
      _2135: x0 => x0.length,
      _2136: x0 => x0.message,
      _2137: x0 => x0.name,
      _2151: (x0,x1) => x0.getAllKeys(x1),
      _2171: (x0,x1) => x0.get(x1),
      _2174: (x0,x1,x2) => x0.put(x1,x2),
      _2184: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2184(f,arguments.length,x0) }),
      _2185: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2185(f,arguments.length,x0) }),
      _2186: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2186(f,arguments.length,x0) }),
      _2187: (x0,x1) => x0.objectStore(x1),
      _2189: (x0,x1) => ({keyPath: x0,autoIncrement: x1}),
      _2190: (x0,x1,x2) => x0.createObjectStore(x1,x2),
      _2191: (x0,x1,x2) => x0.transaction(x1,x2),
      _2192: x0 => x0.close(),
      _2195: (x0,x1,x2) => x0.open(x1,x2),
      _2210: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2210(f,arguments.length,x0) }),
      _2211: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2211(f,arguments.length,x0) }),
      _2212: () => new XMLHttpRequest(),
      _2213: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      _2217: x0 => x0.send(),
      _2219: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2219(f,arguments.length,x0) }),
      _2220: (module,f) => finalizeWrapper(f, function(x0) { return module.exports._2220(f,arguments.length,x0) }),
      _2221: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      _2222: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      _2228: (x0,x1) => new WebSocket(x0,x1),
      _2229: (x0,x1) => x0.send(x1),
      _2230: (x0,x1,x2) => x0.close(x1,x2),
      _2232: x0 => x0.close(),
      _2233: (x0,x1) => x0.item(x1),
      _2237: () => new FileReader(),
      _2238: (x0,x1) => x0.readAsArrayBuffer(x1),
      _2239: () => new AbortController(),
      _2240: x0 => x0.abort(),
      _2241: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      _2242: (x0,x1) => globalThis.fetch(x0,x1),
      _2243: (x0,x1) => x0.get(x1),
      _2244: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports._2244(f,arguments.length,x0,x1,x2) }),
      _2245: (x0,x1) => x0.forEach(x1),
      _2246: x0 => x0.getReader(),
      _2247: x0 => x0.cancel(),
      _2248: x0 => x0.read(),
      _2249: (x0,x1) => x0.append(x1),
      _2250: (x0,x1) => x0.item(x1),
      _2251: x0 => x0.trustedTypes,
      _2252: (x0,x1) => { x0.text = x1 },
      _2253: o => o instanceof Array,
      _2257: a => a.pop(),
      _2258: (a, i) => a.splice(i, 1),
      _2260: (a, s, e) => a.slice(s, e),
      _2262: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      _2263: a => a.length,
      _2265: (a, i) => a[i],
      _2266: (a, i, v) => a[i] = v,
      _2268: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      _2269: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      _2271: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      _2272: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      _2273: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      _2274: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      _2275: o => o instanceof Uint8ClampedArray,
      _2276: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      _2277: o => o instanceof Uint16Array,
      _2278: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      _2279: o => o instanceof Int16Array,
      _2280: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      _2281: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      _2282: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      _2283: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      _2284: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      _2286: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      _2287: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      _2288: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      _2289: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      _2290: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      _2291: (a, i) => a.push(i),
      _2292: (t, s) => t.set(s),
      _2293: l => new DataView(new ArrayBuffer(l)),
      _2294: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      _2296: o => o.buffer,
      _2297: o => o.byteOffset,
      _2298: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      _2299: (b, o) => new DataView(b, o),
      _2300: (b, o, l) => new DataView(b, o, l),
      _2301: Function.prototype.call.bind(DataView.prototype.getUint8),
      _2302: Function.prototype.call.bind(DataView.prototype.setUint8),
      _2303: Function.prototype.call.bind(DataView.prototype.getInt8),
      _2304: Function.prototype.call.bind(DataView.prototype.setInt8),
      _2305: Function.prototype.call.bind(DataView.prototype.getUint16),
      _2306: Function.prototype.call.bind(DataView.prototype.setUint16),
      _2307: Function.prototype.call.bind(DataView.prototype.getInt16),
      _2308: Function.prototype.call.bind(DataView.prototype.setInt16),
      _2309: Function.prototype.call.bind(DataView.prototype.getUint32),
      _2310: Function.prototype.call.bind(DataView.prototype.setUint32),
      _2311: Function.prototype.call.bind(DataView.prototype.getInt32),
      _2312: Function.prototype.call.bind(DataView.prototype.setInt32),
      _2315: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      _2316: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      _2317: Function.prototype.call.bind(DataView.prototype.getFloat32),
      _2318: Function.prototype.call.bind(DataView.prototype.setFloat32),
      _2319: Function.prototype.call.bind(DataView.prototype.getFloat64),
      _2320: Function.prototype.call.bind(DataView.prototype.setFloat64),
      _2321: Function.prototype.call.bind(Number.prototype.toString),
      _2322: Function.prototype.call.bind(BigInt.prototype.toString),
      _2323: Function.prototype.call.bind(Number.prototype.toString),
      _2324: (d, digits) => d.toFixed(digits),
      _2330: (x0,x1) => x0.getContext(x1),
      _2346: () => globalThis.document,
      _2348: () => globalThis.console,
      _2353: (x0,x1) => { x0.height = x1 },
      _2355: (x0,x1) => { x0.width = x1 },
      _2357: (x0,x1) => { x0.pointerEvents = x1 },
      _2366: x0 => x0.style,
      _2369: x0 => x0.src,
      _2370: (x0,x1) => { x0.src = x1 },
      _2371: x0 => x0.naturalWidth,
      _2372: x0 => x0.naturalHeight,
      _2387: (x0,x1) => x0.error(x1),
      _2392: x0 => x0.status,
      _2393: (x0,x1) => { x0.responseType = x1 },
      _2395: x0 => x0.response,
      _2444: (x0,x1) => { x0.responseType = x1 },
      _2445: x0 => x0.response,
      _2533: (x0,x1) => { x0.oncancel = x1 },
      _2539: (x0,x1) => { x0.onchange = x1 },
      _2579: (x0,x1) => { x0.onerror = x1 },
      _2952: (x0,x1) => { x0.src = x1 },
      _2963: x0 => x0.width,
      _2965: x0 => x0.height,
      _3449: (x0,x1) => { x0.accept = x1 },
      _3463: x0 => x0.files,
      _3489: (x0,x1) => { x0.multiple = x1 },
      _3507: (x0,x1) => { x0.type = x1 },
      _3757: (x0,x1) => { x0.src = x1 },
      _3759: (x0,x1) => { x0.type = x1 },
      _3767: (x0,x1) => { x0.crossOrigin = x1 },
      _3769: (x0,x1) => { x0.text = x1 },
      _3777: (x0,x1) => { x0.charset = x1 },
      _3801: x0 => x0.width,
      _3802: (x0,x1) => { x0.width = x1 },
      _3803: x0 => x0.height,
      _3804: (x0,x1) => { x0.height = x1 },
      _4225: () => globalThis.window,
      _4269: x0 => x0.location,
      _4288: x0 => x0.navigator,
      _4545: x0 => x0.indexedDB,
      _4550: x0 => x0.trustedTypes,
      _4551: x0 => x0.sessionStorage,
      _4552: x0 => x0.localStorage,
      _4567: x0 => x0.hostname,
      _4661: x0 => x0.mediaDevices,
      _4678: x0 => x0.vendor,
      _4728: x0 => x0.data,
      _4765: (x0,x1) => { x0.onmessage = x1 },
      _5104: x0 => x0.readyState,
      _5113: x0 => x0.protocol,
      _5117: (x0,x1) => { x0.binaryType = x1 },
      _5120: x0 => x0.code,
      _5121: x0 => x0.reason,
      _6272: x0 => x0.destination,
      _6276: x0 => x0.state,
      _6277: x0 => x0.audioWorklet,
      _6380: (x0,x1) => { x0.fftSize = x1 },
      _6381: x0 => x0.frequencyBinCount,
      _6383: (x0,x1) => { x0.minDecibels = x1 },
      _6385: (x0,x1) => { x0.maxDecibels = x1 },
      _6387: (x0,x1) => { x0.smoothingTimeConstant = x1 },
      _6641: x0 => x0.port,
      _6780: x0 => x0.type,
      _6781: x0 => x0.target,
      _6821: x0 => x0.signal,
      _6833: x0 => x0.length,
      _6893: () => globalThis.document,
      _6973: x0 => x0.body,
      _6975: x0 => x0.head,
      _7306: x0 => x0.id,
      _7307: (x0,x1) => { x0.id = x1 },
      _7334: x0 => x0.children,
      _8653: x0 => x0.value,
      _8655: x0 => x0.done,
      _8835: x0 => x0.size,
      _8836: x0 => x0.type,
      _8843: x0 => x0.name,
      _8844: x0 => x0.lastModified,
      _8849: x0 => x0.length,
      _8855: x0 => x0.result,
      _9224: x0 => x0.mimeType,
      _9225: x0 => x0.state,
      _9229: (x0,x1) => { x0.onstop = x1 },
      _9231: (x0,x1) => { x0.ondataavailable = x1 },
      _9256: x0 => x0.data,
      _9346: x0 => x0.url,
      _9348: x0 => x0.status,
      _9350: x0 => x0.statusText,
      _9351: x0 => x0.headers,
      _9352: x0 => x0.body,
      _10399: x0 => x0.sampleRate,
      _10411: x0 => x0.channelCount,
      _10801: x0 => x0.result,
      _10802: x0 => x0.error,
      _10807: (x0,x1) => { x0.onsuccess = x1 },
      _10809: (x0,x1) => { x0.onerror = x1 },
      _10829: x0 => x0.name,
      _10848: x0 => x0.name,
      _10850: x0 => x0.keyPath,
      _10853: x0 => x0.autoIncrement,
      _10882: x0 => x0.error,
      _10884: (x0,x1) => { x0.onabort = x1 },
      _10886: (x0,x1) => { x0.oncomplete = x1 },
      _10888: (x0,x1) => { x0.onerror = x1 },
      _12936: x0 => x0.name,
      _12937: x0 => x0.message,
      _13652: () => globalThis.console,
      _13679: x0 => x0.name,
      _13680: x0 => x0.message,
      _13681: x0 => x0.code,
      _13683: x0 => x0.customData,

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
