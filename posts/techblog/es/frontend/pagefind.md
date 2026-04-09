---
uuid: ea7cfff1-676a-4f54-8cf0-2e66fd27ae2c
title: "Integración del motor de búsqueda de texto completo Pagefind en un blog Next.js SSG"
description: "Este artículo presenta cómo integrar Pagefind, un motor de búsqueda de texto completo ligero que se ejecuta en la web, en un blog Next.js SSG (Static Site Generation). Pagefind tiene soporte limitado para japonés. Cubre los pasos de configuración específicos, cómo implementar el componente de búsqueda y ejemplos de código para la obtención de resultados de búsqueda con tipado seguro."
category: "techblog"
lang: es
tags: ["nextjs", "frontend"]
created_at: 2024-09-23
updated_at: 2024-09-23
---

## ¿Qué es Pagefind?

Pagefind es un motor de búsqueda de texto completo desarrollado recientemente que se ejecuta en la web.
La descripción oficial indica:

> Pagefind es una librería de búsqueda completamente estática que busca funcionar bien en sitios grandes, utilizando el menor ancho de banda posible del usuario y sin necesidad de alojar ninguna infraestructura. Pagefind se ejecuta después de Hugo, Eleventy, Jekyll, Next, Astro, SvelteKit o cualquier otro framework web. El proceso de instalación es siempre el mismo: Pagefind solo requiere una carpeta que contenga los archivos estáticos construidos de tu sitio web, por lo que en la mayoría de los casos no se necesita configuración para empezar.

Como se puede ver en :gh-meta[CloudCannon/pagefind], está escrito en Rust (WebAssembly). El pipeline de stemming → indexación → búsqueda parece estar basado en WebAssembly.

### Soporte para japonés

El soporte multilingüe está disponible. El soporte para japonés es limitado, pero aparentemente se aplica la segmentación del chino en lugar de la segmentación basada en espacios en blanco.
El idioma soportado se determina consultando el atributo `lang` del HTML.

