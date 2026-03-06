"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, loadCalendar, saveCalendar } from "@/lib/supabase";

/* ═══════════════════════════════ TOKENS ═══════════ */
const C = {
  cyan: "#00f0ff", pink: "#ff375f", yellow: "#ffd60a",
  green: "#30d158", purple: "#bf5af2", indigo: "#5e5ce6", orange: "#ff9f0a",
};

const TYPES: Record<string, { label: string; icon: string; color: string }> = {
  REEL:     { label: "Reel",     icon: "▶",  color: C.pink   },
  CARRUSEL: { label: "Carrusel", icon: "⊞",  color: C.cyan   },
  POST:     { label: "Post",     icon: "◉",  color: C.yellow },
  STORY:    { label: "Story",    icon: "◎",  color: C.green  },
};

const PILLARS: Record<string, { label: string; color: string }> = {
  NEUROCIENCIA:    { label: "Neurociencia",    color: C.cyan   },
  INSPIRACION:     { label: "Inspiración",     color: C.yellow },
  SUPRACONCIENCIA: { label: "Supraconciencia", color: C.pink   },
  COMUNIDAD:       { label: "Comunidad",       color: C.green  },
  ENTRETENIMIENTO: { label: "Entretenimiento", color: C.purple },
};

const SLOTS: Record<string, { label: string; icon: string; time: string; color: string }> = {
  manana:   { label: "Mañana",   icon: "🌅", time: "08:00", color: C.indigo },
  mediodia: { label: "Mediodía", icon: "☀️",  time: "13:00", color: C.yellow },
  noche:    { label: "Noche",    icon: "🌙",  time: "20:00", color: C.purple },
};

const DOW = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const EMOJIS: Record<string, string[]> = {
  REEL:     ["🧠","⚡","👁️","🌌","🔬","✨","🌀","💡","🔭","🧬"],
  CARRUSEL: ["📊","🧩","🔮","💎","⚗️","🧪","📡","🌐","🗺️","🔑"],
  POST:     ["💬","🌟","🪐","💫","🔥","🌊","🕊️","🌙","⚡","🎯"],
  STORY:    ["❓","📸","🎯","📲","💭","🗣️","📣","👇","🔔","✅"],
};
function getEmoji(tipo: string, seed: number) { return EMOJIS[tipo]?.[seed % 10] ?? "✦"; }

/* ═══════════════════════════════ TYPES ═══════════ */
interface SlotData { tipo: string | null; pilar: string | null; titulo: string; hashtags: string; notas: string; hora?: string; }
interface DayData { day: number; manana: SlotData; mediodia: SlotData; noche: SlotData; }

function s(tipo: string, pilar: string, titulo: string, hashtags = "", notas = ""): SlotData {
  return { tipo, pilar, titulo, hashtags, notas };
}
function r(): SlotData { return { tipo: null, pilar: null, titulo: "", hashtags: "", notas: "" }; }
function mk(day: number, manana: SlotData, mediodia: SlotData, noche: SlotData): DayData {
  return { day, manana, mediodia, noche };
}

