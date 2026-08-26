const EVENTOS_ACTIVIDAD = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export function crearVigilanteInactividad(minutos, onInactivo) {
  const ms = minutos * 60 * 1000;
  let timer = null;

  function reiniciar() {
    clearTimeout(timer);
    timer = setTimeout(onInactivo, ms);
  }

  function iniciar() {
    reiniciar();
    EVENTOS_ACTIVIDAD.forEach((ev) => window.addEventListener(ev, reiniciar));
  }

  function detener() {
    clearTimeout(timer);
    EVENTOS_ACTIVIDAD.forEach((ev) => window.removeEventListener(ev, reiniciar));
  }

  return { iniciar, detener };
}