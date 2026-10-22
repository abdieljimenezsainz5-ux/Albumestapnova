# 📸 Álbum de cumpleaños — Guía paso a paso (fácil)

Lee un paso, hazlo, y pasa al siguiente. No tengas prisa. Puedes hacerlo todo desde el celular o la compu.

**Qué vas a tener al final:** una página web. Tus invitados escanean un QR, suben una foto con una dedicatoria y aparece al instante en el álbum, como una foto Polaroid.

**Cuánto cuesta:** $0. Todo se hace en planes gratis.

**Piensa en tres "casitas":**
- 🗄️ **Supabase** = la bodega. Guarda las fotos y los mensajes.
- 📦 **GitHub** = la caja donde guardas los archivos de tu página.
- 🌐 **Netlify** = el cartel en la calle. Muestra tu página a todo el mundo.

Solo haces los pasos 1 a 6 **una vez**. Después, cada cumpleaños nuevo es solo el paso 8.

---

## PASO 1 · Crear tu bodega (Supabase)

1. Entra a **supabase.com** y toca **Start your project**.
2. Crea tu cuenta (puedes usar tu correo o tu cuenta de GitHub).
3. Toca **New project** (proyecto nuevo).
4. Llena:
   - **Name:** `tapnova-albumes` (o el nombre que quieras).
   - **Database password:** toca el botón para generar una contraseña y **guárdala en tus notas**. Casi nunca la usarás, pero no la pierdas.
   - **Region:** elige la más cercana a ti.
   - Plan: **Free** (gratis).
5. Toca **Create new project** y espera 1–2 minutos hasta que termine de cargar.

✅ Listo cuando veas el panel de tu proyecto.

## PASO 2 · Darle las reglas a la bodega (un copiar y pegar)

1. En el menú de la izquierda busca **SQL Editor** (icono `>_` o "SQL").
2. Toca **New query** (consulta nueva).
3. Abre el archivo **`crear-todo.sql`** de esta carpeta, **copia TODO** su contenido y pégalo en el recuadro.
4. Toca el botón verde **Run** (ejecutar).
5. Debe decir **Success** (éxito). Si sale rojo, copia el mensaje y pídeme ayuda.

Esto crea la "tabla" (una hoja de Excel para las fotos) y el "cajón" de fotos, con las reglas: cualquiera puede **ver** y **subir**, pero **nadie puede borrar ni cambiar** las fotos de otros.

✅ Listo cuando diga Success. Si lo ejecutas otra vez no pasa nada malo.

## PASO 3 · Copiar los 2 datos de conexión

1. Menú de la izquierda → **Project Settings** (el engranaje ⚙️).
2. Busca **Data API** → ahí está el **Project URL** (empieza con `https://` y termina en `.supabase.co`). Cópialo.
3. Ahora busca **API Keys**. Copia la **Publishable key** (empieza con `sb_publishable_`).

🚫 **No copies** la que dice **secret** ni **service_role**. Esa abre todo y es solo tuya.
✅ La **publishable** sí es segura para ponerla en la página: está hecha para eso.

> Si en tu pantalla solo ves una clave llamada **anon public** (y no ves "publishable"), también sirve. Cópiala.

## PASO 4 · Pegar los 2 datos en tu página

1. Abre el archivo **`conexion.js`** (con el Bloc de notas o un editor).
2. Reemplaza `PEGA_AQUI_TU_PROJECT_URL` por tu Project URL.
3. Reemplaza `PEGA_AQUI_TU_PUBLISHABLE_KEY` por tu clave publishable.
4. Deja las comillas `' '` en su lugar. Guarda.

Debe quedar parecido a esto (con tus datos, no los de ejemplo):

```js
window.SUPABASE_CONFIG = {
  url: 'https://abcdefghijk.supabase.co',
  key: 'sb_publishable_xxxxxxxxxxxx',
}
```

Este paso se hace **una sola vez**. Sirve para todos tus cumpleaños.

## PASO 5 · Subir los archivos a GitHub (la caja)

1. Entra a **github.com** e inicia sesión (o crea tu cuenta).
2. Toca **+** → **New repository**.
3. Nombre: `albumes`. Elige **Public** (público). Toca **Create repository**.
4. Toca **uploading an existing file** (subir archivos existentes).
5. Arrastra (o elige) **todos los archivos de esta carpeta**, menos la carpeta `pruebas` (esa es solo para pruebas y no hace falta): `index.html`, `karely.html`, `plantilla.html`, `album.js`, `conexion.js`, `estilo.css`, `netlify.toml`. El archivo `crear-todo.sql` puedes subirlo también; no tiene secretos.
6. Abajo toca **Commit changes**.

✅ Listo cuando veas los archivos dentro de tu repositorio.

## PASO 6 · Publicar con Netlify (el cartel)