/* ═══════════════════════════════ DEFAULT CALENDAR ═══════════ */
const DEFAULT: DayData[] = [
  mk(1, s("REEL","NEUROCIENCIA","¿Qué es la metacognición y por qué cambia todo?","#metacognicion #neurociencia #mente","Hook: 'Pocas personas saben que están pensando mal'"), s("STORY","COMUNIDAD","Encuesta: ¿Sabes lo que es la neuroplasticidad?","","✅ Sí / ❌ No / 🤔 Algo"), s("POST","INSPIRACION","«No eres tus pensamientos. Eres quien los observa.»","#supraconciencia #consciencia #despertar","Tipografía grande, fondo negro")),
  mk(2, s("CARRUSEL","NEUROCIENCIA","Tu cerebro tiene un sistema operativo — y puedes reprogramarlo","#neuroplasticidad #cerebro #mindset","Slide 1: analogía SO · Slides 2-7: mecanismo · Slide 8: CTA"), s("STORY","ENTRETENIMIENTO","Este test revela tu nivel de consciencia 🧠","","Mini quiz 3 preguntas"), s("REEL","SUPRACONCIENCIA","Lo que nadie te enseñó sobre cómo funciona tu mente","#supraconciencia #mente #consciencia","B-roll: ondas cerebrales, cosmos, neuronas")),
  mk(3, s("POST","INSPIRACION","«El mayor descubrimiento es que un ser humano puede cambiar su vida cambiando su actitud mental.»","#neuroplasticidad #actitud #cambio","Cita de William James"), s("CARRUSEL","NEUROCIENCIA","5 señales de que tu cerebro está en modo automático","#metacognicion #habitos #consciencia","Diseño visual — muy compartible"), s("REEL","COMUNIDAD","POV: Por fin entiendes cómo funciona tu mente 🌀","#pov #mente #neurociencia #viral","Trending audio + narración")),
  mk(4, s("STORY","COMUNIDAD","Q&A: pregúntame sobre neuroplasticidad 🧠","","Caja de preguntas"), s("REEL","NEUROCIENCIA","¿Cómo se forma un hábito a nivel neuronal? (60 seg)","#neuroplasticidad #habitos #cerebro","B-roll del cerebro"), s("POST","INSPIRACION","«Neuronas que se activan juntas, se conectan juntas.» — Hebb","#neurociencia #hebb #neuroplasticidad","Ley de Hebb")),
  mk(5, s("CARRUSEL","SUPRACONCIENCIA","Supraconciencia: el estado más alto de tu mente en 7 slides","#supraconciencia #consciencia #expansion","Diseño premium"), s("STORY","ENTRETENIMIENTO","¿Sabías esto sobre tu cerebro? 🔬","","Dato sorprendente + encuesta"), s("REEL","NEUROCIENCIA","3 ejercicios que activan tu neuroplasticidad hoy","#neuroplasticidad #ejercicios #cerebro","Hook: 'Haz esto 10 minutos al día'")),
  mk(6, s("POST","SUPRACONCIENCIA","«Tu cerebro es el único órgano que puede estudiarse a sí mismo.»","#metacognicion #neurociencia #filosofia","Imagen abstracta del cerebro"), s("CARRUSEL","NEUROCIENCIA","Metacognición vs pensamiento ordinario: la diferencia real","#metacognicion #pensarcritico #inteligencia","Tabla comparativa"), s("REEL","INSPIRACION","El día que dejé de identificarme con mis pensamientos cambió todo","#consciencia #despertar #metacognicion","Narrativo, personal")),
  mk(7, r(), r(), s("STORY","COMUNIDAD","¿Qué ha sido lo más útil esta semana? 👇","","Encuesta feedback")),
  mk(8, s("REEL","NEUROCIENCIA","El estado de flujo explicado desde la neurociencia","#flujo #flow #neurociencia","Hook: 'Esto pasa en tu cerebro cuando entras en flujo'"), s("CARRUSEL","SUPRACONCIENCIA","Los 4 niveles de consciencia: ¿en cuál estás tú?","#supraconciencia #niveles #consciencia","Diseño premium"), s("POST","INSPIRACION","«La atención es el comienzo del amor.» — Mary Oliver","#atencion #consciencia #mindfulness","")),
  mk(9, s("STORY","COMUNIDAD","Vota: ¿En qué estado pasas más tiempo? 🧠","","Automático / Consciente / Flujo"), s("REEL","NEUROCIENCIA","¿Por qué tu cerebro prefiere los hábitos al pensamiento?","#habitos #cerebro #neurociencia","Economía energética"), s("POST","SUPRACONCIENCIA","«Observa tus pensamientos como nubes. Tú eres el cielo.»","#supraconciencia #meditacion","")),
  mk(10, s("CARRUSEL","NEUROCIENCIA","Neuroplasticidad 101: lo que la ciencia sabe sobre cambiar tu mente","#neuroplasticidad #ciencia","Citar: Doidge, Ramachandran"), s("STORY","ENTRETENIMIENTO","Adivina qué parte del cerebro hace esto 🔬","","Mini quiz"), s("REEL","SUPRACONCIENCIA","Meditación vs supraconciencia: la diferencia que nadie explica","#supraconciencia #meditacion","Gran debate")),
  mk(11, s("POST","INSPIRACION","«Lo que piensas, lo sientes. Lo que sientes, lo atraes.»","#neuroplasticidad #mindset","Une neurociencia con enfoque"), s("REEL","NEUROCIENCIA","Cómo el estrés daña tu cerebro y cómo revertirlo","#estres #cortisol #neuroplasticidad","Alto valor educativo"), s("CARRUSEL","SUPRACONCIENCIA","7 prácticas que expanden tu nivel de consciencia","#consciencia #practica","Lead magnet")),
  mk(12, s("STORY","COMUNIDAD","¿Meditas actualmente? 🧘","","Encuesta"), s("POST","NEUROCIENCIA","«Cada vez que aprendes algo nuevo, tu cerebro cambia físicamente.»","#neuroplasticidad #aprendizaje","Dato científico"), s("REEL","ENTRETENIMIENTO","Tipos de personas según su nivel de consciencia 👁️","#consciencia #humor #viral","Viral + educativo")),
  mk(13, r(), s("CARRUSEL","NEUROCIENCIA","Cómo usar el diario metacognitivo para reprogramar tu mente","#diario #metacognicion #journal","Plantilla descargable"), r()),
  mk(14, s("REEL","SUPRACONCIENCIA","POV: Descubres que puedes observar tus propios pensamientos","#pov #metacognicion","Muy relatable"), s("STORY","COMUNIDAD","Reto: 7 días observando tus pensamientos — ¿te unes? 🧠","","Reto comunitario"), s("POST","INSPIRACION","«Entre el estímulo y la respuesta hay un espacio. En ese espacio está tu poder.» — Viktor Frankl","#metacognicion #libertad","")),
  mk(15, s("CARRUSEL","NEUROCIENCIA","El observador interno: qué es y cómo desarrollarlo","#observador #supraconciencia","Muy práctico"), s("REEL","ENTRETENIMIENTO","Antes vs después de conocer la metacognición 😂","#metacognicion #humor #viral","Comparativo viral"), s("POST","SUPRACONCIENCIA","«No puedes parar las olas, pero puedes aprender a surfear.»","#mindfulness #ondas","")),
  mk(16, s("STORY","COMUNIDAD","¿Cuándo fue la última vez que te observaste pensar? 🤔","","Reflexión"), s("REEL","NEUROCIENCIA","El poder de la respiración para cambiar tu estado cerebral","#respiracion #neurociencia #vago","Nervio vago"), s("CARRUSEL","INSPIRACION","De piloto automático a consciencia plena: 6 pasos","#metacognicion #consciencia","Guía de vida")),
  mk(17, s("POST","NEUROCIENCIA","«Tu cerebro genera 70.000 pensamientos al día. Tú puedes elegir cuáles importan.»","#metacognicion #pensamientos","Dato + herramienta"), s("REEL","SUPRACONCIENCIA","Ejercicio de 3 minutos para activar tu supraconciencia ahora","#supraconciencia #ejercicio","Guiado en tiempo real"), s("STORY","ENTRETENIMIENTO","Dime tu color favorito y te digo tu nivel de consciencia 🎨","","Lúdico")),
  mk(18, s("REEL","NEUROCIENCIA","Neuroplasticidad en acción: el músico ciego que 'vio' con su lengua","#neuroplasticidad #cerebro #ciencia","Ramachandran"), s("CARRUSEL","SUPRACONCIENCIA","Los 5 obstáculos para alcanzar la supraconciencia","#supraconciencia #obstaculos","Alto valor"), s("POST","INSPIRACION","«La mente no entrenada es la mayor fuente de sufrimiento.»","#metacognicion #mente","")),
  mk(19, r(), s("STORY","COMUNIDAD","¿Cómo vas con el reto de los 7 días? 💪","","Seguimiento reto"), r()),
  mk(20, s("CARRUSEL","NEUROCIENCIA","Sueño y neuroplasticidad: por qué dormir bien lo cambia todo","#sueno #neuroplasticidad","Alto interés"), s("REEL","NEUROCIENCIA","¿Qué es la metacognición de segundo orden? (nivel avanzado)","#metacognicion #avanzado","Contenido profundo"), s("POST","SUPRACONCIENCIA","«En el silencio entre tus pensamientos está tu verdadero ser.»","#supraconciencia #silencio","")),
  mk(21, s("REEL","ENTRETENIMIENTO","Si tu cerebro fuera una app necesitaría estas actualizaciones 📱","#cerebro #humor #viral","Analogía tech"), s("CARRUSEL","NEUROCIENCIA","Inteligencia emocional y neuroplasticidad: la conexión","#inteligenciaemocional #neuroplasticidad","Puente temas"), s("STORY","COMUNIDAD","¿Qué ha cambiado en ti esta semana? ✨","","")),
  mk(22, s("POST","INSPIRACION","«No necesitas más información. Necesitas más observación.»","#metacognicion #sabiduria","Frase guardar"), s("REEL","NEUROCIENCIA","Cómo el ayuno afecta tu neuroplasticidad","#ayuno #neuroplasticidad #bdnf","BDNF"), s("CARRUSEL","SUPRACONCIENCIA","Consciencia ordinaria vs supraconciencia: el salto cuántico","#supraconciencia #consciencia","Visual")),
  mk(23, s("STORY","COMUNIDAD","¿Practicas alguna técnica de consciencia? 🧘","","Encuesta"), s("REEL","ENTRETENIMIENTO","Reaccionando a mitos sobre el cerebro que todos creen 🧠","#mitos #cerebro #viral","Formato reacción"), s("POST","NEUROCIENCIA","«El cerebro que aprende no es el mismo que empezó a aprender.»","#neuroplasticidad #aprendizaje","")),
  mk(24, s("CARRUSEL","NEUROCIENCIA","Mindfulness y neurociencia: lo que dicen los estudios de Harvard","#mindfulness #harvard #neurociencia","Credibilidad"), s("REEL","SUPRACONCIENCIA","Lo que sientes cuando por primera vez observas tu mente desde afuera","#supraconciencia #experiencia","Personal"), s("STORY","ENTRETENIMIENTO","¿Cuántas neuronas tienes? Adivina 🔢","","Dato sorprendente")),
  mk(25, s("POST","INSPIRACION","«El sufrimiento es resistencia. La paz es aceptación consciente.»","#supraconciencia #paz","Profundo"), s("CARRUSEL","SUPRACONCIENCIA","Cómo crear un ritual de expansión de consciencia en 10 min","#ritual #consciencia #manana","Muy accionable"), s("REEL","NEUROCIENCIA","Visualización mental y neuroplasticidad: por qué funciona","#visualizacion #neuroplasticidad","Une ciencia con práctica")),
  mk(26, s("STORY","COMUNIDAD","¿Cuál ha sido tu mayor aprendizaje este mes? 💜","","Reflexión"), s("REEL","ENTRETENIMIENTO","POV: Explicas la metacognición en una cena familiar 😂","#metacognicion #humor #pov #viral","Relatable"), s("CARRUSEL","NEUROCIENCIA","Las 10 lecturas imprescindibles sobre neuroplasticidad","#libros #neuroplasticidad #lecturas","Recurso")),
  mk(27, r(), r(), s("POST","SUPRACONCIENCIA","«El más alto grado de consciencia es aquel en que observas sin juzgar.»","#supraconciencia","Reflexión nocturna")),
  mk(28, s("REEL","NEUROCIENCIA","Todo lo que aprendiste este mes sobre tu cerebro en 60 seg","#recap #neuroplasticidad","Resumen visual"), s("CARRUSEL","SUPRACONCIENCIA","De inconsciente a supraconsciente: el mapa completo del viaje","#supraconciencia #mapa #viaje","El más importante"), s("POST","INSPIRACION","«Eres la conciencia que observa, no los pensamientos observados.»","#supraconciencia","")),
  mk(29, s("STORY","COMUNIDAD","¿Seguirías este contenido el próximo mes? 🙋","","Validación"), s("REEL","ENTRETENIMIENTO","Lo que nadie espera cuando empieza a practicar metacognición 👁️","#metacognicion #honesto","Auténtico"), s("CARRUSEL","NEUROCIENCIA","Los estudios más impresionantes sobre neuroplasticidad del año","#neuroplasticidad #ciencia","Actualidad")),
  mk(30, s("POST","SUPRACONCIENCIA","«Este mes miraste tu mente por primera vez. Eso ya no tiene vuelta atrás.»","#cierre #consciencia","Emotivo"), s("REEL","COMUNIDAD","Gracias por este mes de supraconciencia juntos 💜","#recap #gracias #comunidad","Cierre auténtico"), s("STORY","COMUNIDAD","¿Qué tema quieres el próximo mes? Vota 👇","","Encuesta Mes 2")),
  mk(31, s("CARRUSEL","SUPRACONCIENCIA","31 días, 93 publicaciones: todo lo que aprendimos sobre la mente","#recap #mes #supraconciencia","Carrusel final"), s("REEL","INSPIRACION","Si solo pudiera enseñarte una cosa sobre tu mente, sería esta...","#neuroplasticidad #leccion","El más importante"), s("POST","COMUNIDAD","«El viaje hacia la supraconciencia no termina — acaba de empezar.» ✨","#supraconciencia #viaje","Apertura Mes 2")),
];

