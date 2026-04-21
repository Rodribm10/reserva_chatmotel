// Resolve o tenant slug a partir do hostname.
// Prod:   https://prime.reserva.fazer.ai  → slug = "prime"
// Dev:    http://localhost:5180           → fallback VITE_DEFAULT_TENANT_SLUG
// Cloudflared tunnel: *.trycloudflare.com → fallback VITE_DEFAULT_TENANT_SLUG

export function resolveTenantSlug(): string {
  const defaultSlug = import.meta.env.VITE_DEFAULT_TENANT_SLUG || 'grupo-1001'

  if (typeof window === 'undefined') {
    return defaultSlug
  }

  const host = window.location.hostname

  if (host === 'localhost' || host.startsWith('127.') || host.endsWith('.local')) {
    return defaultSlug
  }

  if (
    host.endsWith('.trycloudflare.com') ||
    host.endsWith('.loca.lt') ||
    host.endsWith('.ngrok-free.dev') ||
    host.endsWith('.vercel.app')
  ) {
    return defaultSlug
  }

  // Dominios conhecidos do Grupo 1001 usam tenant "grupo-1001" (default).
  // Mudar aqui quando tiver multi-marca por subdominio.
  if (host.endsWith('.hoteis1001noites.com.br')) {
    return defaultSlug
  }

  const parts = host.split('.')
  return parts[0] || defaultSlug
}
