const { Buffer } = require('buffer')
const { createSocket } = require('dgram')
const { promisify } = require('util')

const test = require('ava')

const { intercept } = require('..')

test.only('Intercepting should stop after the first datagram received', async (t) => {
  const host = encodeURI(t.title)
  const port = '1234'
  const scope = intercept(`${host}:${port}`)
  t.false(scope.used)
  const buffer = Buffer.from('test')
  const send = promisify(createSocket('udp4').send)
  await send(buffer, 0, buffer.length, port, host)
  t.true(scope.used)
  await t.throwsAsync(async () => await send(buffer, 0, buffer.length, port, host))
})
