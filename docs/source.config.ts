import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from 'fumadocs-mdx/config'
import { rehypeCode, rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins'
import { transformerTwoslash } from 'fumadocs-twoslash'
import lastModified from 'fumadocs-mdx/plugins/last-modified'
import { z } from 'zod'

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    async: true,
    postprocess: {
      includeProcessedMarkdown: true,
      extractLinkReferences: true,
    },
    schema: frontmatterSchema.extend({
      comingSoon: z.boolean().default(false),
    }),
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
          inline: 'tailing-curly-colon',
          transformers: [
            ...(rehypeCodeDefaultOptions.transformers ?? []),
            transformerTwoslash(),
          ],
        },
      ],
    ],
  },
})
