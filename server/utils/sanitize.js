const sanitizeHtml = require('sanitize-html')

const sanitize = (value) => {
  if (typeof value !== 'string') return value
  return sanitizeHtml(value, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'span'],
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      span: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false
  })
}

module.exports = sanitize

