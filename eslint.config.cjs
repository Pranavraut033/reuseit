/* eslint-env node */
const { defineConfig } = require('eslint/config');
const shared = require('./eslint.shared.js');

module.exports = defineConfig([shared]);
