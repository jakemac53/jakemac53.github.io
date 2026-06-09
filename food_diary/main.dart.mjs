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
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.clientX,
      AE: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.J(f,arguments.length,x0) }),
      AF: x0 => x0.tiltY,
      AG: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.O(f,arguments.length,x0) }),
      AH: x0 => x0.unlock(),
      AI: () => globalThis.WeakRef,
      AJ: x0 => x0.vendor,
      AK: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      AL: (x0,x1,x2,x3,x4,x5,x6) => globalThis.Module_soloud._play(x0,x1,x2,x3,x4,x5,x6),
      AM: x0 => x0.getAudioTracks(),
      AN: (x0,x1) => { x0.fftSize = x1 },
      AO: (x0,x1,x2) => x0.createPolicy(x1,x2),
      AP: x0 => x0.factorId,
      AQ: x0 => globalThis.firebase_auth.getAdditionalUserInfo(x0),
      AR: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.w(f,arguments.length,x0) }),
      AS: x0 => globalThis.firebase_firestore.getDocsFromCache(x0),
      B: o => o,
      BB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI16ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      BC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      BD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      BE: x0 => x0.matches,
      BF: x0 => x0.tiltX,
      BG: x0 => x0.now(),
      BH: (x0,x1) => x0.lock(x1),
      BI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      BJ: x0 => x0.navigator,
      BK: (x0,x1) => { x0.responseType = x1 },
      BL: (x0,x1) => globalThis.Module_soloud.getValue(x0,x1),
      BM: x0 => x0.stop(),
      BN: (x0,x1) => { x0.maxDecibels = x1 },
      BO: (x0,x1) => x0.createScriptURL(x1),
      BP: x0 => x0.displayName,
      BQ: (x0,x1,x2) => globalThis.firebase_auth.createUserWithEmailAndPassword(x0,x1,x2),
      BR: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.x(f,arguments.length,x0) }),
      BS: x0 => x0.path,
      C: () => new Error().stack,
      CB: x0 => new Uint16Array(x0),
      CC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      CD: x0 => x0.getBoundingClientRect(),
      CE: (x0,x1) => x0.matchMedia(x1),
      CF: x0 => x0.pointerType,
      CG: x0 => x0.performance,
      CH: x0 => x0.orientation,
      CI: (a, s, e) => a.slice(s, e),
      CJ: () => globalThis.window,
      CK: () => new XMLHttpRequest(),
      CL: x0 => globalThis.Module_soloud._free(x0),
      CM: (o,s,v) => o[s] = v,
      CN: (x0,x1) => { x0.minDecibels = x1 },
      CO: (x0,x1) => { x0.nonce = x1 },
      CP: x0 => x0.hints,
      CQ: (x0,x1,x2) => globalThis.firebase_auth.signInWithEmailAndPassword(x0,x1,x2),
      CR: (x0,x1,x2,x3) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2,x3),
      CS: (x0,x1) => globalThis.firebase_firestore.collection(x0,x1),
      D: Function.prototype.call.bind(Number.prototype.toString),
      DB: x0 => new Int32Array(x0),
      DC: (x0,x1) => x0.querySelector(x1),
      DD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      DE: x0 => x0.matches,
      DF: x0 => x0.pointerId,
      DG: (d, digits) => d.toFixed(digits),
      DH: (x0,x1) => x0.querySelector(x1),
      DI: x0 => x0.message,
      DJ: (x0,x1) => x0.getRandomValues(x1),
      DK: (x0,x1,x2) => x0.open(x1,x2),
      DL: (x0,x1) => globalThis.Module_soloud._setWaveformFreq(x0,x1),
      DM: () => Symbol("jsBoxedDartObjectProperty"),
      DN: x0 => x0.channelCount,
      DO: (x0,x1) => x0.querySelectorAll(x1),
      DP: x0 => x0.tenantId,
      DQ: (x0,x1,x2) => globalThis.firebase_auth.sendPasswordResetEmail(x0,x1,x2),
      DR: (x0,x1,x2) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2),
      DS: x0 => x0.length,
      E: Function.prototype.call.bind(BigInt.prototype.toString),
      EB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      EC: (x0,x1) => x0.item(x1),
      ED: s => new Date(s * 1000).getTimezoneOffset() * 60,
      EE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      EF: x0 => x0.getCoalescedEvents(),
      EG: x0 => x0.maxHeight,
      EH: (x0,x1) => { x0.title = x1 },
      EI: x0 => x0.protocol,
      EJ: () => globalThis.crypto,
      EK: x0 => x0.close(),
      EL: (x0,x1,x2,x3,x4) => globalThis.Module_soloud._loadWaveform(x0,x1,x2,x3,x4),
      EM: x0 => x0.mediaDevices,
      EN: (x0,x1) => { x0.onstop = x1 },
      EO: (x0,x1) => x0.item(x1),
      EP: x0 => x0.phoneNumber,
      EQ: x0 => x0.currentUser,
      ER: x0 => globalThis.firebase_firestore.deleteDoc(x0),
      ES: x0 => x0.getReader(),
      F: s => JSON.stringify(s),
      FB: x0 => new Uint32Array(x0),
      FC: x0 => x0.length,
      FD: Date.now,
      FE: f => f.dartFunction,
      FF: (x0,x1) => x0.getModifierState(x1),
      FG: x0 => x0.maxWidth,
      FH: (x0,x1) => x0.vibrate(x1),
      FI: (x0,x1,x2) => x0.close(x1,x2),
      FJ: l => new DataView(new ArrayBuffer(l)),
      FK: x0 => x0.message,
      FL: (x0,x1,x2) => globalThis.Module_soloud.setValue(x0,x1,x2),
      FM: x0 => x0.state,
      FN: (x0,x1) => globalThis.jsFixWebmDuration(x0,x1),
      FO: x0 => x0.nonce,
      FP: x0 => x0.email,
      FQ: (x0,x1) => globalThis.firebase_auth.signInWithPopup(x0,x1),
      FR: () => globalThis.firebase_firestore.updateDoc,
      FS: x0 => x0.value,
      G: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      GB: x0 => new Float32Array(x0),
      GC: (x0,x1) => x0.querySelectorAll(x1),
      GD: (handle) => clearTimeout(handle),
      GE: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.K(f,arguments.length,x0) }),
      GF: s => s.trimLeft(),
      GG: x0 => x0.minHeight,
      GH: x0 => x0.arrayBuffer(),
      GI: x0 => x0.close(),
      GJ: x0 => x0.naturalHeight,
      GK: x0 => x0.name,
      GL: (x0,x1,x2) => globalThis.Module_soloud._addAudioDataStream(x0,x1,x2),
      GM: x0 => x0.permissions,
      GN: x0 => x0.mimeType,
      GO: x0 => x0.length,
      GP: (x0,x1) => globalThis.firebase_auth.getMultiFactorResolver(x0,x1),
      GQ: x0 => x0.call(),
      GR: x0 => globalThis.firebase_firestore.Timestamp.fromMillis(x0),
      GS: x0 => x0.done,
      H: o => String(o),
      HB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      HC: (x0,x1) => x0.getAttribute(x1),
      HD: (x0,x1) => x0.closest(x1),
      HE: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports.L(f,arguments.length,x0,x1) }),
      HF: (x0,x1) => x0[x1],
      HG: x0 => x0.minWidth,
      HH: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      HI: (x0,x1) => x0.send(x1),
      HJ: x0 => x0.naturalWidth,
      HK: (x0,x1) => ({keyPath: x0,autoIncrement: x1}),
      HL: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => globalThis.Module_soloud._setBufferStream(x0,x1,x2,x3,x4,x5,x6,x7,x8),
      HM: (x0,x1) => x0.createMediaStreamSource(x1),
      HN: (x0,x1) => { x0.ondataavailable = x1 },
      HO: x0 => x0.document,
      HP: x0 => x0.customData,
      HQ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.o(f,arguments.length,x0) }),
      HR: (module,f) => finalizeWrapper(f, function() { return module.exports.y(f,arguments.length) }),
      HS: x0 => x0.read(),
      I: Function.prototype.call.bind(Number.prototype.toString),
      IB: x0 => new Float64Array(x0),
      IC: x0 => x0.remove(),
      ID: x0 => x0.bottom,
      IE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      IF: x0 => x0.index,
      IG: (x0,x1) => x0.removeProperty(x1),
      IH: x0 => x0.status,
      II: () => new Array(),
      IJ: (x0,x1) => x0.createElement(x1),
      IK: (x0,x1,x2) => x0.createObjectStore(x1,x2),
      IL: () => globalThis.Module_soloud._getVisualizationEnabled(),
      IM: (x0,x1) => x0.connect(x1),
      IN: x0 => x0.size,
      IO: (x0,x1) => { x0.src = x1 },
      IP: x0 => x0.message,
      IQ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.p(f,arguments.length,x0) }),
      IR: x0 => new firebase_firestore.FieldPath(x0),
      IS: x0 => x0.body,
      J: Function.prototype.call.bind(String.prototype.indexOf),
      JB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      JC: (x0,x1) => x0.appendChild(x1),
      JD: x0 => x0.top,
      JE: (o, i) => o[i],
      JF: (x0,x1) => x0.exec(x1),
      JG: (x0,x1) => x0.add(x1),
      JH: (x0,x1) => x0.fetch(x1),
      JI: (x0,x1) => new WebSocket(x0,x1),
      JJ: (x0,x1) => { x0.pointerEvents = x1 },
      JK: x0 => x0.autoIncrement,
      JL: (x0,x1,x2,x3) => globalThis.Module_soloud._initEngine(x0,x1,x2,x3),
      JM: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.b(f,arguments.length,x0) }),
      JN: x0 => x0.data,
      JO: (x0,x1) => { x0.defer = x1 },
      JP: x0 => x0.code,
      JQ: (x0,x1,x2) => x0.onIdTokenChanged(x1,x2),
      JR: (x0,x1) => new firebase_firestore.FieldPath(x0,x1),
      JS: (x0,x1) => new OffscreenCanvas(x0,x1),
      K: (s, p, i) => s.lastIndexOf(p, i),
      KB: x0 => new ArrayBuffer(x0),
      KC: (x0,x1) => x0.append(x1),
      KD: x0 => x0.right,
      KE: o => o.length,
      KF: s => s.toUpperCase(),
      KG: x0 => x0.data,
      KH: x0 => x0.content,
      KI: x0 => x0.reason,
      KJ: (x0,x1) => { x0.height = x1 },
      KK: x0 => x0.keyPath,
      KL: () => globalThis.Module_soloud._createWorkerInWasm(),
      KM: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.c(f,arguments.length,x0) }),
      KN: x0 => globalThis.MediaRecorder.isTypeSupported(x0),
      KO: (x0,x1) => { x0.async = x1 },
      KP: x0 => x0.idToken,
      KQ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.q(f,arguments.length,x0) }),
      KR: (x0,x1,x2) => new firebase_firestore.FieldPath(x0,x1,x2),
      KS: x0 => x0.assetBase,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      LC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      LD: x0 => x0.left,
      LE: o => {
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
      LF: x0 => x0.length,
      LG: (x0,x1) => { x0.scrollTop = x1 },
      LH: x0 => x0.document,
      LI: x0 => x0.code,
      LJ: (x0,x1) => { x0.width = x1 },
      LK: x0 => x0.name,
      LL: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.Z(f,arguments.length,x0) }),
      LM: (x0,x1) => { x0.onmessage = x1 },
      LN: x0 => x0.disconnect(),
      LO: x0 => x0.trustedTypes,
      LP: x0 => x0.secret,
      LQ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.r(f,arguments.length,x0) }),
      LR: (x0,x1,x2,x3) => new firebase_firestore.FieldPath(x0,x1,x2,x3),
      LS: x0 => x0.loader,
      M: (l, r) => l === r,
      MB: (x0,x1,x2) => new DataView(x0,x1,x2),
      MC: x0 => x0.style,
      MD: x0 => x0.clientY,
      ME: x0 => x0.language,
      MF: x0 => x0.flags,
      MG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      MH: () => typeof dartUseDateNowForTicks !== "undefined",
      MI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      MJ: x0 => x0.style,
      MK: (x0,x1) => x0.get(x1),
      ML: (x0,x1) => { x0.onmessage = x1 },
      MM: x0 => x0.port,
      MN: x0 => x0.state,
      MO: x0 => x0.trustedTypes,
      MP: x0 => x0.accessToken,
      MQ: (x0,x1,x2) => x0.onAuthStateChanged(x1,x2),
      MR: (x0,x1,x2,x3,x4) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4),
      MS: () => globalThis._flutter,
      N: x0 => x0.random(),
      NB: (o, p) => o[p],
      NC: x0 => x0.debugShowSemanticsNodes,
      ND: x0 => x0.clientX,
      NE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      NF: (a, s) => a.join(s),
      NG: (x0,x1) => { x0.value = x1 },
      NH: () => Date.now(),
      NI: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      NJ: (x0,x1) => { x0.src = x1 },
      NK: x0 => x0.getTime(),
      NL: () => globalThis.Module_soloud.wasmWorker,
      NM: x0 => x0.destination,
      NN: (x0,x1) => x0.querySelector(x1),
      NO: (module,f) => finalizeWrapper(f, function() { return module.exports.k(f,arguments.length) }),
      NP: x0 => x0.signInMethod,
      NQ: x0 => globalThis.firebase_auth.signInAnonymously(x0),
      NR: (x0,x1,x2,x3,x4,x5) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5),
      O: o => o,
      OB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      OC: o => o,
      OD: x0 => x0.changedTouches,
      OE: () => globalThis.window.FinalizationRegistry,
      OF: (x0,x1) => x0.error(x1),
      OG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      OH: () => 1000 * performance.now(),
      OI: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.P(f,arguments.length,x0) }),
      OJ: () => globalThis.document,
      OK: x0 => globalThis.Object.keys(x0),
      OL: (x0,x1,x2) => x0.insertBefore(x1,x2),
      OM: (x0,x1) => x0.addModule(x1),
      ON: (x0,x1) => x0.append(x1),
      OO: x0 => { globalThis.onGoogleLibraryLoad = x0 },
      OP: x0 => x0.providerId,
      OQ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.s(f,arguments.length,x0) }),
      OR: (x0,x1,x2,x3,x4,x5,x6) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6),
      P: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      PB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      PC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      PD: x0 => x0.offsetY,
      PE: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.M(f,arguments.length,x0) }),
      PF: () => globalThis.console,
      PG: (x0,x1) => { x0.value = x1 },
      PH: x0 => new Uint8Array(x0),
      PI: (o, t) => typeof o === t,
      PJ: x0 => x0.src,
      PK: x0 => x0.length,
      PL: x0 => x0.id,
      PM: x0 => ({parameterData: x0}),
      PN: x0 => x0.body,
      PO: x0 => x0.measurementId,
      PP: x0 => x0.signOut(),
      PQ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.t(f,arguments.length,x0) }),
      PR: (x0,x1,x2,x3,x4,x5,x6,x7) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7),
      Q: () => globalThis.Math,
      QB: o => o.byteOffset,
      QC: (x0,x1) => x0.warn(x1),
      QD: x0 => x0.offsetX,
      QE: x0 => new window.FinalizationRegistry(x0),
      QF: s => s.trimRight(),
      QG: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      QH: (x0,x1,x2) => x0.slice(x1,x2),
      QI: x0 => x0.data,
      QJ: (x0,x1) => x0.revokeObjectURL(x1),
      QK: (x0,x1,x2) => x0.transaction(x1,x2),
      QL: x0 => x0.offsetHeight,
      QM: (x0,x1,x2) => new AudioWorkletNode(x0,x1,x2),
      QN: x0 => globalThis.URL.revokeObjectURL(x0),
      QO: x0 => x0.appId,
      QP: (x0,x1,x2) => ({errorMap: x0,persistence: x1,popupRedirectResolver: x2}),
      QQ: (x0,x1) => globalThis.firebase_auth.connectAuthEmulator(x0,x1),
      QR: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8),
      R: s => printToConsole(s),
      RB: o => o.buffer,
      RC: x0 => x0.console,
      RD: x0 => x0.type,
      RE: (x0,x1) => x0.unregister(x1),
      RF: x0 => x0.blur(),
      RG: x0 => x0.value,
      RH: (x0,x1) => x0.decode(x1),
      RI: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.Q(f,arguments.length,x0) }),
      RJ: (x0,x1) => { x0.src = x1 },
      RK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.U(f,arguments.length,x0) }),
      RL: x0 => x0.offsetWidth,
      RM: x0 => x0.audioWorklet,
      RN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.f(f,arguments.length,x0) }),
      RO: x0 => x0.messagingSenderId,
      RP: (x0,x1) => globalThis.firebase_auth.initializeAuth(x0,x1),
      RQ: x0 => x0.hostname,
      RR: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9),
      S: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      SB: Function.prototype.call.bind(DataView.prototype.getUint8),
      SC: () => globalThis.window,
      SD: x0 => x0.maxTouchPoints,
      SE: (x0,x1) => x0.contains(x1),
      SF: x0 => x0.button,
      SG: x0 => x0.selectionDirection,
      SH: (x0,x1) => x0.adoptText(x1),
      SI: x0 => x0.readyState,
      SJ: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      SK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.V(f,arguments.length,x0) }),
      SL: x0 => x0.stopPropagation(),
      SM: x0 => ({sampleRate: x0}),
      SN: (x0,x1,x2,x3) => x0.toBlob(x1,x2,x3),
      SO: x0 => x0.authDomain,
      SP: () => globalThis.firebase_auth.browserPopupRedirectResolver,
      SQ: x0 => x0.location,
      SR: () => globalThis.firebase_firestore.documentId(),
      T: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      TB: (b, o) => new DataView(b, o),
      TC: (o, c) => o instanceof c,
      TD: x0 => x0.platform,
      TE: (s) => +s,
      TF: x0 => x0.innerHeight,
      TG: x0 => x0.selectionStart,
      TH: x0 => x0.first(),
      TI: (x0,x1) => { x0.binaryType = x1 },
      TJ: x0 => x0.naturalHeight,
      TK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.W(f,arguments.length,x0) }),
      TL: x0 => x0.disabled,
      TM: x0 => new AudioContext(x0),
      TN: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      TO: x0 => x0.projectId,
      TP: () => globalThis.firebase_auth.debugErrorMap,
      TQ: x0 => x0.token,
      TR: (x0,x1) => new firebase_firestore.GeoPoint(x0,x1),
      U: (x0,x1) => x0.didCreateEngineInitializer(x1),
      UB: (b, o, l) => new DataView(b, o, l),
      UC: (string, token) => string.split(token),
      UD: x0 => x0.body,
      UE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      UF: x0 => x0.innerWidth,
      UG: x0 => x0.selectionEnd,
      UH: x0 => x0.next(),
      UI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      UJ: x0 => x0.naturalWidth,
      UK: (x0,x1) => { x0.oncomplete = x1 },
      UL: (x0,x1) => { x0.min = x1 },
      UM: () => new AudioContext(),
      UN: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      UO: x0 => x0.name,
      UP: () => globalThis.firebase_auth.browserSessionPersistence,
      UQ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.u(f,arguments.length,x0) }),
      UR: x0 => globalThis.firebase_firestore.vector(x0),
      V: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.C(f,arguments.length,x0) }),
      VB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      VC: o => o instanceof Array,
      VD: () => globalThis.document,
      VE: s => s.trim(),
      VF: x0 => x0.height,
      VG: x0 => x0.value,
      VH: x0 => x0.current(),
      VI: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      VJ: x0 => x0.decode(),
      VK: (x0,x1) => { x0.onabort = x1 },
      VL: (x0,x1) => { x0.max = x1 },
      VM: x0 => x0.sampleRate,
      VN: x0 => x0.height,
      VO: x0 => x0.code,
      VP: () => globalThis.firebase_auth.browserLocalPersistence,
      VQ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.v(f,arguments.length,x0) }),
      VR: x0 => globalThis.firebase_firestore.Bytes.fromUint8Array(x0),
      W: (module,f) => finalizeWrapper(f, function() { return module.exports.D(f,arguments.length) }),
      WB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      WC: (a, i) => a[i],
      WD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      WE: x0 => x0.classList,
      WF: x0 => x0.width,
      WG: x0 => x0.selectionDirection,
      WH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      WI: (a, b) => a == b ? 0 : (a > b ? 1 : -1),
      WJ: (x0,x1) => { x0.decoding = x1 },
      WK: (x0,x1) => { x0.onerror = x1 },
      WL: (x0,x1) => { x0.disabled = x1 },
      WM: x0 => x0.getSettings(),
      WN: x0 => x0.width,
      WO: x0 => x0.name,
      WP: () => globalThis.firebase_auth.indexedDBLocalPersistence,
      WQ: (x0,x1,x2) => globalThis.firebase_app_check.onTokenChanged(x0,x1,x2),
      WR: (x0,x1,x2) => globalThis.firebase_firestore.setDoc(x0,x1,x2),
      X: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      XB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      XC: a => a.length,
      XD: x0 => x0.hasFocus(),
      XE: x0 => x0.preventDefault(),
      XF: x0 => x0.clientHeight,
      XG: x0 => x0.selectionStart,
      XH: x0 => x0.v8BreakIterator,
      XI: x0 => x0.pop(),
      XJ: (x0,x1) => { x0.crossOrigin = x1 },
      XK: x0 => x0.message,
      XL: (x0,x1) => { x0.scrollLeft = x1 },
      XM: (x0,x1) => x0.removeTrack(x1),
      XN: (x0,x1) => x0.getContext(x1),
      XO: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      XP: x0 => x0.tenantId,
      XQ: x0 => new firebase_app_check.ReCaptchaV3Provider(x0),
      XR: (x0,x1) => globalThis.firebase_firestore.setDoc(x0,x1),
      Y: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports.E(f,arguments.length,x0,x1) }),
      YB: (t, s) => t.set(s),
      YC: (x0,x1) => x0.test(x1),
      YD: x0 => x0.relatedTarget,
      YE: x0 => x0.parent,
      YF: x0 => x0.clientWidth,
      YG: x0 => x0.selectionEnd,
      YH: () => globalThis.Intl,
      YI: x0 => x0.abort(),
      YJ: (x0,x1) => x0.createObjectURL(x1),
      YK: x0 => x0.error,
      YL: (x0,x1) => { x0.spellcheck = x1 },
      YM: x0 => x0.close(),
      YN: (x0,x1) => { x0.height = x1 },
      YO: (x0,x1) => globalThis.firebase_core.initializeApp(x0,x1),
      YP: (x0,x1) => globalThis.firebase_auth.linkWithCredential(x0,x1),
      YQ: x0 => new firebase_app_check.ReCaptchaEnterpriseProvider(x0),
      YR: x0 => ({merge: x0}),
      Z: x0 => new Promise(x0),
      ZB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      ZC: x0 => x0.userAgent,
      ZD: x0 => x0.shiftKey,
      ZE: x0 => x0.timeStamp,
      ZF: (x0,x1) => { x0.content = x1 },
      ZG: x0 => x0.keyCode,
      ZH: (x0,x1) => x0.segment(x1),
      ZI: () => new AbortController(),
      ZJ: x0 => x0.URL,
      ZK: (x0,x1) => x0.objectStore(x1),
      ZL: (x0,x1) => { x0.disabled = x1 },
      ZM: (x0,x1) => x0.warn(x1),
      ZN: (x0,x1) => { x0.width = x1 },
      ZO: x0 => x0.storageBucket,
      ZP: (x0,x1) => globalThis.firebase_auth.EmailAuthProvider.credential(x0,x1),
      ZQ: x0 => ({provider: x0}),
      ZR: x0 => globalThis.firebase_firestore.getDoc(x0),
      a: (x0,x1,x2) => x0.call(x1,x2),
      aB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      aC: x0 => x0.navigator,
      aD: (decoder, codeUnits) => decoder.decode(codeUnits),
      aE: (x0,x1) => x0.hasAttribute(x1),
      aF: (x0,x1) => { x0.name = x1 },
      aG: (x0,x1) => x0.scrollIntoView(x1),
      aH: x0 => x0.index,
      aI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      aJ: x0 => new Blob(x0),
      aK: x0 => new Date(x0),
      aL: (x0,x1) => x0.transferFromImageBitmap(x1),
      aM: () => globalThis.console,
      aN: x0 => x0.height,
      aO: x0 => x0.databaseURL,
      aP: (x0,x1) => globalThis.firebase_auth.linkWithPopup(x0,x1),
      aQ: (x0,x1) => globalThis.firebase_app_check.initializeAppCheck(x0,x1),
      aR: x0 => globalThis.firebase_firestore.getDocFromServer(x0),
      b: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      bB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      bC: Function.prototype.call.bind(String.prototype.toLowerCase),
      bD: () => new TextDecoder("utf-8", {fatal: true}),
      bE: x0 => x0.buttons,
      bF: x0 => x0.head,
      bG: x0 => x0.multiViewEnabled,
      bH: x0 => x0.next(),
      bI: (x0,x1) => globalThis.fetch(x0,x1),
      bJ: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      bK: (o, p, v) => o[p] = v,
      bL: (x0,x1) => x0.getContext(x1),
      bM: x0 => x0.state,
      bN: x0 => x0.width,
      bO: x0 => x0.apiKey,
      bP: (x0,x1) => x0.setCustomParameters(x1),
      bQ: x0 => x0.localStorage,
      bR: x0 => globalThis.firebase_firestore.getDocFromCache(x0),
      c: x0 => new Array(x0),
      cB: Function.prototype.call.bind(DataView.prototype.getUint32),
      cC: Object.is,
      cD: () => new TextDecoder("utf-8", {fatal: false}),
      cE: x0 => x0.ctrlKey,
      cF: (x0,x1) => x0.removeChild(x1),
      cG: (x0,x1) => x0.replaceWith(x1),
      cH: x0 => x0.value,
      cI: (x0,x1) => x0.get(x1),
      cJ: x0 => new window.ImageDecoder(x0),
      cK: x0 => x0.name,
      cL: (x0,x1) => { x0.height = x1 },
      cM: x0 => globalThis.URL.createObjectURL(x0),
      cN: x0 => x0.remove(),
      cO: x0 => x0.options,
      cP: (x0,x1) => x0.addScope(x1),
      cQ: (x0,x1) => x0.delete(x1),
      cR: x0 => x0.source,
      d: o => [o],
      dB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      dC: x0 => x0.vendor,
      dD: (a, i, v) => a[i] = v,
      dE: x0 => x0.y,
      dF: x0 => x0.firstChild,
      dG: (x0,x1) => { x0.type = x1 },
      dH: x0 => x0.done,
      dI: (module,f) => finalizeWrapper(f, function(x0,x1,x2) { return module.exports.R(f,arguments.length,x0,x1,x2) }),
      dJ: x0 => x0.name,
      dK: x0 => x0.result,
      dL: (x0,x1) => { x0.width = x1 },
      dM: x0 => ({type: x0}),
      dN: (x0,x1) => { x0.src = x1 },
      dO: x0 => globalThis.firebase_core.getApp(x0),
      dP: () => new firebase_auth.GoogleAuthProvider(),
      dQ: (x0,x1) => globalThis.firebase_firestore.doc(x0,x1),
      dR: x0 => ({source: x0}),
      e: (o0, o1) => [o0, o1],
      eB: Function.prototype.call.bind(DataView.prototype.getInt32),
      eC: (x0,x1) => x0.createTextNode(x1),
      eD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      eE: x0 => x0.x,
      eF: x0 => x0.viewConstraints,
      eG: (x0,x1) => { x0.className = x1 },
      eH: (o, m, a) => o[m].apply(o, a),
      eI: (x0,x1) => x0.forEach(x1),
      eJ: x0 => x0.repetitionCount,
      eK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.X(f,arguments.length,x0) }),
      eL: x0 => x0.height,
      eM: (x0,x1) => new Blob(x0,x1),
      eN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.g(f,arguments.length,x0) }),
      eO: () => globalThis.firebase_core.getApp(),
      eP: x0 => x0.providerId,
      eQ: x0 => x0.commit(),
      eR: x0 => x0.metadata,
      f: (o0, o1, o2) => [o0, o1, o2],
      fB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      fC: (x0,x1) => { x0.id = x1 },
      fD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI16ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      fE: x0 => x0.scrollTop,
      fF: x0 => x0.hostElement,
      fG: (x0,x1) => { x0.tabIndex = x1 },
      fH: x0 => x0.iterator,
      fI: x0 => x0.name,
      fJ: x0 => x0.frameCount,
      fK: (x0,x1) => { x0.onerror = x1 },
      fL: x0 => x0.width,
      fM: (x0,x1) => x0.appendChild(x1),
      fN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.h(f,arguments.length,x0) }),
      fO: () => globalThis.firebase_core.SDK_VERSION,
      fP: x0 => x0.uid,
      fQ: x0 => globalThis.firebase_firestore.writeBatch(x0),
      fR: x0 => x0.doc,
      g: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      gB: o => o instanceof Uint16Array,
      gC: (x0,x1) => { x0.nonce = x1 },
      gD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      gE: x0 => x0.offsetTop,
      gF: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.N(f,arguments.length,x0) }),
      gG: (x0,x1) => { x0.name = x1 },
      gH: () => globalThis.Symbol,
      gI: x0 => x0.statusText,
      gJ: x0 => x0.selectedTrack,
      gK: x0 => x0.error,
      gL: x0 => x0.rasterEndMilliseconds,
      gM: (x0,x1) => x0.createElement(x1),
      gN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.i(f,arguments.length,x0) }),
      gO: (x0,x1) => x0.getItem(x1),
      gP: x0 => x0.providerData,
      gQ: (x0,x1) => globalThis.firebase_firestore.getFirestore(x0,x1),
      gR: x0 => x0.newIndex,
      h: (x0,x1,x2) => { x0[x1] = x2 },
      hB: Function.prototype.call.bind(DataView.prototype.getUint16),
      hC: x0 => x0.nonce,
      hD: x0 => x0.visibilityState,
      hE: x0 => x0.scrollLeft,
      hF: x0 => ({runApp: x0}),
      hG: (x0,x1) => { x0.placeholder = x1 },
      hH: (x0,x1) => new Intl.Segmenter(x0,x1),
      hI: x0 => x0.url,
      hJ: x0 => x0.completed,
      hK: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.Y(f,arguments.length,x0) }),
      hL: x0 => x0.rasterStartMilliseconds,
      hM: (x0,x1) => x0.append(x1),
      hN: (x0,x1) => { x0.onerror = x1 },
      hO: (x0,x1,x2) => x0.setItem(x1,x2),
      hP: x0 => x0.tenantId,
      hQ: x0 => ({serverTimestamps: x0}),
      hR: x0 => x0.oldIndex,
      i: (o, p) => o[p],
      iB: o => o instanceof Int16Array,
      iC: () => globalThis.window.flutterConfiguration,
      iD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      iE: x0 => x0.offsetLeft,
      iF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      iG: (x0,x1) => { x0.autocomplete = x1 },
      iH: x0 => x0.Segmenter,
      iI: x0 => x0.status,
      iJ: x0 => x0.ready,
      iK: (x0,x1) => { x0.onsuccess = x1 },
      iL: x0 => x0.imageBitmaps,
      iM: x0 => x0.head,
      iN: (x0,x1) => { x0.oncancel = x1 },
      iO: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      iP: x0 => x0.refreshToken,
      iQ: x0 => x0.fromCache,
      iR: x0 => x0.type,
      j: () => globalThis,
      jB: Function.prototype.call.bind(DataView.prototype.getInt16),
      jC: (x0,x1) => x0.attachShadow(x1),
      jD: x0 => x0.disconnect(),
      jE: x0 => x0.offsetParent,
      jF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      jG: (x0,x1) => { x0.name = x1 },
      jH: x0 => x0.buffer,
      jI: x0 => x0.getReader(),
      jJ: x0 => x0.tracks,
      jK: x0 => x0.target,
      jL: x0 => x0.canvasKitMaximumSurfaces,
      jM: () => globalThis.document,
      jN: (x0,x1) => { x0.onchange = x1 },
      jO: x0 => x0.sessionStorage,
      jP: x0 => x0.photoURL,
      jQ: x0 => x0.hasPendingWrites,
      jR: x0 => x0.docChanges(),
      k: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.F(f,arguments.length,x0) }),
      kB: o => o instanceof Uint8ClampedArray,
      kC: (x0,x1) => x0.createElement(x1),
      kD: x0 => new Intl.Locale(x0),
      kE: (o, p, r) => o.replace(p, () => r),
      kF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      kG: (x0,x1) => { x0.placeholder = x1 },
      kH: x0 => x0.wasmMemory,
      kI: x0 => x0.read(),
      kJ: x0 => x0.close(),
      kK: x0 => x0.indexedDB,
      kL: x0 => x0.nextSibling,
      kM: (x0,x1) => { x0.src = x1 },
      kN: x0 => x0.type,
      kO: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports.l(f,arguments.length,x0,x1) }),
      kP: x0 => x0.phoneNumber,
      kQ: x0 => x0.metadata,
      kR: x0 => x0.docs,
      l: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.G(f,arguments.length,x0) }),
      lB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      lC: x0 => x0.scale,
      lD: x0 => x0.region,
      lE: (x0,x1) => { x0.lastIndex = x1 },
      lF: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      lG: (x0,x1) => { x0.action = x1 },
      lH: () => globalThis.window._flutter_skwasmInstance,
      lI: x0 => x0.value,
      lJ: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      lK: (x0,x1,x2) => x0.put(x1,x2),
      lL: (x0,x1) => x0.debug(x1),
      lM: (x0,x1) => { x0.id = x1 },
      lN: x0 => x0.lastModified,
      lO: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.m(f,arguments.length,x0) }),
      lP: x0 => x0.lastSignInTime,
      lQ: x0 => x0.toArray(),
      lR: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.z(f,arguments.length,x0) }),
      m: (x0,x1) => ({addView: x0,removeView: x1}),
      mB: Function.prototype.call.bind(DataView.prototype.setInt32),
      mC: x0 => x0.visualViewport,
      mD: x0 => x0.script,
      mE: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      mF: x0 => x0.history,
      mG: (x0,x1) => { x0.method = x1 },
      mH: () => new TextDecoder(),
      mI: x0 => x0.done,
      mJ: (x0,x1) => x0.decode(x1),
      mK: (x0,x1) => x0.getAllKeys(x1),
      mL: x0 => x0.hostElement,
      mM: (x0,x1) => { x0.charset = x1 },
      mN: x0 => x0.name,
      mO: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      mP: x0 => x0.creationTime,
      mQ: x0 => x0.toUint8Array(),
      mR: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.AB(f,arguments.length,x0) }),
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setUint32),
      nC: x0 => x0.devicePixelRatio,
      nD: x0 => x0.language,
      nE: o => o instanceof RegExp,
      nF: x0 => x0.search,
      nG: (x0,x1) => { x0.noValidate = x1 },
      nH: (a, i) => a.splice(i, 1),
      nI: x0 => x0.cancel(),
      nJ: x0 => x0.displayHeight,
      nK: x0 => x0.input,
      nL: x0 => x0.location,
      nM: (x0,x1) => { x0.type = x1 },
      nN: (x0,x1) => x0.item(x1),
      nO: (x0,x1) => x0.createScriptURL(x1),
      nP: x0 => x0.metadata,
      nQ: () => globalThis.firebase_firestore.Bytes,
      nR: (x0,x1,x2) => globalThis.firebase_firestore.where(x0,x1,x2),
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setInt16),
      oC: x0 => x0.height,
      oD: x0 => x0.languages,
      oE: x0 => x0.dotAll,
      oF: x0 => x0.location,
      oG: (x0,x1) => x0.removeAttribute(x1),
      oH: a => a.pop(),
      oI: x0 => x0.body,
      oJ: x0 => x0.displayWidth,
      oK: (o, p) => p in o,
      oL: (x0,x1) => x0.getModifierState(x1),
      oM: (x0,x1) => x0.item(x1),
      oN: x0 => x0.length,
      oO: (x0,x1,x2) => x0.createScript(x1,x2),
      oP: x0 => x0.isAnonymous,
      oQ: () => globalThis.firebase_firestore.VectorValue,
      oR: (x0,x1) => globalThis.firebase_firestore.query(x0,x1),
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint16),
      pC: x0 => x0.width,
      pD: (x0,x1) => x0.observe(x1),
      pE: x0 => x0.unicode,
      pF: x0 => x0.pathname,
      pG: x0 => x0.isConnected,
      pH: (map, o, v) => map.set(o, v),
      pI: x0 => x0.headers,
      pJ: x0 => x0.duration,
      pK: x0 => x0.groups,
      pL: x0 => x0.metaKey,
      pM: x0 => x0.id,
      pN: x0 => x0.files,
      pO: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.n(f,arguments.length,x0) }),
      pP: x0 => x0.emailVerified,
      pQ: x0 => x0.longitude,
      pR: () => globalThis.firebase_firestore.and,
      q: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.H(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setUint8),
      qC: x0 => x0.screen,
      qD: (module,f) => finalizeWrapper(f, function(x0,x1) { return module.exports.I(f,arguments.length,x0,x1) }),
      qE: x0 => x0.ignoreCase,
      qF: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      qG: x0 => x0.click(),
      qH: (map, o) => map.get(o),
      qI: x0 => x0.signal,
      qJ: x0 => x0.image,
      qK: () => globalThis.window.navigator.userAgent,
      qL: x0 => x0.altKey,
      qM: x0 => x0.length,
      qN: (x0,x1) => x0.replaceChildren(x1),
      qO: (o, p) => delete o[p],
      qP: x0 => x0.email,
      qQ: x0 => x0.latitude,
      qR: () => globalThis.firebase_firestore.or,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.setInt8),
      rC: (string, times) => string.repeat(times),
      rD: x0 => new ResizeObserver(x0),
      rE: x0 => x0.multiline,
      rF: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      rG: (x0,x1) => x0.getElementsByClassName(x1),
      rH: () => new WeakMap(),
      rI: () => new FileReader(),
      rJ: () => globalThis.window.ImageDecoder,
      rK: () => globalThis.Module_soloud._disposeAllSound(),
      rL: x0 => x0.ctrlKey,
      rM: x0 => x0.children,
      rN: x0 => x0.click(),
      rO: (x0,x1) => { x0.text = x1 },
      rP: x0 => x0.displayName,
      rQ: () => globalThis.firebase_firestore.GeoPoint,
      rR: x0 => globalThis.firebase_firestore.limitToLast(x0),
      s: () => ({}),
      sB: Function.prototype.call.bind(DataView.prototype.getInt8),
      sC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      sD: (x0,x1) => x0.getPropertyValue(x1),
      sE: (o, p, r) => o.replaceAll(p, () => r),
      sF: o => Object.keys(o),
      sG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      sH: x0 => x0.debugSkipFontRetryDelay,
      sI: (x0,x1) => x0.readAsArrayBuffer(x1),
      sJ: x0 => x0.decode(),
      sK: () => globalThis.Module_soloud._dispose(),
      sL: x0 => x0.isComposing,
      sM: x0 => x0.stop(),
      sN: (x0,x1,x2) => x0.setAttribute(x1,x2),
      sO: (x0,x1) => { x0.text = x1 },
      sP: x0 => globalThis.firebase_auth.multiFactor(x0),
      sQ: (x0,x1) => x0.data(x1),
      sR: x0 => globalThis.firebase_firestore.limit(x0),
      t: (o, p, v) => o[p] = v,
      tB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      tC: x0 => x0.tabIndex,
      tD: x0 => globalThis.parseFloat(x0),
      tE: x0 => x0.deltaMode,
      tF: x0 => x0.state,
      tG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      tH: (x0,x1,x2) => x0.set(x1,x2),
      tI: x0 => x0.result,
      tJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      tK: x0 => globalThis.Module_soloud._setDataIsEnded(x0),
      tL: x0 => x0.code,
      tM: (x0,x1,x2) => ({mimeType: x0,audioBitsPerSecond: x1,bitsPerSecond: x2}),
      tN: (x0,x1) => { x0.accept = x1 },
      tO: x0 => x0.trustedTypes,
      tP: x0 => x0.toJSON(),
      tQ: x0 => x0.nanoseconds,
      tR: () => globalThis.firebase_firestore.endBefore,
      u: () => [],
      uB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      uC: (x0,x1) => x0.contains(x1),
      uD: (x0,x1) => x0.getComputedStyle(x1),
      uE: x0 => x0.deltaY,
      uF: x0 => x0.hash,
      uG: (x0,x1) => x0.dispatchEvent(x1),
      uH: x0 => x0.fontFallbackBaseUrl,
      uI: () => new XMLHttpRequest(),
      uJ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.S(f,arguments.length,x0) }),
      uK: () => globalThis.Module_soloud._isInited(),
      uL: x0 => x0.repeat,
      uM: (x0,x1) => new MediaRecorder(x0,x1),
      uN: (x0,x1) => { x0.multiple = x1 },
      uO: (x0,x1) => { x0.crossOrigin = x1 },
      uP: x0 => x0.user,
      uQ: x0 => x0.seconds,
      uR: () => globalThis.firebase_firestore.endAt,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.activeElement,
      vD: x0 => x0.documentElement,
      vE: x0 => x0.deltaX,
      vF: x0 => x0.state,
      vG: (x0,x1) => x0.createEvent(x1),
      vH: (handle) => clearInterval(handle),
      vI: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      vJ: (x0,x1,x2) => x0.addEventListener(x1,x2),
      vK: x0 => globalThis.Module_soloud._disposeSound(x0),
      vL: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.a(f,arguments.length,x0) }),
      vM: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.d(f,arguments.length,x0) }),
      vN: (x0,x1) => { x0.type = x1 },
      vO: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromError(x0),
      vP: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromResult(x0),
      vQ: () => globalThis.firebase_firestore.Timestamp,
      vR: () => globalThis.firebase_firestore.startAfter,
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.parentNode,
      wD: x0 => x0.computedStyleMap(),
      wE: x0 => x0.wheelDeltaY,
      wF: (x0,x1) => x0.go(x1),
      wG: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      wH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      wI: x0 => x0.send(),
      wJ: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.T(f,arguments.length,x0) }),
      wK: x0 => globalThis.Module_soloud._stop(x0),
      wL: x0 => ({name: x0}),
      wM: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.e(f,arguments.length,x0) }),
      wN: (x0,x1) => x0.getAttribute(x1),
      wO: x0 => x0.session,
      wP: x0 => x0.username,
      wQ: () => globalThis.firebase_firestore.DocumentReference,
      wR: () => globalThis.firebase_firestore.startAt,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.tagName,
      xD: (x0,x1) => x0.get(x1),
      xE: x0 => x0.wheelDeltaX,
      xF: x0 => x0.parentElement,
      xG: x0 => x0.readText(),
      xH: () => Date.now(),
      xI: x0 => x0.type,
      xJ: x0 => x0.send(),
      xK: x0 => globalThis.Module_soloud._getIsValidVoiceHandle(x0),
      xL: (x0,x1) => x0.query(x1),
      xM: (x0,x1) => x0.start(x1),
      xN: (x0,x1) => x0.debug(x1),
      xO: x0 => x0.phoneNumber,
      xP: x0 => x0.providerId,
      xQ: x0 => x0.path,
      xR: (x0,x1) => globalThis.firebase_firestore.orderBy(x0,x1),
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.target,
      yD: (o, p) => p in o,
      yE: x0 => x0.key,
      yF: (x0,x1) => x0.querySelectorAll(x1),
      yG: x0 => x0.clipboard,
      yH: x0 => new WeakRef(x0),
      yI: x0 => x0.response,
      yJ: x0 => x0.status,
      yK: (x0,x1) => globalThis.Module_soloud._setRelativePlaySpeed(x0,x1),
      yL: x0 => ({audio: x0}),
      yM: x0 => x0.createAnalyser(),
      yN: (module,f) => finalizeWrapper(f, function(x0) { return module.exports.j(f,arguments.length,x0) }),
      yO: x0 => x0.uid,
      yP: x0 => x0.profile,
      yQ: x0 => x0.ref,
      yR: x0 => globalThis.firebase_firestore.getDocs(x0),
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.clientY,
      zD: (x0,x1) => { x0.textContent = x1 },
      zE: x0 => x0.pressure,
      zF: (x0,x1) => x0.requestAnimationFrame(x1),
      zG: (x0,x1) => x0.writeText(x1),
      zH: x0 => x0.deref(),
      zI: (x0,x1) => { x0.responseType = x1 },
      zJ: x0 => x0.response,
      zK: x0 => globalThis.Module_soloud._malloc(x0),
      zL: (x0,x1) => x0.getUserMedia(x1),
      zM: (x0,x1) => { x0.smoothingTimeConstant = x1 },
      zN: x0 => ({createScriptURL: x0}),
      zO: x0 => x0.enrollmentTime,
      zP: x0 => x0.isNewUser,
      zQ: (x0,x1) => ({includeMetadataChanges: x0,source: x1}),
      zR: x0 => globalThis.firebase_firestore.getDocsFromServer(x0),

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
    dartInstance.exports.B(dartInstance);

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
