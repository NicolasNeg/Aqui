'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { SectionMarker } from '@/components/SectionMarker';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ================ HERO ================ */}
      <section
        className="relative overflow-hidden"
        style={{ background: '#0F1B2E', color: '#FFFFFF' }}
      >
        {/* Top bar */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-6 pb-4 flex items-center justify-between">
          <Logo size="sm" onDark />
          <Link href="/admin" className="text-xs text-white/70 hover:text-white" style={{ letterSpacing: '0.05em' }}>
            Panel admin →
          </Link>
        </div>

        {/* Decorative network illustration */}
        <svg
          className="absolute right-0 top-16 w-[300px] sm:w-[460px] h-[300px] sm:h-[460px] opacity-90 pointer-events-none"
          viewBox="0 0 460 460"
        >
          <defs>
            <radialGradient id="pulseG" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E63946" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#E63946" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#E63946" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none">
            <path d="M 50 100 Q 150 80 230 230" />
            <path d="M 410 80 Q 350 180 230 230" />
            <path d="M 60 380 Q 130 320 230 230" />
            <path d="M 400 380 Q 320 320 230 230" />
            <path d="M 230 50 L 230 230" />
            <path d="M 230 230 L 230 410" />
          </g>
          <g fill="rgba(255,255,255,0.25)">
            <circle cx="50" cy="100" r="5" />
            <circle cx="410" cy="80" r="5" />
            <circle cx="60" cy="380" r="5" />
            <circle cx="400" cy="380" r="5" />
            <circle cx="230" cy="50" r="5" />
            <circle cx="230" cy="410" r="5" />
          </g>
          <circle cx="230" cy="230" r="100" fill="url(#pulseG)" />
          <g transform="translate(230 230)">
            <path
              d="M 0 -55 C -28 -55 -45 -32 -45 -8 C -45 22 0 70 0 70 C 0 70 45 22 45 -8 C 45 -32 28 -55 0 -55 Z"
              fill="#E63946"
            />
            <circle cx="0" cy="-12" r="14" fill="#FFFFFF" />
          </g>
          <g transform="translate(230 320)">
            <text
              textAnchor="middle"
              fill="rgba(255,255,255,0.7)"
              fontFamily="Inter, sans-serif"
              fontSize="11"
              fontWeight="700"
              letterSpacing="3"
            >
              USTED ESTÁ AQUÍ
            </text>
          </g>
        </svg>

        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 relative">
          <div className="max-w-3xl">
            <div
              className="text-xs sm:text-sm font-bold uppercase mb-6"
              style={{ color: '#E63946', letterSpacing: '0.22em' }}
            >
              Sistema de navegación · Información · Acceso
            </div>
            <h1
              className="font-extrabold leading-[0.88] tracking-tight mb-8"
              style={{ fontSize: 'clamp(72px, 12vw, 132px)' }}
            >
              Aqu<span style={{ color: '#E63946' }}>í.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 leading-snug max-w-xl mb-10" style={{ letterSpacing: '-0.01em' }}>
              El sistema que <strong className="text-white font-semibold">guía, informa y controla acceso</strong> en cualquier espacio — desde una boda hasta un festival masivo. Sin apps. Sin instalaciones. Solo QR.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/v/demo"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm"
                style={{ background: '#E63946', color: '#FFFFFF' }}
              >
                Probar la demo
                <span>→</span>
              </Link>
              <Link
                href="/v/boda-demo"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
              >
                Ver caso de boda
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pb-8 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 text-xs text-white/60">
          <div>
            <div className="text-white font-semibold mb-1">Sin instalar</div>
            <div>Funciona en cualquier celular</div>
          </div>
          <div>
            <div className="text-white font-semibold mb-1">Listo en días</div>
            <div>No meses como una app</div>
          </div>
          <div>
            <div className="text-white font-semibold mb-1">Multi-idioma</div>
            <div>Tu evento internacional</div>
          </div>
          <div>
            <div className="text-white font-semibold mb-1">Acceso seguro</div>
            <div>QRs personales validados</div>
          </div>
        </div>
      </section>

      {/* ================ 3 PILARES ================ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <SectionMarker num="01" label="La solución" />
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
          Un QR. Tres <span style={{ color: '#E63946' }}>superpoderes</span>.
        </h2>
        <p className="text-base text-warm-700 max-w-2xl mb-12">
          Aquí no es solo otro lector de QR. Es un sistema completo que reemplaza tres herramientas separadas — el mapa, el folleto y el control de acceso — con una sola experiencia.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="surface-warm p-7 rounded-xl">
            <div className="text-xs font-bold mb-3" style={{ color: '#E63946', letterSpacing: '0.18em' }}>
              01 / NAVEGACIÓN
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ letterSpacing: '-0.02em' }}>Navega</h3>
            <p className="text-sm text-warm-700 leading-relaxed">
              Escanea el QR &quot;Usted está aquí&quot; y ve dónde estás. Elige a dónde ir. El sistema traza tu ruta y te guía con flechas 3D usando la cámara del celular y el GPS.
            </p>
          </div>

          <div className="surface-warm p-7 rounded-xl">
            <div className="text-xs font-bold mb-3" style={{ color: '#E63946', letterSpacing: '0.18em' }}>
              02 / INFORMACIÓN
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ letterSpacing: '-0.02em' }}>Informa</h3>
            <p className="text-sm text-warm-700 leading-relaxed">
              Cada lugar tiene su propio contenido: horarios, descripción, fotos, audio, video, redes sociales, links. El QR convierte cualquier rincón en un punto de información rico.
            </p>
          </div>

          <div className="p-7 rounded-xl" style={{ background: '#0F1B2E', color: '#FFFFFF' }}>
            <div className="text-xs font-bold mb-3" style={{ color: '#E63946', letterSpacing: '0.18em' }}>
              03 / ACCESO
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white" style={{ letterSpacing: '-0.02em' }}>Controla</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Cada invitado tiene su QR personal e intransferible. Al llegar, lo escaneas y verificas: ¿es válido?, ¿ya entró?, ¿qué nivel de acceso tiene? Sin colados.
            </p>
          </div>
        </div>
      </section>

      {/* ================ CÓMO FUNCIONA ================ */}
      <section className="bg-warm-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <SectionMarker num="02" label="Cómo funciona" />
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
            Cuatro pasos. <span style={{ color: '#E63946' }}>Cero fricción.</span>
          </h2>
          <p className="text-base text-warm-700 max-w-2xl mb-12">
            El visitante no necesita instrucciones. La experiencia se diseñó para ser obvia desde el segundo uno.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { n: '01', title: 'Escanea el QR físico', desc: 'Con la cámara nativa del celular. Sin app.' },
              { n: '02', title: 'Ve dónde estás', desc: 'El sistema te ubica al instante.' },
              { n: '03', title: 'Elige destino', desc: 'Ruta calculada con tiempo a pie.' },
              { n: '04', title: 'Sigue la flecha', desc: 'AR con flecha 3D hacia tu destino.' }
            ].map((step) => (
              <div key={step.n} className="p-5 bg-white rounded-xl border border-warm-100">
                <div className="text-xs font-bold mb-3" style={{ color: '#E63946', letterSpacing: '0.18em' }}>
                  PASO {step.n}
                </div>
                <h3 className="text-base font-bold mb-2 leading-tight">{step.title}</h3>
                <p className="text-xs text-warm-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================ USE CASES ================ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <SectionMarker num="03" label="Casos de uso" />
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.035em' }}>
          Donde la gente <span style={{ color: '#E63946' }}>se reúne</span>.
        </h2>
        <p className="text-base text-warm-700 max-w-2xl mb-12">
          Eventos masivos, privados, recurrentes, únicos. Espacios permanentes con visitas diarias. Si necesitas que la gente sepa dónde está y a dónde ir, esto es para ti.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { emoji: '💌', name: 'Bodas y XV', tag: 'Privado' },
            { emoji: '🎪', name: 'Festivales', tag: 'Masivo' },
            { emoji: '🏛️', name: 'Museos', tag: 'Permanente' },
            { emoji: '🏨', name: 'Hoteles', tag: 'Permanente' },
            { emoji: '🏥', name: 'Hospitales', tag: 'Permanente' },
            { emoji: '🛍️', name: 'Centros comerciales', tag: 'Permanente' },
            { emoji: '🎓', name: 'Escuelas', tag: 'Permanente' },
            { emoji: '🎭', name: 'Eventos corporativos', tag: 'Privado' }
          ].map((u) => (
            <div key={u.name} className="surface p-4">
              <div className="text-2xl mb-2">{u.emoji}</div>
              <div className="text-sm font-bold">{u.name}</div>
              <div className="text-xs mt-1" style={{ color: '#E63946', letterSpacing: '0.12em' }}>{u.tag.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ================ CTA FINAL ================ */}
      <section style={{ background: '#0F1B2E', color: '#FFFFFF' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
          <h2
            className="font-extrabold leading-[0.92] tracking-tight mb-6 text-white"
            style={{ fontSize: 'clamp(48px, 9vw, 82px)', letterSpacing: '-0.05em' }}
          >
            El siguiente paso es <span style={{ color: '#E63946' }}>tuyo</span>.
          </h2>
          <p className="text-lg text-white/75 max-w-xl leading-snug mb-10">
            Prueba la demo en tu celular ahora. Si te convence, hablamos para hacer una versión personalizada para tu evento o espacio.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <Link
              href="/v/demo"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm"
              style={{ background: '#E63946', color: '#FFFFFF' }}
            >
              Abrir la demo
              <span>→</span>
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
            >
              Panel de administración
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/10">
            {[
              { n: '→ 01', title: 'Agenda una llamada', desc: '20 minutos. Sin presentación enlatada.' },
              { n: '→ 02', title: 'Recibe la demo', desc: 'Preconfigurada para tu caso.' },
              { n: '→ 03', title: 'Decide sin presión', desc: 'Si te convence, firmamos.' }
            ].map((s) => (
              <div key={s.n}>
                <div className="text-xs font-bold mb-3" style={{ color: '#E63946', letterSpacing: '0.18em' }}>{s.n}</div>
                <h4 className="text-lg font-semibold mb-2 text-white">{s.title}</h4>
                <p className="text-sm text-white/65 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
            <div>Aquí · Sistema de navegación, información y acceso</div>
            <div>Guanajuato · MX</div>
          </div>
        </div>
      </section>
    </main>
  );
}
