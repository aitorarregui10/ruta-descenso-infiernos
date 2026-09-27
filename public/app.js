/* =========================================================================
   Ruta Descenso a los Infiernos — cliente
   ========================================================================= */
"use strict";

const API = "/.netlify/functions/api";
const EMOJIS = ["😈","👹","🔥","🦇","💀","🍷","👻","🕷️","🌙","⭐","😇","👼","🎭","🃏","🐍","🖤","💋","🥂","⚡","🦂","🌹","🗝️","🕯️","🐈‍⬛"];
const VOTOS = ["😇","🙂","😐","😏","😈"]; // del cielo al infierno
const CUMPLE_NOMBRE = "Maribel";

// --- Identidad local persistente ---
const store = {
  get id() { let v = localStorage.getItem("descenso_id"); if (!v) { v = "u_" + Math.random().toString(36).slice(2, 11); localStorage.setItem("descenso_id", v); } return v; },
  get yo() { try { return JSON.parse(localStorage.getItem("descenso_yo") || "null"); } catch { return null; } },
  set yo(v) { localStorage.setItem("descenso_yo", JSON.stringify(v)); },
};

let estado = null;      // último estado del servidor
let pollTimer = null;
let seleccion = { emoji: null, cumple: null };
let votoParada = {};    // parada -> emoji elegido (local, antes de enviar)
let forzarFinal = false; // válvula: ver el final aunque el grupo no haya acabado
let ultimaFaseVista = null;
let transicionMostrada = {}; // control de animaciones ya vistas

const $ = (sel, el = document) => el.querySelector(sel);
const app = () => document.getElementById("app");

// ---- Llamadas API ----
async function api(action, body) {
  const opt = body
    ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }
    : { method: "GET" };
  const r = await fetch(`${API}?action=${action}`, opt);
  return r.json();
}

let ultimaFirma = null; // firma del estado visible; evita re-render innecesario

// Firma de lo que se ve en pantalla. Si no cambia, no hace falta re-render.
function firmaEstado() {
  if (!estado) return "";
  const j = yoJugador();
  const jugSig = estado.jugadores
    .map((x) => x.id + ":" + x.parada + ":" + (x.listo ? 1 : 0) + ":" + (x.activo ? 1 : 0) + ":" + (x.cumple ? 1 : 0))
    .join("|");
  return [
    estado.fase,
    j ? j.parada : "-",
    jugSig,
    (estado.comentarios || []).length, // los comentarios se pintan aparte, pero cuentan para saber si algo cambió
  ].join("#");
}

// ¿El usuario está escribiendo ahora mismo en un campo?
function escribiendo() {
  const a = document.activeElement;
  return a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA");
}

async function refrescar() {
  try {
    const r = await api("state");
    if (!r.ok) return;
    estado = r.estado;
    const firma = firmaEstado();

    // Primera vez o cambio estructural -> re-render completo,
    // pero NUNCA mientras el usuario escribe (perdería texto y foco).
    if (firma !== ultimaFirma) {
      if (escribiendo()) {
        // Algo cambió pero estás escribiendo: solo refresca el chat, no toques el resto.
        pintarMensajes();
        return;
      }
      ultimaFirma = firma;
      render();
    } else {
      // Nada estructural cambió: solo actualiza el chat (mensajes nuevos) sin re-render.
      pintarMensajes();
    }
  } catch (e) { /* silencioso: reintenta en el siguiente poll */ }
}

// Fuerza un re-render en la próxima llamada (tras una acción propia)
function invalidarFirma() { ultimaFirma = null; }

function iniciarPoll() {
  if (pollTimer) return;
  pollTimer = setInterval(refrescar, 3500);
}

// ---- Utilidades de estado ----
const yoJugador = () => estado && estado.jugadores.find((j) => j.id === store.id);
const miParada = () => { const j = yoJugador(); return j ? j.parada : 1; };
const soyCumple = () => { const j = yoJugador(); return j ? j.cumple : false; };

