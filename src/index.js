const convert = require('xml-js')

class Model {
  constructor(data) {
    this._attributes = data.attributes || {}
    this._elements = data.elements || []
  }

  _get(name) {
    return this._elements
      .filter(el => el.name === name)
      .map(el => {
        const value = el.elements && el.elements.length ? { value: el.elements[0].text } : {}

        return Object.assign({}, el.attributes, value)
      })
  }
}

class Channel extends Model {
  constructor(data) {
    super(data)

    this.id = this._attributes.id
    this.name = this._get('display-name')
    this.icon = this._get('icon').map(el => el.src)
    this.url = this._get('url').map(el => el.value)
  }
}

class Programme extends Model {
  constructor(data) {
    super(data)

    this.start = this._attributes.start
    this.stop = this._attributes.stop || this._attributes.end
    this.channel = this._attributes.channel

    this.title = this._get('title')
    this.desc = this._get('desc')
    this.category = this._get('category')
    this.date = this._get('date').map(el => el.value)
    this.episodeNum = this._get('episode-num')
    this.previouslyShown = this._get('previously-shown')
    this.subtitles = this._get('subtitles')
    this.icon = this._get('icon').map(el => el.src)

    const rating = this._elements.find(el => el.name === 'rating')

    try {
      this.rating =
      rating && rating.elements.length
        ? rating.elements
            .map(el => {
              if (!el.elements || !rating.attributes) return null

              return {
                system: rating.attributes.system,
                value: el.elements[0].text
              }
            })
            .filter(i => i)
        : []

    const credits = this._elements.find(el => el.name === 'credits')
    this.credits =
      credits && credits.elements && credits.elements.length
        ? credits.elements.map(el => {
          if (el.elements && el.elements.length > 0){
            return {
              role: el.name,
              name: el.elements[0].text
            }
          }
          })
        : []

    this.audio = this._elements
      .filter(el => el.name === 'audio')
      .map(el => {
        return el.elements.map(el => {
          return {
            [el.name]: el.elements[0].text
          }
        })[0]
      })
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = {
  parse(source) {
    source = source.toString().replace(/&/g, '&amp;')
    const obj = convert.xml2js(source, { compact: false, trim: true })
    const tv = obj.elements.find(el => el.name === 'tv')
    const channels = tv.elements.filter(el => el.name === 'channel').map(el => new Channel(el))
    const programs = tv.elements.filter(el => el.name === 'programme').map(el => new Programme(el))

    return {
      channels,
      programs
    }
  }
}
