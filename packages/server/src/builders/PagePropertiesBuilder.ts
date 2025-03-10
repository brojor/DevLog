import type { PageProperties } from '../types/notion'

export default abstract class PagePropertiesBuilder<TProperties extends PageProperties> {
  protected properties: Partial<TProperties> = {}

  // Společná metoda pro nastavení názvu
  name(name: string): this {
    this.properties.Name = {
      title: [{ text: { content: name } }],
    } as TProperties['Name']
    return this
  }

  // Metoda pro finální sestavení properties
  build(): Partial<TProperties> {
    return this.properties
  }
}