// profundidad para el fondo (0..8 / cielo / final)
function aplicarAmbiente() {
  const b = document.body;
  if (!estado || estado.fase === "registro" || estado.fase === "listos") {
    b.dataset.prof = "cielo"; b.dataset.fuego = "0"; sincronizarBrasas(); return;
  }
  if (estado.fase === "final") { b.dataset.prof = "final"; b.dataset.fuego = "1"; sincronizarBrasas(); return; }
  const p = Math.min(miParada(), 8);
  b.dataset.prof = String(p - 1 <= 0 ? 0 : p - 1); // parada1 -> prof0 (cielo)
  b.dataset.fuego = p >= 5 ? "1" : "0";
  sincronizarBrasas();
}

// Muestra las brasas subiendo solo cuando hay fuego (paradas infernales / final)
let brasasCreadas = false;
function sincronizarBrasas() {
  const cont = document.getElementById("brasas");
  if (!cont) return;
  const hayFuego = document.body.dataset.fuego === "1" && !prefiereMenosMovimiento();
  if (hayFuego && !brasasCreadas) {
    // crea 14 ascuas con posiciones/tiempos variados
    let html = "";
    for (let i = 0; i < 14; i++) {
      const izq = Math.round(Math.random() * 100);
      const dur = (5 + Math.random() * 5).toFixed(1);
      const del = (Math.random() * 6).toFixed(1);
      const tam = (3 + Math.random() * 5).toFixed(0);
      html += `<span class="brasa" style="left:${izq}%;width:${tam}px;height:${tam}px;animation-duration:${dur}s;animation-delay:${del}s"></span>`;
    }
    cont.innerHTML = html;
    brasasCreadas = true;
  }
  cont.style.opacity = hayFuego ? "1" : "0";
}

// Cómo nos referimos a Maribel según el punto de la ruta del que hablamos
function nombreMaribel(personaTipo) {
  return personaTipo === "demonio" ? "Demonio Pelirrojo" : CUMPLE_NOMBRE;
}

// Respeta la preferencia del sistema de reducir animaciones
function prefiereMenosMovimiento() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ============================ RENDER PRINCIPAL ============================
function render() {
  aplicarAmbiente();
  const prog = document.getElementById("progress");

  if (!estado) return;
  ultimaFirma = firmaEstado(); // sincroniza la firma con lo que vamos a pintar

  if (estado.fase === "registro" || estado.fase === "listos") {
    prog.hidden = true;
    if (!yoJugador()) return renderRegistro();
    return renderSala();
  }

  if (estado.fase === "jugando") {
    // ¿estoy inscrito?
    if (!yoJugador()) return renderRegistro(true);
    prog.hidden = false;
    actualizarProgreso();
    // Válvula: si pedí ver el final y ya cerré mi descenso, muéstralo
    if (forzarFinal && miParada() > (estado.total || 8)) return renderFinal();
    return renderJuego();
  }

  if (estado.fase === "final") {
    prog.hidden = false;
    actualizarProgreso();
    return renderFinal();
  }
}

function actualizarProgreso() {
  const p = Math.min(miParada(), 8);
  const total = estado.total || 8;
  $("#progFill").style.width = Math.round(((p - 1) / total) * 100) + "%";
  $("#progLbl").textContent = estado.fase === "final" ? "Descenso completo" : `Parada ${p}/${total}`;
}

