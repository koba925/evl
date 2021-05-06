const eq = (a, b) => a === b
const eqArrayShallow = (a, b) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

const noDisp = (actual, expected) => {}
const defaultDisp = (actual, expected) => {
  console.log(`Actual: ${actual}, Expected: ${expected}`)
  console.trace()
}

const test = (actual, expected, comp = eq, disp = defaultDisp) => {
  if (!comp(actual, expected)) {
    disp(actual, expected)
    return false
  }
  return true
}

const testEq = (actual, expected, disp = defaultDisp) => 
  test(actual, expected, eq, disp)

const testTrue = (actual, disp = defaultDisp) => 
  test(actual, true, eq, disp)

const testFalse = (actual, disp = defaultDisp) => 
  test(actual, false, eq, disp)


const testTruthy = (actual, disp = (actual, expected) => {
  console.log(`Actual: ${actual}, Expected: Truthy Value`)
  console.trace()
}) => test(actual, null, (actual, _) => actual, disp)

const testFalsy = (actual, disp = (actual, expected) => {
  console.log(`Actual: ${actual}, Expected: Falsy Value`)
  console.trace()
}) => test(actual, null, (actual, _) => !actual, disp)
  
const testEqArrayShallow = (actual, expected, disp = defaultDisp) => 
  test(actual, expected, eqArrayShallow, disp)

module.exports = {
  defaultDisp, noDisp,
  test, testEq, 
  testTrue, testTruthy, testFalse, testFalsy, testEqArrayShallow
}

if (require.main !== module) return

testEq(testEq(1, 1), true)
testEq(testEq(1, 2, noDisp), false)

testEq(testTrue(true), true)
testEq(testTrue(1, noDisp), false)
testEq(testTrue("a", noDisp), false)
testEq(testTrue(0, noDisp), false)
testEq(testTrue("", noDisp), false)
testEq(testTrue(null, noDisp), false)
testEq(testTrue(undefined, noDisp), false)
testEq(testTrue(false, noDisp), false)

testEq(testFalse(true, noDisp), false)
testEq(testFalse(1, noDisp), false)
testEq(testFalse("a", noDisp), false)
testEq(testFalse(0, noDisp), false)
testEq(testFalse("", noDisp), false)
testEq(testFalse(null, noDisp), false)
testEq(testFalse(undefined, noDisp), false)
testEq(testFalse(false), true)

testEq(testTruthy(true), true)
testEq(testTruthy(1), true)
testEq(testTruthy("a"), true)
testEq(testTruthy(0, noDisp), false)
testEq(testTruthy("", noDisp), false)
testEq(testTruthy(null, noDisp), false)
testEq(testTruthy(undefined, noDisp), false)
testEq(testTruthy(false, noDisp), false)

testEq(testFalsy(true, noDisp), false)
testEq(testFalsy(1, noDisp), false)
testEq(testFalsy("a", noDisp), false)
testEq(testFalsy(0), true)
testEq(testFalsy(""), true)
testEq(testFalsy(null), true)
testEq(testFalsy(undefined), true)
testEq(testFalsy(false), true)

testEq(testEqArrayShallow([1, 2], [1, 2]), true)
testEq(testEqArrayShallow([1, 2], [1, 3], noDisp), false)
testEq(testEqArrayShallow([1, 2], [1], noDisp), false)
