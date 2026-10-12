# TDS | prompts — micrositio v1.0

Proyecto Vite bilingüe ES/EN. Colocar el contenido del ZIP **directamente** en `Projects\TDS\prompts` (evitar una carpeta adicional).

## Inicio local (terminal de VS Code en la carpeta `prompts`)

```powershell
npm install
npm run dev
```

Abrir `http://localhost:5173/`. El puerto 5173 debe estar disponible. Para compilar: `npm run build`. El resultado se crea en `dist/`.

## Organización y reglas

- `public/i18n/es.properties` y `public/i18n/en.properties`: **única fuente de textos traducibles**. Misma clave en ambos idiomas.
- `public/config/site.properties`: configuración, ubicación de imágenes, URLs, cantidad de prompts, color y lenguaje inicial.
- `public/images/`: archivos gráficos aprobados, sin recomprimir.
- `src/main.js`: presentación e interacción, documentadas con comentarios. No contiene prompts ni traducciones.
- `src/properties.js`: parser sencillo de claves `clave=valor`; utilizar `\n` para saltos de línea en valores.
- `src/style.css`: reglas de presentación.

Los únicos textos literales en JavaScript son identificadores técnicos y mensajes de error anteriores a la carga de idiomas. No son textos de catálogo.

## Publicación futura

Crear repo `prompts` y conectar Cloudflare Pages con `npm run build`, directorio de salida `dist`. No hay conexión ni publicación automática.

## Fuente editorial

Contenido obtenido de `TDS_10_prompts_visuales_v1.0_MASTER_depurado.docx`. Las 16 imágenes proceden de la carpeta previamente organizada. No se cambiaron los prompts ni se regeneraron las imágenes.
