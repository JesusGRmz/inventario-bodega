import { BrowserMultiFormatReader } from '@zxing/browser';

let controlesActivos = null;

/**
 * Prende la cámara (trasera si el dispositivo la tiene) y llama a onDetectado(texto)
 * cada vez que decodifica un código de barras o QR.
 */
export async function iniciarEscaner(videoElement, onDetectado) {
  const reader = new BrowserMultiFormatReader();
  controlesActivos = await reader.decodeFromConstraints(
    { video: { facingMode: 'environment' } },
    videoElement,
    (resultado) => {
      if (resultado) onDetectado(resultado.getText());
    }
  );
}

/** Apaga la cámara. Siempre llamar al cerrar el modal de escaneo. */
export function detenerEscaner() {
  if (controlesActivos) {
    controlesActivos.stop();
    controlesActivos = null;
  }
}
