import { createFileRoute, notFound } from '@tanstack/react-router'

import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { useFumadocsLoader } from 'fumadocs-core/source/client'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Popup, PopupContent, PopupTrigger } from 'fumadocs-twoslash/ui'
import { createServerFn } from '@tanstack/react-start'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page'
import browserCollections from 'fumadocs-mdx:collections/browser.ts'

import { source } from '@/lib/source.tsx'
import { baseOptions } from '@/lib/layout.shared.tsx'

export const Route = createFileRoute('/$')({
  component: Page,
  notFoundComponent: NotFoundComponent,
  loader: async ({ params }) => {
    const slugs = params._splat?.split('/') ?? []
    const data = await serverLoader({ data: slugs })
    await clientLoader.preload(data.path)
    return data
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title
          ? `${loaderData.title} | Girouette`
          : 'Girouette',
      },
    ],
  }),
})

const serverLoader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: Array<string>) => slugs)
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs)
    if (!page) throw notFound()

    return {
      path: page.path,
      title: page.data.title,
      pageTree: await source.serializePageTree(source.getPageTree()),
    }
  })

const clientLoader = browserCollections.docs.createClientLoader({
  component({ toc, frontmatter, default: MDX }) {
    return (
      <DocsPage toc={toc}>
        <DocsTitle>{frontmatter.title}</DocsTitle>
        <DocsDescription>{frontmatter.description}</DocsDescription>
        <DocsBody>
          <MDX
            components={{
              ...defaultMdxComponents,
              Popup,
              PopupContent,
              PopupTrigger,
            }}
          />
        </DocsBody>
      </DocsPage>
    )
  },
})

function Page() {
  const data = Route.useLoaderData()
  const { pageTree } = useFumadocsLoader(data)
  const Content = clientLoader.getComponent(data.path)

  return (
    <DocsLayout {...baseOptions()} tree={pageTree}>
      <Content />
    </DocsLayout>
  )
}

function NotFoundComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-bold text-fd-primary">404</h1>
        <h2 className="text-3xl font-semibold text-fd-foreground">
          Page Not Found
        </h2>
        <p className="text-fd-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/"
            className="px-6 py-2 bg-fd-primary text-fd-primary-foreground rounded-lg hover:bg-fd-primary/90 transition-colors"
          >
            Go Home
          </a>
          <a
            href="https://github.com/adonisjs-community/girouette"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 border border-fd-border rounded-lg hover:bg-fd-accent transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  )
}
