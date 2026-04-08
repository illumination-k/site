import type { Dictionary } from "../types";

const es: Dictionary = {
  home: {
    subtitle: "Ingeniero de Software / Bioinformática",
    techBlog: "Tech Blog",
    techBlogSub: "Artículos técnicos",
    paperStream: "Paper Stream",
    paperStreamSub: "Notas de artículos",
  },
  nav: {
    techBlog: "TechBlog",
  },
  footer: {
    privacyPolicy: "política de privacidad",
    disclaimer: "aviso legal",
  },
  meta: {
    siteDescription: "Ingeniero de Software / Bioinformática",
    articleList: (prefix: string) => `${prefix} Artículos`,
    articleListPage: (prefix: string, page: number | string) =>
      `${prefix} Artículos - Página ${page}`,
    articleListDescription: (prefix: string, page: number | string) =>
      `Lista de artículos de ${prefix} en illumination-k.dev (Página ${page})`,
    tagArticleList: (tag: string) => `Artículos etiquetados "${tag}"`,
    tagArticleListPage: (tag: string, page: number | string) =>
      `Artículos etiquetados "${tag}" - Página ${page}`,
    tagArticleListDescription: (tag: string, page: number | string) =>
      `Artículos etiquetados "${tag}" en illumination-k.dev (Página ${page})`,
    tagList: (prefix: string) => `${prefix} Etiquetas`,
    tagListDescription: (prefix: string) =>
      `Lista de etiquetas de artículos de ${prefix} en illumination-k.dev`,
  },
  search: {
    placeholder: "Buscar artículos...",
  },
  disclaimer: {
    title: "Aviso Legal",
    subtitle: "Disclaimer",
    effectiveDate:
      "Fecha de vigencia: 1 de enero de 2020 / Última actualización: 1 de enero de 2025",
    sections: [
      {
        title: "Aviso Legal",
        body: "La información publicada en este sitio es vigente a la fecha de publicación y puede diferir de la información más reciente. Aunque nos esforzamos por proporcionar información precisa, no garantizamos su exactitud ni seguridad. No aceptamos responsabilidad alguna por los daños causados por el contenido publicado en este sitio.",
      },
      {
        title: "Enlaces Externos",
        body: "No aceptamos responsabilidad alguna por la información o los servicios proporcionados en otros sitios a los que se acceda a través de enlaces o banners de este sitio. Las URL de los enlaces de este sitio pueden cambiar o eliminarse sin previo aviso.",
      },
      {
        title: "Derechos de Autor",
        body: "El contenido publicado en este sitio (textos, imágenes, código fuente, etc.) está protegido por la ley de derechos de autor. Queda prohibida la reproducción no autorizada más allá del uso legítimo. Al citar, incluya un enlace a este sitio como fuente. Salvo indicación contraria, el código fuente se proporciona bajo la Licencia MIT.",
      },
      {
        title: "Infracción de Propiedad Intelectual",
        body: "Este sitio no tiene la intención de infringir derechos de autor ni derechos de imagen. Si tiene alguna inquietud sobre derechos de autor o de imagen, cree un Issue en el repositorio de GitHub o contacte a illumination-k@gmail.com. Responderemos con prontitud.",
      },
      {
        title: "Exactitud del Contenido",
        body: "Los artículos de este sitio están escritos como resultado del aprendizaje e investigación personal. Aunque verificamos el contenido técnico en la medida de lo posible, puede haber errores. Si encuentra algún error, le agradeceríamos que creara un Issue en el repositorio de GitHub.",
      },
      {
        title: "Limitación de Responsabilidad",
        body: 'El operador de este sitio no acepta responsabilidad alguna por los daños derivados del uso de la información o los materiales de este sitio, o del contenido de sitios web de terceros enlazados desde este sitio. El contenido de este sitio se proporciona "tal cual" sin garantía de ningún tipo.',
      },
    ],
  },
  privacyPolicy: {
    title: "Política de Privacidad",
    subtitle: "Privacy Policy",
    effectiveDate:
      "Fecha de vigencia: 1 de enero de 2020 / Última actualización: 1 de enero de 2025",
    sections: [
      {
        title: "Propósito del Uso de Información Personal",
        body: "Podemos recopilar información personal como su nombre y dirección de correo electrónico cuando se comunique con nosotros. Esta información personal se utiliza únicamente para responder a sus consultas y proporcionar la información necesaria, y no se utilizará para ningún otro propósito.",
      },
      {
        title: "Herramientas de Análisis",
        body: "Este sitio utiliza Google Analytics, una herramienta de análisis proporcionada por Google. Google Analytics utiliza cookies para recopilar datos de tráfico. Los datos de tráfico se recopilan de forma anónima y no identifican a personas individuales. Puede rechazar la recopilación de datos desactivando las cookies en la configuración de su navegador. Consulte la página de Google para los Términos de Servicio de Google Analytics.",
      },
      {
        title: "Publicidad",
        body: "Este sitio utiliza Google AdSense, un servicio de publicidad de terceros. Los anunciantes pueden utilizar cookies para mostrar anuncios basados en los intereses del usuario. Para la configuración de desactivación de cookies y detalles sobre Google AdSense, consulte la página de políticas y términos de Google.",
      },
      {
        title: "Programas de Afiliados",
        body: "Este sitio participa en el Programa de Asociados de Amazon, un programa de publicidad de afiliados diseñado para proporcionar un medio para que los sitios ganen tarifas de referencia mediante publicidad y enlaces a Amazon.co.jp.",
      },
      {
        title: "Comentarios y Consultas",
        body: "Para combatir el spam y el abuso, este sitio puede registrar las direcciones IP utilizadas al comentar o realizar consultas. Esta es una función estándar del sitio y no se utilizará para ningún propósito que no sea combatir el spam y el abuso.",
      },
      {
        title: "Aviso Legal",
        body: "Aunque nos esforzamos por proporcionar información precisa en este sitio, no garantizamos su exactitud ni seguridad. No aceptamos responsabilidad alguna por los daños causados por el contenido publicado en este sitio. Tampoco aceptamos responsabilidad por la información o los servicios proporcionados en otros sitios a los que se acceda a través de enlaces o banners de este sitio.",
      },
      {
        title: "Cambios en la Política de Privacidad",
        body: "Este sitio cumple con las leyes japonesas aplicables en materia de información personal y se esfuerza por revisar y mejorar esta política según corresponda. La última política de privacidad revisada siempre se divulgará en esta página.",
      },
    ],
  },
  post: {
    archiveWarning:
      "Este artículo ha sido archivado. Es posible que el contenido esté desactualizado.",
    draftWarning: "Este artículo está en fase de borrador.",
    aiGeneratedWarning:
      "Este artículo fue generado por IA. Tenga cuidado con la precisión de su contenido.",
    githubIssuePrompt: "Crear un issue en GitHub sobre este artículo",
    readNext: "Leer a continuación",
  },
  metrics: {
    title: "Métricas de Calidad",
    subtitle: "Tendencias de cobertura de pruebas y puntuación de mutación",
    description:
      "Métricas de calidad de código de illumination-k.dev — tendencias de cobertura de pruebas y puntuación de mutación",
  },
};

export default es;
