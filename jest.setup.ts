import '@testing-library/jest-dom'

import { createRequire } from 'node:module'
import { MessageChannel, MessagePort } from 'node:worker_threads'
import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web'
import { TextDecoder, TextEncoder } from 'node:util'
import { expect } from '@jest/globals'

;(globalThis as any).MessageChannel = MessageChannel
;(globalThis as any).MessagePort = MessagePort
;(globalThis as any).ReadableStream = ReadableStream
;(globalThis as any).WritableStream = WritableStream
;(globalThis as any).TransformStream = TransformStream
;(globalThis as any).TextEncoder = TextEncoder
;(globalThis as any).TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder

// Web API polyfills for Node-based tests and Next internals.
const require = createRequire(import.meta.url)
const { toHaveNoViolations: axeMatchers } = require('jest-axe').toHaveNoViolations
const { fetch, Request, Response, Headers, FormData, File, Blob } = require('undici')
;(globalThis as any).fetch = fetch
;(globalThis as any).Request = Request
;(globalThis as any).Response = Response
;(globalThis as any).Headers = Headers
;(globalThis as any).FormData = FormData
;(globalThis as any).File = File
;(globalThis as any).Blob = Blob

expect.extend({ toHaveNoViolations: axeMatchers })
