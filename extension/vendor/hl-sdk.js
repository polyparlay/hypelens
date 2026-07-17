(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod3) => function __require() {
    try {
      return mod3 || (0, cb[__getOwnPropNames(cb)[0]])((mod3 = { exports: {} }).exports, mod3), mod3.exports;
    } catch (e) {
      throw mod3 = 0, e;
    }
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/@noble/curves/node_modules/@noble/hashes/esm/crypto.js
  var crypto2;
  var init_crypto = __esm({
    "node_modules/@noble/curves/node_modules/@noble/hashes/esm/crypto.js"() {
      crypto2 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
    }
  });

  // node_modules/@noble/curves/node_modules/@noble/hashes/esm/utils.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function anumber(n) {
    if (!Number.isSafeInteger(n) || n < 0)
      throw new Error("positive integer expected, got " + n);
  }
  function abytes(b, ...lengths) {
    if (!isBytes(b))
      throw new Error("Uint8Array expected");
    if (lengths.length > 0 && !lengths.includes(b.length))
      throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
  }
  function ahash(h) {
    if (typeof h !== "function" || typeof h.create !== "function")
      throw new Error("Hash should be wrapped by utils.createHasher");
    anumber(h.outputLen);
    anumber(h.blockLen);
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes(out);
    const min2 = instance.outputLen;
    if (out.length < min2) {
      throw new Error("digestInto() expects output buffer of length at least " + min2);
    }
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function rotr(word, shift) {
    return word << 32 - shift | word >>> shift;
  }
  function utf8ToBytes(str) {
    if (typeof str !== "string")
      throw new Error("string expected");
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function toBytes(data) {
    if (typeof data === "string")
      data = utf8ToBytes(data);
    abytes(data);
    return data;
  }
  function concatBytes(...arrays) {
    let sum2 = 0;
    for (let i = 0; i < arrays.length; i++) {
      const a = arrays[i];
      abytes(a);
      sum2 += a.length;
    }
    const res = new Uint8Array(sum2);
    for (let i = 0, pad2 = 0; i < arrays.length; i++) {
      const a = arrays[i];
      res.set(a, pad2);
      pad2 += a.length;
    }
    return res;
  }
  function createHasher(hashCons) {
    const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashCons();
    return hashC;
  }
  function randomBytes(bytesLength = 32) {
    if (crypto2 && typeof crypto2.getRandomValues === "function") {
      return crypto2.getRandomValues(new Uint8Array(bytesLength));
    }
    if (crypto2 && typeof crypto2.randomBytes === "function") {
      return Uint8Array.from(crypto2.randomBytes(bytesLength));
    }
    throw new Error("crypto.getRandomValues must be defined");
  }
  var Hash;
  var init_utils = __esm({
    "node_modules/@noble/curves/node_modules/@noble/hashes/esm/utils.js"() {
      init_crypto();
      Hash = class {
      };
    }
  });

  // node_modules/@noble/curves/esm/abstract/utils.js
  function isBytes2(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function abytes2(item) {
    if (!isBytes2(item))
      throw new Error("Uint8Array expected");
  }
  function abool(title, value) {
    if (typeof value !== "boolean")
      throw new Error(title + " boolean expected, got " + value);
  }
  function numberToHexUnpadded(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? "0" + hex : hex;
  }
  function hexToNumber(hex) {
    if (typeof hex !== "string")
      throw new Error("hex string expected, got " + typeof hex);
    return hex === "" ? _0n : BigInt("0x" + hex);
  }
  function bytesToHex(bytes) {
    abytes2(bytes);
    if (hasHexBuiltin)
      return bytes.toHex();
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += hexes[bytes[i]];
    }
    return hex;
  }
  function asciiToBase16(ch) {
    if (ch >= asciis._0 && ch <= asciis._9)
      return ch - asciis._0;
    if (ch >= asciis.A && ch <= asciis.F)
      return ch - (asciis.A - 10);
    if (ch >= asciis.a && ch <= asciis.f)
      return ch - (asciis.a - 10);
    return;
  }
  function hexToBytes(hex) {
    if (typeof hex !== "string")
      throw new Error("hex string expected, got " + typeof hex);
    if (hasHexBuiltin)
      return Uint8Array.fromHex(hex);
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
      throw new Error("hex string expected, got unpadded hex of length " + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
      const n1 = asciiToBase16(hex.charCodeAt(hi));
      const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
      if (n1 === void 0 || n2 === void 0) {
        const char = hex[hi] + hex[hi + 1];
        throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
      }
      array[ai] = n1 * 16 + n2;
    }
    return array;
  }
  function bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex(bytes));
  }
  function bytesToNumberLE(bytes) {
    abytes2(bytes);
    return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
  }
  function numberToBytesBE(n, len) {
    return hexToBytes(n.toString(16).padStart(len * 2, "0"));
  }
  function numberToBytesLE(n, len) {
    return numberToBytesBE(n, len).reverse();
  }
  function ensureBytes(title, hex, expectedLength) {
    let res;
    if (typeof hex === "string") {
      try {
        res = hexToBytes(hex);
      } catch (e) {
        throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
      }
    } else if (isBytes2(hex)) {
      res = Uint8Array.from(hex);
    } else {
      throw new Error(title + " must be hex string or Uint8Array");
    }
    const len = res.length;
    if (typeof expectedLength === "number" && len !== expectedLength)
      throw new Error(title + " of length " + expectedLength + " expected, got " + len);
    return res;
  }
  function concatBytes2(...arrays) {
    let sum2 = 0;
    for (let i = 0; i < arrays.length; i++) {
      const a = arrays[i];
      abytes2(a);
      sum2 += a.length;
    }
    const res = new Uint8Array(sum2);
    for (let i = 0, pad2 = 0; i < arrays.length; i++) {
      const a = arrays[i];
      res.set(a, pad2);
      pad2 += a.length;
    }
    return res;
  }
  function inRange(n, min2, max2) {
    return isPosBig(n) && isPosBig(min2) && isPosBig(max2) && min2 <= n && n < max2;
  }
  function aInRange(title, n, min2, max2) {
    if (!inRange(n, min2, max2))
      throw new Error("expected valid " + title + ": " + min2 + " <= n < " + max2 + ", got " + n);
  }
  function bitLen(n) {
    let len;
    for (len = 0; n > _0n; n >>= _1n, len += 1)
      ;
    return len;
  }
  function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    if (typeof hashLen !== "number" || hashLen < 2)
      throw new Error("hashLen must be a number");
    if (typeof qByteLen !== "number" || qByteLen < 2)
      throw new Error("qByteLen must be a number");
    if (typeof hmacFn !== "function")
      throw new Error("hmacFn must be a function");
    let v = u8n(hashLen);
    let k = u8n(hashLen);
    let i = 0;
    const reset = () => {
      v.fill(1);
      k.fill(0);
      i = 0;
    };
    const h = (...b) => hmacFn(k, v, ...b);
    const reseed = (seed = u8n(0)) => {
      k = h(u8fr([0]), seed);
      v = h();
      if (seed.length === 0)
        return;
      k = h(u8fr([1]), seed);
      v = h();
    };
    const gen2 = () => {
      if (i++ >= 1e3)
        throw new Error("drbg: tried 1000 values");
      let len = 0;
      const out = [];
      while (len < qByteLen) {
        v = h();
        const sl = v.slice();
        out.push(sl);
        len += v.length;
      }
      return concatBytes2(...out);
    };
    const genUntil = (seed, pred) => {
      reset();
      reseed(seed);
      let res = void 0;
      while (!(res = pred(gen2())))
        reseed();
      reset();
      return res;
    };
    return genUntil;
  }
  function validateObject(object, validators, optValidators = {}) {
    const checkField = (fieldName, type, isOptional) => {
      const checkVal = validatorFns[type];
      if (typeof checkVal !== "function")
        throw new Error("invalid validator function");
      const val = object[fieldName];
      if (isOptional && val === void 0)
        return;
      if (!checkVal(val, object)) {
        throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
      }
    };
    for (const [fieldName, type] of Object.entries(validators))
      checkField(fieldName, type, false);
    for (const [fieldName, type] of Object.entries(optValidators))
      checkField(fieldName, type, true);
    return object;
  }
  function memoized(fn) {
    const map = /* @__PURE__ */ new WeakMap();
    return (arg, ...args) => {
      const val = map.get(arg);
      if (val !== void 0)
        return val;
      const computed = fn(arg, ...args);
      map.set(arg, computed);
      return computed;
    };
  }
  var _0n, _1n, hasHexBuiltin, hexes, asciis, isPosBig, bitMask, u8n, u8fr, validatorFns;
  var init_utils2 = __esm({
    "node_modules/@noble/curves/esm/abstract/utils.js"() {
      _0n = /* @__PURE__ */ BigInt(0);
      _1n = /* @__PURE__ */ BigInt(1);
      hasHexBuiltin = // @ts-ignore
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function";
      hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
      asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
      isPosBig = (n) => typeof n === "bigint" && _0n <= n;
      bitMask = (n) => (_1n << BigInt(n)) - _1n;
      u8n = (len) => new Uint8Array(len);
      u8fr = (arr) => Uint8Array.from(arr);
      validatorFns = {
        bigint: (val) => typeof val === "bigint",
        function: (val) => typeof val === "function",
        boolean: (val) => typeof val === "boolean",
        string: (val) => typeof val === "string",
        stringOrUint8Array: (val) => typeof val === "string" || isBytes2(val),
        isSafeInteger: (val) => Number.isSafeInteger(val),
        array: (val) => Array.isArray(val),
        field: (val, object) => object.Fp.isValid(val),
        hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
      };
    }
  });

  // node_modules/@noble/curves/esm/abstract/modular.js
  function mod(a, b) {
    const result = a % b;
    return result >= _0n2 ? result : b + result;
  }
  function pow2(x, power, modulo) {
    let res = x;
    while (power-- > _0n2) {
      res *= res;
      res %= modulo;
    }
    return res;
  }
  function invert(number, modulo) {
    if (number === _0n2)
      throw new Error("invert: expected non-zero number");
    if (modulo <= _0n2)
      throw new Error("invert: expected positive modulus, got " + modulo);
    let a = mod(number, modulo);
    let b = modulo;
    let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
    while (a !== _0n2) {
      const q = b / a;
      const r = b % a;
      const m = x - u * q;
      const n = y - v * q;
      b = a, a = r, x = u, y = v, u = m, v = n;
    }
    const gcd = b;
    if (gcd !== _1n2)
      throw new Error("invert: does not exist");
    return mod(x, modulo);
  }
  function sqrt3mod4(Fp, n) {
    const p1div4 = (Fp.ORDER + _1n2) / _4n;
    const root = Fp.pow(n, p1div4);
    if (!Fp.eql(Fp.sqr(root), n))
      throw new Error("Cannot find square root");
    return root;
  }
  function sqrt5mod8(Fp, n) {
    const p5div8 = (Fp.ORDER - _5n) / _8n;
    const n2 = Fp.mul(n, _2n);
    const v = Fp.pow(n2, p5div8);
    const nv = Fp.mul(n, v);
    const i = Fp.mul(Fp.mul(nv, _2n), v);
    const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
    if (!Fp.eql(Fp.sqr(root), n))
      throw new Error("Cannot find square root");
    return root;
  }
  function tonelliShanks(P2) {
    if (P2 < BigInt(3))
      throw new Error("sqrt is not defined for small field");
    let Q = P2 - _1n2;
    let S = 0;
    while (Q % _2n === _0n2) {
      Q /= _2n;
      S++;
    }
    let Z = _2n;
    const _Fp = Field(P2);
    while (FpLegendre(_Fp, Z) === 1) {
      if (Z++ > 1e3)
        throw new Error("Cannot find square root: probably non-prime P");
    }
    if (S === 1)
      return sqrt3mod4;
    let cc = _Fp.pow(Z, Q);
    const Q1div2 = (Q + _1n2) / _2n;
    return function tonelliSlow(Fp, n) {
      if (Fp.is0(n))
        return n;
      if (FpLegendre(Fp, n) !== 1)
        throw new Error("Cannot find square root");
      let M = S;
      let c = Fp.mul(Fp.ONE, cc);
      let t = Fp.pow(n, Q);
      let R = Fp.pow(n, Q1div2);
      while (!Fp.eql(t, Fp.ONE)) {
        if (Fp.is0(t))
          return Fp.ZERO;
        let i = 1;
        let t_tmp = Fp.sqr(t);
        while (!Fp.eql(t_tmp, Fp.ONE)) {
          i++;
          t_tmp = Fp.sqr(t_tmp);
          if (i === M)
            throw new Error("Cannot find square root");
        }
        const exponent = _1n2 << BigInt(M - i - 1);
        const b = Fp.pow(c, exponent);
        M = i;
        c = Fp.sqr(b);
        t = Fp.mul(t, c);
        R = Fp.mul(R, b);
      }
      return R;
    };
  }
  function FpSqrt(P2) {
    if (P2 % _4n === _3n)
      return sqrt3mod4;
    if (P2 % _8n === _5n)
      return sqrt5mod8;
    return tonelliShanks(P2);
  }
  function validateField(field) {
    const initial = {
      ORDER: "bigint",
      MASK: "bigint",
      BYTES: "isSafeInteger",
      BITS: "isSafeInteger"
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
      map[val] = "function";
      return map;
    }, initial);
    return validateObject(field, opts);
  }
  function FpPow(Fp, num, power) {
    if (power < _0n2)
      throw new Error("invalid exponent, negatives unsupported");
    if (power === _0n2)
      return Fp.ONE;
    if (power === _1n2)
      return num;
    let p = Fp.ONE;
    let d = num;
    while (power > _0n2) {
      if (power & _1n2)
        p = Fp.mul(p, d);
      d = Fp.sqr(d);
      power >>= _1n2;
    }
    return p;
  }
  function FpInvertBatch(Fp, nums, passZero = false) {
    const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
    const multipliedAcc = nums.reduce((acc, num, i) => {
      if (Fp.is0(num))
        return acc;
      inverted[i] = acc;
      return Fp.mul(acc, num);
    }, Fp.ONE);
    const invertedAcc = Fp.inv(multipliedAcc);
    nums.reduceRight((acc, num, i) => {
      if (Fp.is0(num))
        return acc;
      inverted[i] = Fp.mul(acc, inverted[i]);
      return Fp.mul(acc, num);
    }, invertedAcc);
    return inverted;
  }
  function FpLegendre(Fp, n) {
    const p1mod2 = (Fp.ORDER - _1n2) / _2n;
    const powered = Fp.pow(n, p1mod2);
    const yes = Fp.eql(powered, Fp.ONE);
    const zero = Fp.eql(powered, Fp.ZERO);
    const no = Fp.eql(powered, Fp.neg(Fp.ONE));
    if (!yes && !zero && !no)
      throw new Error("invalid Legendre symbol result");
    return yes ? 1 : zero ? 0 : -1;
  }
  function nLength(n, nBitLength) {
    if (nBitLength !== void 0)
      anumber(nBitLength);
    const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return { nBitLength: _nBitLength, nByteLength };
  }
  function Field(ORDER, bitLen2, isLE3 = false, redef = {}) {
    if (ORDER <= _0n2)
      throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
    const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen2);
    if (BYTES > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    let sqrtP;
    const f = Object.freeze({
      ORDER,
      isLE: isLE3,
      BITS,
      BYTES,
      MASK: bitMask(BITS),
      ZERO: _0n2,
      ONE: _1n2,
      create: (num) => mod(num, ORDER),
      isValid: (num) => {
        if (typeof num !== "bigint")
          throw new Error("invalid field element: expected bigint, got " + typeof num);
        return _0n2 <= num && num < ORDER;
      },
      is0: (num) => num === _0n2,
      isOdd: (num) => (num & _1n2) === _1n2,
      neg: (num) => mod(-num, ORDER),
      eql: (lhs, rhs) => lhs === rhs,
      sqr: (num) => mod(num * num, ORDER),
      add: (lhs, rhs) => mod(lhs + rhs, ORDER),
      sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
      mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
      pow: (num, power) => FpPow(f, num, power),
      div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
      // Same as above, but doesn't normalize
      sqrN: (num) => num * num,
      addN: (lhs, rhs) => lhs + rhs,
      subN: (lhs, rhs) => lhs - rhs,
      mulN: (lhs, rhs) => lhs * rhs,
      inv: (num) => invert(num, ORDER),
      sqrt: redef.sqrt || ((n) => {
        if (!sqrtP)
          sqrtP = FpSqrt(ORDER);
        return sqrtP(f, n);
      }),
      toBytes: (num) => isLE3 ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
      fromBytes: (bytes) => {
        if (bytes.length !== BYTES)
          throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
        return isLE3 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
      },
      // TODO: we don't need it here, move out to separate fn
      invertBatch: (lst) => FpInvertBatch(f, lst),
      // We can't move this out because Fp6, Fp12 implement it
      // and it's unclear what to return in there.
      cmov: (a, b, c) => c ? b : a
    });
    return Object.freeze(f);
  }
  function getFieldBytesLength(fieldOrder) {
    if (typeof fieldOrder !== "bigint")
      throw new Error("field order must be bigint");
    const bitLength = fieldOrder.toString(2).length;
    return Math.ceil(bitLength / 8);
  }
  function getMinHashLength(fieldOrder) {
    const length = getFieldBytesLength(fieldOrder);
    return length + Math.ceil(length / 2);
  }
  function mapHashToField(key, fieldOrder, isLE3 = false) {
    const len = key.length;
    const fieldLen = getFieldBytesLength(fieldOrder);
    const minLen = getMinHashLength(fieldOrder);
    if (len < 16 || len < minLen || len > 1024)
      throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
    const num = isLE3 ? bytesToNumberLE(key) : bytesToNumberBE(key);
    const reduced = mod(num, fieldOrder - _1n2) + _1n2;
    return isLE3 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
  }
  var _0n2, _1n2, _2n, _3n, _4n, _5n, _8n, FIELD_FIELDS;
  var init_modular = __esm({
    "node_modules/@noble/curves/esm/abstract/modular.js"() {
      init_utils();
      init_utils2();
      _0n2 = BigInt(0);
      _1n2 = BigInt(1);
      _2n = /* @__PURE__ */ BigInt(2);
      _3n = /* @__PURE__ */ BigInt(3);
      _4n = /* @__PURE__ */ BigInt(4);
      _5n = /* @__PURE__ */ BigInt(5);
      _8n = /* @__PURE__ */ BigInt(8);
      FIELD_FIELDS = [
        "create",
        "isValid",
        "is0",
        "neg",
        "inv",
        "sqrt",
        "sqr",
        "eql",
        "add",
        "sub",
        "mul",
        "pow",
        "div",
        "addN",
        "subN",
        "mulN",
        "sqrN"
      ];
    }
  });

  // node_modules/@noble/curves/node_modules/@noble/hashes/esm/_md.js
  function setBigUint64(view, byteOffset, value, isLE3) {
    if (typeof view.setBigUint64 === "function")
      return view.setBigUint64(byteOffset, value, isLE3);
    const _32n3 = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n3 & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE3 ? 4 : 0;
    const l = isLE3 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE3);
    view.setUint32(byteOffset + l, wl, isLE3);
  }
  function Chi(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  var HashMD, SHA256_IV;
  var init_md = __esm({
    "node_modules/@noble/curves/node_modules/@noble/hashes/esm/_md.js"() {
      init_utils();
      HashMD = class extends Hash {
        constructor(blockLen, outputLen, padOffset, isLE3) {
          super();
          this.finished = false;
          this.length = 0;
          this.pos = 0;
          this.destroyed = false;
          this.blockLen = blockLen;
          this.outputLen = outputLen;
          this.padOffset = padOffset;
          this.isLE = isLE3;
          this.buffer = new Uint8Array(blockLen);
          this.view = createView(this.buffer);
        }
        update(data) {
          aexists(this);
          data = toBytes(data);
          abytes(data);
          const { view, buffer, blockLen } = this;
          const len = data.length;
          for (let pos = 0; pos < len; ) {
            const take = Math.min(blockLen - this.pos, len - pos);
            if (take === blockLen) {
              const dataView = createView(data);
              for (; blockLen <= len - pos; pos += blockLen)
                this.process(dataView, pos);
              continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
              this.process(view, 0);
              this.pos = 0;
            }
          }
          this.length += data.length;
          this.roundClean();
          return this;
        }
        digestInto(out) {
          aexists(this);
          aoutput(out, this);
          this.finished = true;
          const { buffer, view, blockLen, isLE: isLE3 } = this;
          let { pos } = this;
          buffer[pos++] = 128;
          clean(this.buffer.subarray(pos));
          if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
          }
          for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
          setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE3);
          this.process(view, 0);
          const oview = createView(out);
          const len = this.outputLen;
          if (len % 4)
            throw new Error("_sha2: outputLen should be aligned to 32bit");
          const outLen = len / 4;
          const state = this.get();
          if (outLen > state.length)
            throw new Error("_sha2: outputLen bigger than state");
          for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE3);
        }
        digest() {
          const { buffer, outputLen } = this;
          this.digestInto(buffer);
          const res = buffer.slice(0, outputLen);
          this.destroy();
          return res;
        }
        _cloneInto(to) {
          to || (to = new this.constructor());
          to.set(...this.get());
          const { blockLen, buffer, length, finished, destroyed, pos } = this;
          to.destroyed = destroyed;
          to.finished = finished;
          to.length = length;
          to.pos = pos;
          if (length % blockLen)
            to.buffer.set(buffer);
          return to;
        }
        clone() {
          return this._cloneInto();
        }
      };
      SHA256_IV = /* @__PURE__ */ Uint32Array.from([
        1779033703,
        3144134277,
        1013904242,
        2773480762,
        1359893119,
        2600822924,
        528734635,
        1541459225
      ]);
    }
  });

  // node_modules/@noble/curves/node_modules/@noble/hashes/esm/sha2.js
  var SHA256_K, SHA256_W, SHA256, sha256;
  var init_sha2 = __esm({
    "node_modules/@noble/curves/node_modules/@noble/hashes/esm/sha2.js"() {
      init_md();
      init_utils();
      SHA256_K = /* @__PURE__ */ Uint32Array.from([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      SHA256_W = /* @__PURE__ */ new Uint32Array(64);
      SHA256 = class extends HashMD {
        constructor(outputLen = 32) {
          super(64, outputLen, 8, false);
          this.A = SHA256_IV[0] | 0;
          this.B = SHA256_IV[1] | 0;
          this.C = SHA256_IV[2] | 0;
          this.D = SHA256_IV[3] | 0;
          this.E = SHA256_IV[4] | 0;
          this.F = SHA256_IV[5] | 0;
          this.G = SHA256_IV[6] | 0;
          this.H = SHA256_IV[7] | 0;
        }
        get() {
          const { A, B, C, D: D2, E, F, G, H } = this;
          return [A, B, C, D2, E, F, G, H];
        }
        // prettier-ignore
        set(A, B, C, D2, E, F, G, H) {
          this.A = A | 0;
          this.B = B | 0;
          this.C = C | 0;
          this.D = D2 | 0;
          this.E = E | 0;
          this.F = F | 0;
          this.G = G | 0;
          this.H = H | 0;
        }
        process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
          for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
            const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
            SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
          }
          let { A, B, C, D: D2, E, F, G, H } = this;
          for (let i = 0; i < 64; i++) {
            const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
            const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
            const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
            const T2 = sigma0 + Maj(A, B, C) | 0;
            H = G;
            G = F;
            F = E;
            E = D2 + T1 | 0;
            D2 = C;
            C = B;
            B = A;
            A = T1 + T2 | 0;
          }
          A = A + this.A | 0;
          B = B + this.B | 0;
          C = C + this.C | 0;
          D2 = D2 + this.D | 0;
          E = E + this.E | 0;
          F = F + this.F | 0;
          G = G + this.G | 0;
          H = H + this.H | 0;
          this.set(A, B, C, D2, E, F, G, H);
        }
        roundClean() {
          clean(SHA256_W);
        }
        destroy() {
          this.set(0, 0, 0, 0, 0, 0, 0, 0);
          clean(this.buffer);
        }
      };
      sha256 = /* @__PURE__ */ createHasher(() => new SHA256());
    }
  });

  // node_modules/@noble/curves/node_modules/@noble/hashes/esm/hmac.js
  var HMAC, hmac;
  var init_hmac = __esm({
    "node_modules/@noble/curves/node_modules/@noble/hashes/esm/hmac.js"() {
      init_utils();
      HMAC = class extends Hash {
        constructor(hash, _key) {
          super();
          this.finished = false;
          this.destroyed = false;
          ahash(hash);
          const key = toBytes(_key);
          this.iHash = hash.create();
          if (typeof this.iHash.update !== "function")
            throw new Error("Expected instance of class which extends utils.Hash");
          this.blockLen = this.iHash.blockLen;
          this.outputLen = this.iHash.outputLen;
          const blockLen = this.blockLen;
          const pad2 = new Uint8Array(blockLen);
          pad2.set(key.length > blockLen ? hash.create().update(key).digest() : key);
          for (let i = 0; i < pad2.length; i++)
            pad2[i] ^= 54;
          this.iHash.update(pad2);
          this.oHash = hash.create();
          for (let i = 0; i < pad2.length; i++)
            pad2[i] ^= 54 ^ 92;
          this.oHash.update(pad2);
          clean(pad2);
        }
        update(buf) {
          aexists(this);
          this.iHash.update(buf);
          return this;
        }
        digestInto(out) {
          aexists(this);
          abytes(out, this.outputLen);
          this.finished = true;
          this.iHash.digestInto(out);
          this.oHash.update(out);
          this.oHash.digestInto(out);
          this.destroy();
        }
        digest() {
          const out = new Uint8Array(this.oHash.outputLen);
          this.digestInto(out);
          return out;
        }
        _cloneInto(to) {
          to || (to = Object.create(Object.getPrototypeOf(this), {}));
          const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
          to = to;
          to.finished = finished;
          to.destroyed = destroyed;
          to.blockLen = blockLen;
          to.outputLen = outputLen;
          to.oHash = oHash._cloneInto(to.oHash);
          to.iHash = iHash._cloneInto(to.iHash);
          return to;
        }
        clone() {
          return this._cloneInto();
        }
        destroy() {
          this.destroyed = true;
          this.oHash.destroy();
          this.iHash.destroy();
        }
      };
      hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
      hmac.create = (hash, key) => new HMAC(hash, key);
    }
  });

  // node_modules/@noble/curves/esm/abstract/curve.js
  function constTimeNegate(condition, item) {
    const neg = item.negate();
    return condition ? neg : item;
  }
  function validateW(W, bits) {
    if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
      throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
  }
  function calcWOpts(W, scalarBits) {
    validateW(W, scalarBits);
    const windows = Math.ceil(scalarBits / W) + 1;
    const windowSize = 2 ** (W - 1);
    const maxNumber = 2 ** W;
    const mask = bitMask(W);
    const shiftBy = BigInt(W);
    return { windows, windowSize, mask, maxNumber, shiftBy };
  }
  function calcOffsets(n, window2, wOpts) {
    const { windowSize, mask, maxNumber, shiftBy } = wOpts;
    let wbits = Number(n & mask);
    let nextN = n >> shiftBy;
    if (wbits > windowSize) {
      wbits -= maxNumber;
      nextN += _1n3;
    }
    const offsetStart = window2 * windowSize;
    const offset = offsetStart + Math.abs(wbits) - 1;
    const isZero = wbits === 0;
    const isNeg = wbits < 0;
    const isNegF = window2 % 2 !== 0;
    const offsetF = offsetStart;
    return { nextN, offset, isZero, isNeg, isNegF, offsetF };
  }
  function validateMSMPoints(points, c) {
    if (!Array.isArray(points))
      throw new Error("array expected");
    points.forEach((p, i) => {
      if (!(p instanceof c))
        throw new Error("invalid point at index " + i);
    });
  }
  function validateMSMScalars(scalars, field) {
    if (!Array.isArray(scalars))
      throw new Error("array of scalars expected");
    scalars.forEach((s, i) => {
      if (!field.isValid(s))
        throw new Error("invalid scalar at index " + i);
    });
  }
  function getW(P2) {
    return pointWindowSizes.get(P2) || 1;
  }
  function wNAF(c, bits) {
    return {
      constTimeNegate,
      hasPrecomputes(elm) {
        return getW(elm) !== 1;
      },
      // non-const time multiplication ladder
      unsafeLadder(elm, n, p = c.ZERO) {
        let d = elm;
        while (n > _0n3) {
          if (n & _1n3)
            p = p.add(d);
          d = d.double();
          n >>= _1n3;
        }
        return p;
      },
      /**
       * Creates a wNAF precomputation window. Used for caching.
       * Default window size is set by `utils.precompute()` and is equal to 8.
       * Number of precomputed points depends on the curve size:
       * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
       * - 𝑊 is the window size
       * - 𝑛 is the bitlength of the curve order.
       * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
       * @param elm Point instance
       * @param W window size
       * @returns precomputed point tables flattened to a single array
       */
      precomputeWindow(elm, W) {
        const { windows, windowSize } = calcWOpts(W, bits);
        const points = [];
        let p = elm;
        let base = p;
        for (let window2 = 0; window2 < windows; window2++) {
          base = p;
          points.push(base);
          for (let i = 1; i < windowSize; i++) {
            base = base.add(p);
            points.push(base);
          }
          p = base.double();
        }
        return points;
      },
      /**
       * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
       * @param W window size
       * @param precomputes precomputed tables
       * @param n scalar (we don't check here, but should be less than curve order)
       * @returns real and fake (for const-time) points
       */
      wNAF(W, precomputes, n) {
        let p = c.ZERO;
        let f = c.BASE;
        const wo = calcWOpts(W, bits);
        for (let window2 = 0; window2 < wo.windows; window2++) {
          const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
          n = nextN;
          if (isZero) {
            f = f.add(constTimeNegate(isNegF, precomputes[offsetF]));
          } else {
            p = p.add(constTimeNegate(isNeg, precomputes[offset]));
          }
        }
        return { p, f };
      },
      /**
       * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
       * @param W window size
       * @param precomputes precomputed tables
       * @param n scalar (we don't check here, but should be less than curve order)
       * @param acc accumulator point to add result of multiplication
       * @returns point
       */
      wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
        const wo = calcWOpts(W, bits);
        for (let window2 = 0; window2 < wo.windows; window2++) {
          if (n === _0n3)
            break;
          const { nextN, offset, isZero, isNeg } = calcOffsets(n, window2, wo);
          n = nextN;
          if (isZero) {
            continue;
          } else {
            const item = precomputes[offset];
            acc = acc.add(isNeg ? item.negate() : item);
          }
        }
        return acc;
      },
      getPrecomputes(W, P2, transform) {
        let comp = pointPrecomputes.get(P2);
        if (!comp) {
          comp = this.precomputeWindow(P2, W);
          if (W !== 1)
            pointPrecomputes.set(P2, transform(comp));
        }
        return comp;
      },
      wNAFCached(P2, n, transform) {
        const W = getW(P2);
        return this.wNAF(W, this.getPrecomputes(W, P2, transform), n);
      },
      wNAFCachedUnsafe(P2, n, transform, prev) {
        const W = getW(P2);
        if (W === 1)
          return this.unsafeLadder(P2, n, prev);
        return this.wNAFUnsafe(W, this.getPrecomputes(W, P2, transform), n, prev);
      },
      // We calculate precomputes for elliptic curve point multiplication
      // using windowed method. This specifies window size and
      // stores precomputed values. Usually only base point would be precomputed.
      setWindowSize(P2, W) {
        validateW(W, bits);
        pointWindowSizes.set(P2, W);
        pointPrecomputes.delete(P2);
      }
    };
  }
  function pippenger(c, fieldN, points, scalars) {
    validateMSMPoints(points, c);
    validateMSMScalars(scalars, fieldN);
    const plength = points.length;
    const slength = scalars.length;
    if (plength !== slength)
      throw new Error("arrays of points and scalars must have equal length");
    const zero = c.ZERO;
    const wbits = bitLen(BigInt(plength));
    let windowSize = 1;
    if (wbits > 12)
      windowSize = wbits - 3;
    else if (wbits > 4)
      windowSize = wbits - 2;
    else if (wbits > 0)
      windowSize = 2;
    const MASK = bitMask(windowSize);
    const buckets = new Array(Number(MASK) + 1).fill(zero);
    const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
    let sum2 = zero;
    for (let i = lastBits; i >= 0; i -= windowSize) {
      buckets.fill(zero);
      for (let j = 0; j < slength; j++) {
        const scalar = scalars[j];
        const wbits2 = Number(scalar >> BigInt(i) & MASK);
        buckets[wbits2] = buckets[wbits2].add(points[j]);
      }
      let resI = zero;
      for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
        sumI = sumI.add(buckets[j]);
        resI = resI.add(sumI);
      }
      sum2 = sum2.add(resI);
      if (i !== 0)
        for (let j = 0; j < windowSize; j++)
          sum2 = sum2.double();
    }
    return sum2;
  }
  function validateBasic(curve) {
    validateField(curve.Fp);
    validateObject(curve, {
      n: "bigint",
      h: "bigint",
      Gx: "field",
      Gy: "field"
    }, {
      nBitLength: "isSafeInteger",
      nByteLength: "isSafeInteger"
    });
    return Object.freeze({
      ...nLength(curve.n, curve.nBitLength),
      ...curve,
      ...{ p: curve.Fp.ORDER }
    });
  }
  var _0n3, _1n3, pointPrecomputes, pointWindowSizes;
  var init_curve = __esm({
    "node_modules/@noble/curves/esm/abstract/curve.js"() {
      init_modular();
      init_utils2();
      _0n3 = BigInt(0);
      _1n3 = BigInt(1);
      pointPrecomputes = /* @__PURE__ */ new WeakMap();
      pointWindowSizes = /* @__PURE__ */ new WeakMap();
    }
  });

  // node_modules/@noble/curves/esm/abstract/weierstrass.js
  function validateSigVerOpts(opts) {
    if (opts.lowS !== void 0)
      abool("lowS", opts.lowS);
    if (opts.prehash !== void 0)
      abool("prehash", opts.prehash);
  }
  function validatePointOpts(curve) {
    const opts = validateBasic(curve);
    validateObject(opts, {
      a: "field",
      b: "field"
    }, {
      allowInfinityPoint: "boolean",
      allowedPrivateKeyLengths: "array",
      clearCofactor: "function",
      fromBytes: "function",
      isTorsionFree: "function",
      toBytes: "function",
      wrapPrivateKey: "boolean"
    });
    const { endo, Fp, a } = opts;
    if (endo) {
      if (!Fp.eql(a, Fp.ZERO)) {
        throw new Error("invalid endo: CURVE.a must be 0");
      }
      if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
        throw new Error('invalid endo: expected "beta": bigint and "splitScalar": function');
      }
    }
    return Object.freeze({ ...opts });
  }
  function numToSizedHex(num, size2) {
    return bytesToHex(numberToBytesBE(num, size2));
  }
  function weierstrassPoints(opts) {
    const CURVE = validatePointOpts(opts);
    const { Fp } = CURVE;
    const Fn = Field(CURVE.n, CURVE.nBitLength);
    const toBytes4 = CURVE.toBytes || ((_c, point, _isCompressed) => {
      const a = point.toAffine();
      return concatBytes2(Uint8Array.from([4]), Fp.toBytes(a.x), Fp.toBytes(a.y));
    });
    const fromBytes = CURVE.fromBytes || ((bytes) => {
      const tail = bytes.subarray(1);
      const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
      const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
      return { x, y };
    });
    function weierstrassEquation(x) {
      const { a, b } = CURVE;
      const x2 = Fp.sqr(x);
      const x3 = Fp.mul(x2, x);
      return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
    }
    function isValidXY(x, y) {
      const left = Fp.sqr(y);
      const right = weierstrassEquation(x);
      return Fp.eql(left, right);
    }
    if (!isValidXY(CURVE.Gx, CURVE.Gy))
      throw new Error("bad curve params: generator point");
    const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
    const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
    if (Fp.is0(Fp.add(_4a3, _27b2)))
      throw new Error("bad curve params: a or b");
    function isWithinCurveOrder(num) {
      return inRange(num, _1n4, CURVE.n);
    }
    function normPrivateKeyToScalar(key) {
      const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE;
      if (lengths && typeof key !== "bigint") {
        if (isBytes2(key))
          key = bytesToHex(key);
        if (typeof key !== "string" || !lengths.includes(key.length))
          throw new Error("invalid private key");
        key = key.padStart(nByteLength * 2, "0");
      }
      let num;
      try {
        num = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
      } catch (error) {
        throw new Error("invalid private key, expected hex or " + nByteLength + " bytes, got " + typeof key);
      }
      if (wrapPrivateKey)
        num = mod(num, N);
      aInRange("private key", num, _1n4, N);
      return num;
    }
    function aprjpoint(other) {
      if (!(other instanceof Point))
        throw new Error("ProjectivePoint expected");
    }
    const toAffineMemo = memoized((p, iz) => {
      const { px: x, py: y, pz: z } = p;
      if (Fp.eql(z, Fp.ONE))
        return { x, y };
      const is0 = p.is0();
      if (iz == null)
        iz = is0 ? Fp.ONE : Fp.inv(z);
      const ax = Fp.mul(x, iz);
      const ay = Fp.mul(y, iz);
      const zz = Fp.mul(z, iz);
      if (is0)
        return { x: Fp.ZERO, y: Fp.ZERO };
      if (!Fp.eql(zz, Fp.ONE))
        throw new Error("invZ was invalid");
      return { x: ax, y: ay };
    });
    const assertValidMemo = memoized((p) => {
      if (p.is0()) {
        if (CURVE.allowInfinityPoint && !Fp.is0(p.py))
          return;
        throw new Error("bad point: ZERO");
      }
      const { x, y } = p.toAffine();
      if (!Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("bad point: x or y not FE");
      if (!isValidXY(x, y))
        throw new Error("bad point: equation left != right");
      if (!p.isTorsionFree())
        throw new Error("bad point: not in prime-order subgroup");
      return true;
    });
    class Point {
      constructor(px, py, pz) {
        if (px == null || !Fp.isValid(px))
          throw new Error("x required");
        if (py == null || !Fp.isValid(py) || Fp.is0(py))
          throw new Error("y required");
        if (pz == null || !Fp.isValid(pz))
          throw new Error("z required");
        this.px = px;
        this.py = py;
        this.pz = pz;
        Object.freeze(this);
      }
      // Does not validate if the point is on-curve.
      // Use fromHex instead, or call assertValidity() later.
      static fromAffine(p) {
        const { x, y } = p || {};
        if (!p || !Fp.isValid(x) || !Fp.isValid(y))
          throw new Error("invalid affine point");
        if (p instanceof Point)
          throw new Error("projective point not allowed");
        const is0 = (i) => Fp.eql(i, Fp.ZERO);
        if (is0(x) && is0(y))
          return Point.ZERO;
        return new Point(x, y, Fp.ONE);
      }
      get x() {
        return this.toAffine().x;
      }
      get y() {
        return this.toAffine().y;
      }
      /**
       * Takes a bunch of Projective Points but executes only one
       * inversion on all of them. Inversion is very slow operation,
       * so this improves performance massively.
       * Optimization: converts a list of projective points to a list of identical points with Z=1.
       */
      static normalizeZ(points) {
        const toInv = FpInvertBatch(Fp, points.map((p) => p.pz));
        return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
      }
      /**
       * Converts hash string or Uint8Array to Point.
       * @param hex short/long ECDSA hex
       */
      static fromHex(hex) {
        const P2 = Point.fromAffine(fromBytes(ensureBytes("pointHex", hex)));
        P2.assertValidity();
        return P2;
      }
      // Multiplies generator point by privateKey.
      static fromPrivateKey(privateKey) {
        return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
      }
      // Multiscalar Multiplication
      static msm(points, scalars) {
        return pippenger(Point, Fn, points, scalars);
      }
      // "Private method", don't use it directly
      _setWindowSize(windowSize) {
        wnaf.setWindowSize(this, windowSize);
      }
      // A point on curve is valid if it conforms to equation.
      assertValidity() {
        assertValidMemo(this);
      }
      hasEvenY() {
        const { y } = this.toAffine();
        if (Fp.isOdd)
          return !Fp.isOdd(y);
        throw new Error("Field doesn't support isOdd");
      }
      /**
       * Compare one point to another.
       */
      equals(other) {
        aprjpoint(other);
        const { px: X1, py: Y1, pz: Z1 } = this;
        const { px: X2, py: Y2, pz: Z2 } = other;
        const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
        const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
        return U1 && U2;
      }
      /**
       * Flips point to one corresponding to (x, -y) in Affine coordinates.
       */
      negate() {
        return new Point(this.px, Fp.neg(this.py), this.pz);
      }
      // Renes-Costello-Batina exception-free doubling formula.
      // There is 30% faster Jacobian formula, but it is not complete.
      // https://eprint.iacr.org/2015/1060, algorithm 3
      // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
      double() {
        const { a, b } = CURVE;
        const b3 = Fp.mul(b, _3n2);
        const { px: X1, py: Y1, pz: Z1 } = this;
        let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
        let t0 = Fp.mul(X1, X1);
        let t1 = Fp.mul(Y1, Y1);
        let t2 = Fp.mul(Z1, Z1);
        let t3 = Fp.mul(X1, Y1);
        t3 = Fp.add(t3, t3);
        Z3 = Fp.mul(X1, Z1);
        Z3 = Fp.add(Z3, Z3);
        X3 = Fp.mul(a, Z3);
        Y3 = Fp.mul(b3, t2);
        Y3 = Fp.add(X3, Y3);
        X3 = Fp.sub(t1, Y3);
        Y3 = Fp.add(t1, Y3);
        Y3 = Fp.mul(X3, Y3);
        X3 = Fp.mul(t3, X3);
        Z3 = Fp.mul(b3, Z3);
        t2 = Fp.mul(a, t2);
        t3 = Fp.sub(t0, t2);
        t3 = Fp.mul(a, t3);
        t3 = Fp.add(t3, Z3);
        Z3 = Fp.add(t0, t0);
        t0 = Fp.add(Z3, t0);
        t0 = Fp.add(t0, t2);
        t0 = Fp.mul(t0, t3);
        Y3 = Fp.add(Y3, t0);
        t2 = Fp.mul(Y1, Z1);
        t2 = Fp.add(t2, t2);
        t0 = Fp.mul(t2, t3);
        X3 = Fp.sub(X3, t0);
        Z3 = Fp.mul(t2, t1);
        Z3 = Fp.add(Z3, Z3);
        Z3 = Fp.add(Z3, Z3);
        return new Point(X3, Y3, Z3);
      }
      // Renes-Costello-Batina exception-free addition formula.
      // There is 30% faster Jacobian formula, but it is not complete.
      // https://eprint.iacr.org/2015/1060, algorithm 1
      // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
      add(other) {
        aprjpoint(other);
        const { px: X1, py: Y1, pz: Z1 } = this;
        const { px: X2, py: Y2, pz: Z2 } = other;
        let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
        const a = CURVE.a;
        const b3 = Fp.mul(CURVE.b, _3n2);
        let t0 = Fp.mul(X1, X2);
        let t1 = Fp.mul(Y1, Y2);
        let t2 = Fp.mul(Z1, Z2);
        let t3 = Fp.add(X1, Y1);
        let t4 = Fp.add(X2, Y2);
        t3 = Fp.mul(t3, t4);
        t4 = Fp.add(t0, t1);
        t3 = Fp.sub(t3, t4);
        t4 = Fp.add(X1, Z1);
        let t5 = Fp.add(X2, Z2);
        t4 = Fp.mul(t4, t5);
        t5 = Fp.add(t0, t2);
        t4 = Fp.sub(t4, t5);
        t5 = Fp.add(Y1, Z1);
        X3 = Fp.add(Y2, Z2);
        t5 = Fp.mul(t5, X3);
        X3 = Fp.add(t1, t2);
        t5 = Fp.sub(t5, X3);
        Z3 = Fp.mul(a, t4);
        X3 = Fp.mul(b3, t2);
        Z3 = Fp.add(X3, Z3);
        X3 = Fp.sub(t1, Z3);
        Z3 = Fp.add(t1, Z3);
        Y3 = Fp.mul(X3, Z3);
        t1 = Fp.add(t0, t0);
        t1 = Fp.add(t1, t0);
        t2 = Fp.mul(a, t2);
        t4 = Fp.mul(b3, t4);
        t1 = Fp.add(t1, t2);
        t2 = Fp.sub(t0, t2);
        t2 = Fp.mul(a, t2);
        t4 = Fp.add(t4, t2);
        t0 = Fp.mul(t1, t4);
        Y3 = Fp.add(Y3, t0);
        t0 = Fp.mul(t5, t4);
        X3 = Fp.mul(t3, X3);
        X3 = Fp.sub(X3, t0);
        t0 = Fp.mul(t3, t1);
        Z3 = Fp.mul(t5, Z3);
        Z3 = Fp.add(Z3, t0);
        return new Point(X3, Y3, Z3);
      }
      subtract(other) {
        return this.add(other.negate());
      }
      is0() {
        return this.equals(Point.ZERO);
      }
      wNAF(n) {
        return wnaf.wNAFCached(this, n, Point.normalizeZ);
      }
      /**
       * Non-constant-time multiplication. Uses double-and-add algorithm.
       * It's faster, but should only be used when you don't care about
       * an exposed private key e.g. sig verification, which works over *public* keys.
       */
      multiplyUnsafe(sc) {
        const { endo: endo2, n: N } = CURVE;
        aInRange("scalar", sc, _0n4, N);
        const I = Point.ZERO;
        if (sc === _0n4)
          return I;
        if (this.is0() || sc === _1n4)
          return this;
        if (!endo2 || wnaf.hasPrecomputes(this))
          return wnaf.wNAFCachedUnsafe(this, sc, Point.normalizeZ);
        let { k1neg, k1, k2neg, k2 } = endo2.splitScalar(sc);
        let k1p = I;
        let k2p = I;
        let d = this;
        while (k1 > _0n4 || k2 > _0n4) {
          if (k1 & _1n4)
            k1p = k1p.add(d);
          if (k2 & _1n4)
            k2p = k2p.add(d);
          d = d.double();
          k1 >>= _1n4;
          k2 >>= _1n4;
        }
        if (k1neg)
          k1p = k1p.negate();
        if (k2neg)
          k2p = k2p.negate();
        k2p = new Point(Fp.mul(k2p.px, endo2.beta), k2p.py, k2p.pz);
        return k1p.add(k2p);
      }
      /**
       * Constant time multiplication.
       * Uses wNAF method. Windowed method may be 10% faster,
       * but takes 2x longer to generate and consumes 2x memory.
       * Uses precomputes when available.
       * Uses endomorphism for Koblitz curves.
       * @param scalar by which the point would be multiplied
       * @returns New point
       */
      multiply(scalar) {
        const { endo: endo2, n: N } = CURVE;
        aInRange("scalar", scalar, _1n4, N);
        let point, fake;
        if (endo2) {
          const { k1neg, k1, k2neg, k2 } = endo2.splitScalar(scalar);
          let { p: k1p, f: f1p } = this.wNAF(k1);
          let { p: k2p, f: f2p } = this.wNAF(k2);
          k1p = wnaf.constTimeNegate(k1neg, k1p);
          k2p = wnaf.constTimeNegate(k2neg, k2p);
          k2p = new Point(Fp.mul(k2p.px, endo2.beta), k2p.py, k2p.pz);
          point = k1p.add(k2p);
          fake = f1p.add(f2p);
        } else {
          const { p, f } = this.wNAF(scalar);
          point = p;
          fake = f;
        }
        return Point.normalizeZ([point, fake])[0];
      }
      /**
       * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
       * Not using Strauss-Shamir trick: precomputation tables are faster.
       * The trick could be useful if both P and Q are not G (not in our case).
       * @returns non-zero affine point
       */
      multiplyAndAddUnsafe(Q, a, b) {
        const G = Point.BASE;
        const mul2 = (P2, a2) => a2 === _0n4 || a2 === _1n4 || !P2.equals(G) ? P2.multiplyUnsafe(a2) : P2.multiply(a2);
        const sum2 = mul2(this, a).add(mul2(Q, b));
        return sum2.is0() ? void 0 : sum2;
      }
      // Converts Projective point to affine (x, y) coordinates.
      // Can accept precomputed Z^-1 - for example, from invertBatch.
      // (x, y, z) ∋ (x=x/z, y=y/z)
      toAffine(iz) {
        return toAffineMemo(this, iz);
      }
      isTorsionFree() {
        const { h: cofactor, isTorsionFree } = CURVE;
        if (cofactor === _1n4)
          return true;
        if (isTorsionFree)
          return isTorsionFree(Point, this);
        throw new Error("isTorsionFree() has not been declared for the elliptic curve");
      }
      clearCofactor() {
        const { h: cofactor, clearCofactor } = CURVE;
        if (cofactor === _1n4)
          return this;
        if (clearCofactor)
          return clearCofactor(Point, this);
        return this.multiplyUnsafe(CURVE.h);
      }
      toRawBytes(isCompressed = true) {
        abool("isCompressed", isCompressed);
        this.assertValidity();
        return toBytes4(Point, this, isCompressed);
      }
      toHex(isCompressed = true) {
        abool("isCompressed", isCompressed);
        return bytesToHex(this.toRawBytes(isCompressed));
      }
    }
    Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
    const { endo, nBitLength } = CURVE;
    const wnaf = wNAF(Point, endo ? Math.ceil(nBitLength / 2) : nBitLength);
    return {
      CURVE,
      ProjectivePoint: Point,
      normPrivateKeyToScalar,
      weierstrassEquation,
      isWithinCurveOrder
    };
  }
  function validateOpts(curve) {
    const opts = validateBasic(curve);
    validateObject(opts, {
      hash: "hash",
      hmac: "function",
      randomBytes: "function"
    }, {
      bits2int: "function",
      bits2int_modN: "function",
      lowS: "boolean"
    });
    return Object.freeze({ lowS: true, ...opts });
  }
  function weierstrass(curveDef) {
    const CURVE = validateOpts(curveDef);
    const { Fp, n: CURVE_ORDER, nByteLength, nBitLength } = CURVE;
    const compressedLen = Fp.BYTES + 1;
    const uncompressedLen = 2 * Fp.BYTES + 1;
    function modN(a) {
      return mod(a, CURVE_ORDER);
    }
    function invN(a) {
      return invert(a, CURVE_ORDER);
    }
    const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
      ...CURVE,
      toBytes(_c, point, isCompressed) {
        const a = point.toAffine();
        const x = Fp.toBytes(a.x);
        const cat = concatBytes2;
        abool("isCompressed", isCompressed);
        if (isCompressed) {
          return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
        } else {
          return cat(Uint8Array.from([4]), x, Fp.toBytes(a.y));
        }
      },
      fromBytes(bytes) {
        const len = bytes.length;
        const head = bytes[0];
        const tail = bytes.subarray(1);
        if (len === compressedLen && (head === 2 || head === 3)) {
          const x = bytesToNumberBE(tail);
          if (!inRange(x, _1n4, Fp.ORDER))
            throw new Error("Point is not on curve");
          const y2 = weierstrassEquation(x);
          let y;
          try {
            y = Fp.sqrt(y2);
          } catch (sqrtError) {
            const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
            throw new Error("Point is not on curve" + suffix);
          }
          const isYOdd = (y & _1n4) === _1n4;
          const isHeadOdd = (head & 1) === 1;
          if (isHeadOdd !== isYOdd)
            y = Fp.neg(y);
          return { x, y };
        } else if (len === uncompressedLen && head === 4) {
          const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
          const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
          return { x, y };
        } else {
          const cl = compressedLen;
          const ul = uncompressedLen;
          throw new Error("invalid Point, expected length of " + cl + ", or uncompressed " + ul + ", got " + len);
        }
      }
    });
    function isBiggerThanHalfOrder(number) {
      const HALF = CURVE_ORDER >> _1n4;
      return number > HALF;
    }
    function normalizeS(s) {
      return isBiggerThanHalfOrder(s) ? modN(-s) : s;
    }
    const slcNum = (b, from, to) => bytesToNumberBE(b.slice(from, to));
    class Signature {
      constructor(r, s, recovery) {
        aInRange("r", r, _1n4, CURVE_ORDER);
        aInRange("s", s, _1n4, CURVE_ORDER);
        this.r = r;
        this.s = s;
        if (recovery != null)
          this.recovery = recovery;
        Object.freeze(this);
      }
      // pair (bytes of r, bytes of s)
      static fromCompact(hex) {
        const l = nByteLength;
        hex = ensureBytes("compactSignature", hex, l * 2);
        return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
      }
      // DER encoded ECDSA signature
      // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
      static fromDER(hex) {
        const { r, s } = DER.toSig(ensureBytes("DER", hex));
        return new Signature(r, s);
      }
      /**
       * @todo remove
       * @deprecated
       */
      assertValidity() {
      }
      addRecoveryBit(recovery) {
        return new Signature(this.r, this.s, recovery);
      }
      recoverPublicKey(msgHash) {
        const { r, s, recovery: rec } = this;
        const h = bits2int_modN(ensureBytes("msgHash", msgHash));
        if (rec == null || ![0, 1, 2, 3].includes(rec))
          throw new Error("recovery id invalid");
        const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
        if (radj >= Fp.ORDER)
          throw new Error("recovery id 2 or 3 invalid");
        const prefix = (rec & 1) === 0 ? "02" : "03";
        const R = Point.fromHex(prefix + numToSizedHex(radj, Fp.BYTES));
        const ir = invN(radj);
        const u1 = modN(-h * ir);
        const u2 = modN(s * ir);
        const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
        if (!Q)
          throw new Error("point at infinify");
        Q.assertValidity();
        return Q;
      }
      // Signatures should be low-s, to prevent malleability.
      hasHighS() {
        return isBiggerThanHalfOrder(this.s);
      }
      normalizeS() {
        return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
      }
      // DER-encoded
      toDERRawBytes() {
        return hexToBytes(this.toDERHex());
      }
      toDERHex() {
        return DER.hexFromSig(this);
      }
      // padded bytes of r, then padded bytes of s
      toCompactRawBytes() {
        return hexToBytes(this.toCompactHex());
      }
      toCompactHex() {
        const l = nByteLength;
        return numToSizedHex(this.r, l) + numToSizedHex(this.s, l);
      }
    }
    const utils = {
      isValidPrivateKey(privateKey) {
        try {
          normPrivateKeyToScalar(privateKey);
          return true;
        } catch (error) {
          return false;
        }
      },
      normPrivateKeyToScalar,
      /**
       * Produces cryptographically secure private key from random of size
       * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
       */
      randomPrivateKey: () => {
        const length = getMinHashLength(CURVE.n);
        return mapHashToField(CURVE.randomBytes(length), CURVE.n);
      },
      /**
       * Creates precompute table for an arbitrary EC point. Makes point "cached".
       * Allows to massively speed-up `point.multiply(scalar)`.
       * @returns cached point
       * @example
       * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
       * fast.multiply(privKey); // much faster ECDH now
       */
      precompute(windowSize = 8, point = Point.BASE) {
        point._setWindowSize(windowSize);
        point.multiply(BigInt(3));
        return point;
      }
    };
    function getPublicKey(privateKey, isCompressed = true) {
      return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
    }
    function isProbPub(item) {
      if (typeof item === "bigint")
        return false;
      if (item instanceof Point)
        return true;
      const arr = ensureBytes("key", item);
      const len = arr.length;
      const fpl = Fp.BYTES;
      const compLen = fpl + 1;
      const uncompLen = 2 * fpl + 1;
      if (CURVE.allowedPrivateKeyLengths || nByteLength === compLen) {
        return void 0;
      } else {
        return len === compLen || len === uncompLen;
      }
    }
    function getSharedSecret(privateA, publicB, isCompressed = true) {
      if (isProbPub(privateA) === true)
        throw new Error("first arg must be private key");
      if (isProbPub(publicB) === false)
        throw new Error("second arg must be public key");
      const b = Point.fromHex(publicB);
      return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
    }
    const bits2int = CURVE.bits2int || function(bytes) {
      if (bytes.length > 8192)
        throw new Error("input is too large");
      const num = bytesToNumberBE(bytes);
      const delta = bytes.length * 8 - nBitLength;
      return delta > 0 ? num >> BigInt(delta) : num;
    };
    const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
      return modN(bits2int(bytes));
    };
    const ORDER_MASK = bitMask(nBitLength);
    function int2octets(num) {
      aInRange("num < 2^" + nBitLength, num, _0n4, ORDER_MASK);
      return numberToBytesBE(num, nByteLength);
    }
    function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
      if (["recovered", "canonical"].some((k) => k in opts))
        throw new Error("sign() legacy options not supported");
      const { hash, randomBytes: randomBytes2 } = CURVE;
      let { lowS, prehash, extraEntropy: ent } = opts;
      if (lowS == null)
        lowS = true;
      msgHash = ensureBytes("msgHash", msgHash);
      validateSigVerOpts(opts);
      if (prehash)
        msgHash = ensureBytes("prehashed msgHash", hash(msgHash));
      const h1int = bits2int_modN(msgHash);
      const d = normPrivateKeyToScalar(privateKey);
      const seedArgs = [int2octets(d), int2octets(h1int)];
      if (ent != null && ent !== false) {
        const e = ent === true ? randomBytes2(Fp.BYTES) : ent;
        seedArgs.push(ensureBytes("extraEntropy", e));
      }
      const seed = concatBytes2(...seedArgs);
      const m = h1int;
      function k2sig(kBytes) {
        const k = bits2int(kBytes);
        if (!isWithinCurveOrder(k))
          return;
        const ik = invN(k);
        const q = Point.BASE.multiply(k).toAffine();
        const r = modN(q.x);
        if (r === _0n4)
          return;
        const s = modN(ik * modN(m + r * d));
        if (s === _0n4)
          return;
        let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
        let normS = s;
        if (lowS && isBiggerThanHalfOrder(s)) {
          normS = normalizeS(s);
          recovery ^= 1;
        }
        return new Signature(r, normS, recovery);
      }
      return { seed, k2sig };
    }
    const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
    const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
    function sign3(msgHash, privKey, opts = defaultSigOpts) {
      const { seed, k2sig } = prepSig(msgHash, privKey, opts);
      const C = CURVE;
      const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
      return drbg(seed, k2sig);
    }
    Point.BASE._setWindowSize(8);
    function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
      const sg = signature;
      msgHash = ensureBytes("msgHash", msgHash);
      publicKey = ensureBytes("publicKey", publicKey);
      const { lowS, prehash, format } = opts;
      validateSigVerOpts(opts);
      if ("strict" in opts)
        throw new Error("options.strict was renamed to lowS");
      if (format !== void 0 && format !== "compact" && format !== "der")
        throw new Error("format must be compact or der");
      const isHex3 = typeof sg === "string" || isBytes2(sg);
      const isObj = !isHex3 && !format && typeof sg === "object" && sg !== null && typeof sg.r === "bigint" && typeof sg.s === "bigint";
      if (!isHex3 && !isObj)
        throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
      let _sig = void 0;
      let P2;
      try {
        if (isObj)
          _sig = new Signature(sg.r, sg.s);
        if (isHex3) {
          try {
            if (format !== "compact")
              _sig = Signature.fromDER(sg);
          } catch (derError) {
            if (!(derError instanceof DER.Err))
              throw derError;
          }
          if (!_sig && format !== "der")
            _sig = Signature.fromCompact(sg);
        }
        P2 = Point.fromHex(publicKey);
      } catch (error) {
        return false;
      }
      if (!_sig)
        return false;
      if (lowS && _sig.hasHighS())
        return false;
      if (prehash)
        msgHash = CURVE.hash(msgHash);
      const { r, s } = _sig;
      const h = bits2int_modN(msgHash);
      const is = invN(s);
      const u1 = modN(h * is);
      const u2 = modN(r * is);
      const R = Point.BASE.multiplyAndAddUnsafe(P2, u1, u2)?.toAffine();
      if (!R)
        return false;
      const v = modN(R.x);
      return v === r;
    }
    return {
      CURVE,
      getPublicKey,
      getSharedSecret,
      sign: sign3,
      verify,
      ProjectivePoint: Point,
      Signature,
      utils
    };
  }
  var DERErr, DER, _0n4, _1n4, _2n2, _3n2, _4n2;
  var init_weierstrass = __esm({
    "node_modules/@noble/curves/esm/abstract/weierstrass.js"() {
      init_curve();
      init_modular();
      init_utils2();
      DERErr = class extends Error {
        constructor(m = "") {
          super(m);
        }
      };
      DER = {
        // asn.1 DER encoding utils
        Err: DERErr,
        // Basic building block is TLV (Tag-Length-Value)
        _tlv: {
          encode: (tag2, data) => {
            const { Err: E } = DER;
            if (tag2 < 0 || tag2 > 256)
              throw new E("tlv.encode: wrong tag");
            if (data.length & 1)
              throw new E("tlv.encode: unpadded data");
            const dataLen = data.length / 2;
            const len = numberToHexUnpadded(dataLen);
            if (len.length / 2 & 128)
              throw new E("tlv.encode: long form length too big");
            const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
            const t = numberToHexUnpadded(tag2);
            return t + lenLen + len + data;
          },
          // v - value, l - left bytes (unparsed)
          decode(tag2, data) {
            const { Err: E } = DER;
            let pos = 0;
            if (tag2 < 0 || tag2 > 256)
              throw new E("tlv.encode: wrong tag");
            if (data.length < 2 || data[pos++] !== tag2)
              throw new E("tlv.decode: wrong tlv");
            const first = data[pos++];
            const isLong = !!(first & 128);
            let length = 0;
            if (!isLong)
              length = first;
            else {
              const lenLen = first & 127;
              if (!lenLen)
                throw new E("tlv.decode(long): indefinite length not supported");
              if (lenLen > 4)
                throw new E("tlv.decode(long): byte length is too big");
              const lengthBytes = data.subarray(pos, pos + lenLen);
              if (lengthBytes.length !== lenLen)
                throw new E("tlv.decode: length bytes not complete");
              if (lengthBytes[0] === 0)
                throw new E("tlv.decode(long): zero leftmost byte");
              for (const b of lengthBytes)
                length = length << 8 | b;
              pos += lenLen;
              if (length < 128)
                throw new E("tlv.decode(long): not minimal encoding");
            }
            const v = data.subarray(pos, pos + length);
            if (v.length !== length)
              throw new E("tlv.decode: wrong value length");
            return { v, l: data.subarray(pos + length) };
          }
        },
        // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
        // since we always use positive integers here. It must always be empty:
        // - add zero byte if exists
        // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
        _int: {
          encode(num) {
            const { Err: E } = DER;
            if (num < _0n4)
              throw new E("integer: negative integers are not allowed");
            let hex = numberToHexUnpadded(num);
            if (Number.parseInt(hex[0], 16) & 8)
              hex = "00" + hex;
            if (hex.length & 1)
              throw new E("unexpected DER parsing assertion: unpadded hex");
            return hex;
          },
          decode(data) {
            const { Err: E } = DER;
            if (data[0] & 128)
              throw new E("invalid signature integer: negative");
            if (data[0] === 0 && !(data[1] & 128))
              throw new E("invalid signature integer: unnecessary leading zero");
            return bytesToNumberBE(data);
          }
        },
        toSig(hex) {
          const { Err: E, _int: int, _tlv: tlv } = DER;
          const data = ensureBytes("signature", hex);
          const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
          if (seqLeftBytes.length)
            throw new E("invalid signature: left bytes after parsing");
          const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
          const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
          if (sLeftBytes.length)
            throw new E("invalid signature: left bytes after parsing");
          return { r: int.decode(rBytes), s: int.decode(sBytes) };
        },
        hexFromSig(sig) {
          const { _tlv: tlv, _int: int } = DER;
          const rs = tlv.encode(2, int.encode(sig.r));
          const ss = tlv.encode(2, int.encode(sig.s));
          const seq = rs + ss;
          return tlv.encode(48, seq);
        }
      };
      _0n4 = BigInt(0);
      _1n4 = BigInt(1);
      _2n2 = BigInt(2);
      _3n2 = BigInt(3);
      _4n2 = BigInt(4);
    }
  });

  // node_modules/@noble/curves/esm/_shortw_utils.js
  function getHash(hash) {
    return {
      hash,
      hmac: (key, ...msgs) => hmac(hash, key, concatBytes(...msgs)),
      randomBytes
    };
  }
  function createCurve(curveDef, defHash) {
    const create = (hash) => weierstrass({ ...curveDef, ...getHash(hash) });
    return { ...create(defHash), create };
  }
  var init_shortw_utils = __esm({
    "node_modules/@noble/curves/esm/_shortw_utils.js"() {
      init_hmac();
      init_utils();
      init_weierstrass();
    }
  });

  // node_modules/@noble/curves/esm/secp256k1.js
  function sqrtMod(y) {
    const P2 = secp256k1P;
    const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
    const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
    const b2 = y * y * y % P2;
    const b3 = b2 * b2 * y % P2;
    const b6 = pow2(b3, _3n3, P2) * b3 % P2;
    const b9 = pow2(b6, _3n3, P2) * b3 % P2;
    const b11 = pow2(b9, _2n3, P2) * b2 % P2;
    const b22 = pow2(b11, _11n, P2) * b11 % P2;
    const b44 = pow2(b22, _22n, P2) * b22 % P2;
    const b88 = pow2(b44, _44n, P2) * b44 % P2;
    const b176 = pow2(b88, _88n, P2) * b88 % P2;
    const b220 = pow2(b176, _44n, P2) * b44 % P2;
    const b223 = pow2(b220, _3n3, P2) * b3 % P2;
    const t1 = pow2(b223, _23n, P2) * b22 % P2;
    const t2 = pow2(t1, _6n, P2) * b2 % P2;
    const root = pow2(t2, _2n3, P2);
    if (!Fpk1.eql(Fpk1.sqr(root), y))
      throw new Error("Cannot find square root");
    return root;
  }
  var secp256k1P, secp256k1N, _0n5, _1n5, _2n3, divNearest, Fpk1, secp256k1;
  var init_secp256k1 = __esm({
    "node_modules/@noble/curves/esm/secp256k1.js"() {
      init_sha2();
      init_shortw_utils();
      init_modular();
      secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
      secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
      _0n5 = BigInt(0);
      _1n5 = BigInt(1);
      _2n3 = BigInt(2);
      divNearest = (a, b) => (a + b / _2n3) / b;
      Fpk1 = Field(secp256k1P, void 0, void 0, { sqrt: sqrtMod });
      secp256k1 = createCurve({
        a: _0n5,
        b: BigInt(7),
        Fp: Fpk1,
        n: secp256k1N,
        Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
        Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
        h: BigInt(1),
        lowS: true,
        // Allow only low-S signatures by default in sign() and verify()
        endo: {
          // Endomorphism, see above
          beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
          splitScalar: (k) => {
            const n = secp256k1N;
            const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
            const b1 = -_1n5 * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
            const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
            const b2 = a1;
            const POW_2_128 = BigInt("0x100000000000000000000000000000000");
            const c1 = divNearest(b2 * k, n);
            const c2 = divNearest(-b1 * k, n);
            let k1 = mod(k - c1 * a1 - c2 * a2, n);
            let k2 = mod(-c1 * b1 - c2 * b2, n);
            const k1neg = k1 > POW_2_128;
            const k2neg = k2 > POW_2_128;
            if (k1neg)
              k1 = n - k1;
            if (k2neg)
              k2 = n - k2;
            if (k1 > POW_2_128 || k2 > POW_2_128) {
              throw new Error("splitScalar: Endomorphism failed, k=" + k);
            }
            return { k1neg, k1, k2neg, k2 };
          }
        }
      }, sha256);
    }
  });

  // node_modules/viem/_esm/errors/version.js
  var version;
  var init_version = __esm({
    "node_modules/viem/_esm/errors/version.js"() {
      version = "2.54.6";
    }
  });

  // node_modules/viem/_esm/errors/base.js
  function walk(err, fn) {
    if (fn?.(err))
      return err;
    if (err && typeof err === "object" && "cause" in err && err.cause !== void 0)
      return walk(err.cause, fn);
    return fn ? null : err;
  }
  var errorConfig, BaseError;
  var init_base = __esm({
    "node_modules/viem/_esm/errors/base.js"() {
      init_version();
      errorConfig = {
        getDocsUrl: ({ docsBaseUrl, docsPath = "", docsSlug }) => docsPath ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
        version: `viem@${version}`
      };
      BaseError = class _BaseError extends Error {
        constructor(shortMessage, args = {}) {
          const details = (() => {
            if (args.cause instanceof _BaseError)
              return args.cause.details;
            if (args.cause?.message)
              return args.cause.message;
            return args.details;
          })();
          const docsPath = (() => {
            if (args.cause instanceof _BaseError)
              return args.cause.docsPath || args.docsPath;
            return args.docsPath;
          })();
          const docsUrl = errorConfig.getDocsUrl?.({ ...args, docsPath });
          const message = [
            shortMessage || "An error occurred.",
            "",
            ...args.metaMessages ? [...args.metaMessages, ""] : [],
            ...docsUrl ? [`Docs: ${docsUrl}`] : [],
            ...details ? [`Details: ${details}`] : [],
            ...errorConfig.version ? [`Version: ${errorConfig.version}`] : []
          ].join("\n");
          super(message, args.cause ? { cause: args.cause } : void 0);
          Object.defineProperty(this, "details", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "docsPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "metaMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "shortMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "BaseError"
          });
          this.details = details;
          this.docsPath = docsPath;
          this.metaMessages = args.metaMessages;
          this.name = args.name ?? this.name;
          this.shortMessage = shortMessage;
          this.version = version;
        }
        walk(fn) {
          return walk(this, fn);
        }
      };
    }
  });

  // node_modules/viem/_esm/errors/encoding.js
  var IntegerOutOfRangeError, SizeOverflowError;
  var init_encoding = __esm({
    "node_modules/viem/_esm/errors/encoding.js"() {
      init_base();
      IntegerOutOfRangeError = class extends BaseError {
        constructor({ max: max2, min: min2, signed, size: size2, value }) {
          super(`Number "${value}" is not in safe ${size2 ? `${size2 * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max2 ? `(${min2} to ${max2})` : `(above ${min2})`}`, { name: "IntegerOutOfRangeError" });
        }
      };
      SizeOverflowError = class extends BaseError {
        constructor({ givenSize, maxSize }) {
          super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/errors/data.js
  var SliceOffsetOutOfBoundsError, SizeExceedsPaddingSizeError;
  var init_data = __esm({
    "node_modules/viem/_esm/errors/data.js"() {
      init_base();
      SliceOffsetOutOfBoundsError = class extends BaseError {
        constructor({ offset, position, size: size2 }) {
          super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size2}).`, { name: "SliceOffsetOutOfBoundsError" });
        }
      };
      SizeExceedsPaddingSizeError = class extends BaseError {
        constructor({ size: size2, targetSize, type }) {
          super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size2}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/data/pad.js
  function pad(hexOrBytes, { dir, size: size2 = 32 } = {}) {
    if (typeof hexOrBytes === "string")
      return padHex(hexOrBytes, { dir, size: size2 });
    return padBytes(hexOrBytes, { dir, size: size2 });
  }
  function padHex(hex_, { dir, size: size2 = 32 } = {}) {
    if (size2 === null)
      return hex_;
    const hex = hex_.replace("0x", "");
    if (hex.length > size2 * 2)
      throw new SizeExceedsPaddingSizeError({
        size: Math.ceil(hex.length / 2),
        targetSize: size2,
        type: "hex"
      });
    return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size2 * 2, "0")}`;
  }
  function padBytes(bytes, { dir, size: size2 = 32 } = {}) {
    if (size2 === null)
      return bytes;
    if (bytes.length > size2)
      throw new SizeExceedsPaddingSizeError({
        size: bytes.length,
        targetSize: size2,
        type: "bytes"
      });
    const paddedBytes = new Uint8Array(size2);
    for (let i = 0; i < size2; i++) {
      const padEnd = dir === "right";
      paddedBytes[padEnd ? i : size2 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
    }
    return paddedBytes;
  }
  var init_pad = __esm({
    "node_modules/viem/_esm/utils/data/pad.js"() {
      init_data();
    }
  });

  // node_modules/viem/_esm/utils/data/isHex.js
  function isHex(value, { strict = true } = {}) {
    if (!value)
      return false;
    if (typeof value !== "string")
      return false;
    return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
  }
  var init_isHex = __esm({
    "node_modules/viem/_esm/utils/data/isHex.js"() {
    }
  });

  // node_modules/viem/_esm/utils/data/size.js
  function size(value) {
    if (isHex(value, { strict: false }))
      return Math.ceil((value.length - 2) / 2);
    return value.length;
  }
  var init_size = __esm({
    "node_modules/viem/_esm/utils/data/size.js"() {
      init_isHex();
    }
  });

  // node_modules/viem/_esm/utils/data/trim.js
  function trim(hexOrBytes, { dir = "left" } = {}) {
    let data = typeof hexOrBytes === "string" ? hexOrBytes.replace("0x", "") : hexOrBytes;
    let sliceLength = 0;
    for (let i = 0; i < data.length - 1; i++) {
      if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
        sliceLength++;
      else
        break;
    }
    data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
    if (typeof hexOrBytes === "string") {
      if (data.length === 1 && dir === "right")
        data = `${data}0`;
      return `0x${data.length % 2 === 1 ? `0${data}` : data}`;
    }
    return data;
  }
  var init_trim = __esm({
    "node_modules/viem/_esm/utils/data/trim.js"() {
    }
  });

  // node_modules/viem/_esm/utils/encoding/toBytes.js
  function toBytes2(value, opts = {}) {
    if (typeof value === "number" || typeof value === "bigint")
      return numberToBytes(value, opts);
    if (typeof value === "boolean")
      return boolToBytes(value, opts);
    if (isHex(value))
      return hexToBytes2(value, opts);
    return stringToBytes(value, opts);
  }
  function boolToBytes(value, opts = {}) {
    const bytes = new Uint8Array(1);
    bytes[0] = Number(value);
    if (typeof opts.size === "number") {
      assertSize(bytes, { size: opts.size });
      return pad(bytes, { size: opts.size });
    }
    return bytes;
  }
  function charCodeToBase16(char) {
    if (char >= charCodeMap.zero && char <= charCodeMap.nine)
      return char - charCodeMap.zero;
    if (char >= charCodeMap.A && char <= charCodeMap.F)
      return char - (charCodeMap.A - 10);
    if (char >= charCodeMap.a && char <= charCodeMap.f)
      return char - (charCodeMap.a - 10);
    return void 0;
  }
  function hexToBytes2(hex_, opts = {}) {
    let hex = hex_;
    if (opts.size) {
      assertSize(hex, { size: opts.size });
      hex = pad(hex, { dir: "right", size: opts.size });
    }
    let hexString = hex.slice(2);
    if (hexString.length % 2)
      hexString = `0${hexString}`;
    const length = hexString.length / 2;
    const bytes = new Uint8Array(length);
    for (let index = 0, j = 0; index < length; index++) {
      const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
      const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
      if (nibbleLeft === void 0 || nibbleRight === void 0) {
        throw new BaseError(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
      }
      bytes[index] = nibbleLeft * 16 + nibbleRight;
    }
    return bytes;
  }
  function numberToBytes(value, opts) {
    const hex = numberToHex(value, opts);
    return hexToBytes2(hex);
  }
  function stringToBytes(value, opts = {}) {
    const bytes = encoder.encode(value);
    if (typeof opts.size === "number") {
      assertSize(bytes, { size: opts.size });
      return pad(bytes, { dir: "right", size: opts.size });
    }
    return bytes;
  }
  var encoder, charCodeMap;
  var init_toBytes = __esm({
    "node_modules/viem/_esm/utils/encoding/toBytes.js"() {
      init_base();
      init_isHex();
      init_pad();
      init_fromHex();
      init_toHex();
      encoder = /* @__PURE__ */ new TextEncoder();
      charCodeMap = {
        zero: 48,
        nine: 57,
        A: 65,
        F: 70,
        a: 97,
        f: 102
      };
    }
  });

  // node_modules/viem/_esm/utils/encoding/fromHex.js
  function assertSize(hexOrBytes, { size: size2 }) {
    if (size(hexOrBytes) > size2)
      throw new SizeOverflowError({
        givenSize: size(hexOrBytes),
        maxSize: size2
      });
  }
  function hexToBigInt(hex, opts = {}) {
    const { signed } = opts;
    if (opts.size)
      assertSize(hex, { size: opts.size });
    const value = BigInt(hex);
    if (!signed)
      return value;
    const size2 = (hex.length - 2) / 2;
    const max2 = (1n << BigInt(size2) * 8n - 1n) - 1n;
    if (value <= max2)
      return value;
    return value - BigInt(`0x${"f".padStart(size2 * 2, "f")}`) - 1n;
  }
  function hexToNumber2(hex, opts = {}) {
    const value = hexToBigInt(hex, opts);
    const number = Number(value);
    if (!Number.isSafeInteger(number))
      throw new IntegerOutOfRangeError({
        max: `${Number.MAX_SAFE_INTEGER}`,
        min: `${Number.MIN_SAFE_INTEGER}`,
        signed: opts.signed,
        size: opts.size,
        value: `${value}n`
      });
    return number;
  }
  var init_fromHex = __esm({
    "node_modules/viem/_esm/utils/encoding/fromHex.js"() {
      init_encoding();
      init_size();
    }
  });

  // node_modules/viem/_esm/utils/encoding/toHex.js
  function toHex(value, opts = {}) {
    if (typeof value === "number" || typeof value === "bigint")
      return numberToHex(value, opts);
    if (typeof value === "string") {
      return stringToHex(value, opts);
    }
    if (typeof value === "boolean")
      return boolToHex(value, opts);
    return bytesToHex2(value, opts);
  }
  function boolToHex(value, opts = {}) {
    const hex = `0x${Number(value)}`;
    if (typeof opts.size === "number") {
      assertSize(hex, { size: opts.size });
      return pad(hex, { size: opts.size });
    }
    return hex;
  }
  function bytesToHex2(value, opts = {}) {
    let string = "";
    for (let i = 0; i < value.length; i++) {
      string += hexes2[value[i]];
    }
    const hex = `0x${string}`;
    if (typeof opts.size === "number") {
      assertSize(hex, { size: opts.size });
      return pad(hex, { dir: "right", size: opts.size });
    }
    return hex;
  }
  function numberToHex(value_, opts = {}) {
    const { signed, size: size2 } = opts;
    const value = BigInt(value_);
    let maxValue;
    if (size2) {
      if (signed)
        maxValue = (1n << BigInt(size2) * 8n - 1n) - 1n;
      else
        maxValue = 2n ** (BigInt(size2) * 8n) - 1n;
    } else if (typeof value_ === "number") {
      maxValue = BigInt(Number.MAX_SAFE_INTEGER);
    }
    const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
    if (maxValue && value > maxValue || value < minValue) {
      const suffix = typeof value_ === "bigint" ? "n" : "";
      throw new IntegerOutOfRangeError({
        max: maxValue ? `${maxValue}${suffix}` : void 0,
        min: `${minValue}${suffix}`,
        signed,
        size: size2,
        value: `${value_}${suffix}`
      });
    }
    const hex = `0x${(signed && value < 0 ? (1n << BigInt(size2 * 8)) + BigInt(value) : value).toString(16)}`;
    if (size2)
      return pad(hex, { size: size2 });
    return hex;
  }
  function stringToHex(value_, opts = {}) {
    const value = encoder2.encode(value_);
    return bytesToHex2(value, opts);
  }
  var hexes2, encoder2;
  var init_toHex = __esm({
    "node_modules/viem/_esm/utils/encoding/toHex.js"() {
      init_encoding();
      init_pad();
      init_fromHex();
      hexes2 = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
      encoder2 = /* @__PURE__ */ new TextEncoder();
    }
  });

  // node_modules/viem/_esm/utils/lru.js
  var LruMap;
  var init_lru = __esm({
    "node_modules/viem/_esm/utils/lru.js"() {
      LruMap = class extends Map {
        constructor(size2) {
          super();
          Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
          });
          this.maxSize = size2;
        }
        get(key) {
          const value = super.get(key);
          if (super.has(key)) {
            super.delete(key);
            super.set(key, value);
          }
          return value;
        }
        set(key, value) {
          if (super.has(key))
            super.delete(key);
          super.set(key, value);
          if (this.maxSize && this.size > this.maxSize) {
            const firstKey = super.keys().next().value;
            if (firstKey !== void 0)
              super.delete(firstKey);
          }
          return this;
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/signature/serializeSignature.js
  function serializeSignature({ r, s, to = "hex", v, yParity }) {
    const yParity_ = (() => {
      if (yParity === 0 || yParity === 1)
        return yParity;
      if (v && (v === 27n || v === 28n || v >= 35n))
        return v % 2n === 0n ? 1 : 0;
      throw new Error("Invalid `v` or `yParity` value");
    })();
    const signature = `0x${new secp256k1.Signature(hexToBigInt(r), hexToBigInt(s)).toCompactHex()}${yParity_ === 0 ? "1b" : "1c"}`;
    if (to === "hex")
      return signature;
    return hexToBytes2(signature);
  }
  var init_serializeSignature = __esm({
    "node_modules/viem/_esm/utils/signature/serializeSignature.js"() {
      init_secp256k1();
      init_fromHex();
      init_toBytes();
    }
  });

  // node_modules/viem/_esm/accounts/generatePrivateKey.js
  function generatePrivateKey() {
    return toHex(secp256k1.utils.randomPrivateKey());
  }
  var init_generatePrivateKey = __esm({
    "node_modules/viem/_esm/accounts/generatePrivateKey.js"() {
      init_secp256k1();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/errors/address.js
  var InvalidAddressError;
  var init_address = __esm({
    "node_modules/viem/_esm/errors/address.js"() {
      init_base();
      InvalidAddressError = class extends BaseError {
        constructor({ address }) {
          super(`Address "${address}" is invalid.`, {
            metaMessages: [
              "- Address must be a hex value of 20 bytes (40 hex characters).",
              "- Address must match its checksum counterpart."
            ],
            name: "InvalidAddressError"
          });
        }
      };
    }
  });

  // node_modules/viem/node_modules/@noble/hashes/esm/_u64.js
  function fromBig(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
    return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const { h, l } = fromBig(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  var U32_MASK64, _32n, rotlSH, rotlSL, rotlBH, rotlBL;
  var init_u64 = __esm({
    "node_modules/viem/node_modules/@noble/hashes/esm/_u64.js"() {
      U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
      _32n = /* @__PURE__ */ BigInt(32);
      rotlSH = (h, l, s) => h << s | l >>> 32 - s;
      rotlSL = (h, l, s) => l << s | h >>> 32 - s;
      rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
      rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
    }
  });

  // node_modules/viem/node_modules/@noble/hashes/esm/utils.js
  function isBytes3(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function anumber2(n) {
    if (!Number.isSafeInteger(n) || n < 0)
      throw new Error("positive integer expected, got " + n);
  }
  function abytes3(b, ...lengths) {
    if (!isBytes3(b))
      throw new Error("Uint8Array expected");
    if (lengths.length > 0 && !lengths.includes(b.length))
      throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
  }
  function aexists2(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput2(out, instance) {
    abytes3(out);
    const min2 = instance.outputLen;
    if (out.length < min2) {
      throw new Error("digestInto() expects output buffer of length at least " + min2);
    }
  }
  function u32(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  }
  function clean2(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView2(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function rotr2(word, shift) {
    return word << 32 - shift | word >>> shift;
  }
  function byteSwap(word) {
    return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
  }
  function byteSwap32(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = byteSwap(arr[i]);
    }
    return arr;
  }
  function utf8ToBytes2(str) {
    if (typeof str !== "string")
      throw new Error("string expected");
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function toBytes3(data) {
    if (typeof data === "string")
      data = utf8ToBytes2(data);
    abytes3(data);
    return data;
  }
  function createHasher2(hashCons) {
    const hashC = (msg) => hashCons().update(toBytes3(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashCons();
    return hashC;
  }
  var isLE, swap32IfBE, Hash2;
  var init_utils3 = __esm({
    "node_modules/viem/node_modules/@noble/hashes/esm/utils.js"() {
      isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
      swap32IfBE = isLE ? (u) => u : byteSwap32;
      Hash2 = class {
      };
    }
  });

  // node_modules/viem/node_modules/@noble/hashes/esm/sha3.js
  function keccakP(s, rounds = 24) {
    const B = new Uint32Array(5 * 2);
    for (let round2 = 24 - rounds; round2 < 24; round2++) {
      for (let x = 0; x < 10; x++)
        B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
      for (let x = 0; x < 10; x += 2) {
        const idx1 = (x + 8) % 10;
        const idx0 = (x + 2) % 10;
        const B0 = B[idx0];
        const B1 = B[idx0 + 1];
        const Th = rotlH(B0, B1, 1) ^ B[idx1];
        const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
        for (let y = 0; y < 50; y += 10) {
          s[x + y] ^= Th;
          s[x + y + 1] ^= Tl;
        }
      }
      let curH = s[2];
      let curL = s[3];
      for (let t = 0; t < 24; t++) {
        const shift = SHA3_ROTL[t];
        const Th = rotlH(curH, curL, shift);
        const Tl = rotlL(curH, curL, shift);
        const PI2 = SHA3_PI[t];
        curH = s[PI2];
        curL = s[PI2 + 1];
        s[PI2] = Th;
        s[PI2 + 1] = Tl;
      }
      for (let y = 0; y < 50; y += 10) {
        for (let x = 0; x < 10; x++)
          B[x] = s[y + x];
        for (let x = 0; x < 10; x++)
          s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
      }
      s[0] ^= SHA3_IOTA_H[round2];
      s[1] ^= SHA3_IOTA_L[round2];
    }
    clean2(B);
  }
  var _0n6, _1n6, _2n4, _7n, _256n, _0x71n, SHA3_PI, SHA3_ROTL, _SHA3_IOTA, IOTAS, SHA3_IOTA_H, SHA3_IOTA_L, rotlH, rotlL, Keccak, gen, keccak_256;
  var init_sha3 = __esm({
    "node_modules/viem/node_modules/@noble/hashes/esm/sha3.js"() {
      init_u64();
      init_utils3();
      _0n6 = BigInt(0);
      _1n6 = BigInt(1);
      _2n4 = BigInt(2);
      _7n = BigInt(7);
      _256n = BigInt(256);
      _0x71n = BigInt(113);
      SHA3_PI = [];
      SHA3_ROTL = [];
      _SHA3_IOTA = [];
      for (let round2 = 0, R = _1n6, x = 1, y = 0; round2 < 24; round2++) {
        [x, y] = [y, (2 * x + 3 * y) % 5];
        SHA3_PI.push(2 * (5 * y + x));
        SHA3_ROTL.push((round2 + 1) * (round2 + 2) / 2 % 64);
        let t = _0n6;
        for (let j = 0; j < 7; j++) {
          R = (R << _1n6 ^ (R >> _7n) * _0x71n) % _256n;
          if (R & _2n4)
            t ^= _1n6 << (_1n6 << /* @__PURE__ */ BigInt(j)) - _1n6;
        }
        _SHA3_IOTA.push(t);
      }
      IOTAS = split(_SHA3_IOTA, true);
      SHA3_IOTA_H = IOTAS[0];
      SHA3_IOTA_L = IOTAS[1];
      rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
      rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
      Keccak = class _Keccak extends Hash2 {
        // NOTE: we accept arguments in bytes instead of bits here.
        constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
          super();
          this.pos = 0;
          this.posOut = 0;
          this.finished = false;
          this.destroyed = false;
          this.enableXOF = false;
          this.blockLen = blockLen;
          this.suffix = suffix;
          this.outputLen = outputLen;
          this.enableXOF = enableXOF;
          this.rounds = rounds;
          anumber2(outputLen);
          if (!(0 < blockLen && blockLen < 200))
            throw new Error("only keccak-f1600 function is supported");
          this.state = new Uint8Array(200);
          this.state32 = u32(this.state);
        }
        clone() {
          return this._cloneInto();
        }
        keccak() {
          swap32IfBE(this.state32);
          keccakP(this.state32, this.rounds);
          swap32IfBE(this.state32);
          this.posOut = 0;
          this.pos = 0;
        }
        update(data) {
          aexists2(this);
          data = toBytes3(data);
          abytes3(data);
          const { blockLen, state } = this;
          const len = data.length;
          for (let pos = 0; pos < len; ) {
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
              state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
              this.keccak();
          }
          return this;
        }
        finish() {
          if (this.finished)
            return;
          this.finished = true;
          const { state, suffix, pos, blockLen } = this;
          state[pos] ^= suffix;
          if ((suffix & 128) !== 0 && pos === blockLen - 1)
            this.keccak();
          state[blockLen - 1] ^= 128;
          this.keccak();
        }
        writeInto(out) {
          aexists2(this, false);
          abytes3(out);
          this.finish();
          const bufferOut = this.state;
          const { blockLen } = this;
          for (let pos = 0, len = out.length; pos < len; ) {
            if (this.posOut >= blockLen)
              this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
          }
          return out;
        }
        xofInto(out) {
          if (!this.enableXOF)
            throw new Error("XOF is not possible for this instance");
          return this.writeInto(out);
        }
        xof(bytes) {
          anumber2(bytes);
          return this.xofInto(new Uint8Array(bytes));
        }
        digestInto(out) {
          aoutput2(out, this);
          if (this.finished)
            throw new Error("digest() was already called");
          this.writeInto(out);
          this.destroy();
          return out;
        }
        digest() {
          return this.digestInto(new Uint8Array(this.outputLen));
        }
        destroy() {
          this.destroyed = true;
          clean2(this.state);
        }
        _cloneInto(to) {
          const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
          to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
          to.state32.set(this.state32);
          to.pos = this.pos;
          to.posOut = this.posOut;
          to.finished = this.finished;
          to.rounds = rounds;
          to.suffix = suffix;
          to.outputLen = outputLen;
          to.enableXOF = enableXOF;
          to.destroyed = this.destroyed;
          return to;
        }
      };
      gen = (suffix, blockLen, outputLen) => createHasher2(() => new Keccak(blockLen, suffix, outputLen));
      keccak_256 = /* @__PURE__ */ (() => gen(1, 136, 256 / 8))();
    }
  });

  // node_modules/viem/_esm/utils/hash/keccak256.js
  function keccak256(value, to_) {
    const to = to_ || "hex";
    const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes2(value) : value);
    if (to === "bytes")
      return bytes;
    return toHex(bytes);
  }
  var init_keccak256 = __esm({
    "node_modules/viem/_esm/utils/hash/keccak256.js"() {
      init_sha3();
      init_isHex();
      init_toBytes();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/utils/address/getAddress.js
  function checksumAddress(address_, chainId) {
    if (checksumAddressCache.has(`${address_}.${chainId}`))
      return checksumAddressCache.get(`${address_}.${chainId}`);
    const hexAddress = chainId ? `${chainId}${address_.toLowerCase()}` : address_.substring(2).toLowerCase();
    const hash = keccak256(stringToBytes(hexAddress), "bytes");
    const address = (chainId ? hexAddress.substring(`${chainId}0x`.length) : hexAddress).split("");
    for (let i = 0; i < 40; i += 2) {
      if (hash[i >> 1] >> 4 >= 8 && address[i]) {
        address[i] = address[i].toUpperCase();
      }
      if ((hash[i >> 1] & 15) >= 8 && address[i + 1]) {
        address[i + 1] = address[i + 1].toUpperCase();
      }
    }
    const result = `0x${address.join("")}`;
    checksumAddressCache.set(`${address_}.${chainId}`, result);
    return result;
  }
  var checksumAddressCache;
  var init_getAddress = __esm({
    "node_modules/viem/_esm/utils/address/getAddress.js"() {
      init_toBytes();
      init_keccak256();
      init_lru();
      checksumAddressCache = /* @__PURE__ */ new LruMap(8192);
    }
  });

  // node_modules/viem/_esm/utils/address/isAddress.js
  function isAddress(address, options) {
    const { strict = true } = options ?? {};
    const cacheKey = `${address}.${strict}`;
    if (isAddressCache.has(cacheKey))
      return isAddressCache.get(cacheKey);
    const result = (() => {
      if (!addressRegex.test(address))
        return false;
      if (address.toLowerCase() === address)
        return true;
      if (strict)
        return checksumAddress(address) === address;
      return true;
    })();
    isAddressCache.set(cacheKey, result);
    return result;
  }
  var addressRegex, isAddressCache;
  var init_isAddress = __esm({
    "node_modules/viem/_esm/utils/address/isAddress.js"() {
      init_lru();
      init_getAddress();
      addressRegex = /^0x[a-fA-F0-9]{40}$/;
      isAddressCache = /* @__PURE__ */ new LruMap(8192);
    }
  });

  // node_modules/viem/_esm/accounts/toAccount.js
  function toAccount(source) {
    if (typeof source === "string") {
      if (!isAddress(source, { strict: false }))
        throw new InvalidAddressError({ address: source });
      return {
        address: source,
        type: "json-rpc"
      };
    }
    if (!isAddress(source.address, { strict: false }))
      throw new InvalidAddressError({ address: source.address });
    return {
      address: source.address,
      nonceManager: source.nonceManager,
      sign: source.sign,
      signAuthorization: source.signAuthorization,
      signMessage: source.signMessage,
      signTransaction: source.signTransaction,
      signTypedData: source.signTypedData,
      source: "custom",
      type: "local"
    };
  }
  var init_toAccount = __esm({
    "node_modules/viem/_esm/accounts/toAccount.js"() {
      init_address();
      init_isAddress();
    }
  });

  // node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js
  function publicKeyToAddress(publicKey) {
    const address = keccak256(`0x${publicKey.substring(4)}`).substring(26);
    return checksumAddress(`0x${address}`);
  }
  var init_publicKeyToAddress = __esm({
    "node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js"() {
      init_getAddress();
      init_keccak256();
    }
  });

  // node_modules/viem/_esm/accounts/utils/sign.js
  async function sign({ hash, privateKey, to = "object" }) {
    const { r, s, recovery } = secp256k1.sign(hash.slice(2), privateKey.slice(2), {
      lowS: true,
      extraEntropy: isHex(extraEntropy, { strict: false }) ? hexToBytes2(extraEntropy) : extraEntropy
    });
    const signature = {
      r: numberToHex(r, { size: 32 }),
      s: numberToHex(s, { size: 32 }),
      v: recovery ? 28n : 27n,
      yParity: recovery
    };
    return (() => {
      if (to === "bytes" || to === "hex")
        return serializeSignature({ ...signature, to });
      return signature;
    })();
  }
  var extraEntropy;
  var init_sign = __esm({
    "node_modules/viem/_esm/accounts/utils/sign.js"() {
      init_secp256k1();
      init_isHex();
      init_toBytes();
      init_toHex();
      init_serializeSignature();
      extraEntropy = false;
    }
  });

  // node_modules/viem/_esm/utils/data/concat.js
  function concat(values) {
    if (typeof values[0] === "string")
      return concatHex(values);
    return concatBytes3(values);
  }
  function concatBytes3(values) {
    let length = 0;
    for (const arr of values) {
      length += arr.length;
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const arr of values) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }
  function concatHex(values) {
    return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
  }
  var init_concat = __esm({
    "node_modules/viem/_esm/utils/data/concat.js"() {
    }
  });

  // node_modules/viem/_esm/errors/cursor.js
  var NegativeOffsetError, PositionOutOfBoundsError, RecursiveReadLimitExceededError;
  var init_cursor = __esm({
    "node_modules/viem/_esm/errors/cursor.js"() {
      init_base();
      NegativeOffsetError = class extends BaseError {
        constructor({ offset }) {
          super(`Offset \`${offset}\` cannot be negative.`, {
            name: "NegativeOffsetError"
          });
        }
      };
      PositionOutOfBoundsError = class extends BaseError {
        constructor({ length, position }) {
          super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, { name: "PositionOutOfBoundsError" });
        }
      };
      RecursiveReadLimitExceededError = class extends BaseError {
        constructor({ count, limit }) {
          super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, { name: "RecursiveReadLimitExceededError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/cursor.js
  function createCursor(bytes, { recursiveReadLimit = 8192 } = {}) {
    const cursor = Object.create(staticCursor);
    cursor.bytes = bytes;
    cursor.dataView = new DataView(bytes.buffer ?? bytes, bytes.byteOffset, bytes.byteLength);
    cursor.positionReadCount = /* @__PURE__ */ new Map();
    cursor.recursiveReadLimit = recursiveReadLimit;
    return cursor;
  }
  var staticCursor;
  var init_cursor2 = __esm({
    "node_modules/viem/_esm/utils/cursor.js"() {
      init_cursor();
      staticCursor = {
        bytes: new Uint8Array(),
        dataView: new DataView(new ArrayBuffer(0)),
        position: 0,
        positionReadCount: /* @__PURE__ */ new Map(),
        recursiveReadCount: 0,
        recursiveReadLimit: Number.POSITIVE_INFINITY,
        assertReadLimit() {
          if (this.recursiveReadCount >= this.recursiveReadLimit)
            throw new RecursiveReadLimitExceededError({
              count: this.recursiveReadCount + 1,
              limit: this.recursiveReadLimit
            });
        },
        assertPosition(position) {
          if (position < 0 || position > this.bytes.length - 1)
            throw new PositionOutOfBoundsError({
              length: this.bytes.length,
              position
            });
        },
        decrementPosition(offset) {
          if (offset < 0)
            throw new NegativeOffsetError({ offset });
          const position = this.position - offset;
          this.assertPosition(position);
          this.position = position;
        },
        getReadCount(position) {
          return this.positionReadCount.get(position || this.position) || 0;
        },
        incrementPosition(offset) {
          if (offset < 0)
            throw new NegativeOffsetError({ offset });
          const position = this.position + offset;
          this.assertPosition(position);
          this.position = position;
        },
        inspectByte(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position);
          return this.bytes[position];
        },
        inspectBytes(length, position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position + length - 1);
          return this.bytes.subarray(position, position + length);
        },
        inspectUint8(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position);
          return this.bytes[position];
        },
        inspectUint16(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position + 1);
          return this.dataView.getUint16(position);
        },
        inspectUint24(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position + 2);
          return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
        },
        inspectUint32(position_) {
          const position = position_ ?? this.position;
          this.assertPosition(position + 3);
          return this.dataView.getUint32(position);
        },
        pushByte(byte) {
          this.assertPosition(this.position);
          this.bytes[this.position] = byte;
          this.position++;
        },
        pushBytes(bytes) {
          this.assertPosition(this.position + bytes.length - 1);
          this.bytes.set(bytes, this.position);
          this.position += bytes.length;
        },
        pushUint8(value) {
          this.assertPosition(this.position);
          this.bytes[this.position] = value;
          this.position++;
        },
        pushUint16(value) {
          this.assertPosition(this.position + 1);
          this.dataView.setUint16(this.position, value);
          this.position += 2;
        },
        pushUint24(value) {
          this.assertPosition(this.position + 2);
          this.dataView.setUint16(this.position, value >> 8);
          this.dataView.setUint8(this.position + 2, value & ~4294967040);
          this.position += 3;
        },
        pushUint32(value) {
          this.assertPosition(this.position + 3);
          this.dataView.setUint32(this.position, value);
          this.position += 4;
        },
        readByte() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectByte();
          this.position++;
          return value;
        },
        readBytes(length, size2) {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectBytes(length);
          this.position += size2 ?? length;
          return value;
        },
        readUint8() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectUint8();
          this.position += 1;
          return value;
        },
        readUint16() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectUint16();
          this.position += 2;
          return value;
        },
        readUint24() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectUint24();
          this.position += 3;
          return value;
        },
        readUint32() {
          this.assertReadLimit();
          this._touch();
          const value = this.inspectUint32();
          this.position += 4;
          return value;
        },
        get remaining() {
          return this.bytes.length - this.position;
        },
        setPosition(position) {
          const oldPosition = this.position;
          this.assertPosition(position);
          this.position = position;
          return () => this.position = oldPosition;
        },
        _touch() {
          if (this.recursiveReadLimit === Number.POSITIVE_INFINITY)
            return;
          const count = this.getReadCount();
          this.positionReadCount.set(this.position, count + 1);
          if (count > 0)
            this.recursiveReadCount++;
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/encoding/toRlp.js
  function toRlp(bytes, to = "hex") {
    const encodable = getEncodable(bytes);
    const cursor = createCursor(new Uint8Array(encodable.length));
    encodable.encode(cursor);
    if (to === "hex")
      return bytesToHex2(cursor.bytes);
    return cursor.bytes;
  }
  function getEncodable(bytes) {
    if (Array.isArray(bytes))
      return getEncodableList(bytes.map((x) => getEncodable(x)));
    return getEncodableBytes(bytes);
  }
  function getEncodableList(list) {
    const bodyLength = list.reduce((acc, x) => acc + x.length, 0);
    const sizeOfBodyLength = getSizeOfLength(bodyLength);
    const length = (() => {
      if (bodyLength <= 55)
        return 1 + bodyLength;
      return 1 + sizeOfBodyLength + bodyLength;
    })();
    return {
      length,
      encode(cursor) {
        if (bodyLength <= 55) {
          cursor.pushByte(192 + bodyLength);
        } else {
          cursor.pushByte(192 + 55 + sizeOfBodyLength);
          if (sizeOfBodyLength === 1)
            cursor.pushUint8(bodyLength);
          else if (sizeOfBodyLength === 2)
            cursor.pushUint16(bodyLength);
          else if (sizeOfBodyLength === 3)
            cursor.pushUint24(bodyLength);
          else
            cursor.pushUint32(bodyLength);
        }
        for (const { encode: encode2 } of list) {
          encode2(cursor);
        }
      }
    };
  }
  function getEncodableBytes(bytesOrHex) {
    const bytes = typeof bytesOrHex === "string" ? hexToBytes2(bytesOrHex) : bytesOrHex;
    const sizeOfBytesLength = getSizeOfLength(bytes.length);
    const length = (() => {
      if (bytes.length === 1 && bytes[0] < 128)
        return 1;
      if (bytes.length <= 55)
        return 1 + bytes.length;
      return 1 + sizeOfBytesLength + bytes.length;
    })();
    return {
      length,
      encode(cursor) {
        if (bytes.length === 1 && bytes[0] < 128) {
          cursor.pushBytes(bytes);
        } else if (bytes.length <= 55) {
          cursor.pushByte(128 + bytes.length);
          cursor.pushBytes(bytes);
        } else {
          cursor.pushByte(128 + 55 + sizeOfBytesLength);
          if (sizeOfBytesLength === 1)
            cursor.pushUint8(bytes.length);
          else if (sizeOfBytesLength === 2)
            cursor.pushUint16(bytes.length);
          else if (sizeOfBytesLength === 3)
            cursor.pushUint24(bytes.length);
          else
            cursor.pushUint32(bytes.length);
          cursor.pushBytes(bytes);
        }
      }
    };
  }
  function getSizeOfLength(length) {
    if (length < 2 ** 8)
      return 1;
    if (length < 2 ** 16)
      return 2;
    if (length < 2 ** 24)
      return 3;
    if (length < 2 ** 32)
      return 4;
    throw new BaseError("Length is too large.");
  }
  var init_toRlp = __esm({
    "node_modules/viem/_esm/utils/encoding/toRlp.js"() {
      init_base();
      init_cursor2();
      init_toBytes();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/utils/authorization/hashAuthorization.js
  function hashAuthorization(parameters) {
    const { chainId, nonce, to } = parameters;
    const address = parameters.contractAddress ?? parameters.address;
    const hash = keccak256(concatHex([
      "0x05",
      toRlp([
        chainId ? numberToHex(chainId) : "0x",
        address,
        nonce ? numberToHex(nonce) : "0x"
      ])
    ]));
    if (to === "bytes")
      return hexToBytes2(hash);
    return hash;
  }
  var init_hashAuthorization = __esm({
    "node_modules/viem/_esm/utils/authorization/hashAuthorization.js"() {
      init_concat();
      init_toBytes();
      init_toHex();
      init_toRlp();
      init_keccak256();
    }
  });

  // node_modules/viem/_esm/accounts/utils/signAuthorization.js
  async function signAuthorization(parameters) {
    const { chainId, nonce, privateKey, to = "object" } = parameters;
    const address = parameters.contractAddress ?? parameters.address;
    const signature = await sign({
      hash: hashAuthorization({ address, chainId, nonce }),
      privateKey,
      to
    });
    if (to === "object")
      return {
        address,
        chainId,
        nonce,
        ...signature
      };
    return signature;
  }
  var init_signAuthorization = __esm({
    "node_modules/viem/_esm/accounts/utils/signAuthorization.js"() {
      init_hashAuthorization();
      init_sign();
    }
  });

  // node_modules/viem/_esm/constants/strings.js
  var presignMessagePrefix;
  var init_strings = __esm({
    "node_modules/viem/_esm/constants/strings.js"() {
      presignMessagePrefix = "Ethereum Signed Message:\n";
    }
  });

  // node_modules/viem/_esm/utils/signature/toPrefixedMessage.js
  function toPrefixedMessage(message_) {
    const message = (() => {
      if (typeof message_ === "string")
        return stringToHex(message_);
      if (typeof message_.raw === "string")
        return message_.raw;
      return bytesToHex2(message_.raw);
    })();
    const prefix = stringToHex(`${presignMessagePrefix}${size(message)}`);
    return concat([prefix, message]);
  }
  var init_toPrefixedMessage = __esm({
    "node_modules/viem/_esm/utils/signature/toPrefixedMessage.js"() {
      init_strings();
      init_concat();
      init_size();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/utils/signature/hashMessage.js
  function hashMessage(message, to_) {
    return keccak256(toPrefixedMessage(message), to_);
  }
  var init_hashMessage = __esm({
    "node_modules/viem/_esm/utils/signature/hashMessage.js"() {
      init_keccak256();
      init_toPrefixedMessage();
    }
  });

  // node_modules/viem/_esm/accounts/utils/signMessage.js
  async function signMessage({ message, privateKey }) {
    return await sign({ hash: hashMessage(message), privateKey, to: "hex" });
  }
  var init_signMessage = __esm({
    "node_modules/viem/_esm/accounts/utils/signMessage.js"() {
      init_hashMessage();
      init_sign();
    }
  });

  // node_modules/viem/_esm/constants/unit.js
  var gweiUnits;
  var init_unit = __esm({
    "node_modules/viem/_esm/constants/unit.js"() {
      gweiUnits = {
        ether: -9,
        wei: 9
      };
    }
  });

  // node_modules/viem/_esm/utils/unit/formatUnits.js
  function formatUnits(value, decimals) {
    let display = value.toString();
    const negative = display.startsWith("-");
    if (negative)
      display = display.slice(1);
    display = display.padStart(decimals, "0");
    let [integer, fraction] = [
      display.slice(0, display.length - decimals),
      display.slice(display.length - decimals)
    ];
    fraction = fraction.replace(/(0+)$/, "");
    return `${negative ? "-" : ""}${integer || "0"}${fraction ? `.${fraction}` : ""}`;
  }
  var init_formatUnits = __esm({
    "node_modules/viem/_esm/utils/unit/formatUnits.js"() {
    }
  });

  // node_modules/viem/_esm/utils/unit/formatGwei.js
  function formatGwei(wei, unit = "wei") {
    return formatUnits(wei, gweiUnits[unit]);
  }
  var init_formatGwei = __esm({
    "node_modules/viem/_esm/utils/unit/formatGwei.js"() {
      init_unit();
      init_formatUnits();
    }
  });

  // node_modules/viem/_esm/errors/transaction.js
  function prettyPrint(args) {
    const entries = Object.entries(args).map(([key, value]) => {
      if (value === void 0 || value === false)
        return null;
      return [key, value];
    }).filter(Boolean);
    const maxLength = entries.reduce((acc, [key]) => Math.max(acc, key.length), 0);
    return entries.map(([key, value]) => `  ${`${key}:`.padEnd(maxLength + 1)}  ${value}`).join("\n");
  }
  var InvalidLegacyVError, InvalidSerializableTransactionError, InvalidStorageKeySizeError;
  var init_transaction = __esm({
    "node_modules/viem/_esm/errors/transaction.js"() {
      init_base();
      InvalidLegacyVError = class extends BaseError {
        constructor({ v }) {
          super(`Invalid \`v\` value "${v}". Expected 27 or 28.`, {
            name: "InvalidLegacyVError"
          });
        }
      };
      InvalidSerializableTransactionError = class extends BaseError {
        constructor({ transaction }) {
          super("Cannot infer a transaction type from provided transaction.", {
            metaMessages: [
              "Provided Transaction:",
              "{",
              prettyPrint(transaction),
              "}",
              "",
              "To infer the type, either provide:",
              "- a `type` to the Transaction, or",
              "- an EIP-1559 Transaction with `maxFeePerGas`, or",
              "- an EIP-2930 Transaction with `gasPrice` & `accessList`, or",
              "- an EIP-4844 Transaction with `blobs`, `blobVersionedHashes`, `sidecars`, or",
              "- an EIP-7702 Transaction with `authorizationList`, or",
              "- a Legacy Transaction with `gasPrice`"
            ],
            name: "InvalidSerializableTransactionError"
          });
        }
      };
      InvalidStorageKeySizeError = class extends BaseError {
        constructor({ storageKey }) {
          super(`Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${Math.floor((storageKey.length - 2) / 2)} bytes.`, { name: "InvalidStorageKeySizeError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/authorization/serializeAuthorizationList.js
  function serializeAuthorizationList(authorizationList) {
    if (!authorizationList || authorizationList.length === 0)
      return [];
    const serializedAuthorizationList = [];
    for (const authorization of authorizationList) {
      const { chainId, nonce, ...signature } = authorization;
      const contractAddress = authorization.address;
      serializedAuthorizationList.push([
        chainId ? toHex(chainId) : "0x",
        contractAddress,
        nonce ? toHex(nonce) : "0x",
        ...toYParitySignatureArray({}, signature)
      ]);
    }
    return serializedAuthorizationList;
  }
  var init_serializeAuthorizationList = __esm({
    "node_modules/viem/_esm/utils/authorization/serializeAuthorizationList.js"() {
      init_toHex();
      init_serializeTransaction();
    }
  });

  // node_modules/viem/_esm/utils/blob/blobsToCommitments.js
  function blobsToCommitments(parameters) {
    const { kzg } = parameters;
    const to = parameters.to ?? (typeof parameters.blobs[0] === "string" ? "hex" : "bytes");
    const blobs = typeof parameters.blobs[0] === "string" ? parameters.blobs.map((x) => hexToBytes2(x)) : parameters.blobs;
    const commitments = [];
    for (const blob of blobs)
      commitments.push(Uint8Array.from(kzg.blobToKzgCommitment(blob)));
    return to === "bytes" ? commitments : commitments.map((x) => bytesToHex2(x));
  }
  var init_blobsToCommitments = __esm({
    "node_modules/viem/_esm/utils/blob/blobsToCommitments.js"() {
      init_toBytes();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/utils/blob/blobsToProofs.js
  function blobsToProofs(parameters) {
    const { kzg } = parameters;
    const to = parameters.to ?? (typeof parameters.blobs[0] === "string" ? "hex" : "bytes");
    const blobs = typeof parameters.blobs[0] === "string" ? parameters.blobs.map((x) => hexToBytes2(x)) : parameters.blobs;
    const commitments = typeof parameters.commitments[0] === "string" ? parameters.commitments.map((x) => hexToBytes2(x)) : parameters.commitments;
    const proofs = [];
    for (let i = 0; i < blobs.length; i++) {
      const blob = blobs[i];
      const commitment = commitments[i];
      proofs.push(Uint8Array.from(kzg.computeBlobKzgProof(blob, commitment)));
    }
    return to === "bytes" ? proofs : proofs.map((x) => bytesToHex2(x));
  }
  var init_blobsToProofs = __esm({
    "node_modules/viem/_esm/utils/blob/blobsToProofs.js"() {
      init_toBytes();
      init_toHex();
    }
  });

  // node_modules/viem/node_modules/@noble/hashes/esm/_md.js
  function setBigUint642(view, byteOffset, value, isLE3) {
    if (typeof view.setBigUint64 === "function")
      return view.setBigUint64(byteOffset, value, isLE3);
    const _32n3 = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n3 & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE3 ? 4 : 0;
    const l = isLE3 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE3);
    view.setUint32(byteOffset + l, wl, isLE3);
  }
  function Chi2(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj2(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  var HashMD2, SHA256_IV2;
  var init_md2 = __esm({
    "node_modules/viem/node_modules/@noble/hashes/esm/_md.js"() {
      init_utils3();
      HashMD2 = class extends Hash2 {
        constructor(blockLen, outputLen, padOffset, isLE3) {
          super();
          this.finished = false;
          this.length = 0;
          this.pos = 0;
          this.destroyed = false;
          this.blockLen = blockLen;
          this.outputLen = outputLen;
          this.padOffset = padOffset;
          this.isLE = isLE3;
          this.buffer = new Uint8Array(blockLen);
          this.view = createView2(this.buffer);
        }
        update(data) {
          aexists2(this);
          data = toBytes3(data);
          abytes3(data);
          const { view, buffer, blockLen } = this;
          const len = data.length;
          for (let pos = 0; pos < len; ) {
            const take = Math.min(blockLen - this.pos, len - pos);
            if (take === blockLen) {
              const dataView = createView2(data);
              for (; blockLen <= len - pos; pos += blockLen)
                this.process(dataView, pos);
              continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
              this.process(view, 0);
              this.pos = 0;
            }
          }
          this.length += data.length;
          this.roundClean();
          return this;
        }
        digestInto(out) {
          aexists2(this);
          aoutput2(out, this);
          this.finished = true;
          const { buffer, view, blockLen, isLE: isLE3 } = this;
          let { pos } = this;
          buffer[pos++] = 128;
          clean2(this.buffer.subarray(pos));
          if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
          }
          for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
          setBigUint642(view, blockLen - 8, BigInt(this.length * 8), isLE3);
          this.process(view, 0);
          const oview = createView2(out);
          const len = this.outputLen;
          if (len % 4)
            throw new Error("_sha2: outputLen should be aligned to 32bit");
          const outLen = len / 4;
          const state = this.get();
          if (outLen > state.length)
            throw new Error("_sha2: outputLen bigger than state");
          for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE3);
        }
        digest() {
          const { buffer, outputLen } = this;
          this.digestInto(buffer);
          const res = buffer.slice(0, outputLen);
          this.destroy();
          return res;
        }
        _cloneInto(to) {
          to || (to = new this.constructor());
          to.set(...this.get());
          const { blockLen, buffer, length, finished, destroyed, pos } = this;
          to.destroyed = destroyed;
          to.finished = finished;
          to.length = length;
          to.pos = pos;
          if (length % blockLen)
            to.buffer.set(buffer);
          return to;
        }
        clone() {
          return this._cloneInto();
        }
      };
      SHA256_IV2 = /* @__PURE__ */ Uint32Array.from([
        1779033703,
        3144134277,
        1013904242,
        2773480762,
        1359893119,
        2600822924,
        528734635,
        1541459225
      ]);
    }
  });

  // node_modules/viem/node_modules/@noble/hashes/esm/sha2.js
  var SHA256_K2, SHA256_W2, SHA2562, sha2562;
  var init_sha22 = __esm({
    "node_modules/viem/node_modules/@noble/hashes/esm/sha2.js"() {
      init_md2();
      init_utils3();
      SHA256_K2 = /* @__PURE__ */ Uint32Array.from([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      SHA256_W2 = /* @__PURE__ */ new Uint32Array(64);
      SHA2562 = class extends HashMD2 {
        constructor(outputLen = 32) {
          super(64, outputLen, 8, false);
          this.A = SHA256_IV2[0] | 0;
          this.B = SHA256_IV2[1] | 0;
          this.C = SHA256_IV2[2] | 0;
          this.D = SHA256_IV2[3] | 0;
          this.E = SHA256_IV2[4] | 0;
          this.F = SHA256_IV2[5] | 0;
          this.G = SHA256_IV2[6] | 0;
          this.H = SHA256_IV2[7] | 0;
        }
        get() {
          const { A, B, C, D: D2, E, F, G, H } = this;
          return [A, B, C, D2, E, F, G, H];
        }
        // prettier-ignore
        set(A, B, C, D2, E, F, G, H) {
          this.A = A | 0;
          this.B = B | 0;
          this.C = C | 0;
          this.D = D2 | 0;
          this.E = E | 0;
          this.F = F | 0;
          this.G = G | 0;
          this.H = H | 0;
        }
        process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W2[i] = view.getUint32(offset, false);
          for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W2[i - 15];
            const W2 = SHA256_W2[i - 2];
            const s0 = rotr2(W15, 7) ^ rotr2(W15, 18) ^ W15 >>> 3;
            const s1 = rotr2(W2, 17) ^ rotr2(W2, 19) ^ W2 >>> 10;
            SHA256_W2[i] = s1 + SHA256_W2[i - 7] + s0 + SHA256_W2[i - 16] | 0;
          }
          let { A, B, C, D: D2, E, F, G, H } = this;
          for (let i = 0; i < 64; i++) {
            const sigma1 = rotr2(E, 6) ^ rotr2(E, 11) ^ rotr2(E, 25);
            const T1 = H + sigma1 + Chi2(E, F, G) + SHA256_K2[i] + SHA256_W2[i] | 0;
            const sigma0 = rotr2(A, 2) ^ rotr2(A, 13) ^ rotr2(A, 22);
            const T2 = sigma0 + Maj2(A, B, C) | 0;
            H = G;
            G = F;
            F = E;
            E = D2 + T1 | 0;
            D2 = C;
            C = B;
            B = A;
            A = T1 + T2 | 0;
          }
          A = A + this.A | 0;
          B = B + this.B | 0;
          C = C + this.C | 0;
          D2 = D2 + this.D | 0;
          E = E + this.E | 0;
          F = F + this.F | 0;
          G = G + this.G | 0;
          H = H + this.H | 0;
          this.set(A, B, C, D2, E, F, G, H);
        }
        roundClean() {
          clean2(SHA256_W2);
        }
        destroy() {
          this.set(0, 0, 0, 0, 0, 0, 0, 0);
          clean2(this.buffer);
        }
      };
      sha2562 = /* @__PURE__ */ createHasher2(() => new SHA2562());
    }
  });

  // node_modules/viem/node_modules/@noble/hashes/esm/sha256.js
  var sha2563;
  var init_sha256 = __esm({
    "node_modules/viem/node_modules/@noble/hashes/esm/sha256.js"() {
      init_sha22();
      sha2563 = sha2562;
    }
  });

  // node_modules/viem/_esm/utils/hash/sha256.js
  function sha2564(value, to_) {
    const to = to_ || "hex";
    const bytes = sha2563(isHex(value, { strict: false }) ? toBytes2(value) : value);
    if (to === "bytes")
      return bytes;
    return toHex(bytes);
  }
  var init_sha2562 = __esm({
    "node_modules/viem/_esm/utils/hash/sha256.js"() {
      init_sha256();
      init_isHex();
      init_toBytes();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js
  function commitmentToVersionedHash(parameters) {
    const { commitment, version: version2 = 1 } = parameters;
    const to = parameters.to ?? (typeof commitment === "string" ? "hex" : "bytes");
    const versionedHash = sha2564(commitment, "bytes");
    versionedHash.set([version2], 0);
    return to === "bytes" ? versionedHash : bytesToHex2(versionedHash);
  }
  var init_commitmentToVersionedHash = __esm({
    "node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js"() {
      init_toHex();
      init_sha2562();
    }
  });

  // node_modules/viem/_esm/utils/blob/commitmentsToVersionedHashes.js
  function commitmentsToVersionedHashes(parameters) {
    const { commitments, version: version2 } = parameters;
    const to = parameters.to ?? (typeof commitments[0] === "string" ? "hex" : "bytes");
    const hashes = [];
    for (const commitment of commitments) {
      hashes.push(commitmentToVersionedHash({
        commitment,
        to,
        version: version2
      }));
    }
    return hashes;
  }
  var init_commitmentsToVersionedHashes = __esm({
    "node_modules/viem/_esm/utils/blob/commitmentsToVersionedHashes.js"() {
      init_commitmentToVersionedHash();
    }
  });

  // node_modules/viem/_esm/constants/blob.js
  var blobsPerTransaction, bytesPerFieldElement, fieldElementsPerBlob, bytesPerBlob, maxBytesPerTransaction;
  var init_blob = __esm({
    "node_modules/viem/_esm/constants/blob.js"() {
      blobsPerTransaction = 6;
      bytesPerFieldElement = 32;
      fieldElementsPerBlob = 4096;
      bytesPerBlob = bytesPerFieldElement * fieldElementsPerBlob;
      maxBytesPerTransaction = bytesPerBlob * blobsPerTransaction - // terminator byte (0x80).
      1 - // zero byte (0x00) appended to each field element.
      1 * fieldElementsPerBlob * blobsPerTransaction;
    }
  });

  // node_modules/viem/_esm/constants/kzg.js
  var versionedHashVersionKzg;
  var init_kzg = __esm({
    "node_modules/viem/_esm/constants/kzg.js"() {
      versionedHashVersionKzg = 1;
    }
  });

  // node_modules/viem/_esm/errors/blob.js
  var BlobSizeTooLargeError, EmptyBlobError, InvalidVersionedHashSizeError, InvalidVersionedHashVersionError;
  var init_blob2 = __esm({
    "node_modules/viem/_esm/errors/blob.js"() {
      init_kzg();
      init_base();
      BlobSizeTooLargeError = class extends BaseError {
        constructor({ maxSize, size: size2 }) {
          super("Blob size is too large.", {
            metaMessages: [`Max: ${maxSize} bytes`, `Given: ${size2} bytes`],
            name: "BlobSizeTooLargeError"
          });
        }
      };
      EmptyBlobError = class extends BaseError {
        constructor() {
          super("Blob data must not be empty.", { name: "EmptyBlobError" });
        }
      };
      InvalidVersionedHashSizeError = class extends BaseError {
        constructor({ hash, size: size2 }) {
          super(`Versioned hash "${hash}" size is invalid.`, {
            metaMessages: ["Expected: 32", `Received: ${size2}`],
            name: "InvalidVersionedHashSizeError"
          });
        }
      };
      InvalidVersionedHashVersionError = class extends BaseError {
        constructor({ hash, version: version2 }) {
          super(`Versioned hash "${hash}" version is invalid.`, {
            metaMessages: [
              `Expected: ${versionedHashVersionKzg}`,
              `Received: ${version2}`
            ],
            name: "InvalidVersionedHashVersionError"
          });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/blob/toBlobs.js
  function toBlobs(parameters) {
    const to = parameters.to ?? (typeof parameters.data === "string" ? "hex" : "bytes");
    const data = typeof parameters.data === "string" ? hexToBytes2(parameters.data) : parameters.data;
    const size_ = size(data);
    if (!size_)
      throw new EmptyBlobError();
    if (size_ > maxBytesPerTransaction)
      throw new BlobSizeTooLargeError({
        maxSize: maxBytesPerTransaction,
        size: size_
      });
    const blobs = [];
    let active = true;
    let position = 0;
    while (active) {
      const blob = createCursor(new Uint8Array(bytesPerBlob));
      let size2 = 0;
      while (size2 < fieldElementsPerBlob) {
        const bytes = data.slice(position, position + (bytesPerFieldElement - 1));
        blob.pushByte(0);
        blob.pushBytes(bytes);
        if (bytes.length < 31) {
          blob.pushByte(128);
          active = false;
          break;
        }
        size2++;
        position += 31;
      }
      blobs.push(blob);
    }
    return to === "bytes" ? blobs.map((x) => x.bytes) : blobs.map((x) => bytesToHex2(x.bytes));
  }
  var init_toBlobs = __esm({
    "node_modules/viem/_esm/utils/blob/toBlobs.js"() {
      init_blob();
      init_blob2();
      init_cursor2();
      init_size();
      init_toBytes();
      init_toHex();
    }
  });

  // node_modules/viem/_esm/utils/blob/toBlobSidecars.js
  function toBlobSidecars(parameters) {
    const { data, kzg, to } = parameters;
    const blobs = parameters.blobs ?? toBlobs({ data, to });
    const commitments = parameters.commitments ?? blobsToCommitments({ blobs, kzg, to });
    const proofs = parameters.proofs ?? blobsToProofs({ blobs, commitments, kzg, to });
    const sidecars = [];
    for (let i = 0; i < blobs.length; i++)
      sidecars.push({
        blob: blobs[i],
        commitment: commitments[i],
        proof: proofs[i]
      });
    return sidecars;
  }
  var init_toBlobSidecars = __esm({
    "node_modules/viem/_esm/utils/blob/toBlobSidecars.js"() {
      init_blobsToCommitments();
      init_blobsToProofs();
      init_toBlobs();
    }
  });

  // node_modules/viem/_esm/constants/number.js
  var maxInt8, maxInt16, maxInt24, maxInt32, maxInt40, maxInt48, maxInt56, maxInt64, maxInt72, maxInt80, maxInt88, maxInt96, maxInt104, maxInt112, maxInt120, maxInt128, maxInt136, maxInt144, maxInt152, maxInt160, maxInt168, maxInt176, maxInt184, maxInt192, maxInt200, maxInt208, maxInt216, maxInt224, maxInt232, maxInt240, maxInt248, maxInt256, minInt8, minInt16, minInt24, minInt32, minInt40, minInt48, minInt56, minInt64, minInt72, minInt80, minInt88, minInt96, minInt104, minInt112, minInt120, minInt128, minInt136, minInt144, minInt152, minInt160, minInt168, minInt176, minInt184, minInt192, minInt200, minInt208, minInt216, minInt224, minInt232, minInt240, minInt248, minInt256, maxUint8, maxUint16, maxUint24, maxUint32, maxUint40, maxUint48, maxUint56, maxUint64, maxUint72, maxUint80, maxUint88, maxUint96, maxUint104, maxUint112, maxUint120, maxUint128, maxUint136, maxUint144, maxUint152, maxUint160, maxUint168, maxUint176, maxUint184, maxUint192, maxUint200, maxUint208, maxUint216, maxUint224, maxUint232, maxUint240, maxUint248, maxUint256;
  var init_number = __esm({
    "node_modules/viem/_esm/constants/number.js"() {
      maxInt8 = 2n ** (8n - 1n) - 1n;
      maxInt16 = 2n ** (16n - 1n) - 1n;
      maxInt24 = 2n ** (24n - 1n) - 1n;
      maxInt32 = 2n ** (32n - 1n) - 1n;
      maxInt40 = 2n ** (40n - 1n) - 1n;
      maxInt48 = 2n ** (48n - 1n) - 1n;
      maxInt56 = 2n ** (56n - 1n) - 1n;
      maxInt64 = 2n ** (64n - 1n) - 1n;
      maxInt72 = 2n ** (72n - 1n) - 1n;
      maxInt80 = 2n ** (80n - 1n) - 1n;
      maxInt88 = 2n ** (88n - 1n) - 1n;
      maxInt96 = 2n ** (96n - 1n) - 1n;
      maxInt104 = 2n ** (104n - 1n) - 1n;
      maxInt112 = 2n ** (112n - 1n) - 1n;
      maxInt120 = 2n ** (120n - 1n) - 1n;
      maxInt128 = 2n ** (128n - 1n) - 1n;
      maxInt136 = 2n ** (136n - 1n) - 1n;
      maxInt144 = 2n ** (144n - 1n) - 1n;
      maxInt152 = 2n ** (152n - 1n) - 1n;
      maxInt160 = 2n ** (160n - 1n) - 1n;
      maxInt168 = 2n ** (168n - 1n) - 1n;
      maxInt176 = 2n ** (176n - 1n) - 1n;
      maxInt184 = 2n ** (184n - 1n) - 1n;
      maxInt192 = 2n ** (192n - 1n) - 1n;
      maxInt200 = 2n ** (200n - 1n) - 1n;
      maxInt208 = 2n ** (208n - 1n) - 1n;
      maxInt216 = 2n ** (216n - 1n) - 1n;
      maxInt224 = 2n ** (224n - 1n) - 1n;
      maxInt232 = 2n ** (232n - 1n) - 1n;
      maxInt240 = 2n ** (240n - 1n) - 1n;
      maxInt248 = 2n ** (248n - 1n) - 1n;
      maxInt256 = 2n ** (256n - 1n) - 1n;
      minInt8 = -(2n ** (8n - 1n));
      minInt16 = -(2n ** (16n - 1n));
      minInt24 = -(2n ** (24n - 1n));
      minInt32 = -(2n ** (32n - 1n));
      minInt40 = -(2n ** (40n - 1n));
      minInt48 = -(2n ** (48n - 1n));
      minInt56 = -(2n ** (56n - 1n));
      minInt64 = -(2n ** (64n - 1n));
      minInt72 = -(2n ** (72n - 1n));
      minInt80 = -(2n ** (80n - 1n));
      minInt88 = -(2n ** (88n - 1n));
      minInt96 = -(2n ** (96n - 1n));
      minInt104 = -(2n ** (104n - 1n));
      minInt112 = -(2n ** (112n - 1n));
      minInt120 = -(2n ** (120n - 1n));
      minInt128 = -(2n ** (128n - 1n));
      minInt136 = -(2n ** (136n - 1n));
      minInt144 = -(2n ** (144n - 1n));
      minInt152 = -(2n ** (152n - 1n));
      minInt160 = -(2n ** (160n - 1n));
      minInt168 = -(2n ** (168n - 1n));
      minInt176 = -(2n ** (176n - 1n));
      minInt184 = -(2n ** (184n - 1n));
      minInt192 = -(2n ** (192n - 1n));
      minInt200 = -(2n ** (200n - 1n));
      minInt208 = -(2n ** (208n - 1n));
      minInt216 = -(2n ** (216n - 1n));
      minInt224 = -(2n ** (224n - 1n));
      minInt232 = -(2n ** (232n - 1n));
      minInt240 = -(2n ** (240n - 1n));
      minInt248 = -(2n ** (248n - 1n));
      minInt256 = -(2n ** (256n - 1n));
      maxUint8 = 2n ** 8n - 1n;
      maxUint16 = 2n ** 16n - 1n;
      maxUint24 = 2n ** 24n - 1n;
      maxUint32 = 2n ** 32n - 1n;
      maxUint40 = 2n ** 40n - 1n;
      maxUint48 = 2n ** 48n - 1n;
      maxUint56 = 2n ** 56n - 1n;
      maxUint64 = 2n ** 64n - 1n;
      maxUint72 = 2n ** 72n - 1n;
      maxUint80 = 2n ** 80n - 1n;
      maxUint88 = 2n ** 88n - 1n;
      maxUint96 = 2n ** 96n - 1n;
      maxUint104 = 2n ** 104n - 1n;
      maxUint112 = 2n ** 112n - 1n;
      maxUint120 = 2n ** 120n - 1n;
      maxUint128 = 2n ** 128n - 1n;
      maxUint136 = 2n ** 136n - 1n;
      maxUint144 = 2n ** 144n - 1n;
      maxUint152 = 2n ** 152n - 1n;
      maxUint160 = 2n ** 160n - 1n;
      maxUint168 = 2n ** 168n - 1n;
      maxUint176 = 2n ** 176n - 1n;
      maxUint184 = 2n ** 184n - 1n;
      maxUint192 = 2n ** 192n - 1n;
      maxUint200 = 2n ** 200n - 1n;
      maxUint208 = 2n ** 208n - 1n;
      maxUint216 = 2n ** 216n - 1n;
      maxUint224 = 2n ** 224n - 1n;
      maxUint232 = 2n ** 232n - 1n;
      maxUint240 = 2n ** 240n - 1n;
      maxUint248 = 2n ** 248n - 1n;
      maxUint256 = 2n ** 256n - 1n;
    }
  });

  // node_modules/viem/_esm/errors/chain.js
  var InvalidChainIdError;
  var init_chain = __esm({
    "node_modules/viem/_esm/errors/chain.js"() {
      init_base();
      InvalidChainIdError = class extends BaseError {
        constructor({ chainId }) {
          super(typeof chainId === "number" ? `Chain ID "${chainId}" is invalid.` : "Chain ID is invalid.", { name: "InvalidChainIdError" });
        }
      };
    }
  });

  // node_modules/viem/_esm/errors/node.js
  var ExecutionRevertedError, FeeCapTooHighError, FeeCapTooLowError, NonceTooHighError, NonceTooLowError, NonceMaxValueError, InsufficientFundsError, IntrinsicGasTooHighError, IntrinsicGasTooLowError, TransactionTypeNotSupportedError, TipAboveFeeCapError;
  var init_node = __esm({
    "node_modules/viem/_esm/errors/node.js"() {
      init_formatGwei();
      init_base();
      ExecutionRevertedError = class extends BaseError {
        constructor({ cause, message } = {}) {
          const reason = message?.replace("execution reverted: ", "")?.replace("execution reverted", "");
          super(`Execution reverted ${reason ? `with reason: ${reason}` : "for an unknown reason"}.`, {
            cause,
            name: "ExecutionRevertedError"
          });
        }
      };
      Object.defineProperty(ExecutionRevertedError, "code", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 3
      });
      Object.defineProperty(ExecutionRevertedError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /execution reverted|gas required exceeds allowance/
      });
      FeeCapTooHighError = class extends BaseError {
        constructor({ cause, maxFeePerGas } = {}) {
          super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}) cannot be higher than the maximum allowed value (2^256-1).`, {
            cause,
            name: "FeeCapTooHighError"
          });
        }
      };
      Object.defineProperty(FeeCapTooHighError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /max fee per gas higher than 2\^256-1|fee cap higher than 2\^256-1/
      });
      FeeCapTooLowError = class extends BaseError {
        constructor({ cause, maxFeePerGas } = {}) {
          super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)}` : ""} gwei) cannot be lower than the block base fee.`, {
            cause,
            name: "FeeCapTooLowError"
          });
        }
      };
      Object.defineProperty(FeeCapTooLowError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /max fee per gas less than block base fee|fee cap less than block base fee|transaction is outdated/
      });
      NonceTooHighError = class extends BaseError {
        constructor({ cause, nonce } = {}) {
          super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is higher than the next one expected.`, { cause, name: "NonceTooHighError" });
        }
      };
      Object.defineProperty(NonceTooHighError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /nonce too high/
      });
      NonceTooLowError = class extends BaseError {
        constructor({ cause, nonce } = {}) {
          super([
            `Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is lower than the current nonce of the account.`,
            "Try increasing the nonce or find the latest nonce with `getTransactionCount`."
          ].join("\n"), { cause, name: "NonceTooLowError" });
        }
      };
      Object.defineProperty(NonceTooLowError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /nonce too low|transaction already imported|already known/
      });
      NonceMaxValueError = class extends BaseError {
        constructor({ cause, nonce } = {}) {
          super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}exceeds the maximum allowed nonce.`, { cause, name: "NonceMaxValueError" });
        }
      };
      Object.defineProperty(NonceMaxValueError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /nonce has max value/
      });
      InsufficientFundsError = class extends BaseError {
        constructor({ cause } = {}) {
          super([
            "The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account."
          ].join("\n"), {
            cause,
            metaMessages: [
              "This error could arise when the account does not have enough funds to:",
              " - pay for the total gas fee,",
              " - pay for the value to send.",
              " ",
              "The cost of the transaction is calculated as `gas * gas fee + value`, where:",
              " - `gas` is the amount of gas needed for transaction to execute,",
              " - `gas fee` is the gas fee,",
              " - `value` is the amount of ether to send to the recipient."
            ],
            name: "InsufficientFundsError"
          });
        }
      };
      Object.defineProperty(InsufficientFundsError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /insufficient funds|exceeds transaction sender account balance/
      });
      IntrinsicGasTooHighError = class extends BaseError {
        constructor({ cause, gas } = {}) {
          super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction exceeds the limit allowed for the block.`, {
            cause,
            name: "IntrinsicGasTooHighError"
          });
        }
      };
      Object.defineProperty(IntrinsicGasTooHighError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /intrinsic gas too high|gas limit reached/
      });
      IntrinsicGasTooLowError = class extends BaseError {
        constructor({ cause, gas } = {}) {
          super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction is too low.`, {
            cause,
            name: "IntrinsicGasTooLowError"
          });
        }
      };
      Object.defineProperty(IntrinsicGasTooLowError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /intrinsic gas too low/
      });
      TransactionTypeNotSupportedError = class extends BaseError {
        constructor({ cause }) {
          super("The transaction type is not supported for this chain.", {
            cause,
            name: "TransactionTypeNotSupportedError"
          });
        }
      };
      Object.defineProperty(TransactionTypeNotSupportedError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /transaction type not valid/
      });
      TipAboveFeeCapError = class extends BaseError {
        constructor({ cause, maxPriorityFeePerGas, maxFeePerGas } = {}) {
          super([
            `The provided tip (\`maxPriorityFeePerGas\`${maxPriorityFeePerGas ? ` = ${formatGwei(maxPriorityFeePerGas)} gwei` : ""}) cannot be higher than the fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}).`
          ].join("\n"), {
            cause,
            name: "TipAboveFeeCapError"
          });
        }
      };
      Object.defineProperty(TipAboveFeeCapError, "nodeMessage", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: /max priority fee per gas higher than max fee per gas|tip higher than fee cap/
      });
    }
  });

  // node_modules/viem/_esm/utils/data/slice.js
  function slice(value, start, end, { strict } = {}) {
    if (isHex(value, { strict: false }))
      return sliceHex(value, start, end, {
        strict
      });
    return sliceBytes(value, start, end, {
      strict
    });
  }
  function assertStartOffset(value, start) {
    if (typeof start === "number" && start > 0 && start > size(value) - 1)
      throw new SliceOffsetOutOfBoundsError({
        offset: start,
        position: "start",
        size: size(value)
      });
  }
  function assertEndOffset(value, start, end) {
    if (typeof start === "number" && typeof end === "number" && size(value) !== end - start) {
      throw new SliceOffsetOutOfBoundsError({
        offset: end,
        position: "end",
        size: size(value)
      });
    }
  }
  function sliceBytes(value_, start, end, { strict } = {}) {
    assertStartOffset(value_, start);
    const value = value_.slice(start, end);
    if (strict)
      assertEndOffset(value, start, end);
    return value;
  }
  function sliceHex(value_, start, end, { strict } = {}) {
    assertStartOffset(value_, start);
    const value = `0x${value_.replace("0x", "").slice((start ?? 0) * 2, (end ?? value_.length) * 2)}`;
    if (strict)
      assertEndOffset(value, start, end);
    return value;
  }
  var init_slice = __esm({
    "node_modules/viem/_esm/utils/data/slice.js"() {
      init_data();
      init_isHex();
      init_size();
    }
  });

  // node_modules/viem/_esm/utils/transaction/assertTransaction.js
  function assertTransactionEIP7702(transaction) {
    const { authorizationList } = transaction;
    if (authorizationList) {
      for (const authorization of authorizationList) {
        const { chainId } = authorization;
        const address = authorization.address;
        if (!isAddress(address))
          throw new InvalidAddressError({ address });
        if (chainId < 0)
          throw new InvalidChainIdError({ chainId });
      }
    }
    assertTransactionEIP1559(transaction);
  }
  function assertTransactionEIP4844(transaction) {
    const { blobVersionedHashes } = transaction;
    if (blobVersionedHashes) {
      if (blobVersionedHashes.length === 0)
        throw new EmptyBlobError();
      for (const hash of blobVersionedHashes) {
        const size_ = size(hash);
        const version2 = hexToNumber2(slice(hash, 0, 1));
        if (size_ !== 32)
          throw new InvalidVersionedHashSizeError({ hash, size: size_ });
        if (version2 !== versionedHashVersionKzg)
          throw new InvalidVersionedHashVersionError({
            hash,
            version: version2
          });
      }
    }
    assertTransactionEIP1559(transaction);
  }
  function assertTransactionEIP1559(transaction) {
    const { chainId, maxPriorityFeePerGas, maxFeePerGas, to } = transaction;
    if (chainId <= 0)
      throw new InvalidChainIdError({ chainId });
    if (to && !isAddress(to))
      throw new InvalidAddressError({ address: to });
    if (maxFeePerGas && maxFeePerGas > maxUint256)
      throw new FeeCapTooHighError({ maxFeePerGas });
    if (maxPriorityFeePerGas && maxFeePerGas && maxPriorityFeePerGas > maxFeePerGas)
      throw new TipAboveFeeCapError({ maxFeePerGas, maxPriorityFeePerGas });
  }
  function assertTransactionEIP2930(transaction) {
    const { chainId, maxPriorityFeePerGas, gasPrice, maxFeePerGas, to } = transaction;
    if (chainId <= 0)
      throw new InvalidChainIdError({ chainId });
    if (to && !isAddress(to))
      throw new InvalidAddressError({ address: to });
    if (maxPriorityFeePerGas || maxFeePerGas)
      throw new BaseError("`maxFeePerGas`/`maxPriorityFeePerGas` is not a valid EIP-2930 Transaction attribute.");
    if (gasPrice && gasPrice > maxUint256)
      throw new FeeCapTooHighError({ maxFeePerGas: gasPrice });
  }
  function assertTransactionLegacy(transaction) {
    const { chainId, maxPriorityFeePerGas, gasPrice, maxFeePerGas, to } = transaction;
    if (to && !isAddress(to))
      throw new InvalidAddressError({ address: to });
    if (typeof chainId !== "undefined" && chainId <= 0)
      throw new InvalidChainIdError({ chainId });
    if (maxPriorityFeePerGas || maxFeePerGas)
      throw new BaseError("`maxFeePerGas`/`maxPriorityFeePerGas` is not a valid Legacy Transaction attribute.");
    if (gasPrice && gasPrice > maxUint256)
      throw new FeeCapTooHighError({ maxFeePerGas: gasPrice });
  }
  var init_assertTransaction = __esm({
    "node_modules/viem/_esm/utils/transaction/assertTransaction.js"() {
      init_kzg();
      init_number();
      init_address();
      init_base();
      init_blob2();
      init_chain();
      init_node();
      init_isAddress();
      init_size();
      init_slice();
      init_fromHex();
    }
  });

  // node_modules/viem/_esm/utils/transaction/getTransactionType.js
  function getTransactionType(transaction) {
    if (transaction.type)
      return transaction.type;
    if (typeof transaction.authorizationList !== "undefined")
      return "eip7702";
    if (typeof transaction.blobs !== "undefined" || typeof transaction.blobVersionedHashes !== "undefined" || typeof transaction.maxFeePerBlobGas !== "undefined" || typeof transaction.sidecars !== "undefined")
      return "eip4844";
    if (typeof transaction.maxFeePerGas !== "undefined" || typeof transaction.maxPriorityFeePerGas !== "undefined") {
      return "eip1559";
    }
    if (typeof transaction.gasPrice !== "undefined") {
      if (typeof transaction.accessList !== "undefined")
        return "eip2930";
      return "legacy";
    }
    throw new InvalidSerializableTransactionError({ transaction });
  }
  var init_getTransactionType = __esm({
    "node_modules/viem/_esm/utils/transaction/getTransactionType.js"() {
      init_transaction();
    }
  });

  // node_modules/viem/_esm/utils/transaction/serializeAccessList.js
  function serializeAccessList(accessList) {
    if (!accessList || accessList.length === 0)
      return [];
    const serializedAccessList = [];
    for (let i = 0; i < accessList.length; i++) {
      const { address, storageKeys } = accessList[i];
      for (let j = 0; j < storageKeys.length; j++) {
        if (storageKeys[j].length - 2 !== 64) {
          throw new InvalidStorageKeySizeError({ storageKey: storageKeys[j] });
        }
      }
      if (!isAddress(address, { strict: false })) {
        throw new InvalidAddressError({ address });
      }
      serializedAccessList.push([address, storageKeys]);
    }
    return serializedAccessList;
  }
  var init_serializeAccessList = __esm({
    "node_modules/viem/_esm/utils/transaction/serializeAccessList.js"() {
      init_address();
      init_transaction();
      init_isAddress();
    }
  });

  // node_modules/viem/_esm/utils/transaction/serializeTransaction.js
  function serializeTransaction(transaction, signature) {
    const type = getTransactionType(transaction);
    if (type === "eip1559")
      return serializeTransactionEIP1559(transaction, signature);
    if (type === "eip2930")
      return serializeTransactionEIP2930(transaction, signature);
    if (type === "eip4844")
      return serializeTransactionEIP4844(transaction, signature);
    if (type === "eip7702")
      return serializeTransactionEIP7702(transaction, signature);
    return serializeTransactionLegacy(transaction, signature);
  }
  function serializeTransactionEIP7702(transaction, signature) {
    const { authorizationList, chainId, gas, nonce, to, value, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
    assertTransactionEIP7702(transaction);
    const serializedAccessList = serializeAccessList(accessList);
    const serializedAuthorizationList = serializeAuthorizationList(authorizationList);
    return concatHex([
      "0x04",
      toRlp([
        numberToHex(chainId),
        nonce ? numberToHex(nonce) : "0x",
        maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
        maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
        gas ? numberToHex(gas) : "0x",
        to ?? "0x",
        value ? numberToHex(value) : "0x",
        data ?? "0x",
        serializedAccessList,
        serializedAuthorizationList,
        ...toYParitySignatureArray(transaction, signature)
      ])
    ]);
  }
  function serializeTransactionEIP4844(transaction, signature) {
    const { chainId, gas, nonce, to, value, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
    assertTransactionEIP4844(transaction);
    let blobVersionedHashes = transaction.blobVersionedHashes;
    let sidecars = transaction.sidecars;
    if (transaction.blobs && (typeof blobVersionedHashes === "undefined" || typeof sidecars === "undefined")) {
      const blobs2 = typeof transaction.blobs[0] === "string" ? transaction.blobs : transaction.blobs.map((x) => bytesToHex2(x));
      const kzg = transaction.kzg;
      const commitments2 = blobsToCommitments({
        blobs: blobs2,
        kzg
      });
      if (typeof blobVersionedHashes === "undefined")
        blobVersionedHashes = commitmentsToVersionedHashes({
          commitments: commitments2
        });
      if (typeof sidecars === "undefined") {
        const proofs2 = blobsToProofs({ blobs: blobs2, commitments: commitments2, kzg });
        sidecars = toBlobSidecars({ blobs: blobs2, commitments: commitments2, proofs: proofs2 });
      }
    }
    const serializedAccessList = serializeAccessList(accessList);
    const serializedTransaction = [
      numberToHex(chainId),
      nonce ? numberToHex(nonce) : "0x",
      maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
      maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
      gas ? numberToHex(gas) : "0x",
      to ?? "0x",
      value ? numberToHex(value) : "0x",
      data ?? "0x",
      serializedAccessList,
      maxFeePerBlobGas ? numberToHex(maxFeePerBlobGas) : "0x",
      blobVersionedHashes ?? [],
      ...toYParitySignatureArray(transaction, signature)
    ];
    const blobs = [];
    const commitments = [];
    const proofs = [];
    if (sidecars)
      for (let i = 0; i < sidecars.length; i++) {
        const { blob, commitment, proof } = sidecars[i];
        blobs.push(blob);
        commitments.push(commitment);
        proofs.push(proof);
      }
    return concatHex([
      "0x03",
      sidecars ? (
        // If sidecars are enabled, envelope turns into a "wrapper":
        toRlp([serializedTransaction, blobs, commitments, proofs])
      ) : (
        // If sidecars are disabled, standard envelope is used:
        toRlp(serializedTransaction)
      )
    ]);
  }
  function serializeTransactionEIP1559(transaction, signature) {
    const { chainId, gas, nonce, to, value, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
    assertTransactionEIP1559(transaction);
    const serializedAccessList = serializeAccessList(accessList);
    const serializedTransaction = [
      numberToHex(chainId),
      nonce ? numberToHex(nonce) : "0x",
      maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
      maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
      gas ? numberToHex(gas) : "0x",
      to ?? "0x",
      value ? numberToHex(value) : "0x",
      data ?? "0x",
      serializedAccessList,
      ...toYParitySignatureArray(transaction, signature)
    ];
    return concatHex([
      "0x02",
      toRlp(serializedTransaction)
    ]);
  }
  function serializeTransactionEIP2930(transaction, signature) {
    const { chainId, gas, data, nonce, to, value, accessList, gasPrice } = transaction;
    assertTransactionEIP2930(transaction);
    const serializedAccessList = serializeAccessList(accessList);
    const serializedTransaction = [
      numberToHex(chainId),
      nonce ? numberToHex(nonce) : "0x",
      gasPrice ? numberToHex(gasPrice) : "0x",
      gas ? numberToHex(gas) : "0x",
      to ?? "0x",
      value ? numberToHex(value) : "0x",
      data ?? "0x",
      serializedAccessList,
      ...toYParitySignatureArray(transaction, signature)
    ];
    return concatHex([
      "0x01",
      toRlp(serializedTransaction)
    ]);
  }
  function serializeTransactionLegacy(transaction, signature) {
    const { chainId = 0, gas, data, nonce, to, value, gasPrice } = transaction;
    assertTransactionLegacy(transaction);
    let serializedTransaction = [
      nonce ? numberToHex(nonce) : "0x",
      gasPrice ? numberToHex(gasPrice) : "0x",
      gas ? numberToHex(gas) : "0x",
      to ?? "0x",
      value ? numberToHex(value) : "0x",
      data ?? "0x"
    ];
    if (signature) {
      const v = (() => {
        if (signature.v >= 35n) {
          const inferredChainId = (signature.v - 35n) / 2n;
          if (inferredChainId > 0)
            return signature.v;
          return 27n + (signature.v === 35n ? 0n : 1n);
        }
        if (chainId > 0)
          return BigInt(chainId * 2) + BigInt(35n + signature.v - 27n);
        const v2 = 27n + (signature.v === 27n ? 0n : 1n);
        if (signature.v !== v2)
          throw new InvalidLegacyVError({ v: signature.v });
        return v2;
      })();
      const r = trim(signature.r);
      const s = trim(signature.s);
      serializedTransaction = [
        ...serializedTransaction,
        numberToHex(v),
        r === "0x00" ? "0x" : r,
        s === "0x00" ? "0x" : s
      ];
    } else if (chainId > 0) {
      serializedTransaction = [
        ...serializedTransaction,
        numberToHex(chainId),
        "0x",
        "0x"
      ];
    }
    return toRlp(serializedTransaction);
  }
  function toYParitySignatureArray(transaction, signature_) {
    const signature = signature_ ?? transaction;
    const { v, yParity } = signature;
    if (typeof signature.r === "undefined")
      return [];
    if (typeof signature.s === "undefined")
      return [];
    if (typeof v === "undefined" && typeof yParity === "undefined")
      return [];
    const r = trim(signature.r);
    const s = trim(signature.s);
    const yParity_ = (() => {
      if (typeof yParity === "number")
        return yParity ? numberToHex(1) : "0x";
      if (v === 0n)
        return "0x";
      if (v === 1n)
        return numberToHex(1);
      return v === 27n ? "0x" : numberToHex(1);
    })();
    return [yParity_, r === "0x00" ? "0x" : r, s === "0x00" ? "0x" : s];
  }
  var init_serializeTransaction = __esm({
    "node_modules/viem/_esm/utils/transaction/serializeTransaction.js"() {
      init_transaction();
      init_serializeAuthorizationList();
      init_blobsToCommitments();
      init_blobsToProofs();
      init_commitmentsToVersionedHashes();
      init_toBlobSidecars();
      init_concat();
      init_trim();
      init_toHex();
      init_toRlp();
      init_assertTransaction();
      init_getTransactionType();
      init_serializeAccessList();
    }
  });

  // node_modules/viem/_esm/accounts/utils/signTransaction.js
  async function signTransaction(parameters) {
    const { privateKey, transaction, serializer = serializeTransaction } = parameters;
    const signableTransaction = (() => {
      if (transaction.type === "eip4844")
        return {
          ...transaction,
          sidecars: false
        };
      return transaction;
    })();
    const signature = await sign({
      hash: keccak256(await serializer(signableTransaction)),
      privateKey
    });
    return await serializer(transaction, signature);
  }
  var init_signTransaction = __esm({
    "node_modules/viem/_esm/accounts/utils/signTransaction.js"() {
      init_keccak256();
      init_serializeTransaction();
      init_sign();
    }
  });

  // node_modules/viem/_esm/errors/abi.js
  var AbiEncodingArrayLengthMismatchError, AbiEncodingBytesSizeMismatchError, AbiEncodingLengthMismatchError, BytesSizeMismatchError, InvalidAbiEncodingTypeError, InvalidArrayError;
  var init_abi = __esm({
    "node_modules/viem/_esm/errors/abi.js"() {
      init_size();
      init_base();
      AbiEncodingArrayLengthMismatchError = class extends BaseError {
        constructor({ expectedLength, givenLength, type }) {
          super([
            `ABI encoding array length mismatch for type ${type}.`,
            `Expected length: ${expectedLength}`,
            `Given length: ${givenLength}`
          ].join("\n"), { name: "AbiEncodingArrayLengthMismatchError" });
        }
      };
      AbiEncodingBytesSizeMismatchError = class extends BaseError {
        constructor({ expectedSize, value }) {
          super(`Size of bytes "${value}" (bytes${size(value)}) does not match expected size (bytes${expectedSize}).`, { name: "AbiEncodingBytesSizeMismatchError" });
        }
      };
      AbiEncodingLengthMismatchError = class extends BaseError {
        constructor({ expectedLength, givenLength }) {
          super([
            "ABI encoding params/values length mismatch.",
            `Expected length (params): ${expectedLength}`,
            `Given length (values): ${givenLength}`
          ].join("\n"), { name: "AbiEncodingLengthMismatchError" });
        }
      };
      BytesSizeMismatchError = class extends BaseError {
        constructor({ expectedSize, givenSize }) {
          super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, {
            name: "BytesSizeMismatchError"
          });
        }
      };
      InvalidAbiEncodingTypeError = class extends BaseError {
        constructor(type, { docsPath }) {
          super([
            `Type "${type}" is not a valid encoding type.`,
            "Please provide a valid ABI type."
          ].join("\n"), { docsPath, name: "InvalidAbiEncodingType" });
        }
      };
      InvalidArrayError = class extends BaseError {
        constructor(value) {
          super([`Value "${value}" is not a valid array.`].join("\n"), {
            name: "InvalidArrayError"
          });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/regex.js
  var bytesRegex, integerRegex;
  var init_regex = __esm({
    "node_modules/viem/_esm/utils/regex.js"() {
      bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
      integerRegex = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
    }
  });

  // node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
  function encodeAbiParameters(params, values) {
    if (params.length !== values.length)
      throw new AbiEncodingLengthMismatchError({
        expectedLength: params.length,
        givenLength: values.length
      });
    const preparedParams = prepareParams({
      params,
      values
    });
    return encodeParams(preparedParams);
  }
  function prepareParams({ params, values }) {
    const preparedParams = [];
    for (let i = 0; i < params.length; i++) {
      preparedParams.push(prepareParam({ param: params[i], value: values[i] }));
    }
    return preparedParams;
  }
  function prepareParam({ param, value }) {
    const arrayComponents = getArrayComponents(param.type);
    if (arrayComponents) {
      const [length, type] = arrayComponents;
      return encodeArray(value, { length, param: { ...param, type } });
    }
    if (param.type === "tuple") {
      return encodeTuple(value, {
        param
      });
    }
    if (param.type === "address") {
      return encodeAddress(value);
    }
    if (param.type === "bool") {
      return encodeBool(value);
    }
    if (param.type.startsWith("uint") || param.type.startsWith("int")) {
      const signed = param.type.startsWith("int");
      const [, , size2 = "256"] = integerRegex.exec(param.type) ?? [];
      return encodeNumber(value, {
        signed,
        size: Number(size2)
      });
    }
    if (param.type.startsWith("bytes")) {
      return encodeBytes(value, { param });
    }
    if (param.type === "string") {
      return encodeString(value);
    }
    throw new InvalidAbiEncodingTypeError(param.type, {
      docsPath: "/docs/contract/encodeAbiParameters"
    });
  }
  function encodeParams(preparedParams) {
    let staticSize = 0;
    for (let i = 0; i < preparedParams.length; i++) {
      const { dynamic, encoded } = preparedParams[i];
      if (dynamic)
        staticSize += 32;
      else
        staticSize += size(encoded);
    }
    const staticParams = [];
    const dynamicParams = [];
    let dynamicSize = 0;
    for (let i = 0; i < preparedParams.length; i++) {
      const { dynamic, encoded } = preparedParams[i];
      if (dynamic) {
        staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
        dynamicParams.push(encoded);
        dynamicSize += size(encoded);
      } else {
        staticParams.push(encoded);
      }
    }
    return concatHex([...staticParams, ...dynamicParams]);
  }
  function encodeAddress(value) {
    if (!isAddress(value))
      throw new InvalidAddressError({ address: value });
    return { dynamic: false, encoded: padHex(value.toLowerCase()) };
  }
  function encodeArray(value, { length, param }) {
    const dynamic = length === null;
    if (!Array.isArray(value))
      throw new InvalidArrayError(value);
    if (!dynamic && value.length !== length)
      throw new AbiEncodingArrayLengthMismatchError({
        expectedLength: length,
        givenLength: value.length,
        type: `${param.type}[${length}]`
      });
    let dynamicChild = value.length === 0 && isDynamicType(param);
    const preparedParams = [];
    for (let i = 0; i < value.length; i++) {
      const preparedParam = prepareParam({ param, value: value[i] });
      if (preparedParam.dynamic)
        dynamicChild = true;
      preparedParams.push(preparedParam);
    }
    if (dynamic || dynamicChild) {
      const data = encodeParams(preparedParams);
      if (dynamic) {
        const length2 = numberToHex(preparedParams.length, { size: 32 });
        return {
          dynamic: true,
          encoded: concatHex([length2, data])
        };
      }
      if (dynamicChild)
        return { dynamic: true, encoded: data };
    }
    return {
      dynamic: false,
      encoded: concatHex(preparedParams.map(({ encoded }) => encoded))
    };
  }
  function encodeBytes(value, { param }) {
    const [, paramSize] = param.type.split("bytes");
    const bytesSize = size(value);
    if (!paramSize) {
      let value_ = value;
      if (bytesSize % 32 !== 0)
        value_ = padHex(value_, {
          dir: "right",
          size: Math.ceil((value.length - 2) / 2 / 32) * 32
        });
      return {
        dynamic: true,
        encoded: concatHex([
          padHex(numberToHex(bytesSize, { size: 32 })),
          value_
        ])
      };
    }
    if (bytesSize !== Number.parseInt(paramSize, 10))
      throw new AbiEncodingBytesSizeMismatchError({
        expectedSize: Number.parseInt(paramSize, 10),
        value
      });
    return { dynamic: false, encoded: padHex(value, { dir: "right" }) };
  }
  function encodeBool(value) {
    if (typeof value !== "boolean")
      throw new BaseError(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
    return { dynamic: false, encoded: padHex(boolToHex(value)) };
  }
  function encodeNumber(value, { signed, size: size2 = 256 }) {
    if (typeof size2 === "number") {
      const max2 = 2n ** (BigInt(size2) - (signed ? 1n : 0n)) - 1n;
      const min2 = signed ? -max2 - 1n : 0n;
      if (value > max2 || value < min2)
        throw new IntegerOutOfRangeError({
          max: max2.toString(),
          min: min2.toString(),
          signed,
          size: size2 / 8,
          value: value.toString()
        });
    }
    return {
      dynamic: false,
      encoded: numberToHex(value, {
        size: 32,
        signed
      })
    };
  }
  function encodeString(value) {
    const hexValue = stringToHex(value);
    const partsLength = Math.ceil(size(hexValue) / 32);
    const parts = [];
    for (let i = 0; i < partsLength; i++) {
      parts.push(padHex(slice(hexValue, i * 32, (i + 1) * 32), {
        dir: "right"
      }));
    }
    return {
      dynamic: true,
      encoded: concatHex([
        padHex(numberToHex(size(hexValue), { size: 32 })),
        ...parts
      ])
    };
  }
  function encodeTuple(value, { param }) {
    let dynamic = false;
    const preparedParams = [];
    for (let i = 0; i < param.components.length; i++) {
      const param_ = param.components[i];
      const index = Array.isArray(value) ? i : param_.name;
      const preparedParam = prepareParam({
        param: param_,
        value: value[index]
      });
      preparedParams.push(preparedParam);
      if (preparedParam.dynamic)
        dynamic = true;
    }
    return {
      dynamic,
      encoded: dynamic ? encodeParams(preparedParams) : concatHex(preparedParams.map(({ encoded }) => encoded))
    };
  }
  function getArrayComponents(type) {
    const matches = type.match(/^(.*)\[(\d+)?\]$/);
    return matches ? (
      // Return `null` if the array is dynamic.
      [matches[2] ? Number(matches[2]) : null, matches[1]]
    ) : void 0;
  }
  function isDynamicType(param) {
    const { type } = param;
    if (type === "string")
      return true;
    if (type === "bytes")
      return true;
    if (type.endsWith("[]"))
      return true;
    if (type === "tuple")
      return param.components.some(isDynamicType);
    const arrayComponents = getArrayComponents(type);
    if (arrayComponents)
      return isDynamicType({ ...param, type: arrayComponents[1] });
    return false;
  }
  var init_encodeAbiParameters = __esm({
    "node_modules/viem/_esm/utils/abi/encodeAbiParameters.js"() {
      init_abi();
      init_address();
      init_base();
      init_encoding();
      init_isAddress();
      init_concat();
      init_pad();
      init_size();
      init_slice();
      init_toHex();
      init_regex();
    }
  });

  // node_modules/viem/_esm/utils/stringify.js
  var stringify;
  var init_stringify = __esm({
    "node_modules/viem/_esm/utils/stringify.js"() {
      stringify = (value, replacer, space) => JSON.stringify(value, (key, value_) => {
        const value2 = typeof value_ === "bigint" ? value_.toString() : value_;
        return typeof replacer === "function" ? replacer(key, value2) : value2;
      }, space);
    }
  });

  // node_modules/viem/_esm/errors/typedData.js
  var InvalidDomainError, InvalidPrimaryTypeError, InvalidStructTypeError;
  var init_typedData = __esm({
    "node_modules/viem/_esm/errors/typedData.js"() {
      init_stringify();
      init_base();
      InvalidDomainError = class extends BaseError {
        constructor({ domain }) {
          super(`Invalid domain "${stringify(domain)}".`, {
            metaMessages: ["Must be a valid EIP-712 domain."]
          });
        }
      };
      InvalidPrimaryTypeError = class extends BaseError {
        constructor({ primaryType, types }) {
          super(`Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`, {
            docsPath: "/api/glossary/Errors#typeddatainvalidprimarytypeerror",
            metaMessages: ["Check that the primary type is a key in `types`."]
          });
        }
      };
      InvalidStructTypeError = class extends BaseError {
        constructor({ type }) {
          super(`Struct type "${type}" is invalid.`, {
            metaMessages: ["Struct type must not be a Solidity type."],
            name: "InvalidStructTypeError"
          });
        }
      };
    }
  });

  // node_modules/viem/_esm/utils/typedData.js
  function validateTypedData(parameters) {
    const { domain, message, primaryType, types } = parameters;
    const validateData = (struct, data) => {
      for (const param of struct) {
        const { name, type } = param;
        const value = data[name];
        const integerMatch = type.match(integerRegex);
        if (integerMatch && (typeof value === "number" || typeof value === "bigint")) {
          const [_type, base, size_] = integerMatch;
          numberToHex(value, {
            signed: base === "int",
            size: Number.parseInt(size_, 10) / 8
          });
        }
        if (type === "address" && typeof value === "string" && !isAddress(value))
          throw new InvalidAddressError({ address: value });
        const bytesMatch = type.match(bytesRegex);
        if (bytesMatch) {
          const [_type, size_] = bytesMatch;
          if (size_ && size(value) !== Number.parseInt(size_, 10))
            throw new BytesSizeMismatchError({
              expectedSize: Number.parseInt(size_, 10),
              givenSize: size(value)
            });
        }
        const struct2 = types[type];
        if (struct2) {
          validateReference(type);
          validateData(struct2, value);
        }
      }
    };
    if (types.EIP712Domain && domain) {
      if (typeof domain !== "object")
        throw new InvalidDomainError({ domain });
      validateData(types.EIP712Domain, domain);
    }
    if (primaryType !== "EIP712Domain") {
      if (types[primaryType])
        validateData(types[primaryType], message);
      else
        throw new InvalidPrimaryTypeError({ primaryType, types });
    }
  }
  function getTypesForEIP712Domain({ domain }) {
    return [
      typeof domain?.name === "string" && { name: "name", type: "string" },
      domain?.version && { name: "version", type: "string" },
      (typeof domain?.chainId === "number" || typeof domain?.chainId === "bigint") && {
        name: "chainId",
        type: "uint256"
      },
      domain?.verifyingContract && {
        name: "verifyingContract",
        type: "address"
      },
      domain?.salt && { name: "salt", type: "bytes32" }
    ].filter(Boolean);
  }
  function validateReference(type) {
    if (type === "address" || type === "bool" || type === "string" || type.startsWith("bytes") || type.startsWith("uint") || type.startsWith("int"))
      throw new InvalidStructTypeError({ type });
  }
  var init_typedData2 = __esm({
    "node_modules/viem/_esm/utils/typedData.js"() {
      init_abi();
      init_address();
      init_typedData();
      init_isAddress();
      init_size();
      init_toHex();
      init_regex();
    }
  });

  // node_modules/viem/_esm/utils/signature/hashTypedData.js
  function hashTypedData(parameters) {
    const { domain = {}, message, primaryType } = parameters;
    const types = {
      EIP712Domain: getTypesForEIP712Domain({ domain }),
      ...parameters.types
    };
    validateTypedData({
      domain,
      message,
      primaryType,
      types
    });
    const parts = ["0x1901"];
    if (domain)
      parts.push(hashDomain({
        domain,
        types
      }));
    if (primaryType !== "EIP712Domain")
      parts.push(hashStruct({
        data: message,
        primaryType,
        types
      }));
    return keccak256(concat(parts));
  }
  function hashDomain({ domain, types }) {
    return hashStruct({
      data: domain,
      primaryType: "EIP712Domain",
      types
    });
  }
  function hashStruct({ data, primaryType, types }) {
    const encoded = encodeData({
      data,
      primaryType,
      types
    });
    return keccak256(encoded);
  }
  function encodeData({ data, primaryType, types }) {
    const encodedTypes = [{ type: "bytes32" }];
    const encodedValues = [hashType({ primaryType, types })];
    for (const field of types[primaryType]) {
      const [type, value] = encodeField({
        types,
        name: field.name,
        type: field.type,
        value: data[field.name]
      });
      encodedTypes.push(type);
      encodedValues.push(value);
    }
    return encodeAbiParameters(encodedTypes, encodedValues);
  }
  function hashType({ primaryType, types }) {
    const encodedHashType = toHex(encodeType({ primaryType, types }));
    return keccak256(encodedHashType);
  }
  function encodeType({ primaryType, types }) {
    let result = "";
    const unsortedDeps = findTypeDependencies({ primaryType, types });
    unsortedDeps.delete(primaryType);
    const deps = [primaryType, ...Array.from(unsortedDeps).sort()];
    for (const type of deps) {
      result += `${type}(${types[type].map(({ name, type: t }) => `${t} ${name}`).join(",")})`;
    }
    return result;
  }
  function findTypeDependencies({ primaryType: primaryType_, types }, results = /* @__PURE__ */ new Set()) {
    const match = primaryType_.match(/^\w*/u);
    const primaryType = match?.[0];
    if (results.has(primaryType) || types[primaryType] === void 0) {
      return results;
    }
    results.add(primaryType);
    for (const field of types[primaryType]) {
      findTypeDependencies({ primaryType: field.type, types }, results);
    }
    return results;
  }
  function encodeField({ types, name, type, value }) {
    if (types[type] !== void 0) {
      return [
        { type: "bytes32" },
        keccak256(encodeData({ data: value, primaryType: type, types }))
      ];
    }
    if (type === "bytes")
      return [{ type: "bytes32" }, keccak256(value)];
    if (type === "string")
      return [{ type: "bytes32" }, keccak256(toHex(value))];
    if (type.lastIndexOf("]") === type.length - 1) {
      const parsedType = type.slice(0, type.lastIndexOf("["));
      const typeValuePairs = value.map((item) => encodeField({
        name,
        type: parsedType,
        types,
        value: item
      }));
      return [
        { type: "bytes32" },
        keccak256(encodeAbiParameters(typeValuePairs.map(([t]) => t), typeValuePairs.map(([, v]) => v)))
      ];
    }
    return [{ type }, value];
  }
  var init_hashTypedData = __esm({
    "node_modules/viem/_esm/utils/signature/hashTypedData.js"() {
      init_encodeAbiParameters();
      init_concat();
      init_toHex();
      init_keccak256();
      init_typedData2();
    }
  });

  // node_modules/viem/_esm/accounts/utils/signTypedData.js
  async function signTypedData(parameters) {
    const { privateKey, ...typedData } = parameters;
    return await sign({
      hash: hashTypedData(typedData),
      privateKey,
      to: "hex"
    });
  }
  var init_signTypedData = __esm({
    "node_modules/viem/_esm/accounts/utils/signTypedData.js"() {
      init_hashTypedData();
      init_sign();
    }
  });

  // node_modules/viem/_esm/accounts/privateKeyToAccount.js
  function privateKeyToAccount(privateKey, options = {}) {
    const { nonceManager } = options;
    const publicKey = toHex(secp256k1.getPublicKey(privateKey.slice(2), false));
    const address = publicKeyToAddress(publicKey);
    const account = toAccount({
      address,
      nonceManager,
      async sign({ hash }) {
        return sign({ hash, privateKey, to: "hex" });
      },
      async signAuthorization(authorization) {
        return signAuthorization({ ...authorization, privateKey });
      },
      async signMessage({ message }) {
        return signMessage({ message, privateKey });
      },
      async signTransaction(transaction, { serializer } = {}) {
        return signTransaction({ privateKey, transaction, serializer });
      },
      async signTypedData(typedData) {
        return signTypedData({ ...typedData, privateKey });
      }
    });
    return {
      ...account,
      publicKey,
      source: "privateKey"
    };
  }
  var init_privateKeyToAccount = __esm({
    "node_modules/viem/_esm/accounts/privateKeyToAccount.js"() {
      init_secp256k1();
      init_toHex();
      init_toAccount();
      init_publicKeyToAddress();
      init_sign();
      init_signAuthorization();
      init_signMessage();
      init_signTransaction();
      init_signTypedData();
    }
  });

  // node_modules/viem/_esm/accounts/index.js
  var init_accounts = __esm({
    "node_modules/viem/_esm/accounts/index.js"() {
      init_generatePrivateKey();
      init_privateKeyToAccount();
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/_base.js
  var HyperliquidError;
  var init_base2 = __esm({
    "node_modules/@nktkas/hyperliquid/esm/_base.js"() {
      HyperliquidError = class extends Error {
        constructor(message, options) {
          super(message, options);
          this.name = "HyperliquidError";
        }
      };
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/signing/_abstractWallet.js
  function parseSignature(hex) {
    if (hex.length !== 132) {
      throw new AbstractWalletError(`Expected 65-byte signature (132 hex chars), got ${hex.length}`);
    }
    const r = `0x${hex.slice(2, 66)}`;
    const s = `0x${hex.slice(66, 130)}`;
    let v = parseInt(hex.slice(130, 132), 16);
    if (v === 0 || v === 1) v += 27;
    if (v !== 27 && v !== 28) {
      throw new AbstractWalletError(`Invalid signature recovery value: ${v}, expected 0/1 or 27/28`);
    }
    return {
      r,
      s,
      v
    };
  }
  function isEthersV6Signer(wallet) {
    return "signTypedData" in wallet && typeof wallet.signTypedData === "function" && wallet.signTypedData.length === 3 && "getAddress" in wallet && typeof wallet.getAddress === "function";
  }
  function adaptEthersV6(wallet) {
    return {
      kind: "ethers-v6",
      async signTypedData(args) {
        const hex = await wallet.signTypedData(args.domain, args.types, args.message);
        return parseSignature(hex);
      },
      async getAddress() {
        const address = await wallet.getAddress();
        return address.toLowerCase();
      },
      async getChainId() {
        if (!wallet.provider) return "0x1";
        const network = await wallet.provider.getNetwork();
        return `0x${network.chainId.toString(16)}`;
      }
    };
  }
  function isEthersV5Signer(wallet) {
    return "_signTypedData" in wallet && typeof wallet._signTypedData === "function" && wallet._signTypedData.length === 3 && "getAddress" in wallet && typeof wallet.getAddress === "function";
  }
  function adaptEthersV5(wallet) {
    return {
      kind: "ethers-v5",
      async signTypedData(args) {
        const hex = await wallet._signTypedData(args.domain, args.types, args.message);
        return parseSignature(hex);
      },
      async getAddress() {
        const address = await wallet.getAddress();
        return address.toLowerCase();
      },
      async getChainId() {
        if (!wallet.provider) return "0x1";
        const network = await wallet.provider.getNetwork();
        return `0x${network.chainId.toString(16)}`;
      }
    };
  }
  function isViemJsonRpc(wallet) {
    return "signTypedData" in wallet && typeof wallet.signTypedData === "function" && (wallet.signTypedData.length === 1 || wallet.signTypedData.length === 2) && "getAddresses" in wallet && typeof wallet.getAddresses === "function" && "getChainId" in wallet && typeof wallet.getChainId === "function";
  }
  function adaptViemJsonRpc(wallet) {
    return {
      kind: "viem-jsonrpc",
      async signTypedData(args) {
        const hex = await wallet.signTypedData({
          domain: args.domain,
          types: {
            EIP712Domain: EIP712_DOMAIN_TYPE,
            ...args.types
          },
          primaryType: args.primaryType,
          message: args.message
        });
        return parseSignature(hex);
      },
      async getAddress() {
        const addresses = await wallet.getAddresses();
        if (!addresses.length) throw new AbstractWalletError("Wallet returned no addresses");
        return addresses[0].toLowerCase();
      },
      async getChainId() {
        const id = await wallet.getChainId();
        return `0x${id.toString(16)}`;
      }
    };
  }
  function isViemLocal(wallet) {
    return "signTypedData" in wallet && typeof wallet.signTypedData === "function" && (wallet.signTypedData.length === 1 || wallet.signTypedData.length === 2) && "address" in wallet && typeof wallet.address === "string";
  }
  function adaptViemLocal(wallet) {
    return {
      kind: "viem-local",
      async signTypedData(args) {
        const hex = await wallet.signTypedData({
          domain: args.domain,
          types: {
            EIP712Domain: EIP712_DOMAIN_TYPE,
            ...args.types
          },
          primaryType: args.primaryType,
          message: args.message
        });
        return parseSignature(hex);
      },
      getAddress() {
        return Promise.resolve(wallet.address.toLowerCase());
      },
      getChainId() {
        return Promise.resolve("0x1");
      }
    };
  }
  function adapt(wallet) {
    if (isViemJsonRpc(wallet)) return adaptViemJsonRpc(wallet);
    if (isViemLocal(wallet)) return adaptViemLocal(wallet);
    if (isEthersV6Signer(wallet)) return adaptEthersV6(wallet);
    if (isEthersV5Signer(wallet)) return adaptEthersV5(wallet);
    throw new AbstractWalletError("Failed to adapt wallet: unknown wallet type");
  }
  async function signTypedData2(args) {
    try {
      const typeFields = args.types[args.primaryType];
      const message = typeFields ? Object.fromEntries(Object.entries(args.message).filter(([k]) => typeFields.some((f) => f.name === k))) : args.message;
      return await adapt(args.wallet).signTypedData({
        domain: args.domain,
        types: args.types,
        primaryType: args.primaryType,
        message
      });
    } catch (error) {
      if (error instanceof AbstractWalletError) throw error;
      throw new AbstractWalletError(`Failed to sign the typed data using the wallet`, {
        cause: error
      });
    }
  }
  var AbstractWalletError, EIP712_DOMAIN_TYPE;
  var init_abstractWallet = __esm({
    "node_modules/@nktkas/hyperliquid/esm/signing/_abstractWallet.js"() {
      init_base2();
      AbstractWalletError = class extends HyperliquidError {
        constructor(message, options) {
          super(message, options);
          this.name = "AbstractWalletError";
        }
      };
      EIP712_DOMAIN_TYPE = [
        {
          name: "name",
          type: "string"
        },
        {
          name: "version",
          type: "string"
        },
        {
          name: "chainId",
          type: "uint256"
        },
        {
          name: "verifyingContract",
          type: "address"
        }
      ];
    }
  });

  // node_modules/@noble/hashes/_u64.js
  function fromBig2(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK642), l: Number(n >> _32n2 & U32_MASK642) };
    return { h: Number(n >> _32n2 & U32_MASK642) | 0, l: Number(n & U32_MASK642) | 0 };
  }
  function split2(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const { h, l } = fromBig2(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  var U32_MASK642, _32n2, rotlSH2, rotlSL2, rotlBH2, rotlBL2;
  var init_u642 = __esm({
    "node_modules/@noble/hashes/_u64.js"() {
      U32_MASK642 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
      _32n2 = /* @__PURE__ */ BigInt(32);
      rotlSH2 = (h, l, s) => h << s | l >>> 32 - s;
      rotlSL2 = (h, l, s) => l << s | h >>> 32 - s;
      rotlBH2 = (h, l, s) => l << s - 32 | h >>> 64 - s;
      rotlBL2 = (h, l, s) => h << s - 32 | l >>> 64 - s;
    }
  });

  // node_modules/@noble/hashes/utils.js
  function isBytes4(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
  }
  function anumber3(n, title = "") {
    if (typeof n !== "number") {
      const prefix = title && `"${title}" `;
      throw new TypeError(`${prefix}expected number, got ${typeof n}`);
    }
    if (!Number.isSafeInteger(n) || n < 0) {
      const prefix = title && `"${title}" `;
      throw new RangeError(`${prefix}expected integer >= 0, got ${n}`);
    }
  }
  function abytes4(value, length, title = "") {
    const bytes = isBytes4(value);
    const len = value?.length;
    const needsLen = length !== void 0;
    if (!bytes || needsLen && len !== length) {
      const prefix = title && `"${title}" `;
      const ofLen = needsLen ? ` of length ${length}` : "";
      const got = bytes ? `length=${len}` : `type=${typeof value}`;
      const message = prefix + "expected Uint8Array" + ofLen + ", got " + got;
      if (!bytes)
        throw new TypeError(message);
      throw new RangeError(message);
    }
    return value;
  }
  function aexists3(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput3(out, instance) {
    abytes4(out, void 0, "digestInto() output");
    const min2 = instance.outputLen;
    if (out.length < min2) {
      throw new RangeError('"digestInto() output" expected to be of length >=' + min2);
    }
  }
  function u322(arr) {
    return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  }
  function clean3(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function byteSwap2(word) {
    return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
  }
  function byteSwap322(arr) {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = byteSwap2(arr[i]);
    }
    return arr;
  }
  function bytesToHex3(bytes) {
    abytes4(bytes);
    if (hasHexBuiltin2)
      return bytes.toHex();
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += hexes3[bytes[i]];
    }
    return hex;
  }
  function asciiToBase162(ch) {
    if (ch >= asciis2._0 && ch <= asciis2._9)
      return ch - asciis2._0;
    if (ch >= asciis2.A && ch <= asciis2.F)
      return ch - (asciis2.A - 10);
    if (ch >= asciis2.a && ch <= asciis2.f)
      return ch - (asciis2.a - 10);
    return;
  }
  function hexToBytes3(hex) {
    if (typeof hex !== "string")
      throw new TypeError("hex string expected, got " + typeof hex);
    if (hasHexBuiltin2) {
      try {
        return Uint8Array.fromHex(hex);
      } catch (error) {
        if (error instanceof SyntaxError)
          throw new RangeError(error.message);
        throw error;
      }
    }
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
      throw new RangeError("hex string expected, got unpadded hex of length " + hl);
    const array = new Uint8Array(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
      const n1 = asciiToBase162(hex.charCodeAt(hi));
      const n2 = asciiToBase162(hex.charCodeAt(hi + 1));
      if (n1 === void 0 || n2 === void 0) {
        const char = hex[hi] + hex[hi + 1];
        throw new RangeError('hex string expected, got non-hex character "' + char + '" at index ' + hi);
      }
      array[ai] = n1 * 16 + n2;
    }
    return array;
  }
  function concatBytes4(...arrays) {
    let sum2 = 0;
    for (let i = 0; i < arrays.length; i++) {
      const a = arrays[i];
      abytes4(a);
      sum2 += a.length;
    }
    const res = new Uint8Array(sum2);
    for (let i = 0, pad2 = 0; i < arrays.length; i++) {
      const a = arrays[i];
      res.set(a, pad2);
      pad2 += a.length;
    }
    return res;
  }
  function createHasher3(hashCons, info = {}) {
    const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
    const tmp = hashCons(void 0);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.canXOF = tmp.canXOF;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
  }
  var isLE2, swap32IfBE2, hasHexBuiltin2, hexes3, asciis2;
  var init_utils4 = __esm({
    "node_modules/@noble/hashes/utils.js"() {
      isLE2 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
      swap32IfBE2 = isLE2 ? (u) => u : byteSwap322;
      hasHexBuiltin2 = /* @__PURE__ */ (() => (
        // @ts-ignore
        typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
      ))();
      hexes3 = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
      asciis2 = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    }
  });

  // node_modules/@noble/hashes/sha3.js
  function keccakP2(s, rounds = 24) {
    anumber3(rounds, "rounds");
    if (rounds < 1 || rounds > 24)
      throw new Error('"rounds" expected integer 1..24');
    const B = new Uint32Array(5 * 2);
    for (let round2 = 24 - rounds; round2 < 24; round2++) {
      for (let x = 0; x < 10; x++)
        B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
      for (let x = 0; x < 10; x += 2) {
        const idx1 = (x + 8) % 10;
        const idx0 = (x + 2) % 10;
        const B0 = B[idx0];
        const B1 = B[idx0 + 1];
        const Th = rotlH2(B0, B1, 1) ^ B[idx1];
        const Tl = rotlL2(B0, B1, 1) ^ B[idx1 + 1];
        for (let y = 0; y < 50; y += 10) {
          s[x + y] ^= Th;
          s[x + y + 1] ^= Tl;
        }
      }
      let curH = s[2];
      let curL = s[3];
      for (let t = 0; t < 24; t++) {
        const shift = SHA3_ROTL2[t];
        const Th = rotlH2(curH, curL, shift);
        const Tl = rotlL2(curH, curL, shift);
        const PI2 = SHA3_PI2[t];
        curH = s[PI2];
        curL = s[PI2 + 1];
        s[PI2] = Th;
        s[PI2 + 1] = Tl;
      }
      for (let y = 0; y < 50; y += 10) {
        const b0 = s[y], b1 = s[y + 1], b2 = s[y + 2], b3 = s[y + 3];
        s[y] ^= ~s[y + 2] & s[y + 4];
        s[y + 1] ^= ~s[y + 3] & s[y + 5];
        s[y + 2] ^= ~s[y + 4] & s[y + 6];
        s[y + 3] ^= ~s[y + 5] & s[y + 7];
        s[y + 4] ^= ~s[y + 6] & s[y + 8];
        s[y + 5] ^= ~s[y + 7] & s[y + 9];
        s[y + 6] ^= ~s[y + 8] & b0;
        s[y + 7] ^= ~s[y + 9] & b1;
        s[y + 8] ^= ~b0 & b2;
        s[y + 9] ^= ~b1 & b3;
      }
      s[0] ^= SHA3_IOTA_H2[round2];
      s[1] ^= SHA3_IOTA_L2[round2];
    }
    clean3(B);
  }
  var _0n7, _1n7, _2n5, _7n2, _256n2, _0x71n2, SHA3_PI2, SHA3_ROTL2, _SHA3_IOTA2, IOTAS2, SHA3_IOTA_H2, SHA3_IOTA_L2, rotlH2, rotlL2, Keccak2, genKeccak, keccak_2562;
  var init_sha32 = __esm({
    "node_modules/@noble/hashes/sha3.js"() {
      init_u642();
      init_utils4();
      _0n7 = BigInt(0);
      _1n7 = BigInt(1);
      _2n5 = BigInt(2);
      _7n2 = BigInt(7);
      _256n2 = BigInt(256);
      _0x71n2 = BigInt(113);
      SHA3_PI2 = [];
      SHA3_ROTL2 = [];
      _SHA3_IOTA2 = [];
      for (let round2 = 0, R = _1n7, x = 1, y = 0; round2 < 24; round2++) {
        [x, y] = [y, (2 * x + 3 * y) % 5];
        SHA3_PI2.push(2 * (5 * y + x));
        SHA3_ROTL2.push((round2 + 1) * (round2 + 2) / 2 % 64);
        let t = _0n7;
        for (let j = 0; j < 7; j++) {
          R = (R << _1n7 ^ (R >> _7n2) * _0x71n2) % _256n2;
          if (R & _2n5)
            t ^= _1n7 << (_1n7 << BigInt(j)) - _1n7;
        }
        _SHA3_IOTA2.push(t);
      }
      IOTAS2 = split2(_SHA3_IOTA2, true);
      SHA3_IOTA_H2 = IOTAS2[0];
      SHA3_IOTA_L2 = IOTAS2[1];
      rotlH2 = (h, l, s) => s > 32 ? rotlBH2(h, l, s) : rotlSH2(h, l, s);
      rotlL2 = (h, l, s) => s > 32 ? rotlBL2(h, l, s) : rotlSL2(h, l, s);
      Keccak2 = class _Keccak {
        // NOTE: we accept arguments in bytes instead of bits here.
        constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
          __publicField(this, "state");
          __publicField(this, "pos", 0);
          __publicField(this, "posOut", 0);
          __publicField(this, "finished", false);
          __publicField(this, "state32");
          __publicField(this, "destroyed", false);
          __publicField(this, "blockLen");
          __publicField(this, "suffix");
          __publicField(this, "outputLen");
          __publicField(this, "canXOF");
          __publicField(this, "enableXOF", false);
          __publicField(this, "rounds");
          this.blockLen = blockLen;
          this.suffix = suffix;
          this.outputLen = outputLen;
          this.enableXOF = enableXOF;
          this.canXOF = enableXOF;
          this.rounds = rounds;
          anumber3(outputLen, "outputLen");
          if (!(0 < blockLen && blockLen < 200))
            throw new Error("only keccak-f1600 function is supported");
          this.state = new Uint8Array(200);
          this.state32 = u322(this.state);
        }
        clone() {
          return this._cloneInto();
        }
        keccak() {
          swap32IfBE2(this.state32);
          keccakP2(this.state32, this.rounds);
          swap32IfBE2(this.state32);
          this.posOut = 0;
          this.pos = 0;
        }
        update(data) {
          aexists3(this);
          abytes4(data);
          const { blockLen, state } = this;
          const len = data.length;
          for (let pos = 0; pos < len; ) {
            const take = Math.min(blockLen - this.pos, len - pos);
            for (let i = 0; i < take; i++)
              state[this.pos++] ^= data[pos++];
            if (this.pos === blockLen)
              this.keccak();
          }
          return this;
        }
        finish() {
          if (this.finished)
            return;
          this.finished = true;
          const { state, suffix, pos, blockLen } = this;
          state[pos] ^= suffix;
          if ((suffix & 128) !== 0 && pos === blockLen - 1)
            this.keccak();
          state[blockLen - 1] ^= 128;
          this.keccak();
        }
        writeInto(out) {
          aexists3(this, false);
          abytes4(out);
          this.finish();
          const bufferOut = this.state;
          const { blockLen } = this;
          for (let pos = 0, len = out.length; pos < len; ) {
            if (this.posOut >= blockLen)
              this.keccak();
            const take = Math.min(blockLen - this.posOut, len - pos);
            out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
            this.posOut += take;
            pos += take;
          }
          return out;
        }
        xofInto(out) {
          if (!this.enableXOF)
            throw new Error("XOF is not possible for this instance");
          return this.writeInto(out);
        }
        xof(bytes) {
          anumber3(bytes);
          return this.xofInto(new Uint8Array(bytes));
        }
        digestInto(out) {
          aoutput3(out, this);
          if (this.finished)
            throw new Error("digest() was already called");
          this.writeInto(out.subarray(0, this.outputLen));
          this.destroy();
        }
        digest() {
          const out = new Uint8Array(this.outputLen);
          this.digestInto(out);
          return out;
        }
        destroy() {
          this.destroyed = true;
          clean3(this.state);
        }
        _cloneInto(to) {
          const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
          to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
          to.blockLen = blockLen;
          to.state32.set(this.state32);
          to.pos = this.pos;
          to.posOut = this.posOut;
          to.finished = this.finished;
          to.rounds = rounds;
          to.suffix = suffix;
          to.outputLen = outputLen;
          to.enableXOF = enableXOF;
          to.canXOF = this.canXOF;
          to.destroyed = this.destroyed;
          return to;
        }
      };
      genKeccak = (suffix, blockLen, outputLen, info = {}) => createHasher3(() => new Keccak2(blockLen, suffix, outputLen), info);
      keccak_2562 = /* @__PURE__ */ genKeccak(1, 136, 32);
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/_deps/jsr.io/@std/bytes/1.0.6/concat.js
  function concat2(buffers) {
    let length = 0;
    for (const buffer of buffers) {
      length += buffer.length;
    }
    const output = new Uint8Array(length);
    let index = 0;
    for (const buffer of buffers) {
      output.set(buffer, index);
      index += buffer.length;
    }
    return output;
  }
  var init_concat2 = __esm({
    "node_modules/@nktkas/hyperliquid/esm/_deps/jsr.io/@std/bytes/1.0.6/concat.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/_deps/jsr.io/@std/msgpack/1.0.3/encode.js
  function encode(object) {
    const byteParts = [];
    encodeSlice(object, byteParts);
    return concat2(byteParts);
  }
  function encodeFloat64(num) {
    const dataView = new DataView(new ArrayBuffer(9));
    dataView.setFloat64(1, num);
    dataView.setUint8(0, 203);
    return new Uint8Array(dataView.buffer);
  }
  function encodeNumber2(num) {
    if (!Number.isInteger(num)) {
      return encodeFloat64(num);
    }
    if (num < 0) {
      if (num >= -FIVE_BITS) {
        return new Uint8Array([
          num
        ]);
      }
      if (num >= -SEVEN_BITS) {
        return new Uint8Array([
          208,
          num
        ]);
      }
      if (num >= -FIFTEEN_BITS) {
        const dataView = new DataView(new ArrayBuffer(3));
        dataView.setInt16(1, num);
        dataView.setUint8(0, 209);
        return new Uint8Array(dataView.buffer);
      }
      if (num >= -THIRTY_ONE_BITS) {
        const dataView = new DataView(new ArrayBuffer(5));
        dataView.setInt32(1, num);
        dataView.setUint8(0, 210);
        return new Uint8Array(dataView.buffer);
      }
      return encodeFloat64(num);
    }
    if (num <= 127) {
      return new Uint8Array([
        num
      ]);
    }
    if (num < EIGHT_BITS) {
      return new Uint8Array([
        204,
        num
      ]);
    }
    if (num < SIXTEEN_BITS) {
      const dataView = new DataView(new ArrayBuffer(3));
      dataView.setUint16(1, num);
      dataView.setUint8(0, 205);
      return new Uint8Array(dataView.buffer);
    }
    if (num < THIRTY_TWO_BITS) {
      const dataView = new DataView(new ArrayBuffer(5));
      dataView.setUint32(1, num);
      dataView.setUint8(0, 206);
      return new Uint8Array(dataView.buffer);
    }
    return encodeFloat64(num);
  }
  function encodeSlice(object, byteParts) {
    if (object === null) {
      byteParts.push(new Uint8Array([
        192
      ]));
      return;
    }
    if (object === false) {
      byteParts.push(new Uint8Array([
        194
      ]));
      return;
    }
    if (object === true) {
      byteParts.push(new Uint8Array([
        195
      ]));
      return;
    }
    if (typeof object === "number") {
      byteParts.push(encodeNumber2(object));
      return;
    }
    if (typeof object === "bigint") {
      if (object < 0) {
        if (object < -SIXTY_THREE_BITS) {
          throw new Error("Cannot safely encode bigint larger than 64 bits");
        }
        const dataView2 = new DataView(new ArrayBuffer(9));
        dataView2.setBigInt64(1, object);
        dataView2.setUint8(0, 211);
        byteParts.push(new Uint8Array(dataView2.buffer));
        return;
      }
      if (object >= SIXTY_FOUR_BITS) {
        throw new Error("Cannot safely encode bigint larger than 64 bits");
      }
      const dataView = new DataView(new ArrayBuffer(9));
      dataView.setBigUint64(1, object);
      dataView.setUint8(0, 207);
      byteParts.push(new Uint8Array(dataView.buffer));
      return;
    }
    if (typeof object === "string") {
      const encoded = encoder3.encode(object);
      const len = encoded.length;
      if (len < FIVE_BITS) {
        byteParts.push(new Uint8Array([
          160 | len
        ]));
      } else if (len < EIGHT_BITS) {
        byteParts.push(new Uint8Array([
          217,
          len
        ]));
      } else if (len < SIXTEEN_BITS) {
        const dataView = new DataView(new ArrayBuffer(3));
        dataView.setUint16(1, len);
        dataView.setUint8(0, 218);
        byteParts.push(new Uint8Array(dataView.buffer));
      } else if (len < THIRTY_TWO_BITS) {
        const dataView = new DataView(new ArrayBuffer(5));
        dataView.setUint32(1, len);
        dataView.setUint8(0, 219);
        byteParts.push(new Uint8Array(dataView.buffer));
      } else {
        throw new Error("Cannot safely encode string with size larger than 32 bits");
      }
      byteParts.push(encoded);
      return;
    }
    if (object instanceof Uint8Array) {
      if (object.length < EIGHT_BITS) {
        byteParts.push(new Uint8Array([
          196,
          object.length
        ]));
      } else if (object.length < SIXTEEN_BITS) {
        const dataView = new DataView(new ArrayBuffer(3));
        dataView.setUint16(1, object.length);
        dataView.setUint8(0, 197);
        byteParts.push(new Uint8Array(dataView.buffer));
      } else if (object.length < THIRTY_TWO_BITS) {
        const dataView = new DataView(new ArrayBuffer(5));
        dataView.setUint32(1, object.length);
        dataView.setUint8(0, 198);
        byteParts.push(new Uint8Array(dataView.buffer));
      } else {
        throw new Error("Cannot safely encode Uint8Array with size larger than 32 bits");
      }
      byteParts.push(object);
      return;
    }
    if (Array.isArray(object)) {
      if (object.length < FOUR_BITS) {
        byteParts.push(new Uint8Array([
          144 | object.length
        ]));
      } else if (object.length < SIXTEEN_BITS) {
        const dataView = new DataView(new ArrayBuffer(3));
        dataView.setUint16(1, object.length);
        dataView.setUint8(0, 220);
        byteParts.push(new Uint8Array(dataView.buffer));
      } else if (object.length < THIRTY_TWO_BITS) {
        const dataView = new DataView(new ArrayBuffer(5));
        dataView.setUint32(1, object.length);
        dataView.setUint8(0, 221);
        byteParts.push(new Uint8Array(dataView.buffer));
      } else {
        throw new Error("Cannot safely encode array with size larger than 32 bits");
      }
      for (const obj of object) {
        encodeSlice(obj, byteParts);
      }
      return;
    }
    const prototype = Object.getPrototypeOf(object);
    if (prototype === null || prototype === Object.prototype) {
      const numKeys = Object.keys(object).length;
      if (numKeys < FOUR_BITS) {
        byteParts.push(new Uint8Array([
          128 | numKeys
        ]));
      } else if (numKeys < SIXTEEN_BITS) {
        const dataView = new DataView(new ArrayBuffer(3));
        dataView.setUint16(1, numKeys);
        dataView.setUint8(0, 222);
        byteParts.push(new Uint8Array(dataView.buffer));
      } else if (numKeys < THIRTY_TWO_BITS) {
        const dataView = new DataView(new ArrayBuffer(5));
        dataView.setUint32(1, numKeys);
        dataView.setUint8(0, 223);
        byteParts.push(new Uint8Array(dataView.buffer));
      } else {
        throw new Error("Cannot safely encode map with size larger than 32 bits");
      }
      for (const [key, value] of Object.entries(object)) {
        encodeSlice(key, byteParts);
        encodeSlice(value, byteParts);
      }
      return;
    }
    throw new Error("Cannot safely encode value into messagepack");
  }
  var FOUR_BITS, FIVE_BITS, SEVEN_BITS, EIGHT_BITS, FIFTEEN_BITS, SIXTEEN_BITS, THIRTY_ONE_BITS, THIRTY_TWO_BITS, SIXTY_THREE_BITS, SIXTY_FOUR_BITS, encoder3;
  var init_encode = __esm({
    "node_modules/@nktkas/hyperliquid/esm/_deps/jsr.io/@std/msgpack/1.0.3/encode.js"() {
      init_concat2();
      FOUR_BITS = 16;
      FIVE_BITS = 32;
      SEVEN_BITS = 128;
      EIGHT_BITS = 256;
      FIFTEEN_BITS = 32768;
      SIXTEEN_BITS = 65536;
      THIRTY_ONE_BITS = 2147483648;
      THIRTY_TWO_BITS = 4294967296;
      SIXTY_THREE_BITS = 9223372036854775808n;
      SIXTY_FOUR_BITS = 18446744073709551616n;
      encoder3 = new TextEncoder();
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/signing/_l1.js
  function createL1ActionHash(args) {
    const { action, nonce, vaultAddress, expiresAfter } = args;
    const actionBytes = encode(adjust(action));
    const nonceBytes = toUint64Bytes(nonce);
    const vaultMarker = vaultAddress ? new Uint8Array([
      1
    ]) : new Uint8Array([
      0
    ]);
    const vaultBytes = vaultAddress ? hexToBytes3(vaultAddress.slice(2)) : new Uint8Array();
    const expiresMarker = expiresAfter !== void 0 ? new Uint8Array([
      0
    ]) : new Uint8Array();
    const expiresBytes = expiresAfter !== void 0 ? toUint64Bytes(expiresAfter) : new Uint8Array();
    const bytes = concatBytes4(actionBytes, nonceBytes, vaultMarker, vaultBytes, expiresMarker, expiresBytes);
    return `0x${bytesToHex3(keccak_2562(bytes))}`;
  }
  function adjust(value) {
    if (Array.isArray(value)) return value.map(adjust);
    if (typeof value === "object" && value !== null) {
      const result = {};
      for (const key in value) {
        const entry = value[key];
        if (entry !== void 0) result[key] = adjust(entry);
      }
      return result;
    }
    if (typeof value === "number" && Number.isInteger(value) && (value >= 4294967296 || value < -2147483648)) {
      return BigInt(value);
    }
    return value;
  }
  function toUint64Bytes(n) {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigUint64(0, BigInt(n));
    return bytes;
  }
  async function signL1Action(args) {
    const { wallet, action, nonce, isTestnet = false, vaultAddress, expiresAfter } = args;
    const actionHash = createL1ActionHash({
      action,
      nonce,
      vaultAddress,
      expiresAfter
    });
    return await signTypedData2({
      wallet,
      domain: {
        name: "Exchange",
        version: "1",
        chainId: 1337,
        verifyingContract: "0x0000000000000000000000000000000000000000"
      },
      types: {
        Agent: [
          {
            name: "source",
            type: "string"
          },
          {
            name: "connectionId",
            type: "bytes32"
          }
        ]
      },
      primaryType: "Agent",
      message: {
        source: isTestnet ? "b" : "a",
        connectionId: actionHash
      }
    });
  }
  var init_l1 = __esm({
    "node_modules/@nktkas/hyperliquid/esm/signing/_l1.js"() {
      init_sha32();
      init_utils4();
      init_encode();
      init_abstractWallet();
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/signing/mod.js
  var init_mod = __esm({
    "node_modules/@nktkas/hyperliquid/esm/signing/mod.js"() {
      init_l1();
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentEnableDexAbstraction.js
  var init_agentEnableDexAbstraction = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentEnableDexAbstraction.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentSendAsset.js
  var init_agentSendAsset = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentSendAsset.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentSetAbstraction.js
  var init_agentSetAbstraction = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/agentSetAbstraction.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/approveAgent.js
  var ApproveAgentTypes;
  var init_approveAgent = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/approveAgent.js"() {
      ApproveAgentTypes = {
        "HyperliquidTransaction:ApproveAgent": [
          {
            name: "hyperliquidChain",
            type: "string"
          },
          {
            name: "agentAddress",
            type: "address"
          },
          {
            name: "agentName",
            type: "string"
          },
          {
            name: "nonce",
            type: "uint64"
          }
        ]
      };
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/approveBuilderFee.js
  var ApproveBuilderFeeTypes;
  var init_approveBuilderFee = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/approveBuilderFee.js"() {
      ApproveBuilderFeeTypes = {
        "HyperliquidTransaction:ApproveBuilderFee": [
          {
            name: "hyperliquidChain",
            type: "string"
          },
          {
            name: "maxFeeRate",
            type: "string"
          },
          {
            name: "builder",
            type: "address"
          },
          {
            name: "nonce",
            type: "uint64"
          }
        ]
      };
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/authorizeAqav2Role.js
  var init_authorizeAqav2Role = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/authorizeAqav2Role.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/batchModify.js
  var init_batchModify = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/batchModify.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/borrowLend.js
  var init_borrowLend = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/borrowLend.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cancel.js
  var init_cancel = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cancel.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cancelByCloid.js
  var init_cancelByCloid = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cancelByCloid.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cDeposit.js
  var init_cDeposit = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cDeposit.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/claimRewards.js
  var init_claimRewards = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/claimRewards.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/convertToMultiSigUser.js
  var init_convertToMultiSigUser = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/convertToMultiSigUser.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/createSubAccount.js
  var init_createSubAccount = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/createSubAccount.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/createVault.js
  var init_createVault = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/createVault.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cSignerAction.js
  var init_cSignerAction = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cSignerAction.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cValidatorAction.js
  var init_cValidatorAction = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cValidatorAction.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cWithdraw.js
  var init_cWithdraw = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/cWithdraw.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/evmUserModify.js
  var init_evmUserModify = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/evmUserModify.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/finalizeEvmContract.js
  var init_finalizeEvmContract = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/finalizeEvmContract.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/gossipPriorityBid.js
  var init_gossipPriorityBid = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/gossipPriorityBid.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/hip3LiquidatorTransfer.js
  var init_hip3LiquidatorTransfer = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/hip3LiquidatorTransfer.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/linkStakingUser.js
  var init_linkStakingUser = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/linkStakingUser.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/modify.js
  var init_modify = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/modify.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/noop.js
  var init_noop = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/noop.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/order.js
  var init_order = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/order.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/perpDeploy.js
  var init_perpDeploy = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/perpDeploy.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/registerReferrer.js
  var init_registerReferrer = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/registerReferrer.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/reserveRequestWeight.js
  var init_reserveRequestWeight = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/reserveRequestWeight.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/scheduleCancel.js
  var init_scheduleCancel = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/scheduleCancel.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/sendAsset.js
  var init_sendAsset = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/sendAsset.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/sendToEvmWithData.js
  var init_sendToEvmWithData = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/sendToEvmWithData.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/setDisplayName.js
  var init_setDisplayName = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/setDisplayName.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/setReferrer.js
  var init_setReferrer = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/setReferrer.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotDeploy.js
  var init_spotDeploy = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotDeploy.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotSend.js
  var init_spotSend = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotSend.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotUser.js
  var init_spotUser = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/spotUser.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/stakingLinkDisableTradingUser.js
  var init_stakingLinkDisableTradingUser = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/stakingLinkDisableTradingUser.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountModify.js
  var init_subAccountModify = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountModify.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountSpotTransfer.js
  var init_subAccountSpotTransfer = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountSpotTransfer.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountTransfer.js
  var init_subAccountTransfer = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/subAccountTransfer.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/tokenDelegate.js
  var init_tokenDelegate = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/tokenDelegate.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/topUpIsolatedOnlyMargin.js
  var init_topUpIsolatedOnlyMargin = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/topUpIsolatedOnlyMargin.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/twapCancel.js
  var init_twapCancel = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/twapCancel.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/twapOrder.js
  var init_twapOrder = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/twapOrder.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/updateIsolatedMargin.js
  var init_updateIsolatedMargin = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/updateIsolatedMargin.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/updateLeverage.js
  var init_updateLeverage = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/updateLeverage.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/usdClassTransfer.js
  var init_usdClassTransfer = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/usdClassTransfer.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/usdSend.js
  var init_usdSend = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/usdSend.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userDexAbstraction.js
  var init_userDexAbstraction = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userDexAbstraction.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userOutcome.js
  var init_userOutcome = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userOutcome.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userPortfolioMargin.js
  var init_userPortfolioMargin = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userPortfolioMargin.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userSetAbstraction.js
  var init_userSetAbstraction = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/userSetAbstraction.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/validatorL1Stream.js
  var init_validatorL1Stream = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/validatorL1Stream.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultDistribute.js
  var init_vaultDistribute = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultDistribute.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultModify.js
  var init_vaultModify = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultModify.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultTransfer.js
  var init_vaultTransfer = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/vaultTransfer.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/withdraw3.js
  var init_withdraw3 = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/_methods/withdraw3.js"() {
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/api/exchange/mod.js
  var init_mod2 = __esm({
    "node_modules/@nktkas/hyperliquid/esm/api/exchange/mod.js"() {
      init_agentEnableDexAbstraction();
      init_agentSendAsset();
      init_agentSetAbstraction();
      init_approveAgent();
      init_approveBuilderFee();
      init_authorizeAqav2Role();
      init_batchModify();
      init_borrowLend();
      init_cancel();
      init_cancelByCloid();
      init_cDeposit();
      init_claimRewards();
      init_convertToMultiSigUser();
      init_createSubAccount();
      init_createVault();
      init_cSignerAction();
      init_cValidatorAction();
      init_cWithdraw();
      init_evmUserModify();
      init_finalizeEvmContract();
      init_gossipPriorityBid();
      init_hip3LiquidatorTransfer();
      init_linkStakingUser();
      init_modify();
      init_noop();
      init_order();
      init_perpDeploy();
      init_registerReferrer();
      init_reserveRequestWeight();
      init_scheduleCancel();
      init_sendAsset();
      init_sendToEvmWithData();
      init_setDisplayName();
      init_setReferrer();
      init_spotDeploy();
      init_spotSend();
      init_spotUser();
      init_stakingLinkDisableTradingUser();
      init_subAccountModify();
      init_subAccountSpotTransfer();
      init_subAccountTransfer();
      init_tokenDelegate();
      init_topUpIsolatedOnlyMargin();
      init_twapCancel();
      init_twapOrder();
      init_updateIsolatedMargin();
      init_updateLeverage();
      init_usdClassTransfer();
      init_usdSend();
      init_userDexAbstraction();
      init_userOutcome();
      init_userPortfolioMargin();
      init_userSetAbstraction();
      init_validatorL1Stream();
      init_vaultDistribute();
      init_vaultModify();
      init_vaultTransfer();
      init_withdraw3();
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/utils/_symbolConverter.js
  var init_symbolConverter = __esm({
    "node_modules/@nktkas/hyperliquid/esm/utils/_symbolConverter.js"() {
    }
  });

  // node_modules/decimal.js/decimal.mjs
  function digitsToString(d) {
    var i, k, ws, indexOfLastWord = d.length - 1, str = "", w = d[0];
    if (indexOfLastWord > 0) {
      str += w;
      for (i = 1; i < indexOfLastWord; i++) {
        ws = d[i] + "";
        k = LOG_BASE - ws.length;
        if (k) str += getZeroString(k);
        str += ws;
      }
      w = d[i];
      ws = w + "";
      k = LOG_BASE - ws.length;
      if (k) str += getZeroString(k);
    } else if (w === 0) {
      return "0";
    }
    for (; w % 10 === 0; ) w /= 10;
    return str + w;
  }
  function checkInt32(i, min2, max2) {
    if (i !== ~~i || i < min2 || i > max2) {
      throw Error(invalidArgument + i);
    }
  }
  function checkRoundingDigits(d, i, rm, repeating) {
    var di, k, r, rd;
    for (k = d[0]; k >= 10; k /= 10) --i;
    if (--i < 0) {
      i += LOG_BASE;
      di = 0;
    } else {
      di = Math.ceil((i + 1) / LOG_BASE);
      i %= LOG_BASE;
    }
    k = mathpow(10, LOG_BASE - i);
    rd = d[di] % k | 0;
    if (repeating == null) {
      if (i < 3) {
        if (i == 0) rd = rd / 100 | 0;
        else if (i == 1) rd = rd / 10 | 0;
        r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 5e4 || rd == 0;
      } else {
        r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 || (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
      }
    } else {
      if (i < 4) {
        if (i == 0) rd = rd / 1e3 | 0;
        else if (i == 1) rd = rd / 100 | 0;
        else if (i == 2) rd = rd / 10 | 0;
        r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
      } else {
        r = ((repeating || rm < 4) && rd + 1 == k || !repeating && rm > 3 && rd + 1 == k / 2) && (d[di + 1] / k / 1e3 | 0) == mathpow(10, i - 3) - 1;
      }
    }
    return r;
  }
  function convertBase(str, baseIn, baseOut) {
    var j, arr = [0], arrL, i = 0, strL = str.length;
    for (; i < strL; ) {
      for (arrL = arr.length; arrL--; ) arr[arrL] *= baseIn;
      arr[0] += NUMERALS.indexOf(str.charAt(i++));
      for (j = 0; j < arr.length; j++) {
        if (arr[j] > baseOut - 1) {
          if (arr[j + 1] === void 0) arr[j + 1] = 0;
          arr[j + 1] += arr[j] / baseOut | 0;
          arr[j] %= baseOut;
        }
      }
    }
    return arr.reverse();
  }
  function cosine(Ctor, x) {
    var k, len, y;
    if (x.isZero()) return x;
    len = x.d.length;
    if (len < 32) {
      k = Math.ceil(len / 3);
      y = (1 / tinyPow(4, k)).toString();
    } else {
      k = 16;
      y = "2.3283064365386962890625e-10";
    }
    Ctor.precision += k;
    x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));
    for (var i = k; i--; ) {
      var cos2x = x.times(x);
      x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
    }
    Ctor.precision -= k;
    return x;
  }
  function finalise(x, sd, rm, isTruncated) {
    var digits, i, j, k, rd, roundUp, w, xd, xdi, Ctor = x.constructor;
    out: if (sd != null) {
      xd = x.d;
      if (!xd) return x;
      for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
      i = sd - digits;
      if (i < 0) {
        i += LOG_BASE;
        j = sd;
        w = xd[xdi = 0];
        rd = w / mathpow(10, digits - j - 1) % 10 | 0;
      } else {
        xdi = Math.ceil((i + 1) / LOG_BASE);
        k = xd.length;
        if (xdi >= k) {
          if (isTruncated) {
            for (; k++ <= xdi; ) xd.push(0);
            w = rd = 0;
            digits = 1;
            i %= LOG_BASE;
            j = i - LOG_BASE + 1;
          } else {
            break out;
          }
        } else {
          w = k = xd[xdi];
          for (digits = 1; k >= 10; k /= 10) digits++;
          i %= LOG_BASE;
          j = i - LOG_BASE + digits;
          rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
        }
      }
      isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));
      roundUp = rm < 4 ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2)) : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 && // Check whether the digit to the left of the rounding digit is odd.
      (i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10 & 1 || rm == (x.s < 0 ? 8 : 7));
      if (sd < 1 || !xd[0]) {
        xd.length = 0;
        if (roundUp) {
          sd -= x.e + 1;
          xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
          x.e = -sd || 0;
        } else {
          xd[0] = x.e = 0;
        }
        return x;
      }
      if (i == 0) {
        xd.length = xdi;
        k = 1;
        xdi--;
      } else {
        xd.length = xdi + 1;
        k = mathpow(10, LOG_BASE - i);
        xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
      }
      if (roundUp) {
        for (; ; ) {
          if (xdi == 0) {
            for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
            j = xd[0] += k;
            for (k = 1; j >= 10; j /= 10) k++;
            if (i != k) {
              x.e++;
              if (xd[0] == BASE) xd[0] = 1;
            }
            break;
          } else {
            xd[xdi] += k;
            if (xd[xdi] != BASE) break;
            xd[xdi--] = 0;
            k = 1;
          }
        }
      }
      for (i = xd.length; xd[--i] === 0; ) xd.pop();
    }
    if (external) {
      if (x.e > Ctor.maxE) {
        x.d = null;
        x.e = NaN;
      } else if (x.e < Ctor.minE) {
        x.e = 0;
        x.d = [0];
      }
    }
    return x;
  }
  function finiteToString(x, isExp, sd) {
    if (!x.isFinite()) return nonFiniteToString(x);
    var k, e = x.e, str = digitsToString(x.d), len = str.length;
    if (isExp) {
      if (sd && (k = sd - len) > 0) {
        str = str.charAt(0) + "." + str.slice(1) + getZeroString(k);
      } else if (len > 1) {
        str = str.charAt(0) + "." + str.slice(1);
      }
      str = str + (x.e < 0 ? "e" : "e+") + x.e;
    } else if (e < 0) {
      str = "0." + getZeroString(-e - 1) + str;
      if (sd && (k = sd - len) > 0) str += getZeroString(k);
    } else if (e >= len) {
      str += getZeroString(e + 1 - len);
      if (sd && (k = sd - e - 1) > 0) str = str + "." + getZeroString(k);
    } else {
      if ((k = e + 1) < len) str = str.slice(0, k) + "." + str.slice(k);
      if (sd && (k = sd - len) > 0) {
        if (e + 1 === len) str += ".";
        str += getZeroString(k);
      }
    }
    return str;
  }
  function getBase10Exponent(digits, e) {
    var w = digits[0];
    for (e *= LOG_BASE; w >= 10; w /= 10) e++;
    return e;
  }
  function getLn10(Ctor, sd, pr) {
    if (sd > LN10_PRECISION) {
      external = true;
      if (pr) Ctor.precision = pr;
      throw Error(precisionLimitExceeded);
    }
    return finalise(new Ctor(LN10), sd, 1, true);
  }
  function getPi(Ctor, sd, rm) {
    if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
    return finalise(new Ctor(PI), sd, rm, true);
  }
  function getPrecision(digits) {
    var w = digits.length - 1, len = w * LOG_BASE + 1;
    w = digits[w];
    if (w) {
      for (; w % 10 == 0; w /= 10) len--;
      for (w = digits[0]; w >= 10; w /= 10) len++;
    }
    return len;
  }
  function getZeroString(k) {
    var zs = "";
    for (; k--; ) zs += "0";
    return zs;
  }
  function intPow(Ctor, x, n, pr) {
    var isTruncated, r = new Ctor(1), k = Math.ceil(pr / LOG_BASE + 4);
    external = false;
    for (; ; ) {
      if (n % 2) {
        r = r.times(x);
        if (truncate(r.d, k)) isTruncated = true;
      }
      n = mathfloor(n / 2);
      if (n === 0) {
        n = r.d.length - 1;
        if (isTruncated && r.d[n] === 0) ++r.d[n];
        break;
      }
      x = x.times(x);
      truncate(x.d, k);
    }
    external = true;
    return r;
  }
  function isOdd(n) {
    return n.d[n.d.length - 1] & 1;
  }
  function maxOrMin(Ctor, args, n) {
    var k, y, x = new Ctor(args[0]), i = 0;
    for (; ++i < args.length; ) {
      y = new Ctor(args[i]);
      if (!y.s) {
        x = y;
        break;
      }
      k = x.cmp(y);
      if (k === n || k === 0 && x.s === n) {
        x = y;
      }
    }
    return x;
  }
  function naturalExponential(x, sd) {
    var denominator, guard, j, pow3, sum2, t, wpr, rep = 0, i = 0, k = 0, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
    if (!x.d || !x.d[0] || x.e > 17) {
      return new Ctor(x.d ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0 : x.s ? x.s < 0 ? 0 : x : 0 / 0);
    }
    if (sd == null) {
      external = false;
      wpr = pr;
    } else {
      wpr = sd;
    }
    t = new Ctor(0.03125);
    while (x.e > -2) {
      x = x.times(t);
      k += 5;
    }
    guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
    wpr += guard;
    denominator = pow3 = sum2 = new Ctor(1);
    Ctor.precision = wpr;
    for (; ; ) {
      pow3 = finalise(pow3.times(x), wpr, 1);
      denominator = denominator.times(++i);
      t = sum2.plus(divide(pow3, denominator, wpr, 1));
      if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
        j = k;
        while (j--) sum2 = finalise(sum2.times(sum2), wpr, 1);
        if (sd == null) {
          if (rep < 3 && checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
            Ctor.precision = wpr += 10;
            denominator = pow3 = t = new Ctor(1);
            i = 0;
            rep++;
          } else {
            return finalise(sum2, Ctor.precision = pr, rm, external = true);
          }
        } else {
          Ctor.precision = pr;
          return sum2;
        }
      }
      sum2 = t;
    }
  }
  function naturalLogarithm(y, sd) {
    var c, c0, denominator, e, numerator, rep, sum2, t, wpr, x1, x2, n = 1, guard = 10, x = y, xd = x.d, Ctor = x.constructor, rm = Ctor.rounding, pr = Ctor.precision;
    if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
      return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
    }
    if (sd == null) {
      external = false;
      wpr = pr;
    } else {
      wpr = sd;
    }
    Ctor.precision = wpr += guard;
    c = digitsToString(xd);
    c0 = c.charAt(0);
    if (Math.abs(e = x.e) < 15e14) {
      while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
        x = x.times(y);
        c = digitsToString(x.d);
        c0 = c.charAt(0);
        n++;
      }
      e = x.e;
      if (c0 > 1) {
        x = new Ctor("0." + c);
        e++;
      } else {
        x = new Ctor(c0 + "." + c.slice(1));
      }
    } else {
      t = getLn10(Ctor, wpr + 2, pr).times(e + "");
      x = naturalLogarithm(new Ctor(c0 + "." + c.slice(1)), wpr - guard).plus(t);
      Ctor.precision = pr;
      return sd == null ? finalise(x, pr, rm, external = true) : x;
    }
    x1 = x;
    sum2 = numerator = x = divide(x.minus(1), x.plus(1), wpr, 1);
    x2 = finalise(x.times(x), wpr, 1);
    denominator = 3;
    for (; ; ) {
      numerator = finalise(numerator.times(x2), wpr, 1);
      t = sum2.plus(divide(numerator, new Ctor(denominator), wpr, 1));
      if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum2.d).slice(0, wpr)) {
        sum2 = sum2.times(2);
        if (e !== 0) sum2 = sum2.plus(getLn10(Ctor, wpr + 2, pr).times(e + ""));
        sum2 = divide(sum2, new Ctor(n), wpr, 1);
        if (sd == null) {
          if (checkRoundingDigits(sum2.d, wpr - guard, rm, rep)) {
            Ctor.precision = wpr += guard;
            t = numerator = x = divide(x1.minus(1), x1.plus(1), wpr, 1);
            x2 = finalise(x.times(x), wpr, 1);
            denominator = rep = 1;
          } else {
            return finalise(sum2, Ctor.precision = pr, rm, external = true);
          }
        } else {
          Ctor.precision = pr;
          return sum2;
        }
      }
      sum2 = t;
      denominator += 2;
    }
  }
  function nonFiniteToString(x) {
    return String(x.s * x.s / 0);
  }
  function parseDecimal(x, str) {
    var e, i, len;
    if ((e = str.indexOf(".")) > -1) str = str.replace(".", "");
    if ((i = str.search(/e/i)) > 0) {
      if (e < 0) e = i;
      e += +str.slice(i + 1);
      str = str.substring(0, i);
    } else if (e < 0) {
      e = str.length;
    }
    for (i = 0; str.charCodeAt(i) === 48; i++) ;
    for (len = str.length; str.charCodeAt(len - 1) === 48; --len) ;
    str = str.slice(i, len);
    if (str) {
      len -= i;
      x.e = e = e - i - 1;
      x.d = [];
      i = (e + 1) % LOG_BASE;
      if (e < 0) i += LOG_BASE;
      if (i < len) {
        if (i) x.d.push(+str.slice(0, i));
        for (len -= LOG_BASE; i < len; ) x.d.push(+str.slice(i, i += LOG_BASE));
        str = str.slice(i);
        i = LOG_BASE - str.length;
      } else {
        i -= len;
      }
      for (; i--; ) str += "0";
      x.d.push(+str);
      if (external) {
        if (x.e > x.constructor.maxE) {
          x.d = null;
          x.e = NaN;
        } else if (x.e < x.constructor.minE) {
          x.e = 0;
          x.d = [0];
        }
      }
    } else {
      x.e = 0;
      x.d = [0];
    }
    return x;
  }
  function parseOther(x, str) {
    var base, Ctor, divisor, i, isFloat, len, p, xd, xe;
    if (str.indexOf("_") > -1) {
      str = str.replace(/(\d)_(?=\d)/g, "$1");
      if (isDecimal.test(str)) return parseDecimal(x, str);
    } else if (str === "Infinity" || str === "NaN") {
      if (!+str) x.s = NaN;
      x.e = NaN;
      x.d = null;
      return x;
    }
    if (isHex2.test(str)) {
      base = 16;
      str = str.toLowerCase();
    } else if (isBinary.test(str)) {
      base = 2;
    } else if (isOctal.test(str)) {
      base = 8;
    } else {
      throw Error(invalidArgument + str);
    }
    i = str.search(/p/i);
    if (i > 0) {
      p = +str.slice(i + 1);
      str = str.substring(2, i);
    } else {
      str = str.slice(2);
    }
    i = str.indexOf(".");
    isFloat = i >= 0;
    Ctor = x.constructor;
    if (isFloat) {
      str = str.replace(".", "");
      len = str.length;
      i = len - i;
      divisor = intPow(Ctor, new Ctor(base), i, i * 2);
    }
    xd = convertBase(str, base, BASE);
    xe = xd.length - 1;
    for (i = xe; xd[i] === 0; --i) xd.pop();
    if (i < 0) return new Ctor(x.s * 0);
    x.e = getBase10Exponent(xd, xe);
    x.d = xd;
    external = false;
    if (isFloat) x = divide(x, divisor, len * 4);
    if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
    external = true;
    return x;
  }
  function sine(Ctor, x) {
    var k, len = x.d.length;
    if (len < 3) {
      return x.isZero() ? x : taylorSeries(Ctor, 2, x, x);
    }
    k = 1.4 * Math.sqrt(len);
    k = k > 16 ? 16 : k | 0;
    x = x.times(1 / tinyPow(5, k));
    x = taylorSeries(Ctor, 2, x, x);
    var sin2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
    for (; k--; ) {
      sin2_x = x.times(x);
      x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
    }
    return x;
  }
  function taylorSeries(Ctor, n, x, y, isHyperbolic) {
    var j, t, u, x2, i = 1, pr = Ctor.precision, k = Math.ceil(pr / LOG_BASE);
    external = false;
    x2 = x.times(x);
    u = new Ctor(y);
    for (; ; ) {
      t = divide(u.times(x2), new Ctor(n++ * n++), pr, 1);
      u = isHyperbolic ? y.plus(t) : y.minus(t);
      y = divide(t.times(x2), new Ctor(n++ * n++), pr, 1);
      t = u.plus(y);
      if (t.d[k] !== void 0) {
        for (j = k; t.d[j] === u.d[j] && j--; ) ;
        if (j == -1) break;
      }
      j = u;
      u = y;
      y = t;
      t = j;
      i++;
    }
    external = true;
    t.d.length = k + 1;
    return t;
  }
  function tinyPow(b, e) {
    var n = b;
    while (--e) n *= b;
    return n;
  }
  function toLessThanHalfPi(Ctor, x) {
    var t, isNeg = x.s < 0, pi = getPi(Ctor, Ctor.precision, 1), halfPi = pi.times(0.5);
    x = x.abs();
    if (x.lte(halfPi)) {
      quadrant = isNeg ? 4 : 1;
      return x;
    }
    t = x.divToInt(pi);
    if (t.isZero()) {
      quadrant = isNeg ? 3 : 2;
    } else {
      x = x.minus(t.times(pi));
      if (x.lte(halfPi)) {
        quadrant = isOdd(t) ? isNeg ? 2 : 3 : isNeg ? 4 : 1;
        return x;
      }
      quadrant = isOdd(t) ? isNeg ? 1 : 4 : isNeg ? 3 : 2;
    }
    return x.minus(pi).abs();
  }
  function toStringBinary(x, baseOut, sd, rm) {
    var base, e, i, k, len, roundUp, str, xd, y, Ctor = x.constructor, isExp = sd !== void 0;
    if (isExp) {
      checkInt32(sd, 1, MAX_DIGITS);
      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);
    } else {
      sd = Ctor.precision;
      rm = Ctor.rounding;
    }
    if (!x.isFinite()) {
      str = nonFiniteToString(x);
    } else {
      str = finiteToString(x);
      i = str.indexOf(".");
      if (isExp) {
        base = 2;
        if (baseOut == 16) {
          sd = sd * 4 - 3;
        } else if (baseOut == 8) {
          sd = sd * 3 - 2;
        }
      } else {
        base = baseOut;
      }
      if (i >= 0) {
        str = str.replace(".", "");
        y = new Ctor(1);
        y.e = str.length - i;
        y.d = convertBase(finiteToString(y), 10, base);
        y.e = y.d.length;
      }
      xd = convertBase(str, 10, base);
      e = len = xd.length;
      for (; xd[--len] == 0; ) xd.pop();
      if (!xd[0]) {
        str = isExp ? "0p+0" : "0";
      } else {
        if (i < 0) {
          e--;
        } else {
          x = new Ctor(x);
          x.d = xd;
          x.e = e;
          x = divide(x, y, sd, rm, 0, base);
          xd = x.d;
          e = x.e;
          roundUp = inexact;
        }
        i = xd[sd];
        k = base / 2;
        roundUp = roundUp || xd[sd + 1] !== void 0;
        roundUp = rm < 4 ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2)) : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 || rm === (x.s < 0 ? 8 : 7));
        xd.length = sd;
        if (roundUp) {
          for (; ++xd[--sd] > base - 1; ) {
            xd[sd] = 0;
            if (!sd) {
              ++e;
              xd.unshift(1);
            }
          }
        }
        for (len = xd.length; !xd[len - 1]; --len) ;
        for (i = 0, str = ""; i < len; i++) str += NUMERALS.charAt(xd[i]);
        if (isExp) {
          if (len > 1) {
            if (baseOut == 16 || baseOut == 8) {
              i = baseOut == 16 ? 4 : 3;
              for (--len; len % i; len++) str += "0";
              xd = convertBase(str, base, baseOut);
              for (len = xd.length; !xd[len - 1]; --len) ;
              for (i = 1, str = "1."; i < len; i++) str += NUMERALS.charAt(xd[i]);
            } else {
              str = str.charAt(0) + "." + str.slice(1);
            }
          }
          str = str + (e < 0 ? "p" : "p+") + e;
        } else if (e < 0) {
          for (; ++e; ) str = "0" + str;
          str = "0." + str;
        } else {
          if (++e > len) for (e -= len; e--; ) str += "0";
          else if (e < len) str = str.slice(0, e) + "." + str.slice(e);
        }
      }
      str = (baseOut == 16 ? "0x" : baseOut == 2 ? "0b" : baseOut == 8 ? "0o" : "") + str;
    }
    return x.s < 0 ? "-" + str : str;
  }
  function truncate(arr, len) {
    if (arr.length > len) {
      arr.length = len;
      return true;
    }
  }
  function abs(x) {
    return new this(x).abs();
  }
  function acos(x) {
    return new this(x).acos();
  }
  function acosh(x) {
    return new this(x).acosh();
  }
  function add(x, y) {
    return new this(x).plus(y);
  }
  function asin(x) {
    return new this(x).asin();
  }
  function asinh(x) {
    return new this(x).asinh();
  }
  function atan(x) {
    return new this(x).atan();
  }
  function atanh(x) {
    return new this(x).atanh();
  }
  function atan2(y, x) {
    y = new this(y);
    x = new this(x);
    var r, pr = this.precision, rm = this.rounding, wpr = pr + 4;
    if (!y.s || !x.s) {
      r = new this(NaN);
    } else if (!y.d && !x.d) {
      r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
      r.s = y.s;
    } else if (!x.d || y.isZero()) {
      r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
      r.s = y.s;
    } else if (!y.d || x.isZero()) {
      r = getPi(this, wpr, 1).times(0.5);
      r.s = y.s;
    } else if (x.s < 0) {
      this.precision = wpr;
      this.rounding = 1;
      r = this.atan(divide(y, x, wpr, 1));
      x = getPi(this, wpr, 1);
      this.precision = pr;
      this.rounding = rm;
      r = y.s < 0 ? r.minus(x) : r.plus(x);
    } else {
      r = this.atan(divide(y, x, wpr, 1));
    }
    return r;
  }
  function cbrt(x) {
    return new this(x).cbrt();
  }
  function ceil(x) {
    return finalise(x = new this(x), x.e + 1, 2);
  }
  function clamp(x, min2, max2) {
    return new this(x).clamp(min2, max2);
  }
  function config(obj) {
    if (!obj || typeof obj !== "object") throw Error(decimalError + "Object expected");
    var i, p, v, useDefaults = obj.defaults === true, ps = [
      "precision",
      1,
      MAX_DIGITS,
      "rounding",
      0,
      8,
      "toExpNeg",
      -EXP_LIMIT,
      0,
      "toExpPos",
      0,
      EXP_LIMIT,
      "maxE",
      0,
      EXP_LIMIT,
      "minE",
      -EXP_LIMIT,
      0,
      "modulo",
      0,
      9
    ];
    for (i = 0; i < ps.length; i += 3) {
      if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
      if ((v = obj[p]) !== void 0) {
        if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
        else throw Error(invalidArgument + p + ": " + v);
      }
    }
    if (p = "crypto", useDefaults) this[p] = DEFAULTS[p];
    if ((v = obj[p]) !== void 0) {
      if (v === true || v === false || v === 0 || v === 1) {
        if (v) {
          if (typeof crypto != "undefined" && crypto && (crypto.getRandomValues || crypto.randomBytes)) {
            this[p] = true;
          } else {
            throw Error(cryptoUnavailable);
          }
        } else {
          this[p] = false;
        }
      } else {
        throw Error(invalidArgument + p + ": " + v);
      }
    }
    return this;
  }
  function cos(x) {
    return new this(x).cos();
  }
  function cosh(x) {
    return new this(x).cosh();
  }
  function clone(obj) {
    var i, p, ps;
    function Decimal2(v) {
      var e, i2, t, x = this;
      if (!(x instanceof Decimal2)) return new Decimal2(v);
      x.constructor = Decimal2;
      if (isDecimalInstance(v)) {
        x.s = v.s;
        if (external) {
          if (!v.d || v.e > Decimal2.maxE) {
            x.e = NaN;
            x.d = null;
          } else if (v.e < Decimal2.minE) {
            x.e = 0;
            x.d = [0];
          } else {
            x.e = v.e;
            x.d = v.d.slice();
          }
        } else {
          x.e = v.e;
          x.d = v.d ? v.d.slice() : v.d;
        }
        return;
      }
      t = typeof v;
      if (t === "number") {
        if (v === 0) {
          x.s = 1 / v < 0 ? -1 : 1;
          x.e = 0;
          x.d = [0];
          return;
        }
        if (v < 0) {
          v = -v;
          x.s = -1;
        } else {
          x.s = 1;
        }
        if (v === ~~v && v < 1e7) {
          for (e = 0, i2 = v; i2 >= 10; i2 /= 10) e++;
          if (external) {
            if (e > Decimal2.maxE) {
              x.e = NaN;
              x.d = null;
            } else if (e < Decimal2.minE) {
              x.e = 0;
              x.d = [0];
            } else {
              x.e = e;
              x.d = [v];
            }
          } else {
            x.e = e;
            x.d = [v];
          }
          return;
        }
        if (v * 0 !== 0) {
          if (!v) x.s = NaN;
          x.e = NaN;
          x.d = null;
          return;
        }
        return parseDecimal(x, v.toString());
      }
      if (t === "string") {
        if ((i2 = v.charCodeAt(0)) === 45) {
          v = v.slice(1);
          x.s = -1;
        } else {
          if (i2 === 43) v = v.slice(1);
          x.s = 1;
        }
        return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
      }
      if (t === "bigint") {
        if (v < 0) {
          v = -v;
          x.s = -1;
        } else {
          x.s = 1;
        }
        return parseDecimal(x, v.toString());
      }
      throw Error(invalidArgument + v);
    }
    Decimal2.prototype = P;
    Decimal2.ROUND_UP = 0;
    Decimal2.ROUND_DOWN = 1;
    Decimal2.ROUND_CEIL = 2;
    Decimal2.ROUND_FLOOR = 3;
    Decimal2.ROUND_HALF_UP = 4;
    Decimal2.ROUND_HALF_DOWN = 5;
    Decimal2.ROUND_HALF_EVEN = 6;
    Decimal2.ROUND_HALF_CEIL = 7;
    Decimal2.ROUND_HALF_FLOOR = 8;
    Decimal2.EUCLID = 9;
    Decimal2.config = Decimal2.set = config;
    Decimal2.clone = clone;
    Decimal2.isDecimal = isDecimalInstance;
    Decimal2.abs = abs;
    Decimal2.acos = acos;
    Decimal2.acosh = acosh;
    Decimal2.add = add;
    Decimal2.asin = asin;
    Decimal2.asinh = asinh;
    Decimal2.atan = atan;
    Decimal2.atanh = atanh;
    Decimal2.atan2 = atan2;
    Decimal2.cbrt = cbrt;
    Decimal2.ceil = ceil;
    Decimal2.clamp = clamp;
    Decimal2.cos = cos;
    Decimal2.cosh = cosh;
    Decimal2.div = div;
    Decimal2.exp = exp;
    Decimal2.floor = floor;
    Decimal2.hypot = hypot;
    Decimal2.ln = ln;
    Decimal2.log = log;
    Decimal2.log10 = log10;
    Decimal2.log2 = log2;
    Decimal2.max = max;
    Decimal2.min = min;
    Decimal2.mod = mod2;
    Decimal2.mul = mul;
    Decimal2.pow = pow;
    Decimal2.random = random;
    Decimal2.round = round;
    Decimal2.sign = sign2;
    Decimal2.sin = sin;
    Decimal2.sinh = sinh;
    Decimal2.sqrt = sqrt;
    Decimal2.sub = sub;
    Decimal2.sum = sum;
    Decimal2.tan = tan;
    Decimal2.tanh = tanh;
    Decimal2.trunc = trunc;
    if (obj === void 0) obj = {};
    if (obj) {
      if (obj.defaults !== true) {
        ps = ["precision", "rounding", "toExpNeg", "toExpPos", "maxE", "minE", "modulo", "crypto"];
        for (i = 0; i < ps.length; ) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
      }
    }
    Decimal2.config(obj);
    return Decimal2;
  }
  function div(x, y) {
    return new this(x).div(y);
  }
  function exp(x) {
    return new this(x).exp();
  }
  function floor(x) {
    return finalise(x = new this(x), x.e + 1, 3);
  }
  function hypot() {
    var i, n, t = new this(0);
    external = false;
    for (i = 0; i < arguments.length; ) {
      n = new this(arguments[i++]);
      if (!n.d) {
        if (n.s) {
          external = true;
          return new this(1 / 0);
        }
        t = n;
      } else if (t.d) {
        t = t.plus(n.times(n));
      }
    }
    external = true;
    return t.sqrt();
  }
  function isDecimalInstance(obj) {
    return obj instanceof Decimal || obj && obj.toStringTag === tag || false;
  }
  function ln(x) {
    return new this(x).ln();
  }
  function log(x, y) {
    return new this(x).log(y);
  }
  function log2(x) {
    return new this(x).log(2);
  }
  function log10(x) {
    return new this(x).log(10);
  }
  function max() {
    return maxOrMin(this, arguments, -1);
  }
  function min() {
    return maxOrMin(this, arguments, 1);
  }
  function mod2(x, y) {
    return new this(x).mod(y);
  }
  function mul(x, y) {
    return new this(x).mul(y);
  }
  function pow(x, y) {
    return new this(x).pow(y);
  }
  function random(sd) {
    var d, e, k, n, i = 0, r = new this(1), rd = [];
    if (sd === void 0) sd = this.precision;
    else checkInt32(sd, 1, MAX_DIGITS);
    k = Math.ceil(sd / LOG_BASE);
    if (!this.crypto) {
      for (; i < k; ) rd[i++] = Math.random() * 1e7 | 0;
    } else if (crypto.getRandomValues) {
      d = crypto.getRandomValues(new Uint32Array(k));
      for (; i < k; ) {
        n = d[i];
        if (n >= 429e7) {
          d[i] = crypto.getRandomValues(new Uint32Array(1))[0];
        } else {
          rd[i++] = n % 1e7;
        }
      }
    } else if (crypto.randomBytes) {
      d = crypto.randomBytes(k *= 4);
      for (; i < k; ) {
        n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 127) << 24);
        if (n >= 214e7) {
          crypto.randomBytes(4).copy(d, i);
        } else {
          rd.push(n % 1e7);
          i += 4;
        }
      }
      i = k / 4;
    } else {
      throw Error(cryptoUnavailable);
    }
    k = rd[--i];
    sd %= LOG_BASE;
    if (k && sd) {
      n = mathpow(10, LOG_BASE - sd);
      rd[i] = (k / n | 0) * n;
    }
    for (; rd[i] === 0; i--) rd.pop();
    if (i < 0) {
      e = 0;
      rd = [0];
    } else {
      e = -1;
      for (; rd[0] === 0; e -= LOG_BASE) rd.shift();
      for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;
      if (k < LOG_BASE) e -= LOG_BASE - k;
    }
    r.e = e;
    r.d = rd;
    return r;
  }
  function round(x) {
    return finalise(x = new this(x), x.e + 1, this.rounding);
  }
  function sign2(x) {
    x = new this(x);
    return x.d ? x.d[0] ? x.s : 0 * x.s : x.s || NaN;
  }
  function sin(x) {
    return new this(x).sin();
  }
  function sinh(x) {
    return new this(x).sinh();
  }
  function sqrt(x) {
    return new this(x).sqrt();
  }
  function sub(x, y) {
    return new this(x).sub(y);
  }
  function sum() {
    var i = 0, args = arguments, x = new this(args[i]);
    external = false;
    for (; x.s && ++i < args.length; ) x = x.plus(args[i]);
    external = true;
    return finalise(x, this.precision, this.rounding);
  }
  function tan(x) {
    return new this(x).tan();
  }
  function tanh(x) {
    return new this(x).tanh();
  }
  function trunc(x) {
    return finalise(x = new this(x), x.e + 1, 1);
  }
  var EXP_LIMIT, MAX_DIGITS, NUMERALS, LN10, PI, DEFAULTS, inexact, quadrant, external, decimalError, invalidArgument, precisionLimitExceeded, cryptoUnavailable, tag, mathfloor, mathpow, isBinary, isHex2, isOctal, isDecimal, BASE, LOG_BASE, MAX_SAFE_INTEGER, LN10_PRECISION, PI_PRECISION, P, divide, Decimal;
  var init_decimal = __esm({
    "node_modules/decimal.js/decimal.mjs"() {
      EXP_LIMIT = 9e15;
      MAX_DIGITS = 1e9;
      NUMERALS = "0123456789abcdef";
      LN10 = "2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058";
      PI = "3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789";
      DEFAULTS = {
        // These values must be integers within the stated ranges (inclusive).
        // Most of these values can be changed at run-time using the `Decimal.config` method.
        // The maximum number of significant digits of the result of a calculation or base conversion.
        // E.g. `Decimal.config({ precision: 20 });`
        precision: 20,
        // 1 to MAX_DIGITS
        // The rounding mode used when rounding to `precision`.
        //
        // ROUND_UP         0 Away from zero.
        // ROUND_DOWN       1 Towards zero.
        // ROUND_CEIL       2 Towards +Infinity.
        // ROUND_FLOOR      3 Towards -Infinity.
        // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
        // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
        // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
        // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
        // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
        //
        // E.g.
        // `Decimal.rounding = 4;`
        // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
        rounding: 4,
        // 0 to 8
        // The modulo mode used when calculating the modulus: a mod n.
        // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
        // The remainder (r) is calculated as: r = a - n * q.
        //
        // UP         0 The remainder is positive if the dividend is negative, else is negative.
        // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
        // FLOOR      3 The remainder has the same sign as the divisor (Python %).
        // HALF_EVEN  6 The IEEE 754 remainder function.
        // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
        //
        // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
        // division (9) are commonly used for the modulus operation. The other rounding modes can also
        // be used, but they may not give useful results.
        modulo: 1,
        // 0 to 9
        // The exponent value at and beneath which `toString` returns exponential notation.
        // JavaScript numbers: -7
        toExpNeg: -7,
        // 0 to -EXP_LIMIT
        // The exponent value at and above which `toString` returns exponential notation.
        // JavaScript numbers: 21
        toExpPos: 21,
        // 0 to EXP_LIMIT
        // The minimum exponent value, beneath which underflow to zero occurs.
        // JavaScript numbers: -324  (5e-324)
        minE: -EXP_LIMIT,
        // -1 to -EXP_LIMIT
        // The maximum exponent value, above which overflow to Infinity occurs.
        // JavaScript numbers: 308  (1.7976931348623157e+308)
        maxE: EXP_LIMIT,
        // 1 to EXP_LIMIT
        // Whether to use cryptographically-secure random number generation, if available.
        crypto: false
        // true/false
      };
      external = true;
      decimalError = "[DecimalError] ";
      invalidArgument = decimalError + "Invalid argument: ";
      precisionLimitExceeded = decimalError + "Precision limit exceeded";
      cryptoUnavailable = decimalError + "crypto unavailable";
      tag = "[object Decimal]";
      mathfloor = Math.floor;
      mathpow = Math.pow;
      isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
      isHex2 = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i;
      isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;
      isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
      BASE = 1e7;
      LOG_BASE = 7;
      MAX_SAFE_INTEGER = 9007199254740991;
      LN10_PRECISION = LN10.length - 1;
      PI_PRECISION = PI.length - 1;
      P = { toStringTag: tag };
      P.absoluteValue = P.abs = function() {
        var x = new this.constructor(this);
        if (x.s < 0) x.s = 1;
        return finalise(x);
      };
      P.ceil = function() {
        return finalise(new this.constructor(this), this.e + 1, 2);
      };
      P.clampedTo = P.clamp = function(min2, max2) {
        var k, x = this, Ctor = x.constructor;
        min2 = new Ctor(min2);
        max2 = new Ctor(max2);
        if (!min2.s || !max2.s) return new Ctor(NaN);
        if (min2.gt(max2)) throw Error(invalidArgument + max2);
        k = x.cmp(min2);
        return k < 0 ? min2 : x.cmp(max2) > 0 ? max2 : new Ctor(x);
      };
      P.comparedTo = P.cmp = function(y) {
        var i, j, xdL, ydL, x = this, xd = x.d, yd = (y = new x.constructor(y)).d, xs = x.s, ys = y.s;
        if (!xd || !yd) {
          return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
        }
        if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;
        if (xs !== ys) return xs;
        if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;
        xdL = xd.length;
        ydL = yd.length;
        for (i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i) {
          if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
        }
        return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
      };
      P.cosine = P.cos = function() {
        var pr, rm, x = this, Ctor = x.constructor;
        if (!x.d) return new Ctor(NaN);
        if (!x.d[0]) return new Ctor(1);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
        Ctor.rounding = 1;
        x = cosine(Ctor, toLessThanHalfPi(Ctor, x));
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
      };
      P.cubeRoot = P.cbrt = function() {
        var e, m, n, r, rep, s, sd, t, t3, t3plusx, x = this, Ctor = x.constructor;
        if (!x.isFinite() || x.isZero()) return new Ctor(x);
        external = false;
        s = x.s * mathpow(x.s * x, 1 / 3);
        if (!s || Math.abs(s) == 1 / 0) {
          n = digitsToString(x.d);
          e = x.e;
          if (s = (e - n.length + 1) % 3) n += s == 1 || s == -2 ? "0" : "00";
          s = mathpow(n, 1 / 3);
          e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));
          if (s == 1 / 0) {
            n = "5e" + e;
          } else {
            n = s.toExponential();
            n = n.slice(0, n.indexOf("e") + 1) + e;
          }
          r = new Ctor(n);
          r.s = x.s;
        } else {
          r = new Ctor(s.toString());
        }
        sd = (e = Ctor.precision) + 3;
        for (; ; ) {
          t = r;
          t3 = t.times(t).times(t);
          t3plusx = t3.plus(x);
          r = divide(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);
          if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
            n = n.slice(sd - 3, sd + 1);
            if (n == "9999" || !rep && n == "4999") {
              if (!rep) {
                finalise(t, e + 1, 0);
                if (t.times(t).times(t).eq(x)) {
                  r = t;
                  break;
                }
              }
              sd += 4;
              rep = 1;
            } else {
              if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
                finalise(r, e + 1, 1);
                m = !r.times(r).times(r).eq(x);
              }
              break;
            }
          }
        }
        external = true;
        return finalise(r, e, Ctor.rounding, m);
      };
      P.decimalPlaces = P.dp = function() {
        var w, d = this.d, n = NaN;
        if (d) {
          w = d.length - 1;
          n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;
          w = d[w];
          if (w) for (; w % 10 == 0; w /= 10) n--;
          if (n < 0) n = 0;
        }
        return n;
      };
      P.dividedBy = P.div = function(y) {
        return divide(this, new this.constructor(y));
      };
      P.dividedToIntegerBy = P.divToInt = function(y) {
        var x = this, Ctor = x.constructor;
        return finalise(divide(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
      };
      P.equals = P.eq = function(y) {
        return this.cmp(y) === 0;
      };
      P.floor = function() {
        return finalise(new this.constructor(this), this.e + 1, 3);
      };
      P.greaterThan = P.gt = function(y) {
        return this.cmp(y) > 0;
      };
      P.greaterThanOrEqualTo = P.gte = function(y) {
        var k = this.cmp(y);
        return k == 1 || k === 0;
      };
      P.hyperbolicCosine = P.cosh = function() {
        var k, n, pr, rm, len, x = this, Ctor = x.constructor, one = new Ctor(1);
        if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
        if (x.isZero()) return one;
        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
        Ctor.rounding = 1;
        len = x.d.length;
        if (len < 32) {
          k = Math.ceil(len / 3);
          n = (1 / tinyPow(4, k)).toString();
        } else {
          k = 16;
          n = "2.3283064365386962890625e-10";
        }
        x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);
        var cosh2_x, i = k, d8 = new Ctor(8);
        for (; i--; ) {
          cosh2_x = x.times(x);
          x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
        }
        return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
      };
      P.hyperbolicSine = P.sinh = function() {
        var k, pr, rm, len, x = this, Ctor = x.constructor;
        if (!x.isFinite() || x.isZero()) return new Ctor(x);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
        Ctor.rounding = 1;
        len = x.d.length;
        if (len < 3) {
          x = taylorSeries(Ctor, 2, x, x, true);
        } else {
          k = 1.4 * Math.sqrt(len);
          k = k > 16 ? 16 : k | 0;
          x = x.times(1 / tinyPow(5, k));
          x = taylorSeries(Ctor, 2, x, x, true);
          var sinh2_x, d5 = new Ctor(5), d16 = new Ctor(16), d20 = new Ctor(20);
          for (; k--; ) {
            sinh2_x = x.times(x);
            x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
          }
        }
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return finalise(x, pr, rm, true);
      };
      P.hyperbolicTangent = P.tanh = function() {
        var pr, rm, x = this, Ctor = x.constructor;
        if (!x.isFinite()) return new Ctor(x.s);
        if (x.isZero()) return new Ctor(x);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + 7;
        Ctor.rounding = 1;
        return divide(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
      };
      P.inverseCosine = P.acos = function() {
        var x = this, Ctor = x.constructor, k = x.abs().cmp(1), pr = Ctor.precision, rm = Ctor.rounding;
        if (k !== -1) {
          return k === 0 ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0) : new Ctor(NaN);
        }
        if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);
        Ctor.precision = pr + 6;
        Ctor.rounding = 1;
        x = new Ctor(1).minus(x).div(x.plus(1)).sqrt().atan();
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return x.times(2);
      };
      P.inverseHyperbolicCosine = P.acosh = function() {
        var pr, rm, x = this, Ctor = x.constructor;
        if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
        if (!x.isFinite()) return new Ctor(x);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
        Ctor.rounding = 1;
        external = false;
        x = x.times(x).minus(1).sqrt().plus(x);
        external = true;
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return x.ln();
      };
      P.inverseHyperbolicSine = P.asinh = function() {
        var pr, rm, x = this, Ctor = x.constructor;
        if (!x.isFinite() || x.isZero()) return new Ctor(x);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
        Ctor.rounding = 1;
        external = false;
        x = x.times(x).plus(1).sqrt().plus(x);
        external = true;
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return x.ln();
      };
      P.inverseHyperbolicTangent = P.atanh = function() {
        var pr, rm, wpr, xsd, x = this, Ctor = x.constructor;
        if (!x.isFinite()) return new Ctor(NaN);
        if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        xsd = x.sd();
        if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);
        Ctor.precision = wpr = xsd - x.e;
        x = divide(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);
        Ctor.precision = pr + 4;
        Ctor.rounding = 1;
        x = x.ln();
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return x.times(0.5);
      };
      P.inverseSine = P.asin = function() {
        var halfPi, k, pr, rm, x = this, Ctor = x.constructor;
        if (x.isZero()) return new Ctor(x);
        k = x.abs().cmp(1);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        if (k !== -1) {
          if (k === 0) {
            halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
            halfPi.s = x.s;
            return halfPi;
          }
          return new Ctor(NaN);
        }
        Ctor.precision = pr + 6;
        Ctor.rounding = 1;
        x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return x.times(2);
      };
      P.inverseTangent = P.atan = function() {
        var i, j, k, n, px, t, r, wpr, x2, x = this, Ctor = x.constructor, pr = Ctor.precision, rm = Ctor.rounding;
        if (!x.isFinite()) {
          if (!x.s) return new Ctor(NaN);
          if (pr + 4 <= PI_PRECISION) {
            r = getPi(Ctor, pr + 4, rm).times(0.5);
            r.s = x.s;
            return r;
          }
        } else if (x.isZero()) {
          return new Ctor(x);
        } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
          r = getPi(Ctor, pr + 4, rm).times(0.25);
          r.s = x.s;
          return r;
        }
        Ctor.precision = wpr = pr + 10;
        Ctor.rounding = 1;
        k = Math.min(28, wpr / LOG_BASE + 2 | 0);
        for (i = k; i; --i) x = x.div(x.times(x).plus(1).sqrt().plus(1));
        external = false;
        j = Math.ceil(wpr / LOG_BASE);
        n = 1;
        x2 = x.times(x);
        r = new Ctor(x);
        px = x;
        for (; i !== -1; ) {
          px = px.times(x2);
          t = r.minus(px.div(n += 2));
          px = px.times(x2);
          r = t.plus(px.div(n += 2));
          if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--; ) ;
        }
        if (k) r = r.times(2 << k - 1);
        external = true;
        return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
      };
      P.isFinite = function() {
        return !!this.d;
      };
      P.isInteger = P.isInt = function() {
        return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
      };
      P.isNaN = function() {
        return !this.s;
      };
      P.isNegative = P.isNeg = function() {
        return this.s < 0;
      };
      P.isPositive = P.isPos = function() {
        return this.s > 0;
      };
      P.isZero = function() {
        return !!this.d && this.d[0] === 0;
      };
      P.lessThan = P.lt = function(y) {
        return this.cmp(y) < 0;
      };
      P.lessThanOrEqualTo = P.lte = function(y) {
        return this.cmp(y) < 1;
      };
      P.logarithm = P.log = function(base) {
        var isBase10, d, denominator, k, inf, num, sd, r, arg = this, Ctor = arg.constructor, pr = Ctor.precision, rm = Ctor.rounding, guard = 5;
        if (base == null) {
          base = new Ctor(10);
          isBase10 = true;
        } else {
          base = new Ctor(base);
          d = base.d;
          if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);
          isBase10 = base.eq(10);
        }
        d = arg.d;
        if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
          return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
        }
        if (isBase10) {
          if (d.length > 1) {
            inf = true;
          } else {
            for (k = d[0]; k % 10 === 0; ) k /= 10;
            inf = k !== 1;
          }
        }
        external = false;
        sd = pr + guard;
        num = naturalLogarithm(arg, sd);
        denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
        r = divide(num, denominator, sd, 1);
        if (checkRoundingDigits(r.d, k = pr, rm)) {
          do {
            sd += 10;
            num = naturalLogarithm(arg, sd);
            denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
            r = divide(num, denominator, sd, 1);
            if (!inf) {
              if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
                r = finalise(r, pr + 1, 0);
              }
              break;
            }
          } while (checkRoundingDigits(r.d, k += 10, rm));
        }
        external = true;
        return finalise(r, pr, rm);
      };
      P.minus = P.sub = function(y) {
        var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd, x = this, Ctor = x.constructor;
        y = new Ctor(y);
        if (!x.d || !y.d) {
          if (!x.s || !y.s) y = new Ctor(NaN);
          else if (x.d) y.s = -y.s;
          else y = new Ctor(y.d || x.s !== y.s ? x : NaN);
          return y;
        }
        if (x.s != y.s) {
          y.s = -y.s;
          return x.plus(y);
        }
        xd = x.d;
        yd = y.d;
        pr = Ctor.precision;
        rm = Ctor.rounding;
        if (!xd[0] || !yd[0]) {
          if (yd[0]) y.s = -y.s;
          else if (xd[0]) y = new Ctor(x);
          else return new Ctor(rm === 3 ? -0 : 0);
          return external ? finalise(y, pr, rm) : y;
        }
        e = mathfloor(y.e / LOG_BASE);
        xe = mathfloor(x.e / LOG_BASE);
        xd = xd.slice();
        k = xe - e;
        if (k) {
          xLTy = k < 0;
          if (xLTy) {
            d = xd;
            k = -k;
            len = yd.length;
          } else {
            d = yd;
            e = xe;
            len = xd.length;
          }
          i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;
          if (k > i) {
            k = i;
            d.length = 1;
          }
          d.reverse();
          for (i = k; i--; ) d.push(0);
          d.reverse();
        } else {
          i = xd.length;
          len = yd.length;
          xLTy = i < len;
          if (xLTy) len = i;
          for (i = 0; i < len; i++) {
            if (xd[i] != yd[i]) {
              xLTy = xd[i] < yd[i];
              break;
            }
          }
          k = 0;
        }
        if (xLTy) {
          d = xd;
          xd = yd;
          yd = d;
          y.s = -y.s;
        }
        len = xd.length;
        for (i = yd.length - len; i > 0; --i) xd[len++] = 0;
        for (i = yd.length; i > k; ) {
          if (xd[--i] < yd[i]) {
            for (j = i; j && xd[--j] === 0; ) xd[j] = BASE - 1;
            --xd[j];
            xd[i] += BASE;
          }
          xd[i] -= yd[i];
        }
        for (; xd[--len] === 0; ) xd.pop();
        for (; xd[0] === 0; xd.shift()) --e;
        if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);
        y.d = xd;
        y.e = getBase10Exponent(xd, e);
        return external ? finalise(y, pr, rm) : y;
      };
      P.modulo = P.mod = function(y) {
        var q, x = this, Ctor = x.constructor;
        y = new Ctor(y);
        if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);
        if (!y.d || x.d && !x.d[0]) {
          return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
        }
        external = false;
        if (Ctor.modulo == 9) {
          q = divide(x, y.abs(), 0, 3, 1);
          q.s *= y.s;
        } else {
          q = divide(x, y, 0, Ctor.modulo, 1);
        }
        q = q.times(y);
        external = true;
        return x.minus(q);
      };
      P.naturalExponential = P.exp = function() {
        return naturalExponential(this);
      };
      P.naturalLogarithm = P.ln = function() {
        return naturalLogarithm(this);
      };
      P.negated = P.neg = function() {
        var x = new this.constructor(this);
        x.s = -x.s;
        return finalise(x);
      };
      P.plus = P.add = function(y) {
        var carry, d, e, i, k, len, pr, rm, xd, yd, x = this, Ctor = x.constructor;
        y = new Ctor(y);
        if (!x.d || !y.d) {
          if (!x.s || !y.s) y = new Ctor(NaN);
          else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);
          return y;
        }
        if (x.s != y.s) {
          y.s = -y.s;
          return x.minus(y);
        }
        xd = x.d;
        yd = y.d;
        pr = Ctor.precision;
        rm = Ctor.rounding;
        if (!xd[0] || !yd[0]) {
          if (!yd[0]) y = new Ctor(x);
          return external ? finalise(y, pr, rm) : y;
        }
        k = mathfloor(x.e / LOG_BASE);
        e = mathfloor(y.e / LOG_BASE);
        xd = xd.slice();
        i = k - e;
        if (i) {
          if (i < 0) {
            d = xd;
            i = -i;
            len = yd.length;
          } else {
            d = yd;
            e = k;
            len = xd.length;
          }
          k = Math.ceil(pr / LOG_BASE);
          len = k > len ? k + 1 : len + 1;
          if (i > len) {
            i = len;
            d.length = 1;
          }
          d.reverse();
          for (; i--; ) d.push(0);
          d.reverse();
        }
        len = xd.length;
        i = yd.length;
        if (len - i < 0) {
          i = len;
          d = yd;
          yd = xd;
          xd = d;
        }
        for (carry = 0; i; ) {
          carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
          xd[i] %= BASE;
        }
        if (carry) {
          xd.unshift(carry);
          ++e;
        }
        for (len = xd.length; xd[--len] == 0; ) xd.pop();
        y.d = xd;
        y.e = getBase10Exponent(xd, e);
        return external ? finalise(y, pr, rm) : y;
      };
      P.precision = P.sd = function(z) {
        var k, x = this;
        if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);
        if (x.d) {
          k = getPrecision(x.d);
          if (z && x.e + 1 > k) k = x.e + 1;
        } else {
          k = NaN;
        }
        return k;
      };
      P.round = function() {
        var x = this, Ctor = x.constructor;
        return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
      };
      P.sine = P.sin = function() {
        var pr, rm, x = this, Ctor = x.constructor;
        if (!x.isFinite()) return new Ctor(NaN);
        if (x.isZero()) return new Ctor(x);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
        Ctor.rounding = 1;
        x = sine(Ctor, toLessThanHalfPi(Ctor, x));
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
      };
      P.squareRoot = P.sqrt = function() {
        var m, n, sd, r, rep, t, x = this, d = x.d, e = x.e, s = x.s, Ctor = x.constructor;
        if (s !== 1 || !d || !d[0]) {
          return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
        }
        external = false;
        s = Math.sqrt(+x);
        if (s == 0 || s == 1 / 0) {
          n = digitsToString(d);
          if ((n.length + e) % 2 == 0) n += "0";
          s = Math.sqrt(n);
          e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);
          if (s == 1 / 0) {
            n = "5e" + e;
          } else {
            n = s.toExponential();
            n = n.slice(0, n.indexOf("e") + 1) + e;
          }
          r = new Ctor(n);
        } else {
          r = new Ctor(s.toString());
        }
        sd = (e = Ctor.precision) + 3;
        for (; ; ) {
          t = r;
          r = t.plus(divide(x, t, sd + 2, 1)).times(0.5);
          if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
            n = n.slice(sd - 3, sd + 1);
            if (n == "9999" || !rep && n == "4999") {
              if (!rep) {
                finalise(t, e + 1, 0);
                if (t.times(t).eq(x)) {
                  r = t;
                  break;
                }
              }
              sd += 4;
              rep = 1;
            } else {
              if (!+n || !+n.slice(1) && n.charAt(0) == "5") {
                finalise(r, e + 1, 1);
                m = !r.times(r).eq(x);
              }
              break;
            }
          }
        }
        external = true;
        return finalise(r, e, Ctor.rounding, m);
      };
      P.tangent = P.tan = function() {
        var pr, rm, x = this, Ctor = x.constructor;
        if (!x.isFinite()) return new Ctor(NaN);
        if (x.isZero()) return new Ctor(x);
        pr = Ctor.precision;
        rm = Ctor.rounding;
        Ctor.precision = pr + 10;
        Ctor.rounding = 1;
        x = x.sin();
        x.s = 1;
        x = divide(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);
        Ctor.precision = pr;
        Ctor.rounding = rm;
        return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
      };
      P.times = P.mul = function(y) {
        var carry, e, i, k, r, rL, t, xdL, ydL, x = this, Ctor = x.constructor, xd = x.d, yd = (y = new Ctor(y)).d;
        y.s *= x.s;
        if (!xd || !xd[0] || !yd || !yd[0]) {
          return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd ? NaN : !xd || !yd ? y.s / 0 : y.s * 0);
        }
        e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
        xdL = xd.length;
        ydL = yd.length;
        if (xdL < ydL) {
          r = xd;
          xd = yd;
          yd = r;
          rL = xdL;
          xdL = ydL;
          ydL = rL;
        }
        r = [];
        rL = xdL + ydL;
        for (i = rL; i--; ) r.push(0);
        for (i = ydL; --i >= 0; ) {
          carry = 0;
          for (k = xdL + i; k > i; ) {
            t = r[k] + yd[i] * xd[k - i - 1] + carry;
            r[k--] = t % BASE | 0;
            carry = t / BASE | 0;
          }
          r[k] = (r[k] + carry) % BASE | 0;
        }
        for (; !r[--rL]; ) r.pop();
        if (carry) ++e;
        else r.shift();
        y.d = r;
        y.e = getBase10Exponent(r, e);
        return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
      };
      P.toBinary = function(sd, rm) {
        return toStringBinary(this, 2, sd, rm);
      };
      P.toDecimalPlaces = P.toDP = function(dp, rm) {
        var x = this, Ctor = x.constructor;
        x = new Ctor(x);
        if (dp === void 0) return x;
        checkInt32(dp, 0, MAX_DIGITS);
        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
        return finalise(x, dp + x.e + 1, rm);
      };
      P.toExponential = function(dp, rm) {
        var str, x = this, Ctor = x.constructor;
        if (dp === void 0) {
          str = finiteToString(x, true);
        } else {
          checkInt32(dp, 0, MAX_DIGITS);
          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);
          x = finalise(new Ctor(x), dp + 1, rm);
          str = finiteToString(x, true, dp + 1);
        }
        return x.isNeg() && !x.isZero() ? "-" + str : str;
      };
      P.toFixed = function(dp, rm) {
        var str, y, x = this, Ctor = x.constructor;
        if (dp === void 0) {
          str = finiteToString(x);
        } else {
          checkInt32(dp, 0, MAX_DIGITS);
          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);
          y = finalise(new Ctor(x), dp + x.e + 1, rm);
          str = finiteToString(y, false, dp + y.e + 1);
        }
        return x.isNeg() && !x.isZero() ? "-" + str : str;
      };
      P.toFraction = function(maxD) {
        var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r, x = this, xd = x.d, Ctor = x.constructor;
        if (!xd) return new Ctor(x);
        n1 = d0 = new Ctor(1);
        d1 = n0 = new Ctor(0);
        d = new Ctor(d1);
        e = d.e = getPrecision(xd) - x.e - 1;
        k = e % LOG_BASE;
        d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);
        if (maxD == null) {
          maxD = e > 0 ? d : n1;
        } else {
          n = new Ctor(maxD);
          if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
          maxD = n.gt(d) ? e > 0 ? d : n1 : n;
        }
        external = false;
        n = new Ctor(digitsToString(xd));
        pr = Ctor.precision;
        Ctor.precision = e = xd.length * LOG_BASE * 2;
        for (; ; ) {
          q = divide(n, d, 0, 1, 1);
          d2 = d0.plus(q.times(d1));
          if (d2.cmp(maxD) == 1) break;
          d0 = d1;
          d1 = d2;
          d2 = n1;
          n1 = n0.plus(q.times(d2));
          n0 = d2;
          d2 = d;
          d = n.minus(q.times(d2));
          n = d2;
        }
        d2 = divide(maxD.minus(d0), d1, 0, 1, 1);
        n0 = n0.plus(d2.times(n1));
        d0 = d0.plus(d2.times(d1));
        n0.s = n1.s = x.s;
        r = divide(n1, d1, e, 1).minus(x).abs().cmp(divide(n0, d0, e, 1).minus(x).abs()) < 1 ? [n1, d1] : [n0, d0];
        Ctor.precision = pr;
        external = true;
        return r;
      };
      P.toHexadecimal = P.toHex = function(sd, rm) {
        return toStringBinary(this, 16, sd, rm);
      };
      P.toNearest = function(y, rm) {
        var x = this, Ctor = x.constructor;
        x = new Ctor(x);
        if (y == null) {
          if (!x.d) return x;
          y = new Ctor(1);
          rm = Ctor.rounding;
        } else {
          y = new Ctor(y);
          if (rm === void 0) {
            rm = Ctor.rounding;
          } else {
            checkInt32(rm, 0, 8);
          }
          if (!x.d) return y.s ? x : y;
          if (!y.d) {
            if (y.s) y.s = x.s;
            return y;
          }
        }
        if (y.d[0]) {
          external = false;
          x = divide(x, y, 0, rm, 1).times(y);
          external = true;
          finalise(x);
        } else {
          y.s = x.s;
          x = y;
        }
        return x;
      };
      P.toNumber = function() {
        return +this;
      };
      P.toOctal = function(sd, rm) {
        return toStringBinary(this, 8, sd, rm);
      };
      P.toPower = P.pow = function(y) {
        var e, k, pr, r, rm, s, x = this, Ctor = x.constructor, yn = +(y = new Ctor(y));
        if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));
        x = new Ctor(x);
        if (x.eq(1)) return x;
        pr = Ctor.precision;
        rm = Ctor.rounding;
        if (y.eq(1)) return finalise(x, pr, rm);
        e = mathfloor(y.e / LOG_BASE);
        if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
          r = intPow(Ctor, x, k, pr);
          return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
        }
        s = x.s;
        if (s < 0) {
          if (e < y.d.length - 1) return new Ctor(NaN);
          if ((y.d[e] & 1) == 0) s = 1;
          if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
            x.s = s;
            return x;
          }
        }
        k = mathpow(+x, yn);
        e = k == 0 || !isFinite(k) ? mathfloor(yn * (Math.log("0." + digitsToString(x.d)) / Math.LN10 + x.e + 1)) : new Ctor(k + "").e;
        if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);
        external = false;
        Ctor.rounding = x.s = 1;
        k = Math.min(12, (e + "").length);
        r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);
        if (r.d) {
          r = finalise(r, pr + 5, 1);
          if (checkRoundingDigits(r.d, pr, rm)) {
            e = pr + 10;
            r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);
            if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
              r = finalise(r, pr + 1, 0);
            }
          }
        }
        r.s = s;
        external = true;
        Ctor.rounding = rm;
        return finalise(r, pr, rm);
      };
      P.toPrecision = function(sd, rm) {
        var str, x = this, Ctor = x.constructor;
        if (sd === void 0) {
          str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
        } else {
          checkInt32(sd, 1, MAX_DIGITS);
          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);
          x = finalise(new Ctor(x), sd, rm);
          str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
        }
        return x.isNeg() && !x.isZero() ? "-" + str : str;
      };
      P.toSignificantDigits = P.toSD = function(sd, rm) {
        var x = this, Ctor = x.constructor;
        if (sd === void 0) {
          sd = Ctor.precision;
          rm = Ctor.rounding;
        } else {
          checkInt32(sd, 1, MAX_DIGITS);
          if (rm === void 0) rm = Ctor.rounding;
          else checkInt32(rm, 0, 8);
        }
        return finalise(new Ctor(x), sd, rm);
      };
      P.toString = function() {
        var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
        return x.isNeg() && !x.isZero() ? "-" + str : str;
      };
      P.truncated = P.trunc = function() {
        return finalise(new this.constructor(this), this.e + 1, 1);
      };
      P.valueOf = P.toJSON = function() {
        var x = this, Ctor = x.constructor, str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
        return x.isNeg() ? "-" + str : str;
      };
      divide = /* @__PURE__ */ (function() {
        function multiplyInteger(x, k, base) {
          var temp, carry = 0, i = x.length;
          for (x = x.slice(); i--; ) {
            temp = x[i] * k + carry;
            x[i] = temp % base | 0;
            carry = temp / base | 0;
          }
          if (carry) x.unshift(carry);
          return x;
        }
        function compare(a, b, aL, bL) {
          var i, r;
          if (aL != bL) {
            r = aL > bL ? 1 : -1;
          } else {
            for (i = r = 0; i < aL; i++) {
              if (a[i] != b[i]) {
                r = a[i] > b[i] ? 1 : -1;
                break;
              }
            }
          }
          return r;
        }
        function subtract(a, b, aL, base) {
          var i = 0;
          for (; aL--; ) {
            a[aL] -= i;
            i = a[aL] < b[aL] ? 1 : 0;
            a[aL] = i * base + a[aL] - b[aL];
          }
          for (; !a[0] && a.length > 1; ) a.shift();
        }
        return function(x, y, pr, rm, dp, base) {
          var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0, yL, yz, Ctor = x.constructor, sign3 = x.s == y.s ? 1 : -1, xd = x.d, yd = y.d;
          if (!xd || !xd[0] || !yd || !yd[0]) {
            return new Ctor(
              // Return NaN if either NaN, or both Infinity or 0.
              !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN : (
                // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
                xd && xd[0] == 0 || !yd ? sign3 * 0 : sign3 / 0
              )
            );
          }
          if (base) {
            logBase = 1;
            e = x.e - y.e;
          } else {
            base = BASE;
            logBase = LOG_BASE;
            e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
          }
          yL = yd.length;
          xL = xd.length;
          q = new Ctor(sign3);
          qd = q.d = [];
          for (i = 0; yd[i] == (xd[i] || 0); i++) ;
          if (yd[i] > (xd[i] || 0)) e--;
          if (pr == null) {
            sd = pr = Ctor.precision;
            rm = Ctor.rounding;
          } else if (dp) {
            sd = pr + (x.e - y.e) + 1;
          } else {
            sd = pr;
          }
          if (sd < 0) {
            qd.push(1);
            more = true;
          } else {
            sd = sd / logBase + 2 | 0;
            i = 0;
            if (yL == 1) {
              k = 0;
              yd = yd[0];
              sd++;
              for (; (i < xL || k) && sd--; i++) {
                t = k * base + (xd[i] || 0);
                qd[i] = t / yd | 0;
                k = t % yd | 0;
              }
              more = k || i < xL;
            } else {
              k = base / (yd[0] + 1) | 0;
              if (k > 1) {
                yd = multiplyInteger(yd, k, base);
                xd = multiplyInteger(xd, k, base);
                yL = yd.length;
                xL = xd.length;
              }
              xi = yL;
              rem = xd.slice(0, yL);
              remL = rem.length;
              for (; remL < yL; ) rem[remL++] = 0;
              yz = yd.slice();
              yz.unshift(0);
              yd0 = yd[0];
              if (yd[1] >= base / 2) ++yd0;
              do {
                k = 0;
                cmp = compare(yd, rem, yL, remL);
                if (cmp < 0) {
                  rem0 = rem[0];
                  if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);
                  k = rem0 / yd0 | 0;
                  if (k > 1) {
                    if (k >= base) k = base - 1;
                    prod = multiplyInteger(yd, k, base);
                    prodL = prod.length;
                    remL = rem.length;
                    cmp = compare(prod, rem, prodL, remL);
                    if (cmp == 1) {
                      k--;
                      subtract(prod, yL < prodL ? yz : yd, prodL, base);
                    }
                  } else {
                    if (k == 0) cmp = k = 1;
                    prod = yd.slice();
                  }
                  prodL = prod.length;
                  if (prodL < remL) prod.unshift(0);
                  subtract(rem, prod, remL, base);
                  if (cmp == -1) {
                    remL = rem.length;
                    cmp = compare(yd, rem, yL, remL);
                    if (cmp < 1) {
                      k++;
                      subtract(rem, yL < remL ? yz : yd, remL, base);
                    }
                  }
                  remL = rem.length;
                } else if (cmp === 0) {
                  k++;
                  rem = [0];
                }
                qd[i++] = k;
                if (cmp && rem[0]) {
                  rem[remL++] = xd[xi] || 0;
                } else {
                  rem = [xd[xi]];
                  remL = 1;
                }
              } while ((xi++ < xL || rem[0] !== void 0) && sd--);
              more = rem[0] !== void 0;
            }
            if (!qd[0]) qd.shift();
          }
          if (logBase == 1) {
            q.e = e;
            inexact = more;
          } else {
            for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
            q.e = i + e * logBase - 1;
            finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
          }
          return q;
        };
      })();
      P[/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")] = P.toString;
      P[Symbol.toStringTag] = "Decimal";
      Decimal = P.constructor = clone(DEFAULTS);
      LN10 = new Decimal(LN10);
      PI = new Decimal(PI);
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/utils/_format.js
  function toDecimal(value, field) {
    let d;
    try {
      d = new D(value);
    } catch (cause) {
      throw new FormatError(`Invalid ${field}: ${JSON.stringify(value)}`, {
        cause
      });
    }
    if (!d.isFinite()) {
      throw new FormatError(`Invalid ${field}: ${String(value)} is not finite`);
    }
    return d;
  }
  function formatPrice(price, szDecimals, type = "perp") {
    const d = toDecimal(price, "price");
    const maxDecimals = Math.max((type === "perp" ? 6 : 8) - szDecimals, 0);
    let result = d.toDecimalPlaces(maxDecimals);
    if (!result.isInteger()) {
      result = result.toSignificantDigits(5);
    }
    if (result.isZero()) {
      throw new FormatError("Price is too small and was truncated to 0");
    }
    return result.toFixed();
  }
  function formatSize(size2, szDecimals) {
    const d = toDecimal(size2, "size");
    const result = d.toDecimalPlaces(szDecimals);
    if (result.isZero()) {
      throw new FormatError("Size is too small and was truncated to 0");
    }
    return result.toFixed();
  }
  var FormatError, D;
  var init_format = __esm({
    "node_modules/@nktkas/hyperliquid/esm/utils/_format.js"() {
      init_decimal();
      init_base2();
      FormatError = class extends HyperliquidError {
        constructor(message, options) {
          super(message, options);
          this.name = "FormatError";
        }
      };
      D = Decimal.clone({
        rounding: Decimal.ROUND_DOWN
      });
    }
  });

  // node_modules/@nktkas/hyperliquid/esm/utils/mod.js
  var init_mod3 = __esm({
    "node_modules/@nktkas/hyperliquid/esm/utils/mod.js"() {
      init_symbolConverter();
      init_format();
    }
  });

  // adapter.js
  var require_adapter = __commonJS({
    "adapter.js"() {
      init_accounts();
      init_mod();
      init_mod2();
      init_mod3();
      var ZERO = "0x0000000000000000000000000000000000000000";
      var EIP712Domain = [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" }
      ];
      var HLSDK = {
        randomPrivateKey() {
          return generatePrivateKey();
        },
        addressFromPrivateKey(pk) {
          return privateKeyToAccount(pk).address;
        },
        hashL1Action(action, nonce, _isTestnet, vaultAddress) {
          return createL1ActionHash({ action, nonce, vaultAddress: vaultAddress || void 0 });
        },
        async signL1Action(pk, action, nonce, isTestnet, vaultAddress) {
          const wallet = privateKeyToAccount(pk);
          return await signL1Action({ wallet, action, nonce, isTestnet: !!isTestnet, vaultAddress: vaultAddress || void 0 });
        },
        userSignedTypedData(action, signatureChainId) {
          const types = action.type === "approveAgent" ? ApproveAgentTypes : ApproveBuilderFeeTypes;
          const primaryType = Object.keys(types)[0];
          const message = {};
          for (const f of types[primaryType]) message[f.name] = action[f.name];
          return {
            domain: { name: "HyperliquidSignTransaction", version: "1", chainId: parseInt(signatureChainId, 16), verifyingContract: ZERO },
            types: { EIP712Domain, ...types },
            primaryType,
            message
          };
        },
        orderToWire(order, szDecimals) {
          const w = {
            a: order.a,
            b: order.b,
            p: formatPrice(order.p, szDecimals, order.spot ? "spot" : "perp"),
            s: formatSize(order.s, szDecimals),
            r: !!order.r,
            t: order.t
          };
          if (order.c) w.c = order.c;
          return w;
        }
      };
      var g = typeof window !== "undefined" ? window : globalThis;
      g.HLSDK = HLSDK;
    }
  });
  require_adapter();
})();
/*! Bundled license information:

@noble/hashes/esm/utils.js:
@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/esm/abstract/utils.js:
@noble/curves/esm/abstract/modular.js:
@noble/curves/esm/abstract/curve.js:
@noble/curves/esm/abstract/weierstrass.js:
@noble/curves/esm/_shortw_utils.js:
@noble/curves/esm/secp256k1.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

decimal.js/decimal.mjs:
  (*!
   *  decimal.js v10.6.0
   *  An arbitrary-precision Decimal type for JavaScript.
   *  https://github.com/MikeMcl/decimal.js
   *  Copyright (c) 2025 Michael Mclaughlin <M8ch88l@gmail.com>
   *  MIT Licence
   *)
*/
