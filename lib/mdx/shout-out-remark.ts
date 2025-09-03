import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'

const remarkShoutOut: Plugin = () => (tree: unknown) => {
  visit(tree as any, (node: any) => {
    if (node.type === 'containerDirective' && node.name === 'shout-out') {
      node.data ??= {}
      node.data.hName = 'ShoutOut'
      node.data.hProperties = { as: 'div', variant: 'note' }
    }
  })
}

export default remarkShoutOut
