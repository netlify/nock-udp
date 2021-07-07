const { Buffer } = require('buffer')
const { createSocket } = require('dgram')
const { promisify } = require('util')

const test = require('ava')

const { intercept, cleanAll } = require('..')

test.after(() => {
  cleanAll()
})

test('Intercepting should stop after the first datagram received', async (t) => {
  const buffer = Buffer.from('test')
  const host = encodeURI(t.title)
  const port = '1234'

  const scope = intercept(`${host}:${port}`)
  t.false(scope.used)

  const send = promisify(createSocket('udp4').send)
  await send(buffer, 0, buffer.length, port, host)
  t.true(scope.used)

  await t.throwsAsync(async () => await send(buffer, 0, buffer.length, port, host))
  t.is(scope.buffers.length, 1)
  t.is(scope.buffers[0].toString(), buffer.toString())
})

test('If persisted, interception should keep on going', async (t) => {
  const host = encodeURI(t.title)
  const port = '1234'
  const buffer = Buffer.from('test')

  const scope = intercept(`${host}:${port}`, { persist: true })
  t.false(scope.used)

  const send = promisify(createSocket('udp4').send)
  await send(buffer, 0, buffer.length, port, host)
  await send(buffer, 0, buffer.length, port, host)

  t.true(scope.used)
  t.is(scope.buffers.length, 2)
  t.is(scope.buffers[0].toString(), buffer.toString())
  t.is(scope.buffers[1].toString(), buffer.toString())
})

test('Scope.clean should remove that single interception', async (t) => {
  const host1 = encodeURI(t.title)
  const host2 = `${encodeURI(t.title)}-2`
  const port = '1234'
  const buffer = Buffer.from('test')

  intercept(`${host1}:${port}`)
  const scope2 = intercept(`${host2}:${port}`)

  scope2.clean()

  const send = promisify(createSocket('udp4').send)
  await send(buffer, 0, buffer.length, port, host1)
  await t.throwsAsync(async () => await send(buffer, 0, buffer.length, port, host2))
})
