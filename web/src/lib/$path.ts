export const pagesPath = {
  "privacypolicy": {
    $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/privacypolicy' as const, hash: url?.hash })
  },
  "techblog": {
    _page: (page: string | number) => ({
      $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/techblog/[page]' as const, query: { page }, hash: url?.hash })
    }),
    "categories": {
      _category: (category: string | number) => ({
        _page: (page: string | number) => ({
          $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/techblog/categories/[category]/[page]' as const, query: { category, page }, hash: url?.hash })
        })
      }),
      $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/techblog/categories' as const, hash: url?.hash })
    },
    "post": {
      _uuid: (uuid: string | number) => ({
        $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/techblog/post/[uuid]' as const, query: { uuid }, hash: url?.hash })
      })
    },
    "tags": {
      _tag: (tag: string | number) => ({
        _page: (page: string | number) => ({
          $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/techblog/tags/[tag]/[page]' as const, query: { tag, page }, hash: url?.hash })
        })
      }),
      $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/techblog/tags' as const, hash: url?.hash })
    }
  },
  "terms_service": {
    $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/terms_service' as const, hash: url?.hash })
  },
  $url: (url?: { hash?: string | undefined } | undefined) => ({ pathname: '/' as const, hash: url?.hash })
};

export type PagesPath = typeof pagesPath;

export const staticPath = {
  ads_txt: '/ads.txt',
  favicon_ico: '/favicon.ico',
  icons: {
    mark_github_svg: '/icons/mark-github.svg'
  },
  robots_txt: '/robots.txt',
  rss: {
    atom_xml: '/rss/atom.xml',
    feed_json: '/rss/feed.json',
    feed_xml: '/rss/feed.xml'
  },
  techblog: {
    _gitkeep: '/techblog/.gitkeep',
    $1500204713307_webp: '/techblog/1500204713307.webp',
    $2130a_webp: '/techblog/2130a.webp',
    $2130c_webp: '/techblog/2130c.webp',
    $500px_PCR_webp: '/techblog/500px-PCR.webp',
    APB_NGS_Sanger_Sequencing_Illustration_webp: '/techblog/APB_NGS_Sanger_Sequencing_Illustration.webp',
    RT_primers_webp: '/techblog/RT_primers.webp',
    USER_Mechanism_webp: '/techblog/USER_Mechanism.webp',
    abc128_event_webp: '/techblog/abc128_event.webp',
    abc128_img_webp: '/techblog/abc128_img.webp',
    barplot_webp: '/techblog/barplot.webp',
    beeswarm1_webp: '/techblog/beeswarm1.webp',
    beeswarm2_webp: '/techblog/beeswarm2.webp',
    beeswarm3_webp: '/techblog/beeswarm3.webp',
    bridge_pcr_webp: '/techblog/bridge-pcr.webp',
    colorbar_sample_webp: '/techblog/colorbar_sample.webp',
    dotplot_webp: '/techblog/dotplot.webp',
    dotplot_cluster_webp: '/techblog/dotplot_cluster.webp',
    dual_index_pair_webp: '/techblog/dual_index_pair.webp',
    evcxr_jupyter_lsp_webp: '/techblog/evcxr_jupyter_lsp.webp',
    jupyter_image_webp: '/techblog/jupyter_image.webp',
    ligation_webp: '/techblog/ligation.webp',
    lighthouse_nextblog_top_webp: '/techblog/lighthouse-nextblog-top.webp',
    lighthouse_wordpress_top_webp: '/techblog/lighthouse-wordpress-top.webp',
    multiplex_webp: '/techblog/multiplex.webp',
    nextera_webp: '/techblog/nextera.webp',
    seqence_method_webp: '/techblog/seqence-method.webp',
    single_index_pair_webp: '/techblog/single_index_pair.webp',
    truseq_webp: '/techblog/truseq.webp',
    tso_webp: '/techblog/tso.webp',
    upsetplot_basic_webp: '/techblog/upsetplot_basic.webp',
    upsetplot_basic_orientation_webp: '/techblog/upsetplot_basic_orientation.webp',
    upsetplot_basic_sort_webp: '/techblog/upsetplot_basic_sort.webp',
    upsetplot_category_examples_webp: '/techblog/upsetplot_category_examples.webp',
    upsetplot_ext_python_webp: '/techblog/upsetplot_ext_python.webp',
    upsetplot_extensions_webp: '/techblog/upsetplot_extensions.webp',
    upsetplot_sort_webp: '/techblog/upsetplot_sort.webp',
    upsetplot_venn_webp: '/techblog/upsetplot_venn.webp',
    venn_webp: '/techblog/venn.webp'
  },
  vercel_svg: '/vercel.svg'
} as const;

export type StaticPath = typeof staticPath;
