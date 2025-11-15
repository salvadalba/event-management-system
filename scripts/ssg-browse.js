const fs = require('fs')
const path = require('path')
const fetch = require('cross-fetch')

const base = process.env.PUBLIC_BASE_URL || 'http://localhost:5000'

async function run() {
  const res = await fetch(`${base}/api/public/events?limit=24`)
  const json = await res.json().catch(() => ({ data: { events: [] } }))
  const events = json?.data?.events || []
  const items = events.map(e => `
    <div class="card">
      <div class="card-body">
        <h3>${e.title}</h3>
        <p>${e.shortDescription || ''}</p>
        <div>${e.venue?.city || ''}, ${e.venue?.country || ''}</div>
        <div>${new Date(e.startDate).toLocaleString()}</div>
      </div>
    </div>
  `).join('\n')

  let cssHref = '/assets/index.css'
  try {
    const buildIndex = fs.readFileSync(path.join(__dirname, '..', 'client', 'build', 'index.html'), 'utf8')
    const m = buildIndex.match(/href="(\/assets\/index-[^"]+\.css)"/)
    if (m) cssHref = m[1]
  } catch (_) {}

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Browse Events</title>
  <link rel="stylesheet" href="${cssHref}"></head><body>
  <div class="container"><h1>Browse Events</h1><div class="grid grid-cols-1 md:grid-cols-3 gap-6">${items}</div></div>
  </body></html>`

  const out = path.join(__dirname, '..', 'client', 'public', 'browse.html')
  fs.writeFileSync(out, html)
  console.log('Generated', out)
}

run().catch(err => { console.error(err); process.exit(1) })
