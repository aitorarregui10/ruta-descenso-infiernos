# 🔥 Ruta de Descenso a los Infiernos

Gymkhana web para el cumpleaños de Maribel (3 de octubre). El grupo desciende
del Cielo a los Infiernos parada por parada; cada persona vota cada sitio y deja
comentarios públicos para la cumpleañera. Todo se guarda en la nube (Netlify
Blobs) y se sincroniza entre los móviles del grupo.

---

## 🚀 Cómo publicarlo (GitHub + Netlify)

Ya tienes GitHub enlazado con Netlify, así que es rápido. Netlify Blobs se
activa **solo**, sin configurar nada.

### 1. Subir a GitHub
- Crea un repositorio nuevo en GitHub (por ejemplo `ruta-infiernos`), vacío.
- Sube **todo el contenido de esta carpeta** a ese repo. Puede ser:
  - Arrastrando los archivos en la web de GitHub (**Add file → Upload files**), o
  - Por terminal:
    ```bash
    cd ruta-descenso-infiernos
    git init
    git add .
    git commit -m "Ruta de descenso a los infiernos"
    git branch -M main
    git remote add origin https://github.com/TU_USUARIO/ruta-infiernos.git
    git push -u origin main
    ```

### 2. Conectar en Netlify
- En Netlify: **Add new site → Import an existing project → GitHub**.
- Elige el repositorio que acabas de subir.
- Netlify leerá el archivo `netlify.toml` y rellenará todo solo:
  - **Publish directory:** `public`
  - **Functions directory:** `netlify/functions`
  - **Build command:** *(vacío, no hace falta)*
- Pulsa **Deploy**. En un minuto tendrás la URL (algo como
  `https://algo-random.netlify.app`).

### 3. Comprobar que guarda datos
- Abre la web, regístrate con un nombre, recarga la página: si tu nombre sigue
  ahí, **Blobs funciona**. (Netlify instala `@netlify/blobs` automáticamente
  al detectar la función; no tienes que hacer nada.)

Comparte esa URL con el grupo por WhatsApp. Cada persona abre el enlace en su
móvil y se registra.

---

## 🎮 Cómo funciona el juego

1. **Registro:** cada persona elige un emoji, pone su nombre y responde si es la
   cumpleañera. **Solo Maribel** dice que sí (si alguien más lo marca, el sistema
   lo ignora: solo puede haber una cumpleañera).
2. **Sala de espera:** cuando el grupo está reunido, alguien pulsa
   **«¡Estamos listos!»** y cada persona presente confirma. Cuando todos
   confirman, aparece la foto del tren y arranca la ruta.
3. **Las 8 paradas:** cada pantalla trae la historia, la descripción real del
   sitio, el enlace de Google Maps, la votación con emoji (😇→😈) y un comentario
   opcional para la cumpleañera.
4. **Regla del grupo:** nadie puede adelantar al resto. Para desbloquear la
   siguiente parada, **todos** deben haber cerrado la actual.
5. **Válvula de escape:** si alguien tiene que irse, pulsa **«Abandonar la
   ruta»** y deja de frenar al grupo. Puede volver a unirse más tarde (entra por
   donde vaya el grupo, sin adelantarse).
6. **Rezagados:** quien llegue tarde puede registrarse y se une por la parada en
   la que va el grupo.
7. **La transformación:** en la entrada del **Bar Maná** (parada 5), Maribel deja
   de ser «la cumpleañera» y se convierte en el **Demonio Pelirrojo**. A partir
   de ahí se la nombra así.
8. **Final:** cuando todos llegan al fondo, se revela «El libro del descenso» con
   todos los comentarios que el grupo le dejó a Maribel durante la noche.

---

## 🗺️ Las paradas

| # | Nivel | Sitio |
|---|-------|-------|
| 1 | ☁️ El Cielo | Azotea del Círculo de Bellas Artes |
| 2 | 🥂 Purgatorio dorado | Isa · Four Seasons |
| 3 | 🌍 La Tierra | La Venencia |
| 4 | 🍽️ El Festín | Tío Papelón |
| 5 | 🕳️ Primer descenso | Bar Maná *(transformación)* |
| 6 | 🔥 Primer círculo | La Reina Lagarta |
| 7 | 🔥 El pozo | El Perro de la Parte de Atrás del Coche |
| 8 | 😈 Infierno final | Skin Club · o · Sala El Sol |

---

## 🔧 Ajustes rápidos

- **Textos y paradas:** todo está en `public/paradas.js` (historia, descripción,
  horas y enlaces de Maps). Edita ahí lo que quieras.
- **Reiniciar la partida** (borrar todos los jugadores y comentarios, p. ej. para
  hacer una prueba y empezar limpio el día del cumple): desde el móvil, en la
  consola del navegador, o con este comando cambiando la URL por la tuya:
  ```bash
  curl -X POST "https://TU-SITIO.netlify.app/api?action=reset" \
       -H "content-type: application/json" -d '{"clave":"maribel32"}'
  ```
- **Fotos:** están en `public/images/`. Si quieres cambiar alguna, sustituye el
  archivo manteniendo el mismo nombre.

---

## 📁 Estructura

```
├── netlify.toml            # config de Netlify (publish + functions)
├── package.json            # dependencia @netlify/blobs
├── netlify/functions/
│   └── api.js              # backend: estado compartido en Blobs
└── public/
    ├── index.html
    ├── estilos.css
    ├── app.js              # lógica del juego
    ├── paradas.js          # contenido de las 8 paradas
    └── images/             # portada, tarta, tren, pincho, templo, demonio
```
