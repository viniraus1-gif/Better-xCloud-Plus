import { CE } from '@/utils/html';
import { VxVideoEngine } from './vx-video-engine';
import { VxTelemetry } from './vx-telemetry';
import { STATES } from '@/utils/global';

/** Small, non-invasive Phase 1 panel. Future VX controls belong here. */
export class VxLabsSettings {
    static render(): HTMLElement {
        const $status = CE('pre', { class: 'bx-vx-status' });
        const refresh = () => {
            const capabilities = VxVideoEngine.getInstance().getCapabilities();
            const rendererMs = VxTelemetry.getInstance().getAverageRendererMs();
            const latencyProtection = STATES.currentStream.streamPlayerManager?.getCanvasPlayer()?.getLatencyProtectionStatus();
            $status.textContent = [
                `Backend disponível: ${capabilities.webgpu ? 'WebGPU' : capabilities.webgl2 ? 'WebGL2' : 'nenhum'}`,
                `requestVideoFrameCallback: ${capabilities.videoFrameCallback ? 'disponível' : 'indisponível'}`,
                `VideoFrame: ${capabilities.videoFrame ? 'disponível' : 'indisponível'}`,
                `Estimativa de atualização do monitor: ${capabilities.displayRefreshRate ? capabilities.displayRefreshRate + ' Hz' : 'medindo/indisponível'}`,
                `Tempo de submissão do renderizador: ${typeof rendererMs === 'number' ? rendererMs.toFixed(2) + ' ms (CPU)' : 'indisponível até o renderizador canvas ficar ativo'}`,
                `Proteção de latência VX: ${latencyProtection ? `${latencyProtection.label} (${latencyProtection.rendererMs?.toFixed(2) ?? '—'} / ${latencyProtection.budgetMs} ms)` : 'indisponível até o renderizador canvas ficar ativo'}`,
                'Métricas de stream, decode e rede continuam em Estatísticas do Stream quando o WebRTC as expõe.',
            ].join('\n');
        };

        const $refresh = CE('button', {
            class: 'bx-button',
            type: 'button',
            _on: { click: refresh },
        }, 'Atualizar status');

        refresh();
        return CE('div', { class: 'bx-vx-labs' },
            CE('p', false, 'Diagnósticos experimentais. O upscale e a redução de artefatos funcionam somente pelo renderizador WebGL2/WebGPU selecionado. A geração 2× usa fluxo óptico local no WebGL2 e limita a saída VX a 1080p para proteger a latência.'),
            $status,
            CE('div', { class: 'bx-vx-actions' }, $refresh),
        );
    }
}
