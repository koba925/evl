const { error } = require("./error")
const { id, eq } = require("./functions")
const assert = require("assert/strict")

const makeValue = (type, val) => ({ type, val })
const typeOf = a => a.type
const valueOf = a => a.val
const eqVal = (a, b) => 
  typeOf(a) === typeOf(b) && valueOf(a) === valueOf(b)

const makeNumber = a => makeValue("number", Number(a))
const isNumber = a => typeOf(a) == "number"
const add = (a, b) => valueOf(a) + valueOf(b)

const makeString = a => makeValue("string", a.toString())
const isString = a => typeOf(a) == "string"

const makeBool = a => makeValue("bool", Boolean(a))
const isBool = a => typeOf(a) == "bool"

const makeSymbol = a => makeValue("symbol", a)
const isSymbol = a => typeOf(a) == "symbol"
const symbolIs = (sym, name) => 
  typeOf(sym) === "symbol" && valueOf(sym) === name

const makePrimOp = a => makeValue("primop", a)
const isPrimOp = a => typeOf(a) == "primop"

const nil = makeValue("nil", null)
const isNil = a => typeOf(a) == "nil"
  
const makePair = (a, d) => makeValue("pair", [a, d])
const isPair = a => typeOf(a) == "pair"
const cons = (a, d) => makePair(a, d)
const car = a => valueOf(a)[0]
const cdr = a => valueOf(a)[1]
const setCar = (a, val) => { valueOf(a)[0] = val }
const setCdr = (a, val) => { valueOf(a)[1] = val }
const equal = (a, b) => {
  if (!isPair(a) && !isPair(b)) return eqVal(a, b)
  if (!isPair(a) || !isPair(b)) return false
  return equal(car(a), car(b)) && equal(cdr(a), cdr(b))
}
const makeList = (...a) =>
  a.length == 0 ? nil : cons(a[0], makeList(...a.slice(1)))

const isAtom = a => typeOf(a) != "pair" && typeOf(a) != "nil"

const toList = (str, at = 0) => {
  const from = () => str.slice(at)
  const readWhite = () => {
    const w = from().match(/^\s*/)[0]
    at += w.length
  }
  const expect = str => {
    readWhite()
    if (!from().startsWith(str)) error("syntax error at", at, from())
    at += str.length
  }
  const readSharp = () => {
    // console.log("readSharp", from())
    const w = from().match(/^[^\s())]*/)[0]
    at += w.length
    if (w == "t") return makeBool(true)
    if (w == "f") return makeBool(false)
  }
  const readNumber = () => {
    // console.log("readNumber", from())
    const w = from().match(/^\d*/)[0]
    at += w.length
    return makeNumber(Number(w))
  }
  const readString = () => {
    const w = from().match(/^[^"]*/)[0]
    at += w.length
    return makeString(str)
  }
  const readSymbol = () => {
    // console.log("readSymbol", from())
    const w = from().match(/^[^\s())]*/)[0]
    at += w.length
    return makeSymbol(w)
  }
  const readList = () => {
    // console.log("readList", from())
    readWhite()
    if (str[at] == ")") { at++; return nil }
    const a = readTerm()
    readWhite()
    if (str[at] == ".") { 
      at++
      const d = readTerm()
      expect(")")
      return cons(a, d) }
    return cons(a, readList())  
  }
  const readTerm = () => {
    // console.log("readTerm", from())
    readWhite()
    if (str[at] == "(") { at++; return readList() }
    if (str[at] == ")") { error("Unexpected char: )") }
    if (str[at] == "#") { at++; return readSharp() }
    if (/[0-9]/.test(str[at])) return readNumber()
    if (str[at] == "\"") { at++; return readString() }
    return readSymbol()
  }
  const expectEnd = () => {
    readWhite()
    if (at != str.length) error(`syntax error at ${at}: ${from()}`)
  }

  const res = readTerm()
  expectEnd()
  return res
}

const toStringRaw = a => JSON.stringify(a, null, 2)
const printRaw = (...as) => 
  console.log(as.map(a => toStringRaw(a)).join("\n"))

const toString = (a, depth = 4) => {
  // console.log("toString", depth, a)
  const inside = l => {
    // console.log("inside", depth, l)
    if (isNil(l)) return ""
    if (!isPair(l)) return toString(l)
    if (depth == 0) return "(...)"
    if (isNil(cdr(l))) return toString(car(l), depth - 1)
    if (isPair(cdr(l))) return toString(car(l), depth - 1) + " " + inside(cdr(l))
    return toString(car(l), depth - 1) + " . " + toString(cdr(l), depth - 1)
  }
  return typeof a == "number" ? a :
    typeof a == "string" ? a :
    typeOf(a) == "number" ? valueOf(a).toString() :
    typeOf(a) == "string" ? '"' + valueOf(a) + '"':
    typeOf(a) == "bool" ? valueOf(a) ? "#t" : "#f" :
    typeOf(a) == "symbol" ? valueOf(a).toString() :
    typeOf(a) == "primop" ? valueOf(a) :
    typeOf(a) == "nil" ? "()" :
    typeOf(a) == "pair" ? "(" + inside(a) + ")":
    "unknown type"
}
const print = (...as) => 
  console.log(as.map(a => toString(a)).join(" "))

