/**
 * neuralCoordinates — coordenadas determinísticas por nome de módulo.
 * Utilidade pura; sem estado global; sem side effects.
 */

export interface Coordinates { x: number; y: number; z: number; }

export class NeuralCoordinates {
  static generate(moduleName: string): Coordinates {
    const h = this.hashString(moduleName);
    return {
      x: Math.abs(h % 100),
      y: Math.abs((h * 31) % 100),
      z: Math.abs((h * 17) % 100),
    };
  }

  static generateAddress(moduleName: string, instance = 'main'): string {
    const c = this.generate(moduleName);
    return `${moduleName}://${instance}@${c.x}:${c.y}:${c.z}`;
  }

  static distance(a: Coordinates, b: Coordinates): number {
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private static hashString(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h = h & h;
    }
    return h;
  }
}
