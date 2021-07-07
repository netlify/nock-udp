'use strict'

const { overrides } = require('@netlify/eslint-config-node')

module.exports = {
  extends: '@netlify/eslint-config-node',
  rules: {
    'promise/prefer-await-to-callbacks': 'off',
  },
  overrides: [...overrides],
}
