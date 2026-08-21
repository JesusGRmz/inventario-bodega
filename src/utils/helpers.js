export function uid() {
  return 'eq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export function fmtFecha(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return (
    d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  );
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
