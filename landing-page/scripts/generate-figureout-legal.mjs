import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { pages, site } from '../legal/figureout.mjs';

export const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const pagePath = slug => `/figureout${slug ? '/' + slug : ''}`;
export function render(page) {
  const e = escapeHTML;
  const sections = page.sections.map((section, index) => `<section aria-labelledby="section-${index}"><h2 id="section-${index}">${e(section.title)}</h2>${(section.paragraphs ?? []).map(p => `<p>${e(p)}</p>`).join('')}${section.items ? `<ul>${section.items.map(p => `<li>${e(p)}</li>`).join('')}</ul>` : ''}${section.steps ? `<ol>${section.steps.map(p => `<li>${e(p)}</li>`).join('')}</ol>` : ''}${(section.links ?? []).map(link => `<p><a href="${e(link.href)}">${e(link.label)}</a></p>`).join('')}</section>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(page.title)} · Figureout</title><meta name="description" content="${e(page.intro)}"><link rel="canonical" href="${site.origin}${pagePath(page.slug)}"><meta name="theme-color" content="#faf8f3"><style>
  *{box-sizing:border-box}body{margin:0;background:#faf8f3;color:#252a34;font:17px/1.7 system-ui,-apple-system,sans-serif}a{color:#754120;text-underline-offset:4px}a:hover{text-decoration-thickness:2px}a:focus-visible{outline:3px solid #315bd5;outline-offset:4px}header,main,footer{max-width:840px;margin:auto;padding:24px}header{border-bottom:1px solid #ddd8cd}header a{font-weight:700}nav{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:18px;font-size:15px}nav a[aria-current=page]{font-weight:800}h1{font-size:clamp(30px,6vw,46px);line-height:1.15;letter-spacing:-1.5px;margin:20px 0}h2{font-size:23px;line-height:1.3;margin:36px 0 12px}p,li{overflow-wrap:anywhere}p{margin:12px 0}li{margin:10px 0}ul,ol{padding-left:24px}.eyebrow{font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#696357}.intro{font-size:19px}.meta{font-size:14px;color:#615e58}.contact{background:#fff;border:1px solid #ddd8cd;border-radius:18px;padding:20px;margin:24px 0}.skip{position:absolute;top:-80px}.skip:focus{top:0;background:white;padding:12px}footer{border-top:1px solid #ddd8cd;font-size:14px;margin-top:32px} @media(prefers-reduced-motion:no-preference){a{transition:color .15s}} @media print{nav,.skip{display:none}body{background:white}a{color:inherit}}
  </style></head><body><a class="skip" href="#main">Skip to content</a><header><a href="/">AXPO Creations</a><nav aria-label="Figureout information">${pages.map(p => `<a href="${pagePath(p.slug)}"${p.slug === page.slug ? ' aria-current="page"' : ''}>${e(p.label)}</a>`).join('')}</nav></header><main id="main"><div class="eyebrow">${e(site.app)}</div><h1>${e(page.title)}</h1><p class="meta">Updated ${e(site.updated)} · ${e(site.operator)}</p><p class="intro">${e(page.intro)}</p><aside class="contact" aria-label="Contact Figureout">Questions? <a href="mailto:${site.email}?subject=Figureout%20${page.slug === 'account-deletion' ? 'account%20deletion' : 'support'}">${site.email}</a></aside>${sections}</main><footer>© ${new Date().getFullYear()} ${e(site.operator)}. <a href="/figureout/support">Contact Figureout</a> · <a href="/figureout/privacy-policy">Privacy</a> · <a href="/figureout/terms-of-service">Terms</a></footer></body></html>`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const page of pages) {
    const dir = new URL(`../public/figureout/${page.slug ? page.slug + '/' : ''}`, import.meta.url);
    await mkdir(dir, { recursive: true });
    await writeFile(new URL('index.html', dir), render(page));
  }
  console.log(`Generated ${pages.length} Figureout pages (readable without JavaScript).`);
}
