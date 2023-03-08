export const pagesPath = {
  "portfolio": {
    "projects": {
      $url: (url?: { hash?: string }) => ({ pathname: '/portfolio/projects' as const, hash: url?.hash })
    },
    $url: (url?: { hash?: string }) => ({ pathname: '/portfolio' as const, hash: url?.hash })
  },
  "privacypolicy": {
    $url: (url?: { hash?: string }) => ({ pathname: '/privacypolicy' as const, hash: url?.hash })
  },
  "techblog": {
    _page: (page: string | number) => ({
      $url: (url?: { hash?: string }) => ({ pathname: '/techblog/[page]' as const, query: { page }, hash: url?.hash })
    }),
    "categories": {
      _category: (category: string | number) => ({
        _page: (page: string | number) => ({
          $url: (url?: { hash?: string }) => ({ pathname: '/techblog/categories/[category]/[page]' as const, query: { category, page }, hash: url?.hash })
        })
      }),
      $url: (url?: { hash?: string }) => ({ pathname: '/techblog/categories' as const, hash: url?.hash })
    },
    "post": {
      _uuid: (uuid: string | number) => ({
        $url: (url?: { hash?: string }) => ({ pathname: '/techblog/post/[uuid]' as const, query: { uuid }, hash: url?.hash })
      })
    },
    "tags": {
      _tag: (tag: string | number) => ({
        _page: (page: string | number) => ({
          $url: (url?: { hash?: string }) => ({ pathname: '/techblog/tags/[tag]/[page]' as const, query: { tag, page }, hash: url?.hash })
        })
      }),
      $url: (url?: { hash?: string }) => ({ pathname: '/techblog/tags' as const, hash: url?.hash })
    },
    $url: (url?: { hash?: string }) => ({ pathname: '/techblog' as const, hash: url?.hash })
  },
  "terms_service": {
    $url: (url?: { hash?: string }) => ({ pathname: '/terms_service' as const, hash: url?.hash })
  },
  $url: (url?: { hash?: string }) => ({ pathname: '/' as const, hash: url?.hash })
}

export type PagesPath = typeof pagesPath

export const staticPath = {
  favicon_ico: '/favicon.ico',
  icons: {
    mark_github_svg: '/icons/mark-github.svg'
  },
  next_svg: '/next.svg',
  robots_txt: '/robots.txt',
  thirteen_svg: '/thirteen.svg',
  vercel_svg: '/vercel.svg'
} as const

export type StaticPath = typeof staticPath
