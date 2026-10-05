// Only bundled by the diagnostic page; no application imports this shim.
import '../../src/workers/submissionWebp.worker'
const mode = new URL(self.location.href).searchParams.get('mode')
if (mode === 'stall') {
  self.onmessage = () => {}
} else if (mode === 'dom') {
  self.createImageBitmap = () => Promise.reject(new Error('Simulated decode failure'))
} else {
  const original = OffscreenCanvas.prototype.convertToBlob
  OffscreenCanvas.prototype.convertToBlob = function (options) {
    return original.call(this, { ...options, type: 'image/png' })
  }
}