// ============================ 1) REGISTRO ============================
function renderRegistro(tarde = false) {
  seleccion.emoji = seleccion.emoji || null;
  app().innerHTML = `
    <img class="portada-img" src="images/portada.jpg" alt="Ruta de Descenso a los Infiernos, 3 de octubre" />
    <div class="panel" style="margin-top:18px">
      ${tarde ? `<p class="aviso">La aventura ya ha empezado. Puedes unirte: entrarás por donde va el grupo, sin adelantarte a nadie.</p>` : ""}
      <h2 class="display" style="font-size:1.5rem">Preséntate ante las puertas</h2>
      <p class="sub" style="font-size:1rem;margin-top:-4px">Antes de subir al cielo, di quién eres.</p>

      <div class="campo">
        <label>Elige el emoji que te caracteriza</label>
        <div class="emoji-grid" id="emojiGrid">
          ${EMOJIS.map((e) => `<button type="button" data-emoji="${e}">${e}</button>`).join("")}
        </div>
      </div>

      <div class="campo">
        <label>Tu nombre</label>
        <input type="text" id="nombre" maxlength="24" placeholder="¿Cómo te llamamos?" autocomplete="off" />
      </div>

      <div class="campo">
        <label>¿Eres la cumpleañera?</label>
        <div class="choice-row" id="cumpleRow">
          <button type="button" data-c="si">Sí, soy yo 🎂</button>
          <button type="button" data-c="no">No</button>
        </div>
      </div>

      <button class="full" id="btnJoin" disabled>Cruzar las puertas</button>
    </div>
  `;

  const grid = $("#emojiGrid");
  grid.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-emoji]"); if (!b) return;
    grid.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel"); seleccion.emoji = b.dataset.emoji; validarJoin();
  });
  const cumpleRow = $("#cumpleRow");
  cumpleRow.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-c]"); if (!b) return;
    cumpleRow.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel"); seleccion.cumple = b.dataset.c === "si"; validarJoin();
  });
  $("#nombre").addEventListener("input", validarJoin);
  $("#btnJoin").addEventListener("click", hacerJoin);
}

function validarJoin() {
  const nombre = $("#nombre") && $("#nombre").value.trim();
  const ok = seleccion.emoji && nombre && seleccion.cumple !== null;
  const btn = $("#btnJoin"); if (btn) btn.disabled = !ok;
}

async function hacerJoin() {
  const nombre = $("#nombre").value.trim();
  const btn = $("#btnJoin"); btn.disabled = true; btn.textContent = "Entrando…";
  const r = await api("join", { id: store.id, nombre, emoji: seleccion.emoji, cumple: !!seleccion.cumple });
  if (r.ok) {
    estado = r.estado; store.yo = { nombre, emoji: seleccion.emoji };
    iniciarPoll(); render();
  } else {
    btn.disabled = false; btn.textContent = "Cruzar las puertas";
    alert(r.error || "No se pudo entrar");
  }
}

// ============================ 2) SALA DE ESPERA ============================
function renderSala() {
  const jugs = estado.jugadores.filter((j) => j.activo);
  const faseListos = estado.fase === "listos";
  const yo = yoJugador();
  const todosListos = jugs.length > 0 && jugs.every((j) => j.listo);

  app().innerHTML = `
    <img class="portada-img" src="images/portada.jpg" alt="Ruta de Descenso a los Infiernos" />
    <div class="panel" style="margin-top:18px">
      <div class="eyebrow-nivel">☁️ Antes de empezar</div>
      <h2 class="display" style="font-size:1.5rem">${faseListos ? "Confirmad que estáis todos" : "Reuniendo almas"}</h2>
      <p class="sub" style="font-size:1.02rem">
        ${faseListos
          ? "Cada persona presente debe confirmar. Cuando estéis todos, se abrirán las puertas del cielo."
          : "Que se apunte todo el grupo. Cuando estéis reunidos, pulsad «¡Estamos listos!» y cada uno confirma."}
      </p>

      <div class="jug-list">
        ${jugs.map((j) => `
          <span class="jug-chip ${j.cumple ? "cumple" : ""} ${j.listo && faseListos ? "ok" : ""}">
            <span class="em">${j.emoji}</span>${escapeHtml(j.nombre)}${j.cumple ? " 🎂" : ""}
            ${faseListos ? (j.listo ? '<span class="tick">✓</span>' : '<span class="reloj">⏳</span>') : ""}
          </span>`).join("")}
      </div>

      <hr class="sep" />

      ${faseListos
        ? (yo && yo.listo
            ? `<p class="center">Estás listo. Esperando a los demás… <span class="reloj">⏳</span></p>`
            : `<button class="full" id="btnConfirmar">Estoy aquí, confirmo ✋</button>`)
        : `<button class="full" id="btnListos">¡Estamos listos! 🔔</button>
           <p class="hint center">Púlsalo cuando el grupo esté reunido. Luego cada uno confirma.</p>`}
    </div>

    <p class="mini center" style="margin-top:14px">Eres <b>${escapeHtml((yo&&yo.nombre)||"")}</b> ${(yo&&yo.emoji)||""} ${yo&&yo.cumple?"· la cumpleañera 🎂":""}</p>
  `;

  if ($("#btnListos")) $("#btnListos").addEventListener("click", async () => {
    await api("listo", { id: store.id, abrir: true });
    invalidarFirma(); refrescar();
  });
  if ($("#btnConfirmar")) $("#btnConfirmar").addEventListener("click", async (ev) => {
    ev.target.disabled = true;
    await api("listo", { id: store.id });
    invalidarFirma(); refrescar();
  });

  // Cuando arranca, mostrar la foto del tren una vez
  if (todosListos && faseListos && !transicionMostrada.arranque) {
    transicionMostrada.arranque = true;
  }
}

