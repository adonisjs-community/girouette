import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import { rehypeCode, rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins'
import { transformerTwoslash } from 'fumadocs-twoslash'
import lastModified from 'fumadocs-mdx/plugins/last-modified'

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    async: true,
    postprocess: {
      includeProcessedMarkdown: true,
      extractLinkReferences: true,
    },
  },
})

export default defineConfig({
  plugins: [lastModified()],
  mdxOptions: {
    rehypePlugins: [
      [
        rehypeCode,
        {
          ...rehypeCodeDefaultOptions,
          transformers: [
            ...rehypeCodeDefaultOptions.transformers ?? [],
            transformerTwoslash(),
          ],
        },
      ],
    ],
  },
})
