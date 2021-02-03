const test = require('ava')
const luckydog = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => luckydog(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(luckydog('w'), 'w@zce.me')
  t.is(luckydog('w', { host: 'wedn.net' }), 'w@wedn.net')
})
