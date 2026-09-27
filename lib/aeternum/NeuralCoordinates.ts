export interface NeuralCoordinates {
  x: number;
  y: number;
  z: number;
}

export function neuralCoordinates(name: string): NeuralCoordinates {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = ((hash << 5) - hash + name.charCodeAt(index)) | 0;
  }
  const positive = Math.abs(hash);
  return {
    x: positive % 100,
    y: Math.abs((positive * 31) % 100),
    z: Math.abs((positive * 17) % 100),
  };
}

export function neuralDistance(
  first: NeuralCoordinates,
  second: NeuralCoordinates,
): number {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  const dz = first.z - second.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
