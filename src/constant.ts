import path = require('path')

// We don't want to support complete for file with 3w+ lines
export const MAX_CODE_LINES = 3*10**4

export const ROOT = path.resolve(__dirname, '..')