1. Entra a **netlify.com** → **Sign up** con tu cuenta de GitHub.
2. Toca **Add new project** → **Import an existing project** → **GitHub**.
3. Elige tu repositorio `albumes`.
4. Deja todo **vacío** (no hay "build command"). En **Publish directory** pon un punto: `.` (o déjalo como esté si Netlify ya lo toma de `netlify.toml`).
5. Toca **Deploy**. Espera a que diga **Published**.
6. Netlify te da un enlace parecido a `algo-bonito.netlify.app`.

Tu álbum de Karely está en: **`https://algo-bonito.netlify.app/karely.html`** (¡con `.html` al final!).

## PASO 7 · Probar con dos teléfonos (importante)

1. Abre el enlace en el **teléfono 1** y en el **teléfono 2**.
2. En el teléfono 1: elige una foto, escribe un nombre y una dedicatoria, y toca enviar.
3. Debe salir "ya está en el álbum".
4. **Mira el teléfono 2 sin recargar**: la foto debe aparecer sola (puede tardar unos segundos).
5. Cierra y abre la página otra vez: la foto debe seguir ahí.

Si todo eso pasó, ¡funciona de verdad! 🎉

**¿No funciona? Mira aquí:**
| Lo que ves | Qué hacer |
|---|---|
| "Falta conectar la base de datos" | No pegaste bien el paso 4, o no se subió el `conexion.js` nuevo a GitHub. |
| "¡Alto! Esa clave es secreta" | Pegaste la clave equivocada. Usa la **publishable**. Y cambia la secreta en Supabase (Settings → API Keys) porque ya la expusiste. |
| Sale un error al subir la foto | Revisa que el paso 2 diga Success. |
| Cambiaste algo y no se nota | Netlify tarda 1 minuto en publicar. Recarga. |

## PASO 8 · Hacer el álbum de OTRO cumpleaños (lo más fácil)

1. En GitHub, abre **`plantilla.html`** y toca **copiar/duplicar**, o súbela de nuevo con otro nombre. Ejemplo: **`camila-30.html`** (sin espacios, sin acentos, sin mayúsculas).
2. Dentro del archivo cambia **solo lo que está entre comillas**:
   - `data-evento` → un nombre **único** (ej. `camila-30`). Si repites uno, las fotos de dos fiestas se mezclan.
   - `data-nombre`, `data-edad`, `data-fecha`, `data-lugar`, `data-mensaje`.
   - Colores: `data-color-...` (códigos tipo `#c8431c`). Cámbialos para que combinen con la fiesta.
   - `data-stickers="no"` si no quieres las calcomanías.
3. Guarda (**Commit**). En 1 minuto está en `https://tu-sitio.netlify.app/camila-30.html`.
4. Con ese enlace haz el **QR** o el **sticker NFC**.

No tienes que tocar Supabase ni nada más.

## Moderar: esconder o borrar una foto

Entra a Supabase → **Table Editor** → tabla **`album_fotos`**.
- **Esconder:** quita la palomita de la columna **`visible`** (`false`) y guarda. Desaparece del álbum en unos 30 segundos.
- **Borrar:** selecciona la fila y bórrala. Para borrar también el archivo: **Storage → album →** carpeta del evento → el archivo.
- **Revisar antes de publicar:** en **SQL Editor** ejecuta `alter table public.album_fotos alter column visible set default false;` y las fotos nuevas quedarán escondidas hasta que marques `visible`. Para volver: `... set default true;`.

---

## Lo que debes saber (sin letra chiquita)

- **Esconder no es lo mismo que "privado".** Alguien que ya guardó el enlace directo de una foto aún podría verla. Para quitarla de verdad, borra también el archivo en Storage.
- **Cualquiera con el enlace puede subir fotos.** Hay límites: solo JPEG, máx. 3 MB y 150 fotos por cumpleaños. No hay límite por persona. Si alguien abusa, borra o esconde su foto.
- **Plan gratis:** 1 GB de fotos. Supabase **pausa** los proyectos gratis sin uso por una semana; para la fiesta, entra a tu proyecto unos días antes y revisa que esté activo (si está pausado, hay un botón "Restore").
- **Privacidad:** son fotos de tus invitados. Avísales que se publicarán en el álbum y borra el evento cuando ya no se necesite.
- **Sin contraseñas:** esta versión no tiene panel de administrador: moderas desde Supabase, donde solo entras tú.
- **Enlaces con `.html`:** así funcionan sin configuración extra.

## Qué se probó y qué NO

✅ Probado aquí: las reglas de seguridad en una base de datos Postgres real (38 pruebas) y la página completa en navegador (47 pruebas: subir, ver en dos "teléfonos" a la vez, un álbum por cumpleaños, esconder/borrar, límites, avisos de error), usando una **imitación** de Supabase.

⚠️ **No probado aquí:** tu Supabase y tu Netlify reales (no tengo acceso desde mi entorno). Por eso existe el **Paso 7**: hazlo antes de la fiesta.
