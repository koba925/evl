const { error } = require("./error")
const { 
  noDisp, defaultDisp, test, testEq, testTrue, testFalse, testEqArrayShallow
} = require("./test")
const { id, eq, eqArrayShallow } = require("./functions")

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

const testEqual = (actual, expected, disp = (actual, expected) => 
  defaultDisp(toString(actual), toString(expected))
) => test(actual, expected, equal, disp)

  
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

testEq(typeOf(makeValue("sometype", 1)), "sometype")
testEq(valueOf(makeValue("sometype", 1)), 1)
testEq(eqVal(makeValue("sometype", 1), makeValue("sometype", 1)), true)
testEq(eqVal(makeValue("sometype", 1), makeValue("sometype", 2)), false)
testEq(eqVal(makeValue("sometype", 1), makeValue("othertype", 1)), false)

testEq(typeOf(makeNumber(1)), "number")
testEq(valueOf(makeNumber(1)), 1)
testEq(isNumber(makeNumber(1)), true)
testEq(isNumber(makeString("abc")), false)
testEq(add(makeNumber(1), makeNumber(2)), 3)

testEq(typeOf(makeString("abc")), "string")
testEq(valueOf(makeString("abc")), "abc")
testEq(isString(makeString("abc")), true)
testEq(isString(makeNumber(1)), false)

testEq(typeOf(makeBool(true)), "bool")
testEq(typeOf(makeBool(false)), "bool")
testEq(valueOf(makeBool(true)), true)
testEq(valueOf(makeBool(false)), false)
testEq(isBool(makeBool(true)), true)
testEq(isBool(makeBool(false)), true)
testEq(isBool(makeNumber(1)), false)

testEq(typeOf(makeSymbol("abc")), "symbol")
testEq(valueOf(makeSymbol("abc")), "abc")
testEq(isSymbol(makeSymbol("abc")), true)
testEq(isSymbol(makeNumber(1)), false)
testEq(symbolIs(makeSymbol("abc"), "abc"), true)
testEq(symbolIs(makeSymbol("abc"), "def"), false)

testEq(typeOf(makePrimOp(id)), "primop")
testEq(isPrimOp(makePrimOp(id)), true)
testEq(isPrimOp(makeNumber(1)), false)

testEq(typeOf(nil), "nil")
testEq(valueOf(nil), null)
testEq(isNil(nil), true)
testEq(isNil(makeNumber(1)), false)

testEq(typeOf(makePair(1, 2)), "pair")
testEq(isPair(makePair(1, 2)), true)
testEq(car(cons(1, 2)), 1)
testEq(cdr(cons(1, 2)), 2)

const p = cons(1, 2)
setCar(p, 3)
testEq(car(p), 3)
setCdr(p, 4)
testEq(cdr(p), 4)

const one = makeNumber(1)
const two = makeNumber(2)

testTrue(equal(makeNumber(1), makeNumber(1)))
testFalse(equal(makeNumber(1), makeNumber(2)))
testFalse(equal(cons(makeNumber(1), makeNumber(2)),
               makeNumber(1)))
testFalse(equal(makeNumber(1),
               cons(makeNumber(1), makeNumber(2))))
testFalse(equal(cons(makeNumber(1), makeNumber(2)),
               cons(makeNumber(2), makeNumber(2))))
testTrue(equal(cons(makeNumber(1), makeNumber(2)),
               cons(makeNumber(1), makeNumber(2))))

testTrue(testEqual(makeNumber(1), makeNumber(1)))
testFalse(testEqual(makeNumber(1), makeNumber(2), noDisp))

testEqual(makeList(), nil)
testEqual(makeList(makeNumber(1)), cons(makeNumber(1), nil))
testEqual(
  makeList(makeNumber(1), makeNumber(2)), 
  cons(makeNumber(1), cons(makeNumber(2), nil))
)

testTrue(isAtom(makeNumber(1)))
testFalse(isAtom(cons(makeNumber(1), nil)))
testFalse(isAtom(nil))

testEqual(toList("0"), makeNumber(0))
testEqual(toList(" 1"), makeNumber(1))
testEqual(toList("1 "), makeNumber(1))
testEqual(toList("1 1"), makeNumber(1))








