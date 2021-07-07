'use strict'

const { Socket } = require('dgram')

const originalSocketSend = Socket.prototype.send

let intercepts = {}

const createScope = function (address, { persist = false } = {}) {
  return {
    used: false,
    persist,
    buffers: [],
    offset: 0,
    length: 0,
    address,
    clean: () => {
      delete intercepts[address]
    },
  }
}

const validateBufferLength = function (buffer, offset, length) {
  if (offset >= buffer.length) throw new Error('Offset into buffer too large')

  if (offset + length > buffer.length) throw new Error('Offset + length beyond buffer length')
}

// eslint-disable-next-line max-params
const mockSocketSend = function (buffer, offset, length, port, host, callback) {
  validateBufferLength(buffer, offset, length)

  const newBuffer = buffer.slice(offset, offset + length)

  const address = `${host}:${port}`
  if (!intercepts[address]) throw new Error(`Request sent to unmocked path: ${address}`)

  const scope = intercepts[address]
  scope.used = true
  scope.buffers.push(newBuffer)
  scope.offset = offset
  scope.length = length

  if (!scope.persist) delete intercepts[address]

  if (callback) return callback(null, length)
}

mockSocketSend.mocked = true

const isMocked = function () {
  return Boolean(Socket.prototype.send.mocked)
}

const intercept = function (address, { persist = false, startIntercept = true } = {}) {
  const scope = createScope(address, { persist })
  intercepts[address] = scope
  if (!isMocked() && startIntercept) interceptSocketSend()
  return scope
}

const cleanAll = function ({ stopIntercept = true } = {}) {
  intercepts = {}
  if (isMocked() && stopIntercept) restoreSocketSend()
}

const restoreSocketSend = function () {
  Socket.prototype.send = originalSocketSend
}

const interceptSocketSend = function () {
  Socket.prototype.send = mockSocketSend
}

module.exports = {
  intercept,
  cleanAll,
  restoreSocketSend,
  interceptSocketSend,
  isMocked,
}
