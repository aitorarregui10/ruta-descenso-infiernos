import { getStore } from "@netlify/blobs";

// ---------------------------------------------------------------------------
// Ruta Descenso a los Infiernos — API de estado compartido
// Guarda TODO en un único documento JSON en Netlify Blobs ("estado").
// El cliente hace polling cada pocos segundos a ?action=state.
// ---------------------------------------------------------------------------

const TOTAL_PARADAS = 8; // paradas 1..8; al cerrar la 8 se llega al "final"

const nuevoEstado = () => ({
  fase: "registro", // registro | listos | jugando | final
  jugadores: {}, // id -> { id, nombre, emoji, cumple, listo, parada, cerradas:[], activo }
  comentarios: [], // { id, autorId, autorNombre, autorEmoji, parada, emojiVoto, texto, ts }
  creado: Date.now(),
});

const store = () => getStore({ name: "descenso", consistency: "strong" });

async function leer() {
  const s = store();
  const data = await s.get("estado", { type: "json" });
  return data || nuevoEstado();
}

async function guardar(estado) {
  const s = store();
  await s.setJSON("estado", estado);
  return estado;
}

// Personas que siguen dentro (no han abandonado)
const activos = (e) => Object.values(e.jugadores).filter((j) => j.activo);

// Parada por la que va el grupo (la más atrasada de los activos).
function paradaTecho(e) {
  const act = activos(e);
  if (act.length === 0) return 1;
  return Math.min(...act.map((j) => j.parada));
}

// Regla A con válvula de escape: sube a P+1 a todos los activos que estén en la
// parada P en cuanto TODOS los activos en P la hayan cerrado. Se repite por si
// varias paradas quedan desbloqueadas en cadena. Los que han abandonado no
// cuentan, así no bloquean al resto.
function avanzarGrupo(e) {
  let cambios = true;
  while (cambios) {
    cambios = false;
    const act = activos(e);
    if (act.length === 0) break;
    const p = Math.min(...act.map((j) => j.parada)); // parada más atrasada
    const enP = act.filter((j) => j.parada === p);
    const todosCerraronP = enP.every((j) => j.cerradas.includes(p));
    if (todosCerraronP) {
      // Sube a P+1 a quienes están en P y ya cerraron P
      enP.forEach((j) => {
        j.parada = p + 1;
      });
      cambios = true;
    }
  }
}