Además, la segmentación durante la búsqueda no está soportada, por lo que la tokenización de palabras compuestas no ocurre en el momento de la búsqueda. Es necesario hacer la separación por espacios manualmente.
Los detalles del stemming están escritos [aquí](https://github.com/CloudCannon/pagefind/tree/main/pagefind_stem), pero no estoy lo suficientemente familiarizado como para entender completamente los detalles. No parece usar diccionarios y parece estar basado en reglas.

- [Búsqueda multilingüe](https://pagefind.app/docs/multilingual/)

> Actualmente, al indexar, Pagefind no soporta stemming para idiomas especializados, pero sí soporta la segmentación de palabras no separadas por espacios en blanco.
> Pagefind aún no soporta la segmentación de la consulta de búsqueda, por lo que buscar en el navegador requiere que las palabras en la consulta estén separadas por espacios en blanco.
> En la práctica, esto significa que en una página etiquetada como idioma zh-, 每個月都 será indexado como las palabras 每個, 月 y 都.
> Al buscar en el navegador, buscar 每個, 月 o 都 individualmente funcionará. Además, buscar 每個 月 都 devolverá resultados que contengan cada palabra en cualquier orden, y buscar "每個 月 都" entre comillas coincidirá exactamente con 每個月都.
> Buscar 每個月都 devolverá cero resultados, ya que Pagefind no puede segmentarlo en palabras en el navegador. Se está trabajando para mejorar esto y se espera eliminar esta limitación en el futuro.

### Algoritmo de búsqueda

No pude encontrar información sobre el algoritmo de búsqueda en la página oficial, pero leyendo el código, parece usar BM25 a fecha de (2024/09/23).

::gh[https://github.com/CloudCannon/pagefind/blob/20a4206471f8618709aeaa3515ea92d1c0d528e5/pagefind_web/src/search.rs#L65-L75]

## Implementación en Next.js

Esto asume SSG. Omitiré los detalles de configuración de Next.js, pero se requiere `output: "export"`.

### Configuración

```bash
pnpm -i -D pagefind npm-run-all
```

Se utiliza [npm-run-all](https://www.npmjs.com/package/npm-run-all) como ejecutor de tareas.

```json
{
  "scripts": {
    "build": "run-s build:next build:pagefind",
    "build:next": "next build",
    "build:pagefind": "pagefind --site out",
    "dev": "next dev",
    "dev-pagefind": "pagefind --site out --output-path ./public/pagefind"
  }
}
```

En el CLI de pagefind, especifica el directorio `out` generado por `next build` con `--site`.
Esto genera el índice, `pagefind.js`, etc. bajo `out/pagefind/` (a menos que se especifique `--output-path`).

Como referencia, aproximadamente se genera lo siguiente:

:::details

```
out/pagefind/
├── fragment/
│  ├── ja_1e5d60d.pf_fragment
|   ...
├── index/
│  ├── ja_4dc97e6.pf_index
|   ...
├── pagefind-entry.json
├── pagefind-highlight.js
├── pagefind-modular-ui.css
├── pagefind-modular-ui.js
├── pagefind-ui.css
├── pagefind-ui.js
├── pagefind.ja_5f3319f7c9.pf_meta
├── pagefind.ja_e8a5abf83a.pf_meta
├── pagefind.js
└── wasm.unknown.pagefind
```

:::

Además, `pagefind.js` también necesita ser cargable en el entorno de desarrollo, por lo que durante el desarrollo lo generamos bajo `public/pagefind`.
Como no queremos esto en git, lo añadimos a `.gitignore`.

```txt title=.gitignore
# pagefind
public/pagefind
```

### Escribiendo el componente

- Usa `useEffect` para importar dinámicamente `/pagefind/pagefind.js`.
  - Esta ruta debe coincidir con la ruta de salida especificada en el CLI de `pagefind`.
- Se usa Zod para la obtención de resultados con tipado seguro.

```tsx
import React, { useEffect, useState } from "react";

import { z } from "zod";

const pagefindResultSchema = z.object({
	url: z.string().transform((url) => url.replace(".html", "")),
	excerpt: z.string(),
	meta: z.object({
		title: z.string().optional(),
		image: z.string().optional(),
	}),
});

type PagefindResult = z.infer<typeof pagefindResultSchema>;

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		pagefind: any;
	}
}

const pagefindResultSchema = z.object({
	// Eliminar el .html final añadido durante la exportación.
	url: z.string().transform((url) => url.replace(".html", "")),
	excerpt: z.string(),
	meta: z.object({
		title: z.string().optional(),
		image: z.string().optional(),
	}),
});

type PagefindResult = z.infer<typeof pagefindResultSchema>;

declare global {
	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		pagefind: any;
	}
}

export default function Search() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<PagefindResult[]>([]);

	useEffect(() => {
		async function loadPagefind() {
			if (typeof window.pagefind === "undefined") {
				try {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					window.pagefind = await import(
						// @ts-expect-error @types of pagefind are not available
						// eslint-disable-next-line import/no-unresolved
						/* webpackIgnore: true */ "/pagefind/pagefind.js"
					);
				} catch (e) {
					console.error(e);
					window.pagefind = { search: () => ({ results: [] }) };
				}
			}
		}
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		loadPagefind();
	}, []);

	async function handleSearch() {
		if (!window.pagefind) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
		const search = await window.pagefind.search(query);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
		const results = await Promise.all(search.results.map((r: any) => r.data()));

		setResults(z.array(pagefindResultSchema).parse(results));
	}

	return (
		<div>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					// eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises
					handleSearch();
				}}
			>
				<input
					type="text"
					value={query}
					placeholder="Buscar artículos..."
					onChange={(e) => setQuery(e.target.value)}
				/>
				<button type="submit">Buscar</button>
			</form>

			{results.map((result) => (
				<div key={result.url}>
					<h2>
						<Link href={result.url}>{result.meta.title ?? "Sin título"}</Link>
					</h2>
					<div dangerouslySetInnerHTML={{ __html: result.excerpt }} />
				</div>
			))}
		</div>
	);
}
```

Para información de tipos, consulta lo siguiente. Solo usé las partes que parecían necesarias.

::gh[https://github.com/CloudCannon/pagefind/blob/8a16ce730cf3bcef1c6b326322810be4ad3c4706/pagefind_web_js/types/index.d.ts#L123-L160]

## Especificando dónde indexar

Puedes controlar dónde ocurre la indexación especificando etiquetas `data-pagefind-*`.

El ejemplo más directo es especificar `data-pagefind-body`, lo que hace que solo se indexe el contenido dentro de `main`:

```html
<body>
    <main data-pagefind-body>
        <h1>Condimentum Nullam</h1>
        <p>Nullam id dolor id nibh ultricies.</p>
    </main>
    <aside>
        Este contenido no será indexado.
    </aside>
</body>
```

También puedes excluir secciones específicas de la indexación especificando `data-pagefind-ignore`.

Para más detalles, consulta:

- [pagefind.app - Indexing - Configure the index](https://pagefind.app/docs/indexing/)

## Conclusión

Me impresionó lo fácil que fue añadir un motor de búsqueda a un sitio SSG.
Esto hace que parezca posible alojar un blog en Cloudflare o servicios similares con todas las funcionalidades necesarias.
