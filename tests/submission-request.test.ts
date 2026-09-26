import { test } from 'node:test'
import assert from 'node:assert/strict'
import { requestSubmission } from '../src/utils/submissionRequest.ts'
const limited = () =>
  Response.json({ errorCode: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': '60' } })
test('waits Retry-After then retries the same request', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  let calls = 0,
    ready!: () => void
  const waiting = new Promise<void>((r) => {
    ready = r
  })
  t.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => {
    assert.equal(options.body, 'original-body')
    calls++
    return calls === 1 ? limited() : Response.json({ code: 200, data: { id: 'saved' } })
  })
  const promise = requestSubmission(
    'https://example.test',
    { method: 'POST', body: 'original-body' },
    new AbortController().signal,
    (v) => {
      if (v) ready()
    },
  )
  await waiting
  t.mock.timers.tick(59999)
  assert.equal(calls, 1)
  t.mock.timers.tick(1)
  assert.deepEqual(await promise, { id: 'saved' })
  assert.equal(calls, 2)
})
test('cancels pending retry when the dialog is closed', async (t) => {
  const controller = new AbortController()
  let ready!: () => void
  const waiting = new Promise<void>((r) => {
    ready = r
  })
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => limited())
  const promise = requestSubmission('https://example.test', {}, controller.signal, (v) => {
    if (v) ready()
  })
  const rejected = assert.rejects(promise, { name: 'AbortError' })
  await waiting
  controller.abort()
  await rejected
  assert.equal(fetchMock.mock.callCount(), 1)
})
test('does not retry cumulative quota errors or start background polling for status reads', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ errorCode: 'QUOTA_EXCEEDED' }, { status: 429 }),
  )
  await assert.rejects(
    requestSubmission('https://example.test', {}, new AbortController().signal),
    /QUOTA_EXCEEDED/,
  )
  assert.equal(fetchMock.mock.callCount(), 1)
  fetchMock.mock.mockImplementation(async () => limited())
  await assert.rejects(requestSubmission('https://example.test', {}), /RATE_LIMITED/)
  assert.equal(fetchMock.mock.callCount(), 2)
})
