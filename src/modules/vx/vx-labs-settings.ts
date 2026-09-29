import { CE } from '@/utils/html';
import { VxVideoEngine } from './vx-video-engine';
import { VxTelemetry } from './vx-telemetry';
import { STATES } from '@/utils/global';
import { t } from '@/utils/translation';

/** Small, non-invasive Phase 1 panel. Future VX controls belong here. */
export class VxLabsSettings {
    static render(): HTMLElement {
        const $status = CE('pre', { class: 'bx-vx-status' });
        const refresh = () => {
            const capabilities = VxVideoEngine.getInstance().getCapabilities();
            const rendererMs = VxTelemetry.getInstance().getAverageRendererMs();
            const latencyProtection = STATES.currentStream.streamPlayerManager?.getCanvasPlayer()?.getLatencyProtectionStatus();
            $status.textContent = [
                `${t('vx-diagnostics-backend')}: ${capabilities.webgpu ? 'WebGPU' : capabilities.webgl2 ? 'WebGL2' : t('vx-diagnostics-unavailable')}`,
                `${t('vx-diagnostics-vfc')}: ${capabilities.videoFrameCallback ? t('enabled') : t('disabled')}`,
                `${t('vx-diagnostics-video-frame')}: ${capabilities.videoFrame ? t('enabled') : t('disabled')}`,
                `${t('vx-diagnostics-refresh-rate')}: ${capabilities.displayRefreshRate ? capabilities.displayRefreshRate + ' Hz' : t('vx-diagnostics-measuring')}`,
                `${t('vx-diagnostics-renderer-time')}: ${typeof rendererMs === 'number' ? rendererMs.toFixed(2) + ' ms (CPU)' : t('vx-diagnostics-unavailable')}`,
                `${t('vx-diagnostics-latency-protection')}: ${latencyProtection ? `${latencyProtection.label} (${latencyProtection.rendererMs?.toFixed(2) ?? '—'} / ${latencyProtection.budgetMs} ms)` : t('vx-diagnostics-unavailable')}`,
            ].join('\n');
        };

        const $refresh = CE('button', {
            class: 'bx-button',
            type: 'button',
            _on: { click: refresh },
        }, t('vx-diagnostics-refresh'));

        refresh();
        return CE('div', { class: 'bx-vx-labs' },
            CE('p', false, t('vx-diagnostics-description')),
            $status,
            CE('div', { class: 'bx-vx-actions' }, $refresh),
        );
    }
}
