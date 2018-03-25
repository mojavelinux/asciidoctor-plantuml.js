/* global Opal */
const plantumlEncoder = require('plantuml-encoder')

function createImageSrc (serverUrl, shouldFetch, target, outdir, text) {
  let diagramUrl = `${serverUrl}/png/${plantumlEncoder.encode(text)}`
  if (shouldFetch) {
    diagramUrl = require('./fetch').save(diagramUrl, target, outdir)
  }
  return diagramUrl
}

function plantumlBlock () {
  this.named('plantuml')
  this.onContext('listing')
  this.positionalAttributes('target')
  this.process((parent, reader, attrs) => {
    const doc = parent.getDocument()
    const diagramText = reader.getLines().join('\n')
    const serverUrl = doc.getAttribute('plantuml-server-url')
    const role = Opal.hash_get(attrs, 'role')
    const blockId = Opal.hash_get(attrs, 'id')

    if (serverUrl) {
      const target = Opal.hash_get(attrs, 'target')
      const shouldFetch = doc.isAttribute('plantuml-fetch-diagram')
      const imagesOutDir = doc.getAttribute('imagesoutdir')
      const imageUrl = createImageSrc(serverUrl, shouldFetch, target, imagesOutDir, diagramText)
      const blockAttrs = {role: role ? `${role} plantuml` : 'plantuml', target: imageUrl, alt: target || 'diagram'}
      if (blockId) blockAttrs.id = blockId
      return this.createImageBlock(parent, blockAttrs)
    } else {
      console.warn('Skipping plantuml block. PlantUML Server URL not defined in :plantuml-server-url: attribute.')
      Opal.hash_put(attrs, 'role', role ? `${role} plantuml-error` : 'plantuml-error')
      return this.createBlock(parent, 'listing', diagramText, attrs)
    }
  })
}

module.exports.register = function register (registry) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block(plantumlBlock)
    })
  } else if (typeof registry.block === 'function') {
    registry.block('plantuml', plantumlBlock)
  }
  return registry
}
