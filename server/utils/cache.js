const { createClient } = require('redis')

let redis = null
let memory = new Map()

const init = async () => {
  try {
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      redis = createClient({
        url: process.env.REDIS_URL || undefined,
        socket: process.env.REDIS_HOST ? { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379') } : undefined
      })
      redis.on('error', (err) => {
        redis = null
      })
      await redis.connect()
    }
  } catch (_) {
    redis = null
  }
}

init()

const keyFor = (ns, id) => `${ns}:${id}`

const get = async (ns, id) => {
  const key = keyFor(ns, id)
  if (redis) {
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  }
  const entry = memory.get(key)
  if (!entry) return null
  const { value, expires } = entry
  if (Date.now() > expires) {
    memory.delete(key)
    return null
  }
  return value
}

const set = async (ns, id, value, ttlSec = 30) => {
  const key = keyFor(ns, id)
  if (redis) {
    await redis.set(key, JSON.stringify(value), { EX: ttlSec })
    return
  }
  memory.set(key, { value, expires: Date.now() + ttlSec * 1000 })
}

const wrap = async (ns, id, ttlSec, fn) => {
  const cached = await get(ns, id)
  if (cached) return { data: cached, cached: true }
  const data = await fn()
  await set(ns, id, data, ttlSec)
  return { data, cached: false }
}

module.exports = { get, set, wrap }

