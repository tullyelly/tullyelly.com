export default function remarkSemicolonsInsteadOfEmdash() {
  return (tree, file) => {
    const value = String(file);
    const fmMatch = value.startsWith('---') ? value.slice(3, value.indexOf('---', 3)) : '';
    if (/punctuation:\s*allowed/.test(fmMatch)) return;
    function walk(node) {
      if (node.type === 'code' || node.type === 'inlineCode') return;
      if (node.type === 'text' && node.value.includes('—')) {
        node.value = node.value.replace(/—+/g, ';');
      }
      if (node.children) {
        for (const child of node.children) walk(child);
      }
    }
    walk(tree);
  };
}
