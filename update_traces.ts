import fs from 'fs';

let content = fs.readFileSync('src/pages/dashboard/Traces.tsx', 'utf8');

const replacement = `                <tr>
                  <td colSpan={6} className="p-8 sm:p-24 text-center">
                     {traces.length === 0 ? (
                        <div className="max-w-[800px] mx-auto">
                           <div className="flex flex-col items-center mb-8">
                              <Waveform className="w-12 h-12 text-[var(--accent-amber)]/60 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)] mb-4" />
                              <h2 className="text-[16px] font-semibold text-white mb-2">No traces recorded yet</h2>
                              <p className="text-[13px] text-[var(--text-secondary)]">Every action your AI takes will appear here.</p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left">
                              <div className="bg-[#1a0f0f] border border-dashed border-[var(--accent-amber)]/50 rounded-xl p-6 relative">
                                 <h3 className="text-[15px] font-semibold text-white mb-2">Try it without code</h3>
                                 <p className="text-[13px] text-[var(--text-secondary)] mb-6">Send a test trace from your dashboard instantly.</p>
                                 <Button variant="primary" className="w-full bg-[var(--accent-amber)] hover:bg-[var(--accent-amber-hover)] text-black" onClick={() => setShowTestTraceModal(true)}>
                                   Send Test Trace
                                 </Button>
                              </div>

                              <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-xl p-6 relative">
                                 <h3 className="text-[15px] font-semibold text-white mb-2">Add to your code</h3>
                                 <p className="text-[13px] text-[var(--text-secondary)] mb-4">Use the SDK to capture real agent activity</p>
                                 
                                 <div className="bg-[#050505] rounded-lg border border-[#222] overflow-hidden mb-4">
                                     <div className="flex border-b border-[#222] text-[11px] font-medium text-[var(--text-secondary)]">
                                        <div className="px-3 py-1.5 border-b border-[var(--text-primary)] text-[var(--text-primary)]">Python</div>
                                        <div className="px-3 py-1.5 hover:text-white cursor-pointer">Node.js</div>
                                        <div className="px-3 py-1.5 hover:text-white cursor-pointer">curl</div>
                                     </div>
                                     <pre className="p-3 text-[11px] font-mono text-gray-300 overflow-x-auto whitespace-pre">{"pip install arkvoid\\n\\nfrom arkvoid import ArkvoidClient\\nclient = ArkvoidClient(\\n    api_key=\\"ARK_...\\",\\n    agent=\\"my-agent\\"\\n)\\nclient.trace(action=\\"my_first_action\\", risk_level=\\"low\\")"}</pre>
                                 </div>
                                 <div className="flex gap-3">
                                   <Button variant="outline" className="flex-1" onClick={() => navigator.clipboard.writeText('pip install arkvoid\\nfrom arkvoid import ArkvoidClient\\nclient = ArkvoidClient(\\n    api_key="ARK_...",\\n    agent="my-agent"\\n)\\nclient.trace(action="my_first_action", risk_level="low")')}>
                                      Copy Code
                                   </Button>
                                   <Button variant="ghost" className="flex-1" onClick={() => window.open('/docs', '_blank')}>View Docs</Button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     ) : (
                        <>
                           <Waveform className="w-12 h-12 text-[var(--border-strong)] mx-auto mb-4" />
                           <p className="text-[15px] font-medium text-[var(--text-primary)] mb-1">
                             No traces match your filters
                           </p>
                        </>
                     )}
                  </td>
                </tr>`;

const regex = /<td colSpan=\{6\} className="p-24 text-center">[\s\S]*?<\/td>/;
content = content.replace(regex, replacement.replace('<tr>\n', '').replace('                </tr>', ''));

fs.writeFileSync('src/pages/dashboard/Traces.tsx', content);
console.log('updated traces.tsx');
