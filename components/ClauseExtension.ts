
// We need to access the global library since we are using CDN
// In a real build step this would be: import { Extensions } from '@harbour-enterprises/superdoc';

export const getClauseExtension = () => {
  const w = window as any;
  // Ensure library is loaded
  if (!w.SuperDocLibrary || !w.SuperDocLibrary.Extensions) {
    console.warn("SuperDocLibrary not loaded yet");
    return null;
  }

  const { Node, mergeAttributes } = w.SuperDocLibrary.Extensions;

  return Node.create({
    name: 'clause',

    group: 'block',

    content: 'block+', // Can contain paragraphs, lists, headings

    draggable: true,

    selectable: true,

    // Define attributes that persist with the node
    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-clause-id'),
          renderHTML: (attributes: any) => ({
            'data-clause-id': attributes.id,
          }),
        },
        risk: {
          default: 'neutral',
          parseHTML: (element: HTMLElement) => element.getAttribute('data-risk'),
          renderHTML: (attributes: any) => ({
            'data-risk': attributes.risk,
          }),
        },
        status: {
          default: 'original', // original, pending, accepted
          parseHTML: (element: HTMLElement) => element.getAttribute('data-status'),
          renderHTML: (attributes: any) => ({
            'data-status': attributes.status,
          }),
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: 'div[data-type="clause"]',
        },
      ];
    },

    /**
     * Tiptap standard rendering. 
     * We manually merge to ensure no dependency on external helpers if they fail.
     */
    renderHTML({ HTMLAttributes, node }: any) {
       const finalAttrs = {
           ...HTMLAttributes,
           'data-type': 'clause',
           'class': 'sd-clause-node'
       };
       return ['div', finalAttrs, 0];
    },
    
    /**
     * Fallback: Direct ProseMirror toDOM method.
     * Some older/custom Tiptap wrappers might not map renderHTML -> toDOM correctly.
     * This signature matches ProseMirror's NodeSpec.toDOM.
     */
    toDOM(node: any) {
        return ['div', {
            'data-type': 'clause',
            'class': 'sd-clause-node',
            'data-clause-id': node.attrs.id,
            'data-risk': node.attrs.risk,
            'data-status': node.attrs.status
        }, 0];
    }
  });
};