const WEEKS = [
  { n:1, theme:"Semana 1 — Gancho",           days:[1,2,3,4,5,6,7] },
  { n:2, theme:"Semana 2 — Ciencia profunda",  days:[8,9,10,11,12,13,14] },
  { n:3, theme:"Semana 3 — Práctica",          days:[15,16,17,18,19,20,21] },
  { n:4, theme:"Semana 4 — Impacto y cierre",  days:[22,23,24,25,26,27,28,29,30,31] },
];

/* ═══════════════════════════════ AI ═══════════ */
async function callAI(prompt: string): Promise<string> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  return data.text ?? "Error al generar contenido.";
}

async function generatePost(slot: SlotData, slotKey: string): Promise<string> {
  const pilarLabel = slot.pilar ? PILLARS[slot.pilar]?.label : "";
  const fmtGuide: Record<string, string> = {
    REEL: `Genera el guión completo de un Reel de 60 segundos.\nEstructura:\n- HOOK (0-3 seg): Pregunta o afirmación que detenga el scroll\n- DESARROLLO (3-50 seg): 3-5 puntos clave de 8-10 seg cada uno\n- CTA (50-60 seg): Llamada a la acción clara\nUsa primera persona, párrafos cortos, tono cercano y apasionado.`,
    CARRUSEL: `Genera el texto completo de un Carrusel de 8 slides.\nEstructura:\n- Slide 1 (PORTADA): Titular impactante máx 8 palabras\n- Slides 2-7: Un punto clave por slide con título + 2-3 líneas\n- Slide 8 (CTA): "Guarda este post" + pregunta para comentarios\nUsa emojis al principio de cada slide.`,
    POST: `Genera el caption completo de un Post de Instagram.\nEstructura:\n- Primera línea: Hook potente (visible antes del "ver más")\n- 3-4 párrafos reflexivos y profundos sobre el tema\n- Pregunta final para generar comentarios\nTono reflexivo, inspiracional, con base científica. Máx 2200 caracteres.`,
    STORY: `Genera el texto para una Story de Instagram.\nEstructura:\n- Slide 1: Dato o pregunta impactante\n- Slide 2: Contexto breve (1-2 frases)\n- Slide 3: La acción o encuesta\n- Slide 4: CTA\nMáx 50 palabras por slide. Directo y visual.`,
  };

  return callAI(`Eres un experto en contenido sobre supraconciencia, metacognición y neuroplasticidad con 500.000 seguidores en Instagram. Tu voz es la de un mentor que explica ideas complejas con claridad y profundidad. Evita frases genéricas.

Tema: "${slot.titulo}"
Formato: ${slot.tipo}
Pilar: ${pilarLabel}
Notas: ${slot.notas || "ninguna"}
Momento: ${SLOTS[slotKey]?.label}

${fmtGuide[slot.tipo ?? "POST"] ?? "Genera contenido completo listo para publicar."}

REGLAS:
- Idioma: ESPAÑOL
- No incluyas meta-texto ni introducciones
- Saltos de línea naturales
- Termina con: HASHTAGS: (en una línea aparte) seguido de 15-20 hashtags`);
}