// ============================ 3) JUEGO / PARADAS ============================
function renderJuego() {
  const p = miParada();

  // ¿Acabo de entrar en fase jugando? Enseñar la foto del tren (arranque)
  if (!transicionMostrada.arranque) {
    transicionMostrada.arranque = true;
    return renderArranque();
  }

  if (p > (estado.total || 8)) {
    // He cerrado la última; puede que el grupo aún no. Espera al final.
    return renderEsperaFinal();
  }

  const data = PARADAS[p - 1];
  const yo = yoJugador();
  const yaCerre = yo && yo.cerradas ? false : false; // servidor decide; usamos parada
  // Si mi parada es P significa que estoy EN P (aún no cerrada del todo por el grupo)

  renderParada(data);
}

function renderArranque() {
  app().innerHTML = `
    <div class="panel center">
      <div class="eyebrow-nivel center" style="justify-content:center">🚄 Comienza el viaje</div>
      <img class="parada-img" src="images/tren.jpg" alt="¡Nos vamos!" />
      <h2 class="display" style="font-size:1.6rem">¡Estamos todos! El descenso empieza</h2>
      <p class="relato">Seres terrenales que amanecisteis en el Cielo por error. Hay una sola forma de arreglar el karma y despertar mañana como estabais: bajar hasta el fondo. Que empiece la ruta.</p>
      <button class="full" id="btnEmpezar" style="margin-top:12px">Subir al Cielo ☁️</button>
    </div>
  `;
  $("#btnEmpezar").addEventListener("click", () => animarPuertas(render));
}

// Animación: dos hojas de puerta dorada que se abren con resplandor detrás.
function animarPuertas(despues) {
  if (prefiereMenosMovimiento()) { despues(); return; }
  const cap = document.createElement("div");
  cap.className = "puertas-overlay";
  cap.innerHTML = `
    <div class="puertas-luz"></div>
    <div class="puerta-hoja izq"></div>
    <div class="puerta-hoja der"></div>
    <div class="puertas-texto">Se abren las puertas del Cielo…</div>
  `;
  document.body.appendChild(cap);
  // forzar reflow y lanzar
  requestAnimationFrame(() => cap.classList.add("go"));
  setTimeout(() => { despues(); }, 1500);      // renderiza la parada por debajo
  setTimeout(() => { cap.remove(); }, 2600);   // retira el overlay tras el fundido
}

