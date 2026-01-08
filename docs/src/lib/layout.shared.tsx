import { Compass } from 'lucide-react'

import type { DocsLayoutProps } from 'fumadocs-ui/layouts/docs'

export function baseOptions(): Omit<DocsLayoutProps, 'tree' | 'children'> {
  return {
    nav: {
      title: (
        <>
          <Compass className="size-5" />
          Girouette
        </>
      ),
    },
    githubUrl: 'https://github.com/adonisjs-community/girouette',
  }
}
