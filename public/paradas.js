// ===========================================================================
// PARADAS — Ruta Descenso a los Infiernos · 3 de octubre
// Historia central: sois seres terrenales que por error habéis subido al Cielo
// el día del cumpleaños de Maribel. Para reparar el karma tenéis que descender
// hasta los Infiernos y así despertar al día siguiente como estabais.
// ===========================================================================

const PARADAS = [
  {
    n: 1,
    nivel: "El Cielo",
    icono: "☁️",
    titulo: "Azotea del Círculo de Bellas Artes",
    hora: "18:00",
    zona: "C/ Alcalá 42",
    maps: "https://www.google.com/maps/place/?q=place_id:ChIJs-b4dIQoQg0RppCQ716gG_w",
    imagen: "images/tarta.jpg",
    // Historia
    relato:
      "Habéis despertado en el Cielo. No deberíais estar aquí: erais seres terrenales, de barro y resaca, y sin embargo una mano invisible os ha subido hasta esta azotea dorada sobre Madrid, entre nubes y estatuas. En el centro de todo, Maribel sopla dos velas —un 3 y un 2— sobre una tarta imposible. Ese soplido ha sido el error. Ha desajustado el karma. Y ahora los ángeles os miran de reojo, porque sienten que aquí sobráis. Para volver a ser mortales mañana, solo hay un camino: bajar. Bajar hasta abajo del todo.",
    lugar:
      "La azotea del Círculo de Bellas Artes es una de las vistas clásicas de Madrid: mirador sobre la calle Alcalá, el edificio Metrópolis y Gran Vía. Se sube en ascensor, se paga una entrada simbólica (unos 5,50 €) y arriba hay cócteles y camas balinesas. El sitio más alto para empezar a caer.",
    brindis: "Un cóctel mirando Madrid desde las alturas. Disfrutadlo: es lo más cerca del cielo que vais a estar esta noche.",
    persona: "cumple",
  },
  {
    n: 2,
    nivel: "El Purgatorio dorado",
    icono: "🥂",
    titulo: "Isa · Four Seasons",
    hora: "19:00",
    zona: "Canalejas — C/ Sevilla 3",
    maps: "https://maps.google.com/?cid=4568691718300885632",
    imagen: null,
    relato:
      "Primer escalón hacia abajo. Del cielo abierto pasáis a un limbo de lujo: mármol, oro viejo y luz tenue. El Purgatorio no castiga, seduce; os quiere retener aquí, cómodos, con una copa cara en la mano, para que olvidéis que teníais una misión. No os confiéis. Maribel todavía brilla como recién bajada del cielo, pero cada trago la acerca un poco más a la tierra.",
    lugar:
      "Isa es la coctelería del hotel Four Seasons Madrid, en el complejo Canalejas. Cinco estrellas, cocina asiática y coctelería de autor. En el mismo edificio, la 7ª planta esconde la terraza de Dani Brasserie: si la azotea de Bellas Artes se os quedó corta, aquí podéis tomar otra copa con vistas antes de seguir bajando.",
    brindis: "Una copa en el limbo dorado. Que no os atrape: hay que seguir bajando.",
    persona: "cumple",
  },
  {
    n: 3,
    nivel: "La Tierra",
    icono: "🌍",
    titulo: "La Venencia",
    hora: "20:00",
    zona: "Barrio de las Letras",
    maps: "https://maps.google.com/?cid=3135864569193974320",
    imagen: null,
    relato:
      "Habéis tocado tierra. Se acabó el oro: aquí las paredes están ennegrecidas por décadas de humo y secretos. Este es el mundo de los vivos, con su polvo y su memoria. Pisáis suelo firme por primera vez esta noche… pero la tierra es solo el punto medio. Debajo de vuestros pies ya se oye algo. El descenso de verdad empieza aquí.",
    lugar:
      "La Venencia es una taberna de jerez del Barrio de las Letras, intacta desde los años 30. Durante la Guerra Civil fue punto de reunión de espías y brigadistas: por eso, aún hoy, está prohibido hacer fotos (regla de la casa desde entonces) y no se dejan propinas. Solo sirven jerez, solo aceptan efectivo, y te apuntan la cuenta con tiza en la barra. Un trozo de historia negra de Madrid.",
    brindis: "Un fino o un oloroso, en vasito. Sin fotos, sin propina, como manda la casa desde 1930.",
    persona: "cumple",
  },
  {
    n: 4,
    nivel: "El Festín terrenal",
    icono: "🍽️",
    titulo: "Tío Papelón",
    hora: "21:00",
    zona: "C/ del Príncipe 7",
    maps: "https://www.google.com/maps/place/?q=place_id:ChIJ18GRDQApQg0Rx08TCA29wrk",
    imagen: "images/pincho.jpg",
    relato:
      "Antes de descender a lo oscuro, la carne terrenal pide lo suyo: comida. Es el último acto de humanidad de la noche, el banquete de los condenados antes del viaje. Comed fuerte, reíd fuerte, mirad bien a Maribel a la cara… porque cuando salgáis por esa puerta, ella ya no será del todo la misma. El festín es la última frontera. Después empieza la caída.",
    lugar:
      "Tío Papelón es un venezolano de comida rápida en plena calle del Príncipe: arepas, empanadas, cachapas, tequeños. Sencillo, sabroso y abierto hasta tardísimo. El combustible perfecto para aguantar todo lo que viene debajo.",
    brindis: "Arepas y empanadas para el cuerpo. Es el último bocado del mundo de los vivos.",
    persona: "cumple",
    ultimoAntesDemonio: true,
  },
  {
    n: 5,
    nivel: "El primer descenso",
    icono: "🕳️",
    titulo: "Bar Maná",
    hora: "22:45",
    zona: "Plaza de San Martín",
    maps: "https://maps.app.goo.gl/P3uafcL9syLQoWd87",
    imagen: "images/demonio.jpg",
    transformacion: true,
    relato:
      "En el umbral del Bar Maná ocurre. A Maribel le arde el pelo, se le encienden los ojos, la tierra se abre bajo la puerta. La cumpleañera que subió al cielo esta tarde ya no existe: en su lugar cruza el umbral el DEMONIO PELIRROJO. Ya no hay vuelta atrás por arriba; el único camino que repara el karma es hacia abajo, y ahora tenéis quien os guíe. Bienvenidos al primer sótano del infierno.",
    lugar:
      "El Bar Maná es un bar de copas sin pretensiones en la Plaza de San Martín, junto a las Descalzas. Barato, ruidoso, de neón y azulejo. El primer peldaño hacia lo cutre y lo oscuro. (Truco de superviviente: preguntad el precio antes de pedir.)",
    brindis: "La primera copa del inframundo. Brindad por el Demonio Pelirrojo, que ya camina entre vosotros.",
    persona: "demonio",
  },
  {
    n: 6,
    nivel: "El primer círculo",
    icono: "🔥",
    titulo: "La Reina Lagarta",
    hora: "00:00",
    zona: "Malasaña — C/ La Palma 14",
    maps: "https://maps.google.com/?cid=13073180815948669374",
    imagen: null,
    relato:
      "Primer círculo del infierno. Aquí las reglas del mundo de arriba no valen: hay cabaret oscuro, magia, luz roja y criaturas que no sabrías nombrar. El Demonio Pelirrojo se mueve como en casa. Vosotros, mortales aún, miradlo todo con la boca abierta: cuanto más raro, más cerca del fondo estáis, y más cerca de volver a ser normales mañana.",
    lugar:
      "La Reina Lagarta es un bar de Malasaña de estética gótica y freak, decorado en rojo, con espectáculos de cabaret, mentalismo y magia en directo. Un pequeño teatro del absurdo donde lo estrambótico es la norma.",
    brindis: "Una copa entre magos y monstruos. Aplaudid lo raro: aquí es lo sagrado.",
    persona: "demonio",
  },
  {
    n: 7,
    nivel: "El pozo",
    icono: "🔥",
    titulo: "El Perro de la Parte de Atrás del Coche",
    hora: "01:30",
    zona: "Malasaña — C/ Puebla 15",
    maps: "https://maps.google.com/?cid=17183120142380800992",
    imagen: null,
    relato:
      "Bajáis un piso más. Aquí abajo no hay cobertura, no hay tierra, no hay tarde de cielo: solo una cueva excavada donde retumba la música y el mundo de arriba deja de existir. Es el pozo. Casi habéis llegado. El Demonio Pelirrojo sonríe porque huele el final, y el karma empieza por fin a equilibrarse con cada paso que dais hacia lo hondo.",
    lugar:
      "El Perro de la Parte de Atrás del Coche es un club underground de Malasaña con una sala inferior con estética de cueva. Techno, indie y sudor. Uno de esos sitios sin ventanas donde se pierde la noción del tiempo.",
    brindis: "Un gin-tonic en la cueva. Sin ventanas, sin reloj, sin vuelta.",
    persona: "demonio",
  },
  {
    n: 8,
    nivel: "El Infierno final",
    icono: "😈",
    titulo: "Skin Club  ·  o  ·  Sala El Sol",
    hora: "03:30",
    zona: "Sol — C/ Aduana 21  /  C/ Jardines 3",
    maps: "https://www.google.com/maps/place/?q=place_id:ChIJmS3RFwApQg0RQEfsyjZdfJ0",
    mapsAlt: "https://www.google.com/maps/place/?q=place_id:ChIJFwTeOIcoQg0RS-hPVCsHrhM",
    imagen: null,
    relato:
      "El fondo. El último portal. Cruzáis y el karma queda saldado: habéis bajado del cielo hasta lo más hondo, como debíais, y por eso mañana despertaréis exactamente como estabais —terrenales, resacosos, vivos—. El Demonio Pelirrojo os ha traído hasta aquí. Ahora bailad hasta que salga el sol y la deuda quede pagada. Feliz cumpleaños, Maribel: lo conseguisteis.",
    lugar:
      "Puerta final a elegir. SKIN CLUB (C/ Aduana 21): club techno fetish y queer, puerta muy selectiva y dress code estricto —mirad las normas de la noche en su Instagram—. Si no entráis, a 2 minutos está la SALA EL SOL (C/ Jardines 3), templo de la Movida abierto en 1979, con sesión de DJ que aguanta hasta el amanecer. Cualquiera de las dos cierra el descenso.",
    brindis: "La última copa, ya en el fondo del todo. Bailad hasta el amanecer: el karma está saldado.",
    persona: "demonio",
    final: true,
  },
];

if (typeof module !== "undefined") module.exports = { PARADAS };
