const { test } = require("./test")
const { id, testEq } = require("./functions")
const {
  valueOf, eqValue, 
  makeNumber, isNumber, add, 
  makeString, isString, 
  makeBool, isBool, 
  makeSymbol, isSymbol, symbolIs, 
  makePrimOp, isPrimOp, 
  nil, isNil, 
  makePair, isPair, cons, car, cdr, setCar, setCdr, equal, makeList, 
  isAtom, 
  toList, toStringRaw, printRaw, toString, print
} = require("./values")

const exp_operator = exp => car(exp)
const exp_operands = exp => cdr(exp)

const isSelfEval = a => isNil(a) || isNumber(a) || isString(a) || isBool(a)

const primitive = makeString("primitive")
const makePrimitive = func => makeList(primitive, makePrimOp(func))
const primitive_func = proc => car(cdr(proc))
const isPrimitive = proc => equal(car(proc), primitive)

const compound = makeString("compound")
const makeCompound = (params, body, env) => 
  makeList(compound, params, body, env)
const compound_params = proc => car(cdr(proc))
const compound_body = proc => car(cdr(cdr(proc)))
const compound_env = proc => car(cdr(cdr(cdr(proc))))
const isCompound = proc => equal(car(proc), compound)

const bind = (vars, vals, env) => makeList(vars, vals, env)
const env_vars = env => car(env)
const set_env_vars = (env, sym) => setCar(env, sym)
const env_vals = env => car(cdr(env))
const set_env_vals = (env, val) => setCar(cdr(env), val)
const env_parent = env => car(cdr(cdr(env)))
const toEnv = (pairs, parent) => {
  let vars = nil, vals = nil
  for (p of pairs.reverse()) {
    vars = cons(makeSymbol(p[0]), vars)
    vals = cons(p[1], vals)
  }
  return makeList(vars, vals, parent)
}
const lookupEnv = (sym, env) => {
  const lookupFrame = (vars, vals) => {
    if (isNil(vars)) return undefined
    if (equal(car(vars), sym)) return car(vals)
    return lookupFrame(cdr(vars), cdr(vals))
  }

  if (isNil(env)) error("Variable not found: " + valueOf(sym))
  return lookupFrame(env_vars(env), env_vals(env)) || 
    lookupEnv(sym, env_parent(env))
}
const printEnv = (env, depth = 3) => {
  if (isNil(env) || env === e0 || depth == 0) return nil
  print("env: ", env_vars(env), env_vals(env))
  printEnv(env_parent(env), depth - 1)
}

const quote_arg = exp => car(cdr(exp))
const doQuote = exp => quote_arg(exp)

const lambda_args = exp => car(cdr(exp))
const lambda_body = exp => cdr(cdr(exp))

const if_cond = exp => car(cdr(exp))
const if_conseq = exp => car(cdr(cdr(exp)))
const if_alt = exp => car(cdr(cdr(cdr(exp))))
const doIf = (exp, env) => valueOf(evl(if_cond(exp), env)) ? 
    evl(if_conseq(exp), env) : 
    evl(if_alt(exp), env)

const define_name = exp => car(cdr(exp))
const define_value = exp => car(cdr(cdr(exp)))
const doDefine = (sym, val, env) => {
  const putVar = (vars, vals) => {
    if (equal(car(vars), sym)) error("Already defined: " + valueOf(sym))
    if (isNil(cdr(vars))) {
      setCdr(vars, cons(sym, nil))
      setCdr(vals, cons(val, nil))
      return sym
    }
    return putVar(cdr(vars), cdr(vals))
  }
  const vars = env_vars(env), vals = env_vals(env)
  if (isNil(vars)) {
    set_env_vars(env, cons(sym, nil))
    set_env_vals(env, cons(val, nil))
    return sym
  }
  return putVar(vars, vals)
}

const begin_seq = exp => cdr(exp)
const doSeq = (seq, env) => {
  const val = evl(car(seq), env)
  if (isNil(cdr(seq))) return val
  return doSeq(cdr(seq), env)
}
const doBegin = (exp, env) => doSeq(begin_seq(exp), env)

const evlArgs = (args, env) => 
  isNil(args) ? 
    nil : 
    cons(evl(car(args), env), evlArgs(cdr(args), env))

const app = (proc, args) => {
  // print("app: ", proc, args)
  if (isPrimitive(proc)) return valueOf(primitive_func(proc))(args)
  return doSeq(
    compound_body(proc), 
    bind(compound_params(proc), args, compound_env(proc)))
}

const e0 = toEnv([
  ["cons", makePrimitive(args => cons(car(args), car(cdr(args))))],
  ["car", makePrimitive(args => car(car(args)))],
  ["cdr", makePrimitive(args => cdr(car(args)))],
  ["null?", makePrimitive(args => makeBool(isNil(car(args))))], 
  ["+", makePrimitive(args => makeNumber(add(car(args), car(cdr(args)))))]
], nil)
const e1 = makeList(nil, nil, e0)

const evl = (exp, env = e1) => {
  // print("evl/exp: ", exp)
  // printEnv(env)

  if (!isPair(exp)) {
    if (isSelfEval(exp)) return exp
    if (isSymbol(exp)) return lookupEnv(exp, env)
    error(`unknown type atom: ${toString(exp)}`)
  }

  const op = exp_operator(exp)

  if (symbolIs(op, "quote")) return doQuote(exp)
  if (symbolIs(op, "lambda"))
    return makeCompound(lambda_args(exp), lambda_body(exp), env)
  if (symbolIs(op, "if")) return doIf(exp, env)
  if (symbolIs(op, "define"))
    return doDefine(define_name(exp), evl(define_value(exp), env), env)
  if (symbolIs(op, "begin")) return doBegin(exp, env)
  return app(evl(op, env), evlArgs(exp_operands(exp), env))
} 

const value = str => evl(toList(str))

const testExp = (str, val) => testEq(valueOf(value(str)), val)

module.exports = {
  evl, value, testExp
}

testExp("((lambda (b) (define a 1) (+ a b)) 2)", 3)

/*
value("(define lst (cons 1 (cons 2 ())))")
value("(define length (lambda (l) (if (null? l) 0 (+ 1 (length (cdr l))))))")
testExp("(length lst)", 2)

print(value("#t"))
print(value("#f"))

console.log(valueOf(value("#t")))
console.log(valueOf(value("#f")))

print(value("(if #t 1 2)"))
print(value("(if #f 1 2)"))

print(value("(null? ())"))
print(value("(null? 1)"))

print(value("(define lst (cons 1 (cons 2 ())))"))
print(value("(car lst)"))
print(value("(cdr lst)"))
// print(value("(define length (lambda (l) (if (null? l) 0 (+ 1 (length (cdr l))))))"))
// print(value("(length lst)"))

print(value("()"))
print(value("(null? ())"))
print(value("(null? (quote ()))"))

print(value("(null? (quote ()))"))
print(value("(null? 1)"))


print(value("(null? ())"))
print(value("(null? 1)"))

print(value("#t"))
print(value("#f"))

value("(define add (lambda (a b) (+ a b)))")
print(value("(add 1 (add 2 (add 3 4)))"))

print(value("(define a 1)"))
print(value("(define b 2)"))



print(value("(define a 1)"))
print(e0)
print(value("(define b 2)"))
print(e0)

testExp("((lambda (a b) (+ a b)) 1 2)", 3)

testExp("(+ 1 1)", 2)

testExp("(quote aaa)", "aaa")

testExp("1", 1)
testExp('"aaa"', "aaa")
testExp("nil", null)

const two = makeNumber(2)
const aaa = makeString("aaa")

*/