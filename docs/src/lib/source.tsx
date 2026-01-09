import { docs } from 'fumadocs-mdx:collections/server.ts'
import { loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'

const baseSource = loader({
  baseUrl: '/',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
})

function transformPageTree(node: any): any {
  if (node.type === 'page') {
    const page = baseSource.getPage([node.url.slice(1)])
    const comingSoon = page?.data.comingSoon

    if (comingSoon) {
      return {
        href: undefined,
        icon: node.icon,
        name: (
          <span className="flex items-center opacity-60 cursor-not-allowed pointer-events-none">
            {node.name}
            <span className="ml-2 inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-500 ring-1 ring-inset ring-yellow-500/20">
              Coming Soon
            </span>
          </span>
        ),
      }
    }
  }

  if (node.type === 'folder') {
    return {
      ...node,
      children: node.children.map(transformPageTree),
    }
  }

  return node
}

export const source = {
  ...baseSource,
  getPageTree() {
    const tree = baseSource.getPageTree()
    return {
      ...tree,
      children: tree.children.map(transformPageTree),
    }
  },
}