async function generateHooks(): Promise<string> {
  return callAI(`Eres un experto en copywriting para Instagram sobre supraconciencia, metacognición y neuroplasticidad.

Genera exactamente 15 hooks virales para Instagram/TikTok. Cada hook debe:
- Detener el scroll en los primeros 2 segundos
- Generar curiosidad o intriga
- Ser específico, no genérico
- Sonar como lo diría un mentor, no una IA

Temáticas: metacognición, neuroplasticidad, supraconciencia, observador interno, piloto automático, estado de flujo, consciencia, reprogramación mental.

Formato: Un hook por línea, numerados del 1 al 15. Solo los hooks, sin explicaciones ni meta-texto. En español.`);
}

async function generateReelScript(topic: string): Promise<string> {
  return callAI(`Eres un creador de contenido experto en metacognición, neuroplasticidad y supraconciencia.

Genera un guión completo de Reel de 60 segundos sobre: "${topic}"

Estructura EXACTA:
🎬 HOOK (0-3 seg):
[La frase de apertura que detenga el scroll]

📍 PUNTO 1 (3-15 seg):
[Primer punto clave con explicación breve]

📍 PUNTO 2 (15-30 seg):
[Segundo punto clave]

📍 PUNTO 3 (30-45 seg):
[Tercer punto clave o ejemplo/metáfora]

💡 REFLEXIÓN (45-55 seg):
[Idea que haga pensar al espectador]

🎯 CTA (55-60 seg):
[Llamada a la acción]

---
📱 NOTAS DE PRODUCCIÓN:
- Tipo de audio sugerido
- Ideas de B-roll
- Texto en pantalla sugerido

Idioma: español. Tono: mentor cercano y apasionado.`);
}

/* ═══════════════════════════════ MAIN COMPONENT ═══════════ */

type View = "calendar" | "hooks" | "reels";

