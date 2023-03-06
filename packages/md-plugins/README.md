# MD Plugins for my site

## Supported directive

- githug: `::gh[https://github.com/illumination-k/blog-remark/blob/7855162f655858f2122911c66d6dd80ef327a055/src/highlighter.ts#L11-L15]`
- github-card: `::gh-card[illumination-k/blog-remark]`

## Plan

- doi: `::doi[https://doi.org/10.1126/science.169.3946.635]{#apa}`
  - https://citation.crosscite.org/docs.html
  - curl -LH "Accept: text/x-bibliography; style=apa" https://doi.org/10.1126/science.169.3946.635
- isbn: `::isbn10[isbn]`
- post: `::post[[dir]/[categories]/[uuid]]`