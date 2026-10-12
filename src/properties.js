/** Lee archivos .properties: claves externas, sin textos de interfaz en código. */
export function parseProperties(input) {
  const result = {};
  for (const line of input.replace(/\r/g, '').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
    const split = line.indexOf('=');
    if (split < 0) continue;
    const key = line.slice(0, split).trim();
    // El editor usa \n para saltos y \\ para barras invertidas.
    result[key] = line.slice(split + 1).replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
  }
  return result;
}
/** Carga y comprueba el estado HTTP para que no haya fallos silenciosos. */
export async function loadProperties(path) {
  const response = await fetch(`${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`);
  if (!response.ok) throw new Error(`Cannot load ${path}: ${response.status}`);
  return parseProperties(await response.text());
}
