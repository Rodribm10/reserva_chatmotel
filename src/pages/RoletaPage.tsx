import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { supabase } from '@/lib/supabase'
import { chatwootApi } from '@/lib/chatwootApi'

interface RevealResult {
  status: 'revealed' | 'expired'
  prize_nome: string
  prize_tipo: 'desconto_percentual' | 'brinde_fisico' | 'nada' | ''
  prize_valor: number | null
  code: string | null
  revealed_at: string | null
  total_blocos: number
  bloco_sorteado: number
}

interface DrawPrize {
  position: number
  nome: string
  tipo: 'desconto_percentual' | 'brinde_fisico' | 'nada'
  valor: number | null
}

interface DrawContext {
  marca_nome: string | null
  prizes: DrawPrize[]
}

// Paleta rica (tons joia) — gradientes dark→bright por slice
const PALETTE = [
  { from: '#1a4d3e', to: '#3f9e78' }, // esmeralda
  { from: '#6b1d3f', to: '#c4416c' }, // rubi
  { from: '#1e3d6b', to: '#4687c2' }, // safira
  { from: '#4a2a6b', to: '#8a5dc4' }, // ametista
  { from: '#6b4a1a', to: '#d4a140' }, // topázio
  { from: '#1a5a5a', to: '#3fa0a0' }, // turquesa
  { from: '#6b2a1a', to: '#c46548' }, // coral
  { from: '#3d2a6b', to: '#6b5dc4' }, // índigo
  { from: '#5a4a1a', to: '#c4a040' }, // âmbar
  { from: '#2a5a2a', to: '#5ab05a' }, // jade
]

type Phase = 'loading' | 'ready' | 'spinning' | 'done' | 'error'

