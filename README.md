# Registro de Equipos

App de inventario (No. de serie, marca/modelo, RAM, comentario) con JS vanilla,
Tailwind CSS + DaisyUI, y sincronización opcional con Firestore. Guarda siempre
en `localStorage` como respaldo/modo offline, y exporta a JSON y Excel.

## Estructura

```
registro-equipos/
├── index.html              # único HTML, con el markup y las clases de Tailwind
├── vite.config.js          # config del bundler/dev server
├── tailwind.config.js      # paleta de colores, fuentes, plugin daisyUI
├── postcss.config.js       # conecta Tailwind con el build de CSS
├── .env.example            # plantilla de credenciales de Firebase (copiar a .env)
├── src/
│   ├── main.js              # entry point: conecta store + firebase + UI
│   ├── style.css            # @tailwind base/components/utilities + estilos propios
│   ├── firebase/
│   │   └── config.js        # inicializa Firebase, lee/guarda config (localStorage o .env)
│   ├── modules/
│   │   ├── actividades.js   # store y respaldo local de la bitácora
│   │   ├── actividades-firestore.js # sincronización de actividades
│   │   ├── storage.js       # persistencia en localStorage
│   │   ├── firestore.js     # CRUD + listener en tiempo real de Firestore
│   │   ├── equipos.js       # store/estado: agregar, editar, eliminar, buscar
│   │   ├── ui.js            # todo el DOM: render de tabla, formulario, modal, eventos
│   │   └── export.js        # exportar a JSON y Excel (xlsx)
│   └── utils/
│       └── helpers.js       # uid(), fmtFecha(), escapeHtml()
```

**Por qué así:** cada módulo tiene una sola responsabilidad. `equipos.js` no sabe
nada de DOM, `ui.js` no sabe nada de Firestore, y `main.js` es el único lugar que
conecta todo. Si mañana cambias de Firestore a otra base, solo tocas
`firestore.js` y `equipos.js` — la UI no se entera.

## Instalación (VSCode)

1. Abre la carpeta `registro-equipos` en VSCode.
2. Abre una terminal integrada (` Ctrl+ñ ` o `Terminal → New Terminal`) y corre:

   ```bash
   npm install
   ```

3. (Opcional) Si quieres que el proyecto se conecte solo a Firestore sin usar
   el modal de configuración cada vez:

   ```bash
   cp .env.example .env
   ```

   y llena las 6 variables con los datos de tu proyecto de Firebase
   (Firebase Console → ⚙️ Configuración del proyecto → tus apps → SDK config).
   Si no lo haces, la app sigue funcionando 100% con localStorage, y puedes
   pegar la config manualmente desde el botón ⚙️ dentro de la app (queda
   guardada en el localStorage del navegador).

4. Levanta el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre automáticamente `http://localhost:5173`. Los cambios en cualquier
   archivo de `src/` o `index.html` recargan solos (hot reload de Vite).

## Extensiones recomendadas de VSCode

- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) — autocompletado
  y preview de clases de Tailwind/DaisyUI directo en `index.html`.
- **ESLint** (opcional, si luego quieres linting).

No necesitas nada más instalado globalmente: Node ya trae npm, y Vite se
encarga del bundling, del servidor de desarrollo y del build de producción.

## Reglas de seguridad de Firestore

En Firebase Console → Firestore → Reglas, publica reglas como estas. Los
equipos siguen siendo compartidos entre usuarios autenticados; las actividades
solo se pueden leer y modificar dentro de la ruta del UID de la sesión:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /equipos/{doc} {
      allow read, write: if request.auth != null;
    }
    match /usuarios/{uid}/actividades/{actividadId} {
      allow read, create, update, delete:
        if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Las cuentas se crean/administran en Firebase Authentication (la aplicación
actual permite iniciar sesión, pero no incluye registro de cuentas). Las
actividades nuevas se guardan en `usuarios/{uid}/actividades/{actividadId}`.
El respaldo local también se separa por UID. Los datos antiguos de la colección
compartida `actividades` y de la clave local anterior no se asignan
automáticamente a una cuenta, porque no es posible saber a quién pertenecen.

## Funcionalidades

- **Alta**: No. de serie, Marca/Modelo (HP, Lenovo, Dell, ThinkSmart u "Otra"
  con texto libre), RAM (4/8/16/32/64 GB u "Otra"), Comentario.
- **Edición**: botón "Editar" en cada fila precarga el formulario; el botón
  cambia a "Guardar cambios" y aparece "Cancelar edición".
- **Eliminar**: con confirmación.
- **Búsqueda**: filtra en vivo por serie, marca, RAM o comentario.
- **Exportar**: JSON y Excel (`.xlsx`) con un clic, con todos los registros
  actuales (respeta lo que haya en la tabla, no el filtro de búsqueda).
- **Firestore opcional**: si lo conectas, todo se sincroniza en tiempo real
  (varias personas viendo la misma tabla a la vez); si no, funciona 100%
  local y sigue exportando evidencias igual.
- **Actividades**: registra la persona destinataria, la actividad, un comentario
  opcional y el estado de seguimiento (Pendiente, Atendido, etiquetado o Atendido
  sin etiquetar). El estado puede actualizarse desde el listado. La fecha/hora se
  asigna al guardar. Con sesión de Firebase, cada usuario accede solo a sus
  actividades; sin Firebase, la aplicación conserva el modo local compartido
  para uso en ese navegador.

## Build para producción

```bash
npm run build
```

Genera `dist/` con los archivos estáticos listos para subir a Netlify,
Vercel, Firebase Hosting, etc. `npm run preview` sirve ese build localmente
para revisarlo antes de publicar.
