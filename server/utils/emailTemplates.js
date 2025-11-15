const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')

const cache = new Map()

const load = (name) => {
  if (cache.has(name)) return cache.get(name)
  const file = path.join(__dirname, '..', 'templates', `${name}.hbs`)
  const src = fs.readFileSync(file, 'utf8')
  const tpl = Handlebars.compile(src)
  cache.set(name, tpl)
  return tpl
}

const render = (name, model) => {
  const tpl = load(name)
  return tpl(model || {})
}

module.exports = { render }

