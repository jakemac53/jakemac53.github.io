// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
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
            AB: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      AC: Function.prototype.call.bind(DataView.prototype.setInt32),
      AD: x0 => x0.maxTouchPoints,
      AE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      AF: (x0,x1) => { x0.method = x1 },
      AG: x0 => x0.changedTouches,
      AH: (x0,x1,x2) => x0.start(x1,x2),
      AI: x0 => x0.index,
      AJ: (x0,x1) => { x0.disabled = x1 },
      B: s => printToConsole(s),
      BB: x0 => x0.flags,
      BC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      BD: x0 => x0.platform,
      BE: (x0,x1) => x0.removeProperty(x1),
      BF: (x0,x1) => { x0.noValidate = x1 },
      BG: x0 => x0.offsetY,
      BH: x0 => x0.currentTime,
      BI: x0 => x0.next(),
      BJ: (x0,x1) => x0.transferFromImageBitmap(x1),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      CC: o => o instanceof Uint16Array,
      CD: x0 => x0.navigator,
      CE: (x0,x1) => x0.appendChild(x1),
      CF: (x0,x1) => x0.removeAttribute(x1),
      CG: x0 => x0.offsetX,
      CH: (x0,x1) => { x0.loop = x1 },
      CI: x0 => x0.value,
      CJ: (x0,x1) => x0.getContext(x1),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: o => o instanceof RegExp,
      DC: Function.prototype.call.bind(DataView.prototype.getUint16),
      DD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      DE: x0 => x0.debugShowSemanticsNodes,
      DF: x0 => x0.isConnected,
      DG: x0 => x0.type,
      DH: (x0,x1) => { x0.buffer = x1 },
      DI: x0 => x0.done,
      DJ: (x0,x1) => { x0.height = x1 },
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: (a, i, v) => a[i] = v,
      EC: Function.prototype.call.bind(DataView.prototype.setUint16),
      ED: Date.now,
      EE: (o, c) => o instanceof c,
      EF: x0 => x0.click(),
      EG: x0 => x0.hasFocus(),
      EH: x0 => x0.duration,
      EI: (o, m, a) => o[m].apply(o, a),
      EJ: (x0,x1) => { x0.width = x1 },
      F: () => new Error().stack,
      FB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      FC: o => o instanceof Int16Array,
      FD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      FE: x0 => x0.vendor,
      FF: (x0,x1) => x0.getElementsByClassName(x1),
      FG: x0 => x0.shiftKey,
      FH: (x0,x1,x2,x3) => x0.createBuffer(x1,x2,x3),
      FI: x0 => x0.iterator,
      FJ: x0 => x0.height,
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      GC: Function.prototype.call.bind(DataView.prototype.getInt16),
      GD: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      GE: (x0,x1) => x0.createTextNode(x1),
      GF: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      GG: x0 => x0.visibilityState,
      GH: (x0,x1) => x0.getChannelData(x1),
      GI: () => globalThis.Symbol,
      GJ: x0 => x0.width,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      HC: Function.prototype.call.bind(DataView.prototype.setInt16),
      HD: x0 => x0.style,
      HE: (x0,x1) => { x0.nonce = x1 },
      HF: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      HG: x0 => x0.disconnect(),
      HH: (x0,x1) => x0.set(x1),
      HI: (x0,x1) => new Intl.Segmenter(x0,x1),
      HJ: x0 => x0.rasterEndMilliseconds,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: Function.prototype.call.bind(String.prototype.toLowerCase),
      IC: o => o instanceof Uint8ClampedArray,
      ID: (x0,x1) => x0.createElement(x1),
      IE: x0 => x0.nonce,
      IF: (x0,x1) => x0.contains(x1),
      IG: x0 => new Intl.Locale(x0),
      IH: () => new AudioContext(),
      II: x0 => x0.Segmenter,
      IJ: x0 => x0.rasterStartMilliseconds,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      JC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      JD: x0 => x0.body,
      JE: () => globalThis.window.flutterConfiguration,
      JF: (s) => +s,
      JG: x0 => x0.region,
      JH: x0 => x0.createGain(),
      JI: x0 => x0.buffer,
      JJ: x0 => x0.imageBitmaps,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: () => ({}),
      KC: Function.prototype.call.bind(DataView.prototype.setInt8),
      KD: x0 => x0.remove(),
      KE: (x0,x1) => x0.attachShadow(x1),
      KF: x0 => x0.target,
      KG: x0 => x0.script,
      KH: x0 => x0.resume(),
      KI: x0 => x0.wasmMemory,
      KJ: x0 => x0.canvasKitMaximumSurfaces,
      L: o => o === undefined,
      LB: (o, p, v) => o[p] = v,
      LC: Function.prototype.call.bind(DataView.prototype.getInt8),
      LD: (x0,x1) => x0.getPropertyValue(x1),
      LE: x0 => x0.preventDefault(),
      LF: (x0,x1) => x0.dispatchEvent(x1),
      LG: x0 => x0.language,
      LH: x0 => x0.state,
      LI: () => globalThis.window._flutter_skwasmInstance,
      LJ: (a, i) => a.splice(i, 1),
      M: o => String(o),
      MB: () => [],
      MC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      MD: (x0,x1) => x0.warn(x1),
      ME: (x0,x1) => x0.contains(x1),
      MF: (x0,x1) => x0.createEvent(x1),
      MG: x0 => x0.languages,
      MH: x0 => x0.destination,
      MI: () => new TextDecoder(),
      MJ: a => a.pop(),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (a, i) => a.push(i),
      NC: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      ND: x0 => x0.console,
      NE: (x0,x1) => x0.focus(x1),
      NF: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      NG: (x0,x1) => x0.observe(x1),
      NH: (x0,x1) => { x0.value = x1 },
      NI: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      NJ: x0 => x0.hostElement,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: b => !!b,
      OC: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      OD: (x0,x1) => { x0.id = x1 },
      OE: (x0,x1) => x0.closest(x1),
      OF: () => globalThis.window,
      OG: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      OH: x0 => x0.gain,
      OI: () => Date.now(),
      OJ: x0 => x0.location,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: x0 => new Int8Array(x0),
      PC: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      PD: s => s.trimLeft(),
      PE: (x0,x1) => x0.getAttribute(x1),
      PF: x0 => x0.readText(),
      PG: x0 => new ResizeObserver(x0),
      PH: x0 => x0.stop(),
      PI: (handle) => clearInterval(handle),
      PJ: (x0,x1) => x0.getModifierState(x1),
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      QC: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      QD: x0 => x0.unicode,
      QE: x0 => x0.activeElement,
      QF: x0 => x0.clipboard,
      QG: x0 => globalThis.parseFloat(x0),
      QH: x0 => x0.disconnect(),
      QI: x0 => x0.debugSkipFontRetryDelay,
      QJ: x0 => x0.metaKey,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: x0 => new Uint8Array(x0),
      RC: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      RD: x0 => x0.index,
      RE: (x0,x1) => x0.add(x1),
      RF: (x0,x1) => x0.writeText(x1),
      RG: (x0,x1) => x0.getComputedStyle(x1),
      RH: (x0,x1) => x0.send(x1),
      RI: (x0,x1,x2) => x0.set(x1,x2),
      RJ: x0 => x0.altKey,
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: x0 => new Uint8ClampedArray(x0),
      SC: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      SD: (x0,x1) => x0[x1],
      SE: x0 => x0.classList,
      SF: x0 => x0.unlock(),
      SG: x0 => x0.documentElement,
      SH: x0 => x0.readyState,
      SI: x0 => x0.fontFallbackBaseUrl,
      SJ: x0 => x0.ctrlKey,
      T: x0 => new Promise(x0),
      TB: x0 => new Int16Array(x0),
      TC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      TD: (x0,x1) => x0.exec(x1),
      TE: x0 => x0.data,
      TF: (x0,x1) => x0.lock(x1),
      TG: x0 => x0.computedStyleMap(),
      TH: (a, l) => a.length = l,
      TI: (o, p, v) => o[p] = v,
      TJ: x0 => x0.isComposing,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      UC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      UD: (x0,x1) => { x0.lastIndex = x1 },
      UE: x0 => x0.scrollTop,
      UF: x0 => x0.orientation,
      UG: (x0,x1) => x0.get(x1),
      UH: (x0,x1) => x0.start(x1),
      UI: x0 => x0.close(),
      UJ: x0 => x0.code,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: x0 => new Uint16Array(x0),
      VC: x0 => x0.history,
      VD: x0 => x0.dotAll,
      VE: (handle) => clearTimeout(handle),
      VF: (x0,x1) => x0.querySelector(x1),
      VG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      VH: x0 => x0.blur(),
      VI: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      VJ: x0 => x0.repeat,
      W: x0 => new Array(x0),
      WB: x0 => new Int32Array(x0),
      WC: x0 => x0.search,
      WD: x0 => x0.ignoreCase,
      WE: (x0,x1) => { x0.scrollTop = x1 },
      WF: (x0,x1) => { x0.content = x1 },
      WG: x0 => x0.matches,
      WH: x0 => x0.button,
      WI: () => globalThis.window,
      WJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      X: o => [o],
      XB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      XC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      XD: x0 => x0.multiline,
      XE: x0 => x0.tagName,
      XF: x0 => x0.head,
      XG: (x0,x1) => x0.matchMedia(x1),
      XH: x0 => x0.innerHeight,
      XI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      XJ: x0 => x0.length,
      Y: (o0, o1) => [o0, o1],
      YB: x0 => new Uint32Array(x0),
      YC: x0 => x0.location,
      YD: (o, p, r) => o.replace(p, () => r),
      YE: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      YF: (x0,x1) => { x0.name = x1 },
      YG: x0 => x0.matches,
      YH: x0 => x0.height,
      YI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      YJ: x0 => x0.getReader(),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: x0 => new Float32Array(x0),
      ZC: x0 => x0.pathname,
      ZD: (o, p, r) => o.replaceAll(p, () => r),
      ZE: (x0,x1) => { x0.value = x1 },
      ZF: (x0,x1) => { x0.title = x1 },
      ZG: x0 => x0.timeStamp,
      ZH: x0 => x0.clientHeight,
      ZI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ZJ: x0 => x0.value,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      aC: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      aD: x0 => x0.length,
      aE: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      aF: () => globalThis.document,
      aG: (x0,x1) => x0.hasAttribute(x1),
      aH: x0 => x0.innerWidth,
      aI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      aJ: x0 => x0.done,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: x0 => new Float64Array(x0),
      bC: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      bD: s => s.trim(),
      bE: (x0,x1) => { x0.value = x1 },
      bF: (x0,x1) => x0.vibrate(x1),
      bG: x0 => x0.buttons,
      bH: x0 => x0.width,
      bI: x0 => new WebSocket(x0),
      bJ: x0 => x0.read(),
      c: o => o,
      cB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      cC: o => Object.keys(o),
      cD: (a, s) => a.join(s),
      cE: x0 => x0.relatedTarget,
      cF: (o, p) => p in o,
      cG: x0 => x0.ctrlKey,
      cH: x0 => x0.clientWidth,
      cI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      cJ: x0 => x0.body,
      d: (o, p) => o[p],
      dB: x0 => new ArrayBuffer(x0),
      dC: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      dD: (x0,x1) => x0.error(x1),
      dE: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      dF: x0 => x0.arrayBuffer(),
      dG: x0 => x0.y,
      dH: (x0,x1) => x0.removeChild(x1),
      dI: (x0,x1,x2) => x0.addEventListener(x1,x2),
      dJ: (x0,x1) => new OffscreenCanvas(x0,x1),
      e: () => globalThis,
      eB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      eC: f => f.dartFunction,
      eD: () => globalThis.console,
      eE: x0 => x0.value,
      eF: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      eG: x0 => x0.x,
      eH: x0 => x0.firstChild,
      eI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      eJ: x0 => x0.assetBase,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: (x0,x1,x2) => new DataView(x0,x1,x2),
      fC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fD: s => s.trimRight(),
      fE: x0 => x0.selectionDirection,
      fF: x0 => x0.status,
      fG: x0 => x0.offsetTop,
      fH: x0 => x0.viewConstraints,
      fI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fJ: x0 => x0.loader,
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: (o, p) => o[p],
      gC: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      gD: (x0,x1) => x0.requestAnimationFrame(x1),
      gE: x0 => x0.selectionStart,
      gF: (x0,x1) => x0.fetch(x1),
      gG: x0 => x0.scrollLeft,
      gH: x0 => x0.hostElement,
      gI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gJ: () => globalThis._flutter,
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      hC: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      hD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hE: x0 => x0.selectionEnd,
      hF: x0 => x0.content,
      hG: x0 => x0.offsetLeft,
      hH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      iC: (o, i) => o[i],
      iD: x0 => x0.now(),
      iE: x0 => x0.value,
      iF: x0 => x0.document,
      iG: x0 => x0.offsetParent,
      iH: x0 => ({runApp: x0}),
      iI: (o, t) => typeof o === t,
      j: x0 => x0.random(),
      jB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      jC: o => o.length,
      jD: x0 => x0.performance,
      jE: x0 => x0.selectionDirection,
      jF: x0 => x0.language,
      jG: x0 => x0.deltaMode,
      jH: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      jI: x0 => x0.data,
      k: o => o,
      kB: o => o.byteOffset,
      kC: o => {
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
      kD: (a, l) => a.length = l,
      kE: x0 => x0.selectionStart,
      kF: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      kG: x0 => x0.deltaY,
      kH: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      kI: (a, i) => a.splice(i, 1)[0],
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: o => o.buffer,
      lC: x0 => x0.state,
      lD: (x0,x1) => x0.unregister(x1),
      lE: x0 => x0.selectionEnd,
      lF: (x0,x1) => x0.prepend(x1),
      lG: x0 => x0.deltaX,
      lH: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      lI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      m: () => globalThis.Math,
      mB: (b, o) => new DataView(b, o),
      mC: x0 => x0.hash,
      mD: () => globalThis.window.FinalizationRegistry,
      mE: x0 => x0.keyCode,
      mF: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      mG: x0 => x0.wheelDeltaY,
      mH: () => typeof dartUseDateNowForTicks !== "undefined",
      mI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      n: (string, token) => string.split(token),
      nB: (b, o, l) => new DataView(b, o, l),
      nC: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      nD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      nE: (x0,x1) => x0.scrollIntoView(x1),
      nF: (x0,x1) => x0.querySelector(x1),
      nG: x0 => x0.wheelDeltaX,
      nH: () => Date.now(),
      nI: () => globalThis.document,
      o: o => o instanceof Array,
      oB: Function.prototype.call.bind(DataView.prototype.getUint8),
      oC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      oD: x0 => new window.FinalizationRegistry(x0),
      oE: x0 => x0.multiViewEnabled,
      oF: (x0,x1) => x0.querySelectorAll(x1),
      oG: x0 => x0.key,
      oH: () => 1000 * performance.now(),
      oI: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      p: (a, i) => a[i],
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: x0 => x0.state,
      pD: x0 => x0.scale,
      pE: x0 => x0.parent,
      pF: x0 => x0.tabIndex,
      pG: x0 => x0.identifier,
      pH: x0 => new Uint8Array(x0),
      pI: (x0,x1,x2) => x0.insertBefore(x1,x2),
      q: a => a.length,
      qB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      qC: (x0,x1,x2) => x0.addEventListener(x1,x2),
      qD: x0 => x0.visualViewport,
      qE: (x0,x1) => x0.replaceWith(x1),
      qF: x0 => x0.parentNode,
      qG: x0 => x0.touches,
      qH: (x0,x1,x2) => x0.slice(x1,x2),
      qI: x0 => x0.id,
      r: (string, times) => string.repeat(times),
      rB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      rC: (x0,x1) => x0.go(x1),
      rD: x0 => x0.devicePixelRatio,
      rE: (x0,x1) => { x0.type = x1 },
      rF: x0 => x0.clientY,
      rG: x0 => x0.pressure,
      rH: (x0,x1) => x0.decode(x1),
      rI: x0 => x0.offsetHeight,
      s: (decoder, codeUnits) => decoder.decode(codeUnits),
      sB: (t, s) => t.set(s),
      sC: (x0,x1) => x0.append(x1),
      sD: (d, digits) => d.toFixed(digits),
      sE: (x0,x1) => { x0.className = x1 },
      sF: x0 => x0.clientX,
      sG: x0 => x0.tiltY,
      sH: (x0,x1) => x0.adoptText(x1),
      sI: x0 => x0.offsetWidth,
      t: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      tB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      tC: (x0,x1) => { x0.textContent = x1 },
      tD: x0 => x0.maxHeight,
      tE: (x0,x1) => { x0.tabIndex = x1 },
      tF: x0 => x0.getBoundingClientRect(),
      tG: x0 => x0.tiltX,
      tH: x0 => x0.first(),
      tI: x0 => x0.stopPropagation(),
      u: () => new TextDecoder("utf-8", {fatal: true}),
      uB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      uC: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      uD: x0 => x0.maxWidth,
      uE: (x0,x1) => { x0.name = x1 },
      uF: x0 => x0.bottom,
      uG: x0 => x0.pointerType,
      uH: x0 => x0.next(),
      uI: x0 => x0.disabled,
      v: () => new TextDecoder("utf-8", {fatal: false}),
      vB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      vC: x0 => x0.parentElement,
      vD: x0 => x0.minHeight,
      vE: (x0,x1) => { x0.placeholder = x1 },
      vF: x0 => x0.top,
      vG: x0 => x0.pointerId,
      vH: x0 => x0.current(),
      vI: (x0,x1) => { x0.min = x1 },
      w: s => s.toUpperCase(),
      wB: Function.prototype.call.bind(DataView.prototype.getUint32),
      wC: (x0,x1) => x0.querySelectorAll(x1),
      wD: x0 => x0.minWidth,
      wE: (x0,x1) => { x0.autocomplete = x1 },
      wF: x0 => x0.right,
      wG: x0 => x0.getCoalescedEvents(),
      wH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      wI: (x0,x1) => { x0.max = x1 },
      x: Object.is,
      xB: Function.prototype.call.bind(DataView.prototype.setUint32),
      xC: (x0,x1) => x0.item(x1),
      xD: x0 => x0.height,
      xE: (x0,x1) => { x0.name = x1 },
      xF: x0 => x0.left,
      xG: (x0,x1) => x0.getModifierState(x1),
      xH: x0 => x0.v8BreakIterator,
      xI: (x0,x1) => { x0.disabled = x1 },
      y: (x0,x1) => x0.test(x1),
      yB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      yC: x0 => x0.length,
      yD: x0 => x0.width,
      yE: (x0,x1) => { x0.placeholder = x1 },
      yF: x0 => x0.clientY,
      yG: x0 => x0.createBufferSource(),
      yH: () => globalThis.Intl,
      yI: (x0,x1) => { x0.scrollLeft = x1 },
      z: o => o,
      zB: Function.prototype.call.bind(DataView.prototype.getInt32),
      zC: x0 => x0.userAgent,
      zD: x0 => x0.screen,
      zE: (x0,x1) => { x0.action = x1 },
      zF: x0 => x0.clientX,
      zG: (x0,x1) => x0.connect(x1),
      zH: (x0,x1) => x0.segment(x1),
      zI: (x0,x1) => { x0.spellcheck = x1 },

    };

    const baseImports = {
      _: dart2wasm,
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
