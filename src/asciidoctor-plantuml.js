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
  this.onContext('listing')
  this.positionalAttributes('target')
  this.process((parent, reader, attrs) => {
    const doc = parent.getDocument()
    let diagramText = reader.getString()
    if (!/^@start([a-z]+)\n[\s\S]*\n@end\1$/.test(diagramText)) {
      const diagramType = Opal.hash_get(attrs, 1)
      if (diagramType === 'plantuml') {
        diagramText = '@startuml\n' + diagramText + '\n@enduml'
      } else if (diagramType === 'ditaa') {
        diagramText = '@startditaa\n' + diagramText + '\n@endditaa'
      }
    }
    const serverUrl = doc.getAttribute('plantuml-server-url')
    let roles = Opal.hash_get(attrs, 'role')
    const blockId = Opal.hash_get(attrs, 'id')

    if (serverUrl) {
      const target = Opal.hash_get(attrs, 'target')
      const shouldFetch = doc.isAttribute('plantuml-fetch-diagram')
      const imagesOutDir = doc.getAttribute('imagesoutdir')
      const imageUrl = createImageSrc(serverUrl, shouldFetch, target, imagesOutDir, diagramText)
      const blockAttrs = {role: roles ? `${roles} plantuml` : 'plantuml', target: imageUrl, alt: target || 'diagram'}
      if (blockId) blockAttrs['id'] = blockId
      return this.createImageBlock(parent, blockAttrs, blockAttrs)
    } else {
      console.warn('Skipping plantuml block. PlantUML Server URL not defined in :plantuml-server-url: attribute.')
      Opal.hash_put(attrs, 'role', roles ? `${roles} plantuml-error` : 'plantuml-error')
      return this.createBlock(parent, 'listing', diagramText, attrs)
    }
  })
}

module.exports.register = function register (registry) {
  if (typeof registry.register === 'function') {
    registry.register(function () {
      this.block('plantuml', plantumlBlock)
      this.block('ditaa', plantumlBlock)
    })
  } else if (typeof registry.block === 'function') {
    registry.block('plantuml', plantumlBlock)
    registry.block('ditaa', plantumlBlock)
  }
  return registry
}
