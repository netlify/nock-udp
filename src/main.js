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

const validateIncomingMsg = function (buffer, offset, length, address) {
  if (offset >= buffer.length) throw new Error('Offset into buffer too large')

  if (offset + length > buffer.length) throw new Error('Offset + length beyond buffer length')

  if (!intercepts[address]) throw new Error(`Request sent to unmocked path: ${address}`)
}

const getMockSocketSend = function ({ allowUnknown = false } = {}) {
  // eslint-disable-next-line max-params
  const mockSocketSend = function (buffer, offset, length, port, host, callback) {
    const address = `${host}:${port}`
    if (allowUnknown && !intercepts[address]) {
      // We allow extraneous connections, fallback to original use
      // eslint-disable-next-line no-invalid-this
      originalSocketSend.call(this, buffer, offset, length, port, host, callback)
      return
    }

    validateIncomingMsg(buffer, offset, length, address)

    const newBuffer = buffer.slice(offset, offset + length)

    const scope = intercepts[address]
    scope.used = true
    scope.buffers.push(newBuffer)
    scope.offset = offset
    scope.length = length

    if (!scope.persist) delete intercepts[address]

    if (callback) return callback(null, length)
  }

  mockSocketSend.mocked = true

  return mockSocketSend
}

const isMocked = function () {
  return Boolean(Socket.prototype.send.mocked)
}

const intercept = function (address, { persist = false, startIntercept = true, allowUnknown = false } = {}) {
  const scope = createScope(address, { persist })
  intercepts[address] = scope
  if (!isMocked() && startIntercept) interceptSocketSend({ allowUnknown })
  return scope
}

const cleanAll = function ({ stopIntercept = true } = {}) {
  intercepts = {}
  if (isMocked() && stopIntercept) restoreSocketSend()
}

const restoreSocketSend = function () {
  Socket.prototype.send = originalSocketSend
}

const interceptSocketSend = function ({ allowUnknown } = {}) {
  Socket.prototype.send = getMockSocketSend({ allowUnknown })
}

module.exports = {
  intercept,
  cleanAll,
  restoreSocketSend,
  interceptSocketSend,
  isMocked,
}