function iconFor(tipo: DrawPrize['tipo']): string {
  if (tipo === 'desconto_percentual') return '%'
  if (tipo === 'brinde_fisico') return '🎁'
  return '🎲'
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export default function RoletaPage() {
  const { token } = useParams<{ token: string }>()
  const [phase, setPhase] = useState<Phase>('loading')
  const [context, setContext] = useState<DrawContext | null>(null)
  const [result, setResult] = useState<RevealResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!token || startedRef.current) return
    startedRef.current = true
    void (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error: rpcErr } = await (supabase as any).rpc('get_draw_context', {
          p_token: token,
        })
        if (rpcErr) throw new Error(rpcErr.message)
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Nenhum prêmio configurado pra essa marca')
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const marca = (data[0] as any).marca_nome ?? null
        const prizes: DrawPrize[] = data.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (r: any): DrawPrize => ({
            position: r.prize_position,
            nome: r.prize_nome,
            tipo: r.prize_tipo,
            valor: r.prize_valor,
          })
        )
        setContext({ marca_nome: marca, prizes })
        setPhase('ready')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Link inválido')
        setPhase('error')
      }
    })()
  }, [token])

  const startSpin = async () => {
    if (!context || phase !== 'ready') return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcErr } = await (supabase as any).rpc('reveal_draw', {
        p_token: token,
      })
      if (rpcErr) throw new Error(rpcErr.message)
      const row = Array.isArray(data) && data.length > 0 ? (data[0] as RevealResult) : null
      if (!row) throw new Error('Resposta vazia')
      if (row.status === 'expired') throw new Error('Essa roleta expirou.')
      setResult(row)

      // Drama pela desaceleração contínua (sem overshoot nem reversão):
      // Roda gira forte, vai perdendo velocidade GRADUALMENTE e termina crawlando MUITO devagar.
      // Nos últimos 1-1.5s cruza cada fronteira de slice bem lento — o cliente fica na dúvida
      // se vai passar pra próxima ou ficar na atual. Efeito "quase não passou".
      const N = row.total_blocos
      const K = row.bloco_sorteado
      const blockAngle = 360 / N
      // Posição aleatória DENTRO da slice vencedora (não sempre no centro).
      // Range [0.12, 0.88]: às vezes cai perto da borda (suspense real no crawl final),
      // às vezes no meio. Nunca nos ~12% da extremidade pra não ficar ambíguo.
      const offsetFactor = 0.12 + Math.random() * 0.76
      const targetAngle = 360 - (K * blockAngle + blockAngle * offsetFactor)
      const totalSpins = 8
      const finalRotation = totalSpins * 360 + targetAngle

      setPhase('spinning')
      setRotation(finalRotation)

      setTimeout(() => {
        setPhase('done')
        if (row.prize_tipo !== 'nada' && row.prize_tipo !== '') {
          confetti({ particleCount: 220, spread: 110, origin: { y: 0.55 } })
          setTimeout(() => confetti({ particleCount: 120, spread: 160, origin: { y: 0.6 } }), 400)
        }
        // Avisa o Chatwoot — Jasmine manda a msg automática.
        // Fire-and-forget: se falhar, não trava o cliente (cron de fallback cobre).
        if (token) {
          chatwootApi.notifyRouletteResult(token).catch((e) => {
            console.warn('Falha ao notificar Chatwoot:', e)
          })
        }
      }, 7500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro no sorteio')
      setPhase('error')
    }
  }

  const slices = useMemo(() => {
    if (!context) return []
    const N = context.prizes.length
    const angle = 360 / N
    return context.prizes.map((p, i) => ({
      ...p,
      color: PALETTE[i % PALETTE.length],
      rotation: i * angle,
      angle,
    }))
  }, [context])

  // Transição única com desaceleração agressiva no final.
  // cubic-bezier(0.04, 0.85, 0.08, 1): sai com velocidade MUITO alta (derivada inicial ~21),
  // e a curva achata dramaticamente perto do fim — nas últimas ~1.5s a roda está crawlando,
  // cruzando cada fronteira de slice bem devagar. Isso gera a dúvida natural "vai passar ou não?".
  const transitionStyle: React.CSSProperties = useMemo(() => {
    if (phase === 'spinning') {
      return {
        transitionDuration: '7000ms',
        transitionTimingFunction: 'cubic-bezier(0.04, 0.85, 0.08, 1)',
      }
    }
    return { transitionDuration: '0ms' }
  }, [phase])

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-serif text-3xl text-champagne">Ops!</h1>
          <p className="text-ivory">{error ?? 'Algo deu errado.'}</p>
        </div>
      </div>
    )
  }

  if (phase === 'loading' || !context) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ivory animate-pulse">Carregando...</div>
      </div>
    )
  }

  const showPrize = phase === 'done'
  const ganhou = showPrize && result && result.prize_tipo !== 'nada' && result.prize_tipo !== ''
  const N = slices.length
  // Font size scala com número de blocos (menos blocos = texto maior)
  const textFontSize = N <= 4 ? 7.5 : N <= 6 ? 6 : N <= 9 ? 5 : 4.2
  const maxLen = N <= 4 ? 16 : N <= 6 ? 12 : N <= 9 ? 10 : 8

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-obsidian via-midnight to-obsidian">
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 40px 4px rgba(212,165,116,0.35), 0 0 80px 12px rgba(212,165,116,0.15); }
          50% { box-shadow: 0 0 60px 8px rgba(212,165,116,0.55), 0 0 120px 20px rgba(212,165,116,0.25); }
        }
        @keyframes shakeWheel {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
        }
        @keyframes pointerBounce {
          0%   { transform: translateX(-50%) rotate(0deg) scale(1); }
          30%  { transform: translateX(-50%) rotate(-12deg) scale(1.1); }
          60%  { transform: translateX(-50%) rotate(8deg) scale(1.05); }
          100% { transform: translateX(-50%) rotate(0deg) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="text-center mb-8 space-y-2 max-w-xl">
        <p className="text-champagne/70 text-sm font-sans tracking-[0.3em] uppercase">
          {context.marca_nome ?? 'Grupo 1001'}
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-champagne drop-shadow-[0_2px_12px_rgba(212,165,116,0.3)]">
          Gira a Sorte
        </h1>
        <p className="text-ivory/80 min-h-[1.5rem]">
          {phase === 'ready' && 'Toca o botão e descobre seu prêmio.'}
          {phase === 'spinning' && 'Rodando...'}
          {phase === 'done' && ganhou && 'Parabéns! Você ganhou:'}
          {phase === 'done' && !ganhou && 'Dessa vez não rolou, mas a gente te espera 🫶'}
        </p>
      </header>

      {/* Roda + ponteiro */}
      <div className="relative w-[340px] h-[340px] md:w-[440px] md:h-[440px]">
        {/* Anel externo com glow pulsando quando ready */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            animation: phase === 'ready' ? 'pulseGlow 2.4s ease-in-out infinite' : undefined,
          }}
        />

        {/* Ponteiro */}
        <div
          className="absolute left-1/2 -top-6 z-20"
          style={{
            animation: phase === 'done' ? 'pointerBounce 600ms ease-out' : undefined,
            transform: 'translateX(-50%)',
          }}
        >
          <svg width="44" height="56" viewBox="0 0 44 56">
            <defs>
              <linearGradient id="pointerGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f5d99a" />
                <stop offset="60%" stopColor="#d4a574" />
                <stop offset="100%" stopColor="#8a6a3c" />
              </linearGradient>
              <filter id="pointerShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.55" />
              </filter>
            </defs>
            <path
              d="M 22 52 L 4 4 L 40 4 Z"
              fill="url(#pointerGrad)"
              stroke="#2a1e10"
              strokeWidth="1.5"
              filter="url(#pointerShadow)"
            />
            <circle cx="22" cy="12" r="3" fill="#f5d99a" opacity="0.8" />
          </svg>
        </div>

        {/* Círculo que gira */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            // shake removido — o overshoot+reversão já dá drama suficiente sem precisar de tremida
          }}
        >
          <div
            className="w-full h-full transition-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              ...transitionStyle,
            }}
          >
            <svg viewBox="-100 -100 200 200" className="w-full h-full">
              <defs>
                {slices.map((s, i) => (
                  <radialGradient key={`grad-${i}`} id={`slice-${i}`} cx="0.5" cy="0.5" r="0.9">
                    <stop offset="0%" stopColor={s.color.from} />
                    <stop offset="100%" stopColor={s.color.to} />
                  </radialGradient>
                ))}
                <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {slices.map((s, i) => {
                const startAngle = (s.rotation - 90) * (Math.PI / 180)
                const endAngle = (s.rotation + s.angle - 90) * (Math.PI / 180)
                const x1 = 100 * Math.cos(startAngle)
                const y1 = 100 * Math.sin(startAngle)
                const x2 = 100 * Math.cos(endAngle)
                const y2 = 100 * Math.sin(endAngle)
                const largeArc = s.angle > 180 ? 1 : 0
                const midAngle = s.rotation + s.angle / 2 - 90
                const midRad = midAngle * (Math.PI / 180)
                const tx = 62 * Math.cos(midRad)
                const ty = 62 * Math.sin(midRad)

                // Texto do prêmio: nome (curto) na linha 1, valor/ícone na linha 2
                const nome = truncate(s.nome, maxLen)
                const label2 =
                  s.tipo === 'desconto_percentual' && s.valor != null
                    ? `${Number(s.valor)}%`
                    : s.tipo === 'brinde_fisico'
                      ? iconFor(s.tipo)
                      : ''

                return (
                  <g key={i}>
                    <path
                      d={`M 0 0 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={`url(#slice-${i})`}
                      stroke="#f5d99a"
                      strokeWidth="0.6"
                      opacity="0.95"
                    />
                    <g transform={`rotate(${midAngle + 90} ${tx} ${ty})`}>
                      <text
                        x={tx}
                        y={ty - (label2 ? 3 : 0)}
                        fill="#ffffff"
                        fontSize={textFontSize}
                        fontWeight="700"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                        }}
                      >
                        {nome}
                      </text>
                      {label2 && (
                        <text
                          x={tx}
                          y={ty + textFontSize}
                          fill="#f5d99a"
                          fontSize={textFontSize * 1.15}
                          fontWeight="800"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                          }}
                        >
                          {label2}
                        </text>
                      )}
                    </g>
                  </g>
                )
              })}

              {/* Hub central decorativo */}
              <circle cx="0" cy="0" r="16" fill="#1a1a2e" stroke="#d4a574" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="10" fill="#2a2a44" stroke="#f5d99a" strokeWidth="1" />
              <circle cx="0" cy="0" r="4" fill="#f5d99a" />
            </svg>
          </div>
        </div>
      </div>

      {/* Botão */}
      {phase === 'ready' && (
        <button
          onClick={startSpin}
          className="mt-12 px-12 py-4 rounded-full bg-gradient-to-b from-[#f5d99a] via-[#d4a574] to-[#a07a48] text-obsidian font-sans font-bold text-lg tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-transform border-2 border-[#f5d99a]/60"
          style={{ boxShadow: '0 10px 30px rgba(212,165,116,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' }}
        >
          GIRAR
        </button>
      )}

      {/* Resultado */}
      {phase === 'done' && result && (
        <div
          className="mt-12 max-w-md w-full text-center space-y-4"
          style={{ animation: 'fadeInUp 500ms ease-out' }}
        >
          <div
            className={`rounded-2xl p-7 border-2 backdrop-blur ${
              ganhou
                ? 'border-champagne/60 bg-gradient-to-b from-champagne/10 to-champagne/5'
                : 'border-slate-600/40 bg-slate-600/10'
            }`}
          >
            <p className="text-3xl md:text-4xl font-serif text-champagne mb-2">{result.prize_nome}</p>
            {result.prize_tipo === 'desconto_percentual' && result.prize_valor != null && (
              <p className="text-ivory text-lg">
                <span className="text-champagne font-bold">{Number(result.prize_valor)}%</span> de
                desconto no saldo do check-in
              </p>
            )}
            {result.prize_tipo === 'brinde_fisico' && (
              <p className="text-ivory text-lg">Retire seu brinde na recepção 🎁</p>
            )}
            {ganhou && result.code && (
              <div className="mt-5 pt-5 border-t border-champagne/20">
                <p className="text-xs text-ivory/70 mb-2 tracking-widest uppercase">
                  Mostre esse código na recepção
                </p>
                <p className="text-4xl md:text-5xl font-mono tracking-[0.4em] text-champagne drop-shadow-[0_0_20px_rgba(212,165,116,0.5)]">
                  {result.code}
                </p>
              </div>
            )}
            {!ganhou && (
              <p className="text-ivory/80 text-sm mt-3">
                Guarda a sua próxima estadia pra rodar de novo 😉
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
