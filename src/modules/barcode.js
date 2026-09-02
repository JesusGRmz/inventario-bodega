import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * Genera un contenedor HTML con código de barras para un equipo
 * @param {Object} equipo - Objeto equipo con id, noSerie, marca, etc.
 * @param {number} index - Índice para ID único
 * @returns {HTMLElement} - Card con código de barras
 */
export async function crearCardCodigos(equipo, index) {
  const card = document.createElement('div');
  card.className = 'card bg-white shadow-md rounded-lg p-4 break-inside-avoid w-72';

  // Código de barras (SVG)
  const barcodeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const barcodeSection = document.createElement('div');
  barcodeSection.className = 'mb-3 flex justify-center';
  barcodeSection.appendChild(barcodeSvg);
  card.appendChild(barcodeSection);

  // Número de serie debajo
  const serieDiv = document.createElement('div');
  serieDiv.className = 'text-center font-mono font-bold text-sm text-gray-800';
  serieDiv.textContent = equipo.noSerie;
  card.appendChild(serieDiv);

  // Generar código de barras (Code 128)
  JsBarcode(barcodeSvg, equipo.noSerie, {
    format: 'CODE128',
    lineColor: '#000',
    width: 2,
    height: 50,
    displayValue: false
  });

  return card;
}

/**
 * Genera un modal con códigos de barras para un conjunto de equipos
 * @param {Array} equipos - Array de equipos
 * @param {string} titulo - Título del modal
 * @returns {HTMLElement} - Modal con códigos
 */
export async function crearModalCodigos(equipos, titulo = 'Generar Códigos de Barras') {
  const modal = document.createElement('div');
  modal.id = 'barcodeModal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';

  const container = document.createElement('div');
  container.className = 'bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-auto w-full';

  // Header
  const header = document.createElement('div');
  header.className = 'sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center print:hidden';
  header.innerHTML = `
    <h2 class="text-xl font-bold">Códigos de Barras</h2>
    <button type="button" id="closeBarcode" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
  `;
  container.appendChild(header);

  // Contenedor de tarjetas - 2 columnas en pantalla, 2 en impresión
  const content = document.createElement('div');
  content.className = 'p-4';
  content.style.display = 'grid';
  content.style.gridTemplateColumns = 'repeat(2, 1fr)';
  content.style.gap = '15px';
  content.style.printColorAdjust = 'exact';

  // Generar cards para cada equipo
  for (let i = 0; i < equipos.length; i++) {
    const card = await crearCardCodigos(equipos[i], i);
    content.appendChild(card);
  }

  container.appendChild(content);

  // Footer con botón de impresión
  const footer = document.createElement('div');
  footer.className = 'sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex gap-2 justify-end print:hidden';
  footer.innerHTML = `
    <button id="printBarcode" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
      🖨️ Imprimir
    </button>
  `;
  container.appendChild(footer);

  modal.appendChild(container);

  // Event listeners
  modal.querySelector('#closeBarcode').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('#printBarcode').addEventListener('click', () => {
    window.print();
  });

  return modal;
}

/**
 * Muestra el modal de códigos de barras
 * @param {Array} equipos - Equipos a mostrar
 */
export async function mostrarModalCodigos(equipos) {
  if (equipos.length === 0) {
    alert('No hay equipos para generar códigos.');
    return;
  }

  const modal = await crearModalCodigos(equipos);
  document.body.appendChild(modal);

  // Cerrar al hacer click fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
