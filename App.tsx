
import React, { useState, useRef } from 'react';
import { Menu, FileJson, CheckCircle, Upload } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ReportElement, TemplateMetadata } from './types';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [elements, setElements] = useState<ReportElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: 'Untitled Report',
    outputFormat: 'PDF',
  });
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  const handleUpdateElement = (updatedElement: ReportElement) => {
    setElements((prev) =>
      prev.map((el) => (el.id === updatedElement.id ? updatedElement : el))
    );
  };

  const handleUpdateMetadata = (field: string, value: string) => {
    setMetadata(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async (type: 'JSON' | 'PDF' | 'HTML') => {
    // Deselect element to remove UI controls (border boxes, delete buttons) from capture
    setSelectedId(null);

    // Short delay to allow UI to update (remove selection rings)
    await new Promise(resolve => setTimeout(resolve, 100));

    if (type === 'JSON') {
        const exportData = {
        templateId: crypto.randomUUID(),
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
                style: el.style
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
                scale: 2, // Higher quality
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [794, 1123] // A4 in pixels roughly
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
        
        // Simple HTML export - in a real app you might want to inline styles more aggressively
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
        
        // Basic validation and state update
        if (json.metadata) {
          setMetadata({
            name: json.metadata.name || 'Imported Template',
            outputFormat: json.metadata.outputFormat || 'PDF',
            sqlQuery: json.metadata.sqlQuery
          });
        }

        if (Array.isArray(json.elements)) {
          // Map external JSON format back to internal state
          const importedElements: ReportElement[] = json.elements.map((el: any) => ({
            id: el.id,
            type: el.type,
            x: el.position?.x || 0,
            y: el.position?.y || 0,
            label: el.type.charAt(0).toUpperCase() + el.type.slice(1) + (el.type === 'placeholder' ? ' Variable' : ' Block'),
            content: el.properties?.content,
            key: el.properties?.key,
            style: el.properties?.style || {}
          }));
          
          setElements(importedElements);
          setSelectedId(null);
        }
        
        // Clear input value to allow re-importing same file if needed
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
                <span>Import JSON</span>
            </button>

            <div className="h-4 w-[1px] bg-border mx-1"></div>

            <div className="text-xs text-zinc-500 font-mono hidden sm:block">
                {elements.length} Elements
            </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        
        <Canvas
          elements={elements}
          setElements={setElements}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
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
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-green-900/90 border border-green-700 text-green-100 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md z-50 pointer-events-none"
                >
                    <CheckCircle size={20} className="text-green-400" />
                    <span className="font-medium text-sm">{exportMessage}</span>
                </motion.div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;