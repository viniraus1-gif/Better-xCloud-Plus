# Better xCloud VX — technical baseline (Phase 1)

## What exists today

The project is a Bun-built TypeScript userscript. `src/index.ts` installs its
monkey patches before the xCloud application starts, while `build.ts` bundles
the sources, builds patch fragments and writes the distributable userscript to
`dist/`. Source code, not `dist/`, is the VX integration point.

The stream path is:

```text
xCloud WebRTC MediaStream -> xCloud <video> -> StreamPlayerManager
                                      |             |-- native VideoPlayer
                                      |             |-- WebGL2Player canvas
                                      |             `-- WebGPUPlayer canvas
                                      `-> VX Video Engine (Phase 1 observer)
```

`patchVideoApi()` in `src/utils/monkey-patches.ts` recognizes the media
container, waits for `loadedmetadata`, and supplies the real video element to
`StreamPlayerManager`. The existing canvas renderers upload that element using
`texImage2D(video)` (WebGL2) or `importExternalTexture({ source: video })`
(WebGPU). Those are the appropriate future VX processing insertion points.

## Real data and platform constraints

- WebRTC's `getStats()` is the source of stream resolution, received FPS,
  bitrate, packet loss, dropped frames, jitter-buffer delay and decode time
  where Chromium exposes them. These are already collected by
  `StreamStatsCollector`.
- A browser does not reliably expose the GPU model, hardware-decoder status,
  GPU utilization, or final scan-out timing. VX must label unavailable values
  as unavailable, rather than estimating them as facts.
- `requestVideoFrameCallback` provides presentation metadata; it does not give
  a mutable decoded frame. `VideoFrame` being present also does not mean that
  protected/WebRTC video may be read back cheaply.
- Drawing a video element into WebGL/WebGPU can be browser- and policy-
  dependent. A later processor must catch import/upload or context-loss errors,
  tear down only its own canvas, and reveal the native video immediately.
- `VIDEO_MAX_FPS` limits local canvas drawing only. It must never be reported
  as an xCloud server frame-rate control. Frame generation, if added later,
  must separately report stream and interpolated display rates.

## Phase 1 implementation

`src/modules/vx/` provides a deliberately passive core:

- `vx-capabilities.ts` detects WebGPU, WebGL2, `VideoFrame`, and
  `requestVideoFrameCallback`; it estimates display refresh with a bounded rAF
  sample.
- `vx-telemetry.ts` stores at most 180 in-memory timing samples. Decode timing
  comes from video callback metadata only when exposed; canvas timing is CPU
  submission time and is labelled as such.
- `vx-benchmark.ts` runs an explicit, local WebGL2 completed-work benchmark on
  demand. Its result is a measured presentation-budget category, not a GPU
  name or a server capability claim.
- `vx-video-engine.ts` is the future orchestration seam. In Phase 1 it only
  observes the original stream, so it cannot introduce a black-screen failure.
- `vx-labs-settings.ts` exposes the Phase 1 status and benchmark under the
  existing settings dialog.

## Next phases

1. Add a guarded WebGL2 pass graph (identity, scale and colour stages), then
   a WebGPU equivalent. Each stage must have an error boundary and native-video
   fallback.
2. Add lightweight spatial scaling and adaptive sharpening with reusable
   textures; report source and output resolution separately.
3. Add artifact-reduction passes only after a per-pass latency budget exists.
4. Research a frame-generation prototype that never buffers the input path;
   retain explicit `Stream` versus `Interpolated display` reporting.
5. Add auto-quality, game-scoped settings, Controller+/Mouse+, session
   analytics and export/import around the existing game settings storage.

No neural models, DRM bypasses, server-FPS claims, or automatic heavy features
are part of Phase 1.

## Experimental spatial processing

The WebGL2 and WebGPU canvas paths now support a source-preserving, spatial
pipeline: hardware bilinear scaling to Native/Auto/1440p/4K canvas targets,
an edge-aware one-pass deblock/denoise control, and the existing adaptive
sharpening. `1440p upscaled` and `4K upscaled` are output labels only; the
server stream resolution is unchanged.

Frame generation is experimental in the WebGL2 renderer at 2×. It keeps the
previous and current source frames in GPU textures, uses a small local block
search to estimate motion, then warps the earlier frame toward the current
one at the midpoint. It is output-capped to 1080p to protect latency. This is
not server FPS and it is not available in the native-video or WebGPU path.