function renderParada(data) {
  const esInfernal = data.n >= 5;
  const nombrePersona = nombreMaribel(data.persona);

  // Animación de transformación en Bar Maná (parada 5) una sola vez
  if (data.transformacion && !transicionMostrada["trans" + data.n]) {
    transicionMostrada["trans" + data.n] = true;
    return renderTransformacion(data);
  }

  const votoSel = votoParada[data.n] || null;

  app().innerHTML = `
    <div class="panel">
      <div class="eyebrow-nivel">${data.icono} Parada ${data.n} · ${escapeHtml(data.nivel)}</div>
      <h1 class="parada-titulo display">${escapeHtml(data.titulo)}</h1>
      <div class="meta-parada">
        <span>🕒 ${escapeHtml(data.hora)}</span>
        <span>📍 ${escapeHtml(data.zona)}</span>
      </div>
      ${data.imagen ? `<img class="parada-img" src="${data.imagen}" alt="${escapeHtml(data.titulo)}" />` : ""}
      <p class="relato">${escapeHtml(data.relato).replace(/DEMONIO PELIRROJO/g, "<b>Demonio Pelirrojo</b>")}</p>

      <div class="bloque-lugar">
        <h4>El sitio</h4>
        ${escapeHtml(data.lugar)}
      </div>

      <p class="brindis">🥂 ${escapeHtml(data.brindis)}</p>

      <div class="maps-acciones">
        <a class="btn maps-btn ${esInfernal ? "infernal" : ""}" href="${data.maps}" target="_blank" rel="noopener">📍 Abrir en Maps</a>
        ${data.mapsAlt ? `<a class="btn ghost maps-alt" href="${data.mapsAlt}" target="_blank" rel="noopener">Plan B: Sala El Sol</a>` : ""}
      </div>
    </div>

    <div class="panel">
      <h3 style="font-size:1.15rem">¿Qué tal esta parada?</h3>
      <p class="mini">Del cielo al infierno, elige tu emoji.</p>
      <div class="voto-grid" id="votoGrid">
        ${VOTOS.map((v) => `<button type="button" data-v="${v}" class="${votoSel===v?"sel":""}">${v}</button>`).join("")}
      </div>
      <div class="campo" style="margin:8px 0 0">
        <label>Deja un comentario para ${data.persona === "demonio" ? "el Demonio Pelirrojo" : "la cumpleañera"} (opcional)</label>
        <textarea id="comentarioCierre" maxlength="400" placeholder="Algo bonito, gracioso o infernal para ${escapeHtml(nombrePersona)}…"></textarea>
      </div>
      <button class="full ${esInfernal ? "infernal" : ""}" id="btnCerrar" style="margin-top:10px">
        ${data.final ? "Cerrar el descenso 😈" : "Cerrar parada y bajar ⬇️"}
      </button>
      <p class="hint center">Al cerrar, esperaréis a que todo el grupo termine esta parada.</p>
    </div>

    ${renderChat(data)}

    <div class="panel center" style="margin-top:16px">
      <button class="ghost" id="btnAbandonar">Tengo que irme — abandonar la ruta</button>
    </div>
  `;

  const vg = $("#votoGrid");
  vg.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-v]"); if (!b) return;
    vg.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
    b.classList.add("sel"); votoParada[data.n] = b.dataset.v;
  });
  $("#btnCerrar").addEventListener("click", () => cerrarParada(data));
  $("#btnAbandonar").addEventListener("click", abandonar);
  montarChat(data);
}

function renderTransformacion(data) {
  app().innerHTML = `
    <div class="panel center" id="transWrap">
      <div class="eyebrow-nivel center" style="justify-content:center">🕳️ En el umbral del Bar Maná</div>
      <h2 class="display" style="font-size:1.5rem">La transformación</h2>
      <div id="transFase1">
        <div class="trans-foto" id="transFoto">
          <img class="parada-img" src="images/templo.jpg" alt="Maribel" id="imgTemplo" />
          <img class="parada-img trans-demonio" src="images/demonio.jpg" alt="El Demonio Pelirrojo" id="imgDemonio" />
          <div class="trans-llama" id="transLlama"></div>
          <div class="trans-flash" id="transFlash"></div>
        </div>
        <p class="relato" id="transTexto">Maribel se detiene en la puerta. Algo cruje. El festín ha terminado y el mundo de los vivos queda atrás…</p>
        <button class="full infernal" id="btnTrans">Cruzar el umbral 🔥</button>
      </div>
    </div>
  `;
  $("#btnTrans").addEventListener("click", () => reproducirTransformacion());
}

