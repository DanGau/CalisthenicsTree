export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export function el(html: string): HTMLElement {
  const t = document.createElement('template')
  t.innerHTML = html.trim()
  return t.content.firstElementChild as HTMLElement
}