function recalcularFase(e) {
  if (e.fase === "registro" || e.fase === "listos") return e;
  const act = activos(e);
  if (act.length > 0 && act.every((j) => j.parada > TOTAL_PARADAS)) {
    e.fase = "final";
  }
  return e;
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "state";

  try {
    // -------- Lecturas --------
    if (req.method === "GET" && action === "state") {
      const e = await leer();
      return json({ ok: true, estado: publico(e) });
    }

    // -------- Escrituras --------
    if (req.method !== "POST") return json({ ok: false, error: "método" }, 405);
    const body = await req.json().catch(() => ({}));
    let e = await leer();

    switch (action) {
      case "join": {
        const id = String(body.id || "").slice(0, 40);
        const nombre = String(body.nombre || "").trim().slice(0, 24);
        const emoji = String(body.emoji || "").slice(0, 8);
        const cumple = !!body.cumple;
        if (!id || !nombre || !emoji) return json({ ok: false, error: "faltan datos" }, 400);

        // Solo una cumpleañera: si ya hay una, este deja de serlo.
        const yaHayCumple = Object.values(e.jugadores).some((j) => j.cumple && j.id !== id);
        const esCumple = cumple && !yaHayCumple;

        const existe = e.jugadores[id];
        // Parada de entrada: si el juego ya arrancó, entra por la cabeza del grupo
        // (la parada más baja de los activos) para no adelantar a nadie.
        let paradaInicial = 1;
        if (e.fase === "jugando" || e.fase === "final") {
          paradaInicial = paradaTecho(e);
        }

        e.jugadores[id] = {
          id,
          nombre,
          emoji,
          cumple: esCumple,
          listo: existe ? existe.listo : false,
          parada: existe ? existe.parada : paradaInicial,
          cerradas: existe ? existe.cerradas : [],
          activo: true,
        };
        await guardar(e);
        return json({ ok: true, estado: publico(e) });
      }

      case "listo": {
        // Cada persona confirma "estoy presente" tras pulsar Estamos listos
        const id = String(body.id || "");
        if (e.jugadores[id]) e.jugadores[id].listo = true;
        // Cualquiera puede abrir la fase de confirmación
        if (e.fase === "registro" && body.abrir) e.fase = "listos";
        // Si TODOS los activos están listos -> arranca
        const act = activos(e);
        if (e.fase === "listos" && act.length > 0 && act.every((j) => j.listo)) {
          e.fase = "jugando";
        }
        await guardar(e);
        return json({ ok: true, estado: publico(e) });
      }

      case "cerrar": {
        // Cerrar la parada actual: guarda voto + comentario opcional y marca
        // esta parada como "cerrada" por esta persona. El avance real (parada+1)
        // solo ocurre cuando TODOS los activos han cerrado la misma parada.
        const id = String(body.id || "");
        const j = e.jugadores[id];
        if (!j) return json({ ok: false, error: "sin jugador" }, 400);

        const paradaActual = Number(body.parada || j.parada);
        // Solo puede cerrar SU parada actual (idempotente si repite)
        if (paradaActual !== j.parada) {
          return json({ ok: true, estado: publico(e) });
        }

        // Registrar cierre + voto/comentario (una vez)
        if (!j.cerradas.includes(paradaActual)) {
          j.cerradas.push(paradaActual);
          if (body.emojiVoto || (body.texto && body.texto.trim())) {
            e.comentarios.push({
              id: "c_" + Math.random().toString(36).slice(2, 10),
              autorId: id,
              autorNombre: j.nombre,
              autorEmoji: j.emoji,
              cumple: j.cumple,
              parada: paradaActual,
              emojiVoto: String(body.emojiVoto || "").slice(0, 8),
              texto: String(body.texto || "").trim().slice(0, 400),
              ts: Date.now(),
            });
          }
        }

        // Regla A + válvula: avanza a P+1 todo activo que haya cerrado P, en
        // cuanto TODOS los activos que están en P la hayan cerrado.
        avanzarGrupo(e);
        recalcularFase(e);
        await guardar(e);
        return json({ ok: true, estado: publico(e) });
      }

      case "comentar": {
        // Comentario suelto de chat (no ligado al cierre de parada)
        const id = String(body.id || "");
        const j = e.jugadores[id];
        if (!j) return json({ ok: false, error: "sin jugador" }, 400);
        const texto = String(body.texto || "").trim().slice(0, 400);
        if (!texto) return json({ ok: false, error: "vacío" }, 400);
        e.comentarios.push({
          id: "c_" + Math.random().toString(36).slice(2, 10),
          autorId: id,
          autorNombre: j.nombre,
          autorEmoji: j.emoji,
          cumple: j.cumple,
          parada: Number(body.parada || j.parada),
          emojiVoto: "",
          texto,
          ts: Date.now(),
        });
        await guardar(e);
        return json({ ok: true, estado: publico(e) });
      }

      case "abandonar": {
        const id = String(body.id || "");
        if (e.jugadores[id]) e.jugadores[id].activo = false;
        recalcularFase(e);
        await guardar(e);
        return json({ ok: true, estado: publico(e) });
      }

      case "volver": {
        // Reincorporarse: entra por la cabeza del grupo
        const id = String(body.id || "");
        if (e.jugadores[id]) {
          e.jugadores[id].activo = true;
          const techo = paradaTecho(e);
          if (e.jugadores[id].parada < techo) e.jugadores[id].parada = techo;
        }
        await guardar(e);
        return json({ ok: true, estado: publico(e) });
      }

      case "reset": {
        // Reinicio total (para pruebas). Requiere clave.
        if (String(body.clave || "") !== "maribel32") {
          return json({ ok: false, error: "clave" }, 403);
        }
        await guardar(nuevoEstado());
        return json({ ok: true });
      }

      default:
        return json({ ok: false, error: "acción desconocida" }, 400);
    }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) }, 500);
  }
};

// Añade campos derivados que el cliente necesita (techo del grupo)
function publico(e) {
  const techo = paradaTecho(e);
  const act = activos(e);
  return {
    fase: e.fase,
    total: TOTAL_PARADAS,
    techo, // parada mínima entre activos = hasta donde puede ir la cabeza
    jugadores: Object.values(e.jugadores).map((j) => ({
      id: j.id,
      nombre: j.nombre,
      emoji: j.emoji,
      cumple: j.cumple,
      listo: j.listo,
      parada: j.parada,
      activo: j.activo,
    })),
    activos: act.length,
    comentarios: e.comentarios.slice(-300),
  };
}