function reproducirTransformacion() {
  const btn = $("#btnTrans");
  if (btn) btn.remove();
  const foto = $("#transFoto");
  const texto = $("#transTexto");

  // Camino corto si el usuario pide menos movimiento: cambio directo
  if (prefiereMenosMovimiento()) {
    mostrarDemonioFinal();
    return;
  }

  // Fase 1: la foto del templo se tiñe de rojo y tiembla
  foto.classList.add("fase-tension");
  if (texto) texto.textContent = "La piel arde, el pelo se enciende, la tierra se abre bajo sus pies…";

  // Fase 2 (a los 1.1s): sube la llamarada
  setTimeout(() => { foto.classList.add("fase-fuego"); }, 1100);

  // Fase 3 (a los 1.9s): fogonazo blanco y revelado del demonio
  setTimeout(() => {
    foto.classList.add("fase-flash");
    document.body.dataset.fuego = "1"; document.body.dataset.prof = "5";
  }, 1900);

  // Fase 4 (a los 2.5s): asienta el estado final
  setTimeout(() => { mostrarDemonioFinal(); }, 2500);
}

function mostrarDemonioFinal() {
  document.body.dataset.fuego = "1"; document.body.dataset.prof = "5";
  const w = $("#transWrap");
  w.innerHTML = `
    <div class="eyebrow-nivel center" style="justify-content:center">🔥 Parada 5 · El primer descenso</div>
    <h2 class="display" style="font-size:1.6rem;color:var(--fuego-claro)">Nace el Demonio Pelirrojo</h2>
    <img class="parada-img trans-entra" src="images/demonio.jpg" alt="El Demonio Pelirrojo" />
    <p class="relato">La cumpleañera que subió al cielo ya no existe. Entre la lava y el humo, arde ahora el <b>Demonio Pelirrojo</b>, que os guiará hasta el fondo. A partir de aquí, ese es su nombre.</p>
    <button class="full infernal" id="btnSeguirTrans">Entrar en el Bar Maná ⬇️</button>
  `;
  $("#btnSeguirTrans").addEventListener("click", render);
}

async function cerrarParada(data) {
  const btn = $("#btnCerrar"); btn.disabled = true; btn.textContent = "Cerrando…";
  const texto = ($("#comentarioCierre") && $("#comentarioCierre").value.trim()) || "";
  const emojiVoto = votoParada[data.n] || "";
  const r = await api("cerrar", { id: store.id, parada: data.n, emojiVoto, texto });
  if (r.ok) { estado = r.estado; render(); }
  else { btn.disabled = false; btn.textContent = "Cerrar parada y bajar ⬇️"; }
}

function renderEsperaFinal() {
  const jugs = estado.jugadores.filter((j) => j.activo);
  const faltan = jugs.filter((j) => j.parada <= (estado.total || 8));
  app().innerHTML = `
    <div class="panel espera-box">
      <div class="eyebrow-nivel center" style="justify-content:center">😈 Has llegado al fondo</div>
      <div class="big">🔥</div>
      <h2 class="display" style="font-size:1.5rem">Esperando al resto del grupo</h2>
      <div class="spinner"></div>
      <p class="relato">Ya has cerrado tu descenso. Cuando todos lleguen al fondo, se revelará el final.</p>
      ${faltan.length ? `<p class="hint">Aún bajando: ${faltan.map((j)=>escapeHtml(j.emoji+" "+j.nombre)).join(", ")}</p>` : ""}
      <button class="ghost" id="btnVerFinal" style="margin-top:14px">Ver el final igualmente →</button>
    </div>
    ${renderChat({ n: 99, persona: "demonio" })}
    <div class="panel center" style="margin-top:16px">
      <button class="ghost" id="btnAbandonar">Me voy ya — abandonar la ruta</button>
    </div>
  `;
  $("#btnVerFinal").addEventListener("click", () => { forzarFinal = true; render(); });
  $("#btnAbandonar").addEventListener("click", abandonar);
  montarChat({ n: 99 });
}

// ============================ 4) CHAT DE COMENTARIOS ============================
function renderChat(data) {
  return `
    <div class="panel chat">
      <h3 style="font-size:1.15rem">🗣️ Mensajes para la cumpleañera</h3>
      <p class="mini">Todos ven lo que escribes. Aparece como «Tu nombre dice…».</p>
      <div class="chat-scroll" id="chatScroll"></div>
      <div class="chat-input">
        <input type="text" id="chatInput" maxlength="400" placeholder="Escribe algo para ${CUMPLE_NOMBRE}…" autocomplete="off" />
        <button id="chatSend">Enviar</button>
      </div>
    </div>
  `;
}

