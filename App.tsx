
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Menu, FileJson, CheckCircle, Upload, Wand2, Loader2, Undo2, Redo2, Eye, EyeOff, Database, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ReportElement, TemplateMetadata } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

// Helper to generate UUIDs locally
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const DEFAULT_TEST_DATA = {
  "company": "Acme Corp",
  "report_date": "2023-10-27",
  "monthly_sales": [
      { "month": "Jan", "revenue": 12000, "cost": 8000, "profit": 4000 },
      { "month": "Feb", "revenue": 15000, "cost": 9000, "profit": 6000 },
      { "month": "Mar", "revenue": 11000, "cost": 8500, "profit": 2500 },
      { "month": "Apr", "revenue": 18000, "cost": 10000, "profit": 8000 },
      { "month": "May", "revenue": 22000, "cost": 12000, "profit": 10000 }
  ],
  "employees": [
    { "id": "E001", "name": "Alice Smith", "role": "Senior Developer", "salary": "$120,000" },
    { "id": "E002", "name": "Bob Jones", "role": "UI Designer", "salary": "$95,000" },
    { "id": "E003", "name": "Charlie Day", "role": "Project Manager", "salary": "$105,000" },
    { "id": "E004", "name": "Diana Prince", "role": "DevOps Engineer", "salary": "$115,000" }
  ]
};

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // State for Elements
  const [elements, setElements] = useState<ReportElement[]>([]);
  
  // State for History
  const [history, setHistory] = useState<ReportElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: 'Untitled Report',
    outputFormat: 'PDF',
  });
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Preview & Data Binding State
  const [previewMode, setPreviewMode] = useState(false);
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [testDataInput, setTestDataInput] = useState(JSON.stringify(DEFAULT_TEST_DATA, null, 2));
  const [dataContext, setDataContext] = useState<Record<string, any>>(DEFAULT_TEST_DATA);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;
  
  // Safe API Key retrieval
  let API_KEY = '';
  try {
      if (typeof process !== 'undefined' && process.env) {
          API_KEY = process.env.API_KEY || '';
      }
  } catch (e) { console.warn("Env access failed", e); }

  // --- History Management ---

  const addToHistory = useCallback((newElements: ReportElement[]) => {
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(newElements);
          return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setElements(history[newIndex]);
      }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setElements(history[newIndex]);
      }
  }, [history, historyIndex]);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              if (e.shiftKey) {
                  redo();
              } else {
                  undo();
              }
              e.preventDefault();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              redo();
              e.preventDefault();
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);


  const handleUpdateElement = (updatedElement: ReportElement) => {
    const newElements = elements.map((el) => (el.id === updatedElement.id ? updatedElement : el));
    setElements(newElements);
    addToHistory(newElements);
  };

  const handleUpdateMetadata = (field: string, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const handleAiLayoutFix = async () => {
      if (!API_KEY || elements.length === 0) return;
      setIsGenerating(true);

      try {
          const ai = new GoogleGenAI({ apiKey: API_KEY });
          // Simplified payload to save tokens
          const simpleElements = elements.map(el => ({
              id: el.id,
              type: el.type,
              x: el.x,
              y: el.y,
              width: el.style.width || 'auto',
              height: el.style.height || 'auto'
          }));

          const prompt = `
            You are a layout expert. I have a list of UI elements on an A4 canvas (794x1123).
            The current positions are messy. Please reorganize them into a professional, aligned layout.
            - Header elements should be at the top.
            - Footers at the bottom.
            - Align text and tables to a consistent grid.
            - Ensure no overlapping.
            
            Current Elements JSON: ${JSON.stringify(simpleElements)}
            
            Return ONLY a JSON array of objects with "id", "x", and "y" properties. No markdown.
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
          });

          const rawText = response.text;
          const cleanJson = rawText?.replace(/```json|```/g, '').trim();
          
          if (cleanJson) {
              const fixedPositions = JSON.parse(cleanJson);
              
              const newElements = elements.map(el => {
                  const fix = fixedPositions.find((f: any) => f.id === el.id);
                  if (fix) {
                      return { ...el, x: fix.x, y: fix.y };
                  }
                  return el;
              });

              setElements(newElements);
              addToHistory(newElements); // Save to history

              setExportMessage('Layout Fixed by AI');
              setShowExportSuccess(true);
              setTimeout(() => setShowExportSuccess(false), 3000);
          }

      } catch (error) {
          console.error("AI Layout Fix Failed", error);
          alert("Failed to fix layout. Please check console.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleExport = async (type: 'JSON' | 'PDF' | 'HTML') => {
    setSelectedId(null);
    setPreviewMode(true); // Force preview mode for cleaner export
    await new Promise(resolve => setTimeout(resolve, 100));

    // Dynamic imports to prevent load crashes
    let html2canvas, jsPDF;
    try {
        const h2cModule = await import('html2canvas');
        // @ts-ignore
        html2canvas = h2cModule.default || h2cModule;
        
        const jspdfModule = await import('jspdf');
        // @ts-ignore
        jsPDF = jspdfModule.jsPDF || jspdfModule.default;
    } catch (e) {
        console.error("Failed to load export libraries", e);
        return;
    }

    if (type === 'JSON') {
        const exportData = {
        templateId: generateUUID(),
        metadata: {
            ...metadata,
            generatedAt: new Date().toISOString(),
        },
        elements: elements.map(el => ({
            id: el.id,
            type: el.type,
            position: { x: el.x, y: el.y },
            properties: {
                content: el.content,
                key: el.key,
                style: el.style,
                columns: el.columns,
                series: el.series
            }
        }))
        };
        console.log('Exported JSON:', JSON.stringify(exportData, null, 2));
        setExportMessage('Template JSON Exported to Console');
        setShowExportSuccess(true);
    } 
    else if (type === 'PDF') {
        const canvasElement = document.querySelector('#report-canvas') as HTMLElement;
        if (!canvasElement) return;

        try {
            const canvas = await html2canvas(canvasElement, {
                scale: 2, 
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [794, 1123] 
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 794, 1123);
            pdf.save(`${metadata.name || 'report'}.pdf`);
            
            setExportMessage('PDF Downloaded');
            setShowExportSuccess(true);
        } catch (err) {
            console.error(err);
            alert("Error generating PDF");
        }
    }
    else if (type === 'HTML') {
        const canvasElement = document.querySelector('#report-canvas') as HTMLElement;
        if (!canvasElement) return;
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${metadata.name}</title>
    <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; background: #f0f0f0; }
        .report-container { 
            position: relative; 
            width: 794px; 
            height: 1123px; 
            background: white; 
            overflow: hidden;
        }
    </style>
</head>
<body>
    <div class="report-container">
        ${canvasElement.innerHTML}
    </div>
</body>
</html>`;
        
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${metadata.name || 'report'}.html`;
        a.click();
        URL.revokeObjectURL(url);
        
        setExportMessage('HTML Downloaded');
        setShowExportSuccess(true);
    }

    setPreviewMode(false); // Revert
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        if (json.metadata) {
          setMetadata({
            name: json.metadata.name || 'Imported Template',
            outputFormat: json.metadata.outputFormat || 'PDF',
            sqlQuery: json.metadata.sqlQuery
          });
        }

        if (Array.isArray(json.elements)) {
          const importedElements: ReportElement[] = json.elements.map((el: any) => ({
            id: el.id,
            type: el.type,
            x: el.position?.x || 0,
            y: el.position?.y || 0,
            label: el.type.charAt(0).toUpperCase() + el.type.slice(1) + (el.type === 'placeholder' ? ' Variable' : ' Block'),
            content: el.properties?.content,
            key: el.properties?.key,
            style: el.properties?.style || {},
            columns: el.properties?.columns,
            series: el.properties?.series
          }));
          
          setElements(importedElements);
          addToHistory(importedElements);
          setSelectedId(null);
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

      } catch (err) {
        console.error("Failed to parse JSON", err);
        alert("Invalid JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const handleSaveData = () => {
      try {
          const parsed = JSON.parse(testDataInput);
          setDataContext(parsed);
          setShowDataEditor(false);
          setExportMessage('Test Data Updated');
          setShowExportSuccess(true);
          setTimeout(() => setShowExportSuccess(false), 2000);
      } catch (e) {
          alert("Invalid JSON format");
      }
  };

  const MotionDiv = motion.div as any;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden selection:bg-primary/30 text-zinc-100">
      {/* Top Navbar */}
      <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md z-30 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-surface rounded-md text-zinc-400 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-primary to-purple-600 rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center">
              <FileJson size={18} className="text-white" />
            </div>
            <h1 className="font-semibold text-sm tracking-wide hidden sm:block">{metadata.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             {/* History Controls */}
            <div className="flex items-center bg-zinc-800 rounded-md border border-zinc-700 mr-2">
                <button 
                    onClick={undo}
                    disabled={historyIndex === 0}
                    className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={16} />
                </button>
                <div className="w-[1px] h-4 bg-zinc-700"></div>
                <button 
                    onClick={redo}
                    disabled={historyIndex === history.length - 1}
                    className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={16} />
                </button>
            </div>

            <div className="h-4 w-[1px] bg-border mx-1"></div>

            {/* Data Controls */}
            <button
                onClick={() => setShowDataEditor(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-surface text-zinc-400 hover:text-white text-xs font-medium transition-all border border-transparent hover:border-zinc-700"
            >
                <Database size={14} />
                <span>Data Source</span>
            </button>

            <button
                onClick={() => { setPreviewMode(!previewMode); setSelectedId(null); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${previewMode ? 'bg-primary/20 border-primary text-primary' : 'hover:bg-surface text-zinc-400 hover:text-white border-transparent hover:border-zinc-700'}`}
            >
                {previewMode ? <Eye size={14} /> : <EyeOff size={14} />}
                <span>{previewMode ? 'Previewing' : 'Preview'}</span>
            </button>

             <div className="h-4 w-[1px] bg-border mx-1"></div>

            {/* AI Auto-Align Button */}
            <button 
                onClick={handleAiLayoutFix}
                disabled={isGenerating || elements.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Intelligently fix layout issues using Gemini"
            >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                <span className="hidden sm:inline">Magic Layout Fix</span>
            </button>

            <div className="h-4 w-[1px] bg-border mx-1"></div>

            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange} 
            />
            
            <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white text-zinc-400 text-xs font-medium transition-all"
            >
                <Upload size={14} />
                <span className="hidden lg:inline">Import JSON</span>
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        
        <Canvas
          elements={elements}
          setElements={setElements}
          addToHistory={addToHistory}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          previewMode={previewMode}
          dataContext={dataContext}
        />
        
        <PropertiesPanel
          element={selectedElement}
          onUpdate={handleUpdateElement}
          metadata={metadata}
          onUpdateMetadata={handleUpdateMetadata}
          onExport={handleExport}
        />
        
        {/* Success Toast */}
        <AnimatePresence>
            {showExportSuccess && (
                <MotionDiv
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-green-900/90 border border-green-700 text-green-100 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md z-50 pointer-events-none"
                >
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="font-medium text-sm">{exportMessage}</span>
                </MotionDiv>
            )}
        </AnimatePresence>

        {/* Data Editor Modal */}
        <AnimatePresence>
            {showDataEditor && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <MotionDiv 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-surface border border-border rounded-lg shadow-2xl w-[600px] flex flex-col max-h-[80vh]"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Database size={16} className="text-primary" />
                                Test Data (JSON)
                            </h2>
                            <button onClick={() => setShowDataEditor(false)} className="text-zinc-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                             <p className="text-xs text-zinc-400 mb-2">Define JSON data here. Bind elements using keys (e.g. <code>employees</code> for tables, <code>company</code> for text).</p>
                             <textarea 
                                className="w-full flex-1 bg-background border border-border rounded p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-primary resize-none"
                                value={testDataInput}
                                onChange={(e) => setTestDataInput(e.target.value)}
                                spellCheck={false}
                             />
                        </div>
                        <div className="p-4 border-t border-border flex justify-end gap-2">
                             <button onClick={() => setShowDataEditor(false)} className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white">Cancel</button>
                             <button onClick={handleSaveData} className="px-4 py-2 text-xs font-medium bg-primary hover:bg-primaryHover text-white rounded">Save Data</button>
                        </div>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
