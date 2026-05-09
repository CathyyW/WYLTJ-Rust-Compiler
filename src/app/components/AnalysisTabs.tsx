import * as Tabs from '@radix-ui/react-tabs';
import { ASTTreeView } from './ASTTreeView';

interface AnalysisTabsProps {
  astTree: any;
  lexicalTokens: Array<{ type: string; value: string; line: number }>;
  intermediateCode: string;
  targetCode: string;
}

export function AnalysisTabs({ astTree, lexicalTokens, intermediateCode, targetCode }: AnalysisTabsProps) {
  return (
    <Tabs.Root defaultValue="ast" className="flex flex-col h-full">
      <Tabs.List className="flex gap-1 bg-[#25262B] p-1 rounded-t-lg border border-[#363944] border-b-0">
        <TabTrigger value="lexical">Lexical Analysis</TabTrigger>
        <TabTrigger value="ast">AST Tree</TabTrigger>
        <TabTrigger value="ir">Intermediate Representation</TabTrigger>
        <TabTrigger value="target">Target Code</TabTrigger>
      </Tabs.List>

      <Tabs.Content value="lexical" className="flex-1 overflow-hidden">
        <div className="h-full bg-[#1A1B1E] rounded-b-lg overflow-auto border border-[#363944] border-t-0 p-4">
          <table className="w-full font-mono text-sm">
            <tbody>
              {lexicalTokens.map((token, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-[#25262B]' : 'bg-transparent'}>
                  <td className="px-3 py-2 text-[#9CA3AF]">{token.line}</td>
                  <td className="px-3 py-2 text-[#50FA7B]">{token.type}</td>
                  <td className="px-3 py-2 text-[#E8E8E8]">{token.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lexicalTokens.length === 0 && (
            <div className="text-center text-[#9CA3AF] italic mt-8">
              No tokens analyzed yet
            </div>
          )}
        </div>
      </Tabs.Content>

      <Tabs.Content value="ast" className="flex-1 overflow-hidden">
        <ASTTreeView tree={astTree} />
      </Tabs.Content>

      <Tabs.Content value="ir" className="flex-1 overflow-hidden">
        <div className="h-full bg-[#1A1B1E] rounded-b-lg overflow-auto border border-[#363944] border-t-0 p-4">
          <pre className="font-mono text-sm text-[#E8E8E8] whitespace-pre-wrap">
            {intermediateCode || (
              <span className="text-[#9CA3AF] italic">
                No intermediate representation generated yet
              </span>
            )}
          </pre>
        </div>
      </Tabs.Content>

      <Tabs.Content value="target" className="flex-1 overflow-hidden">
        <div className="h-full bg-[#1A1B1E] rounded-b-lg overflow-auto border border-[#363944] border-t-0 p-4">
          <pre className="font-mono text-sm text-[#E8E8E8] whitespace-pre-wrap">
            {targetCode || (
              <span className="text-[#9CA3AF] italic">
                No target code generated yet
              </span>
            )}
          </pre>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  );
}

function TabTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <Tabs.Trigger
      value={value}
      className="px-4 py-2 text-sm text-[#9CA3AF] hover:text-[#E8E8E8] data-[state=active]:text-[#50FA7B] data-[state=active]:bg-[#1A1B1E] rounded transition-colors"
    >
      {children}
    </Tabs.Trigger>
  );
}