function montarChat(data) {
  pintarMensajes();
  const send = $("#chatSend"), input = $("#chatInput");
  if (!send || !input) return;
  const enviar = async () => {
    const texto = input.value.trim(); if (!texto) return;
    input.value = ""; send.disabled = true;
    const r = await api("comentar", { id: store.id, parada: (data && data.n) || miParada(), texto });
    if (r.ok) { estado = r.estado; pintarMensajes(); }
    send.disabled = false; input.focus();
  };
  send.addEventListener("click", enviar);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") enviar(); });
}

function pintarMensajes() {
  const cont = $("#chatScroll"); if (!cont || !estado) return;
  const msgs = estado.comentarios || [];
  // ¿estaba el usuario mirando el fondo del chat?
  const cercaDelFondo = cont.scrollHeight - cont.scrollTop - cont.clientHeight < 60;
  const nuevoHTML = msgs.map((m) => `
    <div class="msg ${m.cumple ? "decumple" : ""}">
      ${m.emojiVoto ? `<span class="voto-emoji">${m.emojiVoto}</span>` : ""}
      <div class="autor"><span class="em">${m.autorEmoji || ""}</span> ${escapeHtml(m.autorNombre || "?")} dice:</div>
      <div class="txt">${escapeHtml(m.texto || "")}</div>
      <div class="parada-tag">Parada ${m.parada || "?"}</div>
    </div>`).join("") || `<p class="mini center">Aún no hay mensajes. Sé el primero.</p>`;
  // Solo reescribe si cambió, para no parpadear
  if (cont.innerHTML !== nuevoHTML) cont.innerHTML = nuevoHTML;
  if (cercaDelFondo) cont.scrollTop = cont.scrollHeight;
}

// ============================ 5) FINAL ============================
function renderFinal() {
  document.body.dataset.fuego = "1"; document.body.dataset.prof = "final";
  const msgs = estado.comentarios || [];
  const cumpleJug = estado.jugadores.find((j) => j.cumple);
  const cumpleNombre = cumpleJug ? cumpleJug.nombre : CUMPLE_NOMBRE;

  app().innerHTML = `
    <div class="panel final-hero">
      <div class="medalla">😈🔥😇</div>
      <div class="display">Karma saldado</div>
      <p class="relato" style="margin-top:10px">
        Bajasteis del cielo hasta el fondo del todo, como debíais. La deuda está pagada:
        mañana despertaréis terrenales, resacosos y vivos. Lo conseguisteis.
      </p>
      <p class="sub">Feliz cumpleaños, ${escapeHtml(cumpleNombre)} 🎂🔥</p>
    </div>

    <div class="panel">
      <h3 style="font-size:1.25rem">📜 El libro del descenso</h3>
      <p class="mini">Todo lo que el grupo le dejó a la cumpleañera durante la noche.</p>
      <div class="chat-scroll" style="max-height:60vh" id="finalScroll">
        ${msgs.length ? msgs.map((m) => `
          <div class="msg ${m.cumple ? "decumple" : ""}">
            ${m.emojiVoto ? `<span class="voto-emoji">${m.emojiVoto}</span>` : ""}
            <div class="autor"><span class="em">${m.autorEmoji || ""}</span> ${escapeHtml(m.autorNombre || "?")} dice:</div>
            <div class="txt">${escapeHtml(m.texto || "")}</div>
            <div class="parada-tag">Parada ${m.parada || "?"}</div>
          </div>`).join("") : `<p class="mini center">No quedaron mensajes.</p>`}
      </div>
    </div>

    <div class="panel chat">
      <h3 style="font-size:1.1rem">Deja un último mensaje</h3>
      <div class="chat-input">
        <input type="text" id="chatInput" maxlength="400" placeholder="Un último deseo para ${escapeHtml(cumpleNombre)}…" autocomplete="off" />
        <button id="chatSend">Enviar</button>
      </div>
    </div>
  `;
  montarChat({ n: 100 });
}

