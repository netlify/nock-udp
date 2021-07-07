const test = require('ava')

test('Requiring this module should not monkey patch Socket.send', (t) => {
  // eslint-disable-next-line node/global-require
  const nockUdp = require('..')
  t.false(nockUdp.isMocked())
})

test('Intercepting an address should monkey patch by default and cleanAll should restore it', (t) => {
  // eslint-disable-next-line node/global-require
  const nockUdp = require('..')
  nockUdp.intercept('localhost:1234')
  t.true(nockUdp.isMocked())
  nockUdp.cleanAll()
  t.false(nockUdp.isMocked())
})
