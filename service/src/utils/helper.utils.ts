export const minify = (data: any) => {
  let rawData = null
  if (typeof data === 'object') {
    rawData = data
  } else {
    rawData = data
      .replace(/\t|\n|\r/gm, () => {
        return ''
      })
      .replace(/>\s+</gm, () => {
        return '><'
      })
  }
  return rawData
}