// ============================ acciones comunes ============================
async function abandonar() {
  if (!confirm("¿Seguro que abandonas la ruta? El grupo podrá seguir sin ti.")) return;
  await api("abandonar", { id: store.id });
  clearInterval(pollTimer); pollTimer = null;
  app().innerHTML = `
    <div class="panel center">
      <div class="big" style="font-size:3rem">🌙</div>
      <h2 class="display" style="font-size:1.4rem">Has dejado la ruta</h2>
      <p class="relato">El resto del grupo continúa el descenso. Que descanses.</p>
      <button class="full" id="btnVolver" style="margin-top:12px">Volver a unirme</button>
    </div>`;
  $("#btnVolver").addEventListener("click", async () => {
    await api("volver", { id: store.id });
    iniciarPoll(); refrescar();
  });
}

// ---- util ----
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ============================ PANTALLA DE RESET (oculta) ============================
// Se activa solo si la URL lleva ?reset o #reset. No aparece nunca en el flujo normal.
function esRutaReset() {
  return /(\?|&)reset\b/.test(location.search) || location.hash.replace("#", "") === "reset";
}

function renderReset() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } // no refrescar aquí
  document.body.dataset.prof = "cielo"; document.body.dataset.fuego = "0";
  const prog = document.getElementById("progress"); if (prog) prog.hidden = true;
  app().innerHTML = `
    <div class="panel">
      <div class="eyebrow-nivel">🗝️ Zona privada</div>
      <h2 class="display" style="font-size:1.5rem">Reiniciar la ruta</h2>
      <p class="sub" style="font-size:1rem">Esto borra <b>todos</b> los jugadores y comentarios y deja la partida limpia para empezar de cero. No se puede deshacer.</p>
      <div class="campo">
        <label>Contraseña</label>
        <input type="password" id="resetPass" placeholder="Introduce la clave" autocomplete="off" />
      </div>
      <button class="full infernal" id="btnReset">Borrar todo y empezar de cero</button>
      <p id="resetMsg" class="hint center" style="margin-top:12px"></p>
      <hr class="sep" />
      <a class="btn ghost" href="/">← Volver al juego</a>
    </div>
  `;
  const msg = $("#resetMsg");
  $("#btnReset").addEventListener("click", async () => {
    const clave = $("#resetPass").value.trim();
    if (!clave) { msg.textContent = "Escribe la contraseña."; return; }
    if (!confirm("¿Seguro? Esto borra a TODOS los jugadores y comentarios y no se puede deshacer.")) return;
    const btn = $("#btnReset"); btn.disabled = true; msg.textContent = "Borrando…";
    try {
      const r = await api("reset", { clave });
      if (r.ok) {
        msg.textContent = "✓ Partida reiniciada. Ya podéis empezar de cero.";
        // limpiar identidad local para que este dispositivo también arranque limpio
        localStorage.removeItem("descenso_yo");
        // (mantenemos el id del dispositivo; se re-registrará al entrar)
      } else if (r.error === "clave") {
        msg.textContent = "Contraseña incorrecta."; btn.disabled = false;
      } else {
        msg.textContent = "No se pudo reiniciar: " + (r.error || "error"); btn.disabled = false;
      }
    } catch (e) {
      msg.textContent = "Error de conexión, inténtalo otra vez."; btn.disabled = false;
    }
  });
}

// ============================ ARRANQUE ============================
(async function init() {
  // Ruta oculta de reinicio: solo si la URL lleva ?reset o #reset
  if (esRutaReset()) { renderReset(); return; }

  // Si ya estoy jugando (recarga), no repetir la animación de arranque
  await refrescar();
  if (estado && (estado.fase === "jugando" || estado.fase === "final") && yoJugador()) {
    transicionMostrada.arranque = true;
    // Marcar transformación como vista si ya voy por debajo de la 5
    if (miParada() > 5) transicionMostrada["trans5"] = true;
    render();
  }
  iniciarPoll();
})();