const testEqual = (actual, expected, message) => 
  assert(equal(actual, expected), message)

  
module.exports = {
  valueOf, eq, 
  makeNumber, isNumber, add, 
  makeString, isString, 
  makeBool, isBool, 
  makeSymbol, isSymbol, symbolIs, 
  makePrimOp, isPrimOp, 
  nil, isNil, 
  makePair, isPair, cons, car, cdr, setCar, setCdr, 
  equal, makeList, 
  isAtom, 
  toList, toStringRaw, printRaw, toString, print,
  testEqual
}

if (require.main !== module) return

assert.equal(typeOf(makeValue("sometype", 1)), "sometype")
assert.equal(valueOf(makeValue("sometype", 1)), 1)
assert.equal(eqVal(makeValue("sometype", 1), makeValue("sometype", 1)), true)
assert.equal(eqVal(makeValue("sometype", 1), makeValue("sometype", 2)), false)
assert.equal(eqVal(makeValue("sometype", 1), makeValue("othertype", 1)), false)
assert.equal(typeOf(makeNumber(1)), "number")
assert.equal(valueOf(makeNumber(1)), 1)

assert.equal(isNumber(makeNumber(1)), true)
assert.equal(isNumber(makeString("abc")), false)
assert.equal(add(makeNumber(1), makeNumber(2)), 3)

assert.equal(typeOf(makeString("abc")), "string")
assert.equal(valueOf(makeString("abc")), "abc")
assert.equal(isString(makeString("abc")), true)
assert.equal(isString(makeNumber(1)), false)

assert.equal(typeOf(makeBool(true)), "bool")
assert.equal(typeOf(makeBool(false)), "bool")
assert.equal(valueOf(makeBool(true)), true)
assert.equal(valueOf(makeBool(false)), false)
assert.equal(isBool(makeBool(true)), true)
assert.equal(isBool(makeBool(false)), true)
assert.equal(isBool(makeNumber(1)), false)

assert.equal(typeOf(makeSymbol("abc")), "symbol")
assert.equal(valueOf(makeSymbol("abc")), "abc")
assert.equal(isSymbol(makeSymbol("abc")), true)
assert.equal(isSymbol(makeNumber(1)), false)
assert.equal(symbolIs(makeSymbol("abc"), "abc"), true)
assert.equal(symbolIs(makeSymbol("abc"), "def"), false)

assert.equal(typeOf(makePrimOp(id)), "primop")
assert.equal(isPrimOp(makePrimOp(id)), true)
assert.equal(isPrimOp(makeNumber(1)), false)

assert.equal(typeOf(nil), "nil")
assert.equal(valueOf(nil), null)
assert.equal(isNil(nil), true)
assert.equal(isNil(makeNumber(1)), false)

assert.equal(typeOf(makePair(1, 2)), "pair")
assert.equal(isPair(makePair(1, 2)), true)
assert.equal(car(cons(1, 2)), 1)
assert.equal(cdr(cons(1, 2)), 2)

const p = cons(1, 2)
setCar(p, 3)
assert.equal(car(p), 3)
setCdr(p, 4)
assert.equal(cdr(p), 4)

const one = makeNumber(1)
const two = makeNumber(2)

assert.equal(equal(makeNumber(1), makeNumber(1)), true)
assert.equal(equal(makeNumber(1), makeNumber(2)), false)
assert.equal(
  equal(
    cons(makeNumber(1), makeNumber(2)),
    makeNumber(1)),
  false
)
assert.equal(
  equal(
    makeNumber(1),
    cons(makeNumber(1), makeNumber(2))),
  false
)
assert.equal(
  equal(
    cons(makeNumber(1), makeNumber(2)),
    cons(makeNumber(2), makeNumber(2))),
  false
)
assert.equal(
  equal(
    cons(makeNumber(1), makeNumber(2)),
    cons(makeNumber(1), makeNumber(2))),
  true
)

assert.throws(() => testEqual(makeNumber(1), makeNumber(1)))
assert.doesNotThrow(() => testEqual(makeNumber(1), makeNumber(2)))

testEqual(makeList(), nil)
testEqual(makeList(makeNumber(1)), cons(makeNumber(1), nil))
testEqual(
  makeList(makeNumber(1), makeNumber(2)), 
  cons(makeNumber(1), cons(makeNumber(2), nil))
)

testTrue(isAtom(makeNumber(1)), true)
testFalse(isAtom(cons(makeNumber(1), nil)), false)
testFalse(isAtom(nil), false)

testEqual(toList("0"), makeNumber(0))
testEqual(toList(" 1"), makeNumber(1))
testEqual(toList("1 "), makeNumber(1))
testEqual(toList("1 1"), makeNumber(1))
*/