export default function ContentOS() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("calendar");

  // Edit modal
  const [editModal, setEditModal] = useState<{ day: number; slotKey: string } | null>(null);
  const [edit, setEdit] = useState<SlotData | null>(null);

  // Preview modal
  const [previewModal, setPreviewModal] = useState<{ day: number; slotKey: string; slot: SlotData } | null>(null);
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Hooks tool
  const [hooks, setHooks] = useState("");
  const [hooksLoading, setHooksLoading] = useState(false);

  // Reels tool
  const [reelTopic, setReelTopic] = useState("");
  const [reelScript, setReelScript] = useState("");
  const [reelLoading, setReelLoading] = useState(false);

  // Filter
  const [filterType, setFilterType] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  /* Load data — Supabase if available, else localStorage */
  useEffect(() => {
    (async () => {
      try {
        // Generate or retrieve anonymous user id
        let uid = localStorage.getItem("content-os-uid");
        if (!uid) { uid = crypto.randomUUID(); localStorage.setItem("content-os-uid", uid); }
        setUserId(uid);

        // Try Supabase first
        const remote = await loadCalendar(uid);
        if (remote && Array.isArray(remote) && remote.length > 0) {
          setDays(remote as DayData[]);
          localStorage.setItem("content-os-v1", JSON.stringify(remote));
        } else {
          // Fall back to localStorage
          const local = localStorage.getItem("content-os-v1");
          const parsed = local ? JSON.parse(local) : null;
          setDays(parsed?.length ? parsed : DEFAULT.map(d => ({ ...d })));
        }
      } catch {
        try {
          const local = localStorage.getItem("content-os-v1");
          setDays(local ? JSON.parse(local) : DEFAULT.map(d => ({ ...d })));
        } catch { setDays(DEFAULT.map(d => ({ ...d }))); }
      } finally { setLoading(false); }
    })();
  }, []);

  const persist = async (newDays: DayData[]) => {
    setDays(newDays);
    // Save locally immediately
    try { localStorage.setItem("content-os-v1", JSON.stringify(newDays)); } catch {}
    // Sync to Supabase in background
    if (userId) {
      setSyncing(true);
      try { await saveCalendar(userId, newDays); } catch {}
      finally { setSyncing(false); }
    }
    showToast("✓ Guardado y sincronizado");
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast("✓ Copiado")).catch(() => showToast("Error al copiar"));
  };

  const openEdit = (day: number, slotKey: string) => {
    const d = days.find(x => x.day === day);
    if (!d) return;
    setEditModal({ day, slotKey });
    setEdit({ ...(d as any)[slotKey] });
  };

  const saveEdit = () => {
    if (!editModal || !edit) return;
    const newDays = days.map(d => d.day === editModal.day ? { ...d, [editModal.slotKey]: { ...edit } } : d);
    persist(newDays);
    setEditModal(null);
  };

  const openPreview = async (day: number, slotKey: string) => {
    const d = days.find(x => x.day === day);
    if (!d) return;
    const slot = (d as any)[slotKey] as SlotData;
    if (!slot.tipo) return;
    setPreviewModal({ day, slotKey, slot });
    setAiContent(""); setAiLoading(true);
    try { setAiContent(await generatePost(slot, slotKey)); }
    catch { setAiContent("Error al generar. Verifica la conexión."); }
    finally { setAiLoading(false); }
  };

  const stats: Record<string, number> = {};
  days.forEach(d => {
    (["manana","mediodia","noche"] as const).forEach(sk => {
      const t = (d as any)[sk]?.tipo; if (t) stats[t] = (stats[t] || 0) + 1;
    });
  });
  const totalPosts = days.reduce((a, d) => a + ["manana","mediodia","noche"].filter(sk => (d as any)[sk]?.tipo).length, 0);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-[#00f0ff] text-xs tracking-[4px]">CARGANDO…</div>
    </div>
  );

  /* Parse AI content */
  let mainContent = aiContent, hashtagsFromAI = "";
  if (aiContent.includes("HASHTAGS:")) {
    const parts = aiContent.split("HASHTAGS:");
    mainContent = parts[0].trim();
    hashtagsFromAI = parts[1]?.trim() ?? "";
  }

  const pm = previewModal;
  const ptm = pm?.slot?.tipo ? TYPES[pm.slot.tipo] : null;
  const psm = pm ? SLOTS[pm.slotKey] : null;
  const em = editModal ? days.find(x => x.day === editModal.day) : null;
  const etm = edit?.tipo ? TYPES[edit.tipo] : null;

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "-apple-system,'Helvetica Neue',sans-serif" }}>
      <div className="max-w-[430px] mx-auto pb-32">

        {/* ── HEADER ── */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-xl border-b border-white/5 px-5 pt-12 pb-0">
          <div className="flex justify-between items-start pb-4">
            <div>
              <div className="text-[11px] tracking-[1px] text-white/30 mb-1 flex items-center gap-2">
                Content OS · 2025
                {syncing && <span className="text-[#00f0ff] text-[10px] tracking-[1px]">↑ sincronizando…</span>}
              </div>
              <div className="text-[26px] font-bold tracking-tight leading-tight">
                Calendario<br/>
                <span style={{ background: "linear-gradient(135deg,#00f0ff,#ff375f)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Mensual</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[34px] font-bold tracking-[-2px]">{totalPosts}</div>
              <div className="text-[10px] text-white/30 tracking-[.5px]">publicaciones</div>
            </div>
          </div>

          {/* Topic pills */}
          <div className="flex gap-[5px] flex-wrap pb-3">
            {[["SUPRACONCIENCIA","#ff375f"],["METACOGNICIÓN","#00f0ff"],["NEUROPLASTICIDAD","#30d158"]].map(([l,c])=>(
              <span key={l} className="text-[9px] tracking-[.5px] px-[10px] py-[4px] rounded-full font-medium" style={{ color:c, background:`${c}12`, border:`1px solid ${c}28` }}>{l}</span>
            ))}
          </div>

          {/* Filter chips */}
          <div className="flex gap-[6px] overflow-x-auto pb-3">
            {Object.entries(TYPES).map(([k,t])=>(
              <button key={k}
                onClick={() => setFilterType(filterType===k ? null : k)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-[7px] rounded-full text-[11px] font-medium border transition-all"
                style={{
                  color: filterType===k ? t.color : "#636366",
                  borderColor: filterType===k ? `${t.color}44` : "#2c2c2e",
                  background: filterType===k ? `${t.color}10` : "#1c1c1e",
                }}>
                <span>{t.icon}</span><span>{t.label}</span>
                <span className="opacity-40 text-[10px]">({stats[k]||0})</span>
              </button>
            ))}
            {filterType && <button onClick={()=>setFilterType(null)} className="flex-shrink-0 px-3 py-[7px] rounded-full text-[11px] border border-[#2c2c2e] bg-[#1c1c1e] text-[#636366]">✕</button>}
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 pb-0">
            {([["calendar","📅 Calendario"],["hooks","⚡ Hooks"],["reels","🎬 Guiones"]] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)}
                className="flex-1 py-2 text-[11px] font-semibold tracking-[.5px] border-b-2 transition-all"
                style={{ color: view===v ? "#00f0ff" : "#636366", borderColor: view===v ? "#00f0ff" : "transparent" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════ CALENDAR VIEW ══════════ */}
        {view === "calendar" && (
          <div>
            {WEEKS.map(wk => (
              <div key={wk.n}>
                <div className="flex items-center gap-2 px-5 pt-7 pb-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <div className="text-[10px] tracking-[1.5px] text-white/20 uppercase whitespace-nowrap">{wk.theme}</div>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {wk.days.map(dn => {
                  const d = days.find(x => x.day === dn);
                  if (!d) return null;
                  const dow = DOW[(dn+1)%7];
                  const cnt = ["manana","mediodia","noche"].filter(sk => (d as any)[sk]?.tipo).length;

                  return (
                    <div key={dn} className="mx-3">
                      {/* Day header */}
                      <div className="flex items-center gap-3 px-1 pt-4 pb-2">
                        <div className="text-[38px] font-bold tracking-[-3px] leading-none min-w-[58px]"
                          style={{ color: cnt > 0 ? "#fff" : "#1c1c1e" }}>
                          {String(dn).padStart(2,"0")}
                        </div>
                        <div>
                          <div className="text-[11px] text-white/25 tracking-[.5px]">{dow}</div>
                          <div className="text-[12px] text-white/40">{cnt === 0 ? "Descanso" : `${cnt} publicación${cnt>1?"es":""}`}</div>
                        </div>
                      </div>
                      <div className="h-px bg-white/5 mx-1 mb-3" />

                      {/* Slots */}
                      {(["manana","mediodia","noche"] as const).map(sk => {
                        const sl = (d as any)[sk] as SlotData;
                        const sm = SLOTS[sk];
                        if (!sl?.tipo) return (
                          <div key={sk} className="flex items-center gap-3 mb-2 px-1 opacity-20 rounded-xl border border-dashed border-white/10 py-3">
                            <div className="text-[10px] tracking-[1px] text-white/30 min-w-[70px] uppercase">{sm.icon} {sm.label}</div>
                            <div className="flex-1 h-px bg-white/10" />
                            <div className="text-[10px] tracking-[2px] text-white/20">Descanso</div>
                          </div>
                        );
                        const tm = TYPES[sl.tipo];
                        const pp = sl.pilar ? PILLARS[sl.pilar] : null;
                        const tags = sl.hashtags ? sl.hashtags.split(/\s+/).filter(Boolean) : [];
                        const dimmed = filterType && filterType !== sl.tipo;

                        return (
                          <div key={sk} className="mb-2 rounded-[18px] overflow-hidden border border-white/7 bg-[#111] transition-all"
                            style={{ opacity: dimmed ? 0.1 : 1 }}>
                            <div className="h-[2px]" style={{ background: `linear-gradient(90deg,${tm.color},${tm.color}00)` }} />
                            <div className="p-4">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[15px]">{sm.icon}</span>
                                  <div>
                                    <div className="text-[10px] font-semibold tracking-[.8px] uppercase" style={{ color: sm.color }}>{sm.label}</div>
                                    <div className="text-[11px] text-white/30">{sl.hora || sm.time}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-[4px] px-3 py-[5px] rounded-full border text-[10px] font-semibold"
                                  style={{ color:tm.color, borderColor:`${tm.color}44`, background:`${tm.color}0e` }}>
                                  <span>{tm.icon}</span><span>{tm.label}</span>
                                </div>
                              </div>

                              <div className="text-[28px] leading-none mb-2">{getEmoji(sl.tipo, dn + ["manana","mediodia","noche"].indexOf(sk))}</div>
                              <div className="text-[15px] font-semibold leading-[1.4] text-white/90 mb-3 tracking-[-0.2px]">{sl.titulo}</div>

                              {pp && (
                                <div className="inline-flex items-center gap-[5px] px-[10px] py-1 rounded-[7px] border text-[9px] font-semibold tracking-[1px] uppercase mb-3"
                                  style={{ color:pp.color, borderColor:`${pp.color}25`, background:`${pp.color}0a` }}>
                                  <div className="w-[5px] h-[5px] rounded-full" style={{ background:pp.color, boxShadow:`0 0 5px ${pp.color}` }} />
                                  {pp.label}
                                </div>
                              )}

                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {tags.slice(0,3).map(h => <span key={h} className="text-[10px] px-2 py-1 rounded-md bg-[#1c1c1e] border border-[#2c2c2e] text-[#636366]">{h}</span>)}
                                  {tags.length > 3 && <span className="text-[10px] px-2 py-1 rounded-md bg-[#1c1c1e] border border-[#2c2c2e] text-[#636366]">+{tags.length-3}</span>}
                                </div>
                              )}

                              {sl.notas && (
                                <div className="flex gap-2 bg-[#1a1a1a] rounded-[10px] p-3 mb-3">
                                  <span className="text-[12px]">📝</span>
                                  <span className="text-[11px] text-[#636366] leading-[1.5]">{sl.notas}</span>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => openPreview(dn, sk)}
                                  className="flex-[2] flex items-center justify-center gap-2 py-[10px] rounded-[12px] border text-[12px] font-semibold transition-all active:scale-[.97]"
                                  style={{ color:tm.color, borderColor:`${tm.color}44`, background:`${tm.color}10` }}>
                                  <span>✦</span>
                                  <span>Ver publicación lista</span>
                                  <span className="text-[9px] opacity-60 bg-white/5 px-[6px] py-[2px] rounded">IA</span>
                                </button>
                                <button
                                  onClick={() => openEdit(dn, sk)}
                                  className="w-12 flex items-center justify-center py-[10px] rounded-[12px] bg-[#1c1c1e] border border-[#2c2c2e] text-[#636366] text-base transition-all active:scale-[.97]">
                                  ✎
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* ══════════ HOOKS VIEW ══════════ */}
        {view === "hooks" && (
          <div className="px-4 pt-6">
            <div className="mb-6">
              <div className="text-[22px] font-bold mb-1">⚡ Generador de Hooks</div>
              <div className="text-[13px] text-white/40">15 hooks virales para detener el scroll</div>
            </div>

            <button
              onClick={async () => {
                setHooksLoading(true); setHooks("");
                try { setHooks(await generateHooks()); }
                catch { setHooks("Error al generar. Verifica la conexión."); }
                finally { setHooksLoading(false); }
              }}
              disabled={hooksLoading}
              className="w-full py-4 rounded-2xl font-bold text-[14px] tracking-[.5px] mb-6 transition-all active:scale-[.98]"
              style={{ background: `linear-gradient(135deg,${C.cyan}20,${C.pink}20)`, border:`1px solid ${C.cyan}44`, color:C.cyan }}>
              {hooksLoading ? "⚡ Generando hooks..." : "⚡ Generar 15 Hooks Virales"}
            </button>

            {hooksLoading && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <div className="w-2 h-2 rounded-full bg-[#00f0ff] ai-dot" />
                <div className="w-2 h-2 rounded-full bg-[#00f0ff] ai-dot" style={{ animationDelay:".2s" }} />
                <div className="w-2 h-2 rounded-full bg-[#00f0ff] ai-dot" style={{ animationDelay:".4s" }} />
                <span className="text-[13px] text-white/40">Generando...</span>
              </div>
            )}

            {hooks && !hooksLoading && (
              <div className="space-y-3">
                {hooks.split("\n").filter(l => l.trim()).map((line, i) => (
                  <div key={i}
                    onClick={() => copyText(line.replace(/^\d+\.\s*/,""))}
                    className="bg-[#111] border border-white/7 rounded-2xl p-4 cursor-pointer transition-all active:scale-[.98] hover:border-white/15">
                    <div className="text-[14px] font-medium leading-[1.5] text-white/85">{line}</div>
                    <div className="text-[10px] text-white/20 mt-2 tracking-[1px]">TAP PARA COPIAR</div>
                  </div>
                ))}
                <button onClick={() => copyText(hooks)} className="w-full py-3 rounded-2xl border border-[#2c2c2e] bg-[#111] text-[12px] font-semibold text-[#636366] mt-2 transition-all active:scale-[.97]">
                  📋 Copiar todos los hooks
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════ REELS VIEW ══════════ */}
        {view === "reels" && (
          <div className="px-4 pt-6">
            <div className="mb-6">
              <div className="text-[22px] font-bold mb-1">🎬 Generador de Guiones</div>
              <div className="text-[13px] text-white/40">Guión completo de Reel listo para grabar</div>
            </div>

            <div className="mb-4">
              <div className="text-[10px] tracking-[2px] text-[#636366] uppercase mb-2">Tema del Reel</div>
              <input
                value={reelTopic}
                onChange={e => setReelTopic(e.target.value)}
                placeholder="Ej: ¿Qué es el observador interno?"
                className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl px-4 py-3 text-[15px] text-white outline-none"
                style={{ fontFamily:"inherit" }}
              />
            </div>

            {/* Quick topics */}
            <div className="mb-5">
              <div className="text-[10px] tracking-[2px] text-[#636366] uppercase mb-2">Temas rápidos</div>
              <div className="flex flex-wrap gap-2">
                {["Metacognición para principiantes","El piloto automático mental","Cómo salir del modo automático","Neuroplasticidad en 60 segundos","El estado de flujo","Tu observador interno"].map(t=>(
                  <button key={t} onClick={() => setReelTopic(t)}
                    className="text-[11px] px-3 py-[6px] rounded-full border border-[#2c2c2e] bg-[#1c1c1e] text-[#636366] transition-all active:border-[#00f0ff] active:text-[#00f0ff]">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={async () => {
                if (!reelTopic.trim()) { showToast("Escribe un tema primero"); return; }
                setReelLoading(true); setReelScript("");
                try { setReelScript(await generateReelScript(reelTopic)); }
                catch { setReelScript("Error al generar. Verifica la conexión."); }
                finally { setReelLoading(false); }
              }}
              disabled={reelLoading}
              className="w-full py-4 rounded-2xl font-bold text-[14px] tracking-[.5px] mb-6 transition-all active:scale-[.98]"
              style={{ background:`linear-gradient(135deg,${C.pink}20,${C.purple}20)`, border:`1px solid ${C.pink}44`, color:C.pink }}>
              {reelLoading ? "🎬 Generando guión..." : "🎬 Generar Guión Completo"}
            </button>

            {reelLoading && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <div className="w-2 h-2 rounded-full bg-[#ff375f] ai-dot" />
                <div className="w-2 h-2 rounded-full bg-[#ff375f] ai-dot" style={{ animationDelay:".2s" }} />
                <div className="w-2 h-2 rounded-full bg-[#ff375f] ai-dot" style={{ animationDelay:".4s" }} />
                <span className="text-[13px] text-white/40">Escribiendo guión...</span>
              </div>
            )}

            {reelScript && !reelLoading && (
              <div className="bg-[#111] border border-white/7 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="text-[10px] tracking-[2px] text-[#636366] uppercase">Guión</span>
                  <span className="text-[9px] px-2 py-1 rounded-lg text-[#ff375f] border border-[#ff375f]/30 bg-[#ff375f]/10">✦ IA</span>
                </div>
                <div className="p-4 text-[13px] text-white/80 leading-[1.7] whitespace-pre-wrap">{reelScript}</div>
                <button onClick={() => copyText(reelScript)} className="w-full py-3 border-t border-white/5 text-[12px] font-semibold text-[#636366] bg-transparent transition-all hover:text-white">
                  📋 Copiar guión completo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════ PREVIEW MODAL ══════════ */}
      {previewModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-end fade-in"
          onClick={e => { if(e.target === e.currentTarget) setPreviewModal(null); }}>
          <div className="w-full max-w-[430px] mx-auto bg-[#000] border-t border-white/10 rounded-[22px_22px_0_0] pb-10 max-h-[95vh] overflow-y-auto slide-up">
            <div className="w-9 h-1 bg-[#2c2c2e] rounded mx-auto mt-3 mb-0" />

            {/* Header */}
            <div className="flex justify-between items-start px-5 py-4 border-b border-white/5">
              <div>
                <div className="text-[10px] tracking-[2px] uppercase font-semibold mb-1" style={{ color: psm?.color }}>{psm?.icon} {psm?.label} · Día {previewModal.day}</div>
                <div className="text-[16px] font-semibold text-white/90 max-w-[260px] leading-[1.3]">{pm?.slot?.titulo?.slice(0,55)}{(pm?.slot?.titulo?.length??0)>55?"…":""}</div>
              </div>
              <button onClick={()=>setPreviewModal(null)} className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-[10px] px-3 py-2 text-[#636366] text-base flex-shrink-0">✕</button>
            </div>

            {/* IG Mockup */}
            <div className="mx-4 mt-4 mb-4 rounded-2xl overflow-hidden border border-white/7 bg-[#111]">
              <div className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: ptm ? `linear-gradient(135deg,${ptm.color},${ptm.color}66)` : "#333" }}>
                  {getEmoji(pm?.slot?.tipo ?? "", previewModal.day)}
                </div>
                <div>
                  <div className="text-[13px] font-bold">tu_cuenta</div>
                  <div className="text-[11px] text-[#636366]">@supraconciencia</div>
                </div>
                <div className="ml-auto text-[#636366] text-lg">···</div>
              </div>

              {/* Media */}
              <div className={`bg-black flex items-center justify-center flex-col gap-4 relative overflow-hidden ${pm?.slot?.tipo==="REEL"||pm?.slot?.tipo==="STORY" ? "aspect-[9/16] max-h-[340px]" : "aspect-square"}`}
                style={{ background: `linear-gradient(160deg,#0a0a0a,${ptm?.color ?? "#111"}12,#000)` }}>
                <div className="absolute top-3 right-3 text-[9px] font-bold px-2 py-1 rounded-xl border" style={{ color:ptm?.color, borderColor:`${ptm?.color}44`, background:`${ptm?.color}20` }}>{ptm?.icon} {ptm?.label}</div>
                <div className="text-[56px]">{getEmoji(pm?.slot?.tipo ?? "", previewModal.day)}</div>
                <div className="text-[14px] font-semibold text-white/70 text-center px-8 leading-[1.4] max-w-[90%]">{pm?.slot?.titulo}</div>
              </div>

              <div className="flex items-center gap-4 px-4 pt-3 pb-2">
                <span className="text-xl">🤍</span><span className="text-xl">💬</span><span className="text-xl">✈️</span>
                <span className="ml-auto text-xl">🔖</span>
              </div>
              <div className="text-[13px] font-bold px-4 mb-1">1.247 Me gusta</div>
              <div className="text-[13px] px-4 pb-4 text-white/90 leading-[1.5]">
                <strong>tu_cuenta</strong> {aiLoading ? "Generando..." : mainContent.slice(0,180)}{!aiLoading&&mainContent.length>180&&<span className="text-[#636366]">... ver más</span>}
                {hashtagsFromAI&&!aiLoading&&<div className="text-[#0095f6] text-[12px] mt-1">{hashtagsFromAI.split(/\s+/).slice(0,6).join(" ")}</div>}
              </div>
            </div>

            {/* Caption */}
            <div className="mx-4 mb-3 bg-[#111] rounded-2xl overflow-hidden border border-white/7">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="text-[10px] tracking-[2px] text-[#636366] uppercase">Caption completo</span>
                <span className="text-[9px] px-2 py-1 rounded-lg text-[#00f0ff] border border-[#00f0ff]/30 bg-[#00f0ff]/10">✦ IA</span>
              </div>
              {aiLoading ? (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-[6px] h-[6px] rounded-full bg-[#636366] ai-dot" />
                  <div className="w-[6px] h-[6px] rounded-full bg-[#636366] ai-dot" style={{ animationDelay:".2s" }} />
                  <div className="w-[6px] h-[6px] rounded-full bg-[#636366] ai-dot" style={{ animationDelay:".4s" }} />
                  <span className="text-[13px] text-white/40">Generando publicación…</span>
                </div>
              ) : (
                <>
                  <div className="p-4 text-[13px] text-white/80 leading-[1.7] whitespace-pre-wrap">{mainContent}</div>
                  <button onClick={()=>copyText(mainContent+(hashtagsFromAI?"\n\n"+hashtagsFromAI:""))} className="w-full py-3 border-t border-white/5 text-[12px] font-semibold text-[#636366] bg-transparent hover:text-white transition-all">
                    📋 Copiar caption completo
                  </button>
                </>
              )}
            </div>

            {/* Hashtags */}
            {!aiLoading && hashtagsFromAI && (
              <div className="mx-4 mb-3 bg-[#111] rounded-2xl overflow-hidden border border-white/7">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <span className="text-[10px] tracking-[2px] text-[#636366] uppercase">Hashtags</span>
                  <span className="text-[10px] text-[#636366]">{hashtagsFromAI.split(/\s+/).filter(t=>t.startsWith("#")).length} tags</span>
                </div>
                <div className="p-3 flex flex-wrap gap-[6px]">
                  {hashtagsFromAI.split(/\s+/).filter(t=>t.startsWith("#")).map((t,i)=>(
                    <span key={i} className="text-[11px] px-[10px] py-1 rounded-lg bg-[#1c1c1e] border border-[#2c2c2e] text-[#0095f6]">{t}</span>
                  ))}
                </div>
                <button onClick={()=>copyText(hashtagsFromAI)} className="w-full py-3 border-t border-white/5 text-[12px] font-semibold text-[#636366] bg-transparent hover:text-white transition-all">
                  📋 Copiar hashtags
                </button>
              </div>
            )}

            {/* Regen */}
            {!aiLoading && (
              <button onClick={async()=>{
                setAiContent(""); setAiLoading(true);
                try { setAiContent(await generatePost(previewModal.slot, previewModal.slotKey)); }
                catch { setAiContent("Error."); }
                finally { setAiLoading(false); }
              }} className="mx-4 w-[calc(100%-32px)] py-3 rounded-2xl border border-white/10 bg-white/4 text-[13px] font-semibold text-white/40 flex items-center justify-center gap-2">
                ↻ Regenerar contenido
              </button>
            )}
            <div className="h-4" />
          </div>
        </div>
      )}

      {/* ══════════ EDIT MODAL ══════════ */}
      {editModal && edit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-end fade-in"
          onClick={e => { if(e.target===e.currentTarget) setEditModal(null); }}>
          <div className="w-full max-w-[430px] mx-auto bg-[#111] border-t border-white/10 rounded-[22px_22px_0_0] pb-12 max-h-[92vh] overflow-y-auto slide-up">
            <div className="w-9 h-1 bg-[#2c2c2e] rounded mx-auto mt-3" />
            <div className="px-5 py-4 border-b border-[#1c1c1e] flex justify-between items-start">
              <div>
                <div className="text-[10px] tracking-[2px] uppercase font-semibold mb-1" style={{ color: etm?.color ?? C.cyan }}>Día {editModal.day} · {SLOTS[editModal.slotKey]?.label}</div>
                <div className="text-[48px] font-bold tracking-[-3px] leading-none" style={{ color: etm?.color ?? "#fff" }}>{String(editModal.day).padStart(2,"0")}</div>
              </div>
              <div className="flex flex-col items-end gap-2 mt-1">
                {etm && <div className="flex items-center gap-1 px-3 py-[6px] rounded-full border text-[11px] font-semibold" style={{ color:etm.color, borderColor:`${etm.color}44`, background:`${etm.color}10` }}>{etm.icon} {etm.label}</div>}
                <div className="text-[32px]">{getEmoji(edit.tipo??""  ,editModal.day)}</div>
              </div>
            </div>

            {[
              { label:"FORMATO", content:(
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(TYPES).map(([k,t])=>(
                    <button key={k} onClick={()=>setEdit(p=>p?{...p,tipo:k}:p)}
                      className="py-3 rounded-[14px] border text-[11px] font-semibold flex items-center justify-center gap-2 transition-all"
                      style={{ color:edit.tipo===k?t.color:"#48484a", borderColor:edit.tipo===k?`${t.color}55`:"#2c2c2e", background:edit.tipo===k?`${t.color}12`:"#1c1c1e" }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              )},
              { label:"PILAR", content:(
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PILLARS).map(([k,p])=>(
                    <button key={k} onClick={()=>setEdit(pr=>pr?{...pr,pilar:k}:pr)}
                      className="py-[10px] rounded-[13px] border text-[9px] font-semibold tracking-[1px] uppercase transition-all"
                      style={{ color:edit.pilar===k?p.color:"#48484a", borderColor:edit.pilar===k?`${p.color}44`:"#2c2c2e", background:edit.pilar===k?`${p.color}0e`:"#1c1c1e" }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              )},
              { label:"TÍTULO / IDEA", content:(
                <textarea value={edit.titulo} onChange={e=>setEdit(p=>p?{...p,titulo:e.target.value}:p)}
                  className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-[14px] px-4 py-3 text-[15px] text-white outline-none resize-none min-h-[84px] leading-[1.5]"
                  style={{ fontFamily:"inherit" }} />
              )},
              { label:"HORA", content:(
                <input type="time" value={edit.hora||SLOTS[editModal.slotKey]?.time||""} onChange={e=>setEdit(p=>p?{...p,hora:e.target.value}:p)}
                  className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-[12px] px-4 py-3 text-[14px] text-white outline-none"
                  style={{ fontFamily:"inherit" }} />
              )},
              { label:"HASHTAGS", content:(
                <input value={edit.hashtags} onChange={e=>setEdit(p=>p?{...p,hashtags:e.target.value}:p)} placeholder="#metacognicion #neuroplasticidad ..."
                  className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-[12px] px-4 py-3 text-[14px] text-white outline-none"
                  style={{ fontFamily:"inherit" }} />
              )},
              { label:"NOTAS DE PRODUCCIÓN", content:(
                <textarea value={edit.notas} onChange={e=>setEdit(p=>p?{...p,notas:e.target.value}:p)}
                  className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-[14px] px-4 py-3 text-[14px] text-white outline-none resize-none min-h-[60px] leading-[1.5]"
                  style={{ fontFamily:"inherit" }} />
              )},
            ].map(({ label, content }) => (
              <div key={label} className="px-5 mt-5">
                <div className="text-[10px] tracking-[2px] text-[#636366] uppercase mb-2">{label}</div>
                {content}
              </div>
            ))}

            <div className="flex gap-2 px-5 mt-6">
              <button onClick={saveEdit}
                className="flex-1 py-4 rounded-[14px] font-bold text-[13px] tracking-[.5px] transition-all active:scale-[.97]"
                style={{ background:etm?`${etm.color}15`:"#1c1c1e", border:`1px solid ${etm?etm.color+"44":"#2c2c2e"}`, color:etm?.color??"#fff" }}>
                ✓ GUARDAR
              </button>
              <button onClick={()=>setEditModal(null)} className="py-4 px-5 rounded-[14px] bg-[#1c1c1e] border border-[#2c2c2e] text-[#636366] text-lg transition-all active:scale-[.97]">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1c1c1e] border rounded-[22px] px-5 py-3 text-[13px] font-semibold z-[300] whitespace-nowrap fade-in"
          style={{ borderColor: toast.includes("Copiad") ? `${C.cyan}44` : `${C.green}44`, color: toast.includes("Copiad") ? C.cyan : C.green }}>
          {toast}
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-black/95 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-[430px] mx-auto flex">
          {([["calendar","📅","Calendario"],["hooks","⚡","Hooks"],["reels","🎬","Guiones"]] as const).map(([v,ic,lb])=>(
            <button key={v} onClick={()=>setView(v)} className="flex-1 py-3 flex flex-col items-center gap-1 transition-all">
              <span className="text-[20px]">{ic}</span>
              <span className="text-[10px] tracking-[.5px]" style={{ color: view===v ? C.cyan : "#636366" }}>{lb}</span>
            </button>
          ))}
        </div>
        <div className="h-safe" style={{ height:"env(safe-area-inset-bottom)" }} />
      </div>
    </div>
  );
}
