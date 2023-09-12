// const { testEq, testTruthy, testFalsy } = require("./test")

const id = a => a
const eq = (a, b) => a === b
/*
const eqArrayShallow = (a, b) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
*/

module.exports = {
  id, eq // , eqArrayShallow
}

if (require.main !== module) return

const assert = require("assert/strict") 
assert.equal(id(1), 1)
assert.equal(eq(1, 1), true)
assert.equal(eq(1, 2), false)

/*
testEq(id(1), 1)
testTruthy(eq(1, 1))
testFalsy(eq(1, 2))
testTruthy(eqArrayShallow([1, 2], [1, 2]))
testFalsy(eqArrayShallow([1, 2], [1, 3]))
testFalsy(eqArrayShallow([1, 2], [1]))
 */

