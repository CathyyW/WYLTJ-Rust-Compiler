import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface ASTNode {
  type: 'Program' | 'Statement' | 'Expression' | 'Literal' | 'Identifier';
  label: string;
  children?: ASTNode[];
}

interface ASTTreeViewProps {
  tree: ASTNode | null;
}

function TreeNode({ node, depth = 0 }: { node: ASTNode; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Program': return 'bg-[#6B9BD1] text-[#1A1B1E]';
      case 'Statement': return 'bg-[#8FBC8F] text-[#1A1B1E]';
      case 'Expression': return 'bg-[#98FB98] text-[#1A1B1E]';
      case 'Literal': return 'bg-[#FFB86C] text-[#1A1B1E]';
      case 'Identifier': return 'bg-[#8BE9FD] text-[#1A1B1E]';
      default: return 'bg-[#363944] text-[#E8E8E8]';
    }
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#25262B] rounded cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          )
        ) : (
          <div className="w-4" />
        )}

        <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${getNodeColor(node.type)}`}>
          {node.type}
        </span>

        <span className="text-sm text-[#E8E8E8] font-mono">{node.label}</span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode key={index} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ASTTreeView({ tree }: ASTTreeViewProps) {
  return (
    <div className="h-full bg-[#1A1B1E] rounded-lg overflow-auto border border-[#363944] p-2">
      {tree ? (
        <TreeNode node={tree} />
      ) : (
        <div className="flex items-center justify-center h-full text-[#9CA3AF] italic">
          No AST tree generated yet. Click "Compile" to analyze your code.
        </div>
      )}
    </div>
  );
}
