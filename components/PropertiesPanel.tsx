
import React from 'react';
import { ReportElement, ElementStyle, TableColumn } from '../types';
import { motion } from 'framer-motion';
import { AlignLeft, AlignCenter, AlignRight, Bold, Type, PaintBucket, BoxSelect, Maximize, Image as ImageIcon, Grid3X3, Upload, ScanLine, BarChart, List, Plus, Trash2, Palette, ChevronDown } from 'lucide-react';

interface PropertiesPanelProps {
  element: ReportElement | null;
  onUpdate: (updated: ReportElement) => void;
  metadata: { name: string; outputFormat: string };
  onUpdateMetadata: (field: string, value: string) => void;
  onExport: (type: 'JSON' | 'PDF' | 'HTML') => void;
}

// Helper to generate UUIDs locally
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

const STYLE_PRESETS: Record<string, { label: string, style: Partial<ElementStyle> }[]> = {
  text: [
    { label: 'Heading 1', style: { fontSize: 32, fontWeight: 'bold', color: '#f4f4f5' } },
    { label: 'Heading 2', style: { fontSize: 24, fontWeight: 'bold', color: '#a1a1aa' } },
    { label: 'Body Text', style: { fontSize: 14, fontWeight: 'normal', color: '#e4e4e7' } },
    { label: 'Caption', style: { fontSize: 12, fontWeight: 'normal', color: '#71717a' } },
    { label: 'Accent Label', style: { fontSize: 14, fontWeight: 'bold', color: '#6366f1' } },
    { label: 'Error Message', style: { fontSize: 14, fontWeight: 'bold', color: '#ef4444' } },
    { label: 'Success Message', style: { fontSize: 14, fontWeight: 'bold', color: '#22c55e' } },
  ],
  table: [
    { label: 'Clean Light', style: { tableStriped: false, tableHeaderBg: '#f4f4f5', tableHeaderColor: '#18181b', tableRowBg: '#ffffff', tableShowGrid: true, borderColor: '#e4e4e7', color: '#18181b' } },
    { label: 'Striped Blue', style: { tableStriped: true, tableStripeColor: '#eff6ff', tableHeaderBg: '#3b82f6', tableHeaderColor: '#ffffff', tableRowBg: '#ffffff', tableShowGrid: false, color: '#18181b' } },
    { label: 'Dark Modern', style: { tableStriped: true, tableStripeColor: '#27272a', tableHeaderBg: '#18181b', tableHeaderColor: '#e4e4e7', tableRowBg: '#09090b', borderColor: '#3f3f46', tableShowGrid: true, color: '#e4e4e7' } },
    { label: 'Minimal', style: { tableStriped: false, tableShowGrid: false, tableHeaderBg: 'transparent', tableHeaderColor: '#a1a1aa', tableRowBg: 'transparent', borderColor: 'transparent', color: '#e4e4e7' } },
  ],
  rectangle: [
    { label: 'Card Surface', style: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 8 } },
    { label: 'Outlined Box', style: { backgroundColor: 'transparent', borderColor: '#52525b', borderWidth: 2, borderRadius: 4 } },
    { label: 'Primary Solid', style: { backgroundColor: '#6366f1', borderColor: 'transparent', borderWidth: 0, borderRadius: 6 } },
    { label: 'Subtle Fill', style: { backgroundColor: '#27272a', borderColor: 'transparent', borderWidth: 0, borderRadius: 4 } },
    { label: 'Dashed Border', style: { backgroundColor: 'transparent', borderColor: '#71717a', borderWidth: 2, borderRadius: 4 } },
  ]
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  onUpdate,
  metadata,
  onUpdateMetadata,
  onExport,
}) => {
  if (!element) {
    return (
      <aside className="w-80 bg-surface border-l border-border p-6 flex flex-col h-full z-20 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BoxSelect size={18} className="text-primary" />
            Report Settings
        </h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Report Name</label>
            <input
              type="text"
              value={metadata.name}
              onChange={(e) => onUpdateMetadata('name', e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-zinc-600"
              placeholder="Enter report name..."
            />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Export Actions</label>
             <div className="grid grid-cols-1 gap-2">
                <button
                    onClick={() => onExport('PDF')}
                    className="w-full py-2 bg-primary hover:bg-primaryHover text-white rounded font-medium shadow transition-all text-xs"
                >
                    Download as PDF
                </button>
                 <button
                    onClick={() => onExport('HTML')}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium shadow transition-all text-xs border border-zinc-700"
                >
                    Download as HTML
                </button>
                <button
                    onClick={() => onExport('JSON')}
                    className="w-full py-2 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white rounded font-medium transition-all text-xs border border-zinc-700"
                >
                    Save JSON Template
                </button>
             </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
              <p className="text-zinc-500 text-xs text-center leading-relaxed">
                  Select an element on the canvas to edit its properties.
              </p>
          </div>
        </div>
      </aside>
    );
  }

  const handleChange = (field: keyof ReportElement | 'style', value: any, styleField?: string) => {
    if (field === 'style' && styleField) {
      onUpdate({
        ...element,
        style: {
          ...element.style,
          [styleField]: value,
        },
      });
    } else {
      onUpdate({
        ...element,
        [field]: value,
      });
    }
  };

  const handleApplyPreset = (presetStyle: Partial<ElementStyle>) => {
    onUpdate({
        ...element,
        style: {
            ...element.style,
            ...presetStyle
        }
    });
  };

  const handleColumnUpdate = (colId: string, field: keyof TableColumn, value: any) => {
    if (!element.columns) return;
    const newColumns = element.columns.map(col => 
      col.id === colId ? { ...col, [field]: value } : col
    );
    onUpdate({ ...element, columns: newColumns });
  };

  const addColumn = () => {
    const newCol: TableColumn = {
        id: generateUUID(),
        header: 'New Column',
        accessorKey: 'key',
        width: 100,
        align: 'left'
    };
    onUpdate({ ...element, columns: [...(element.columns || []), newCol] });
  };

  const removeColumn = (id: string) => {
    onUpdate({ ...element, columns: element.columns?.filter(col => col.id !== id) });
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                onUpdate({ ...element, src: event.target.result as string });
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const elementPresets = STYLE_PRESETS[element.type];

  return (
    <aside className="w-80 bg-surface border-l border-border flex flex-col h-full overflow-hidden z-20 shadow-xl">
      <div className="p-5 border-b border-border bg-surface shrink-0">
        <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                {element.label}
            </h2>
            <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800">{element.id.slice(0, 4)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        
        {/* Style Presets Dropdown */}
        {elementPresets && (
            <section className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Palette size={12} />
                    Quick Styles
                </h3>
                <div className="relative">
                    <select
                        onChange={(e) => {
                             const preset = elementPresets.find(p => p.label === e.target.value);
                             if (preset) handleApplyPreset(preset.style);
                             e.target.value = ""; 
                        }}
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded px-3 py-2 appearance-none focus:border-primary focus:outline-none cursor-pointer"
                        defaultValue=""
                    >
                        <option value="" disabled>Select a preset...</option>
                        {elementPresets.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" size={14} />
                </div>
                <hr className="border-zinc-800" />
            </section>
        )}

        {/* Position */}
        <section className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase">X</label>
                    <input
                    type="number"
                    value={element.x}
                    onChange={(e) => handleChange('x', parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase">Y</label>
                    <input
                    type="number"
                    value={element.y}
                    onChange={(e) => handleChange('y', parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                    />
                </div>
            </div>
        </section>

        {/* Dynamic Content Inputs */}
        <section className="space-y-4">
             {/* Text Content */}
             {element.type === 'text' && (
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase">Text Content</label>
                    <textarea
                    rows={3}
                    value={element.content || ''}
                    onChange={(e) => handleChange('content', e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-primary resize-none"
                    />
                </div>
            )}

             {/* List Type Selection */}
            {element.type === 'list' && (
                <div className="space-y-2">
                     <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><List size={10}/> List Style</label>
                     <div className="flex bg-zinc-900 rounded border border-zinc-700 p-0.5">
                        <button
                            onClick={() => handleChange('style', 'disc', 'listStyle')}
                            className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${element.style.listStyle !== 'decimal' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Bulleted
                        </button>
                         <button
                            onClick={() => handleChange('style', 'decimal', 'listStyle')}
                            className={`flex-1 px-2 py-1.5 rounded text-xs transition-colors ${element.style.listStyle === 'decimal' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Numbered
                        </button>
                    </div>
                </div>
            )}

            {/* Barcode/QR */}
            {(element.type === 'barcode' || element.type === 'qrcode') && (
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><ScanLine size={10}/> Value to Encode</label>
                    <input
                        type="text"
                        value={element.content || ''}
                        onChange={(e) => handleChange('content', e.target.value)}
                        placeholder="12345678"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-primary font-mono"
                    />
                </div>
            )}

            {/* Chart */}
             {element.type === 'chart' && (
                <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1"><BarChart size={10}/> Chart Type</label>
                         <select
                            value={element.style.chartType || 'bar'}
                            onChange={(e) => handleChange('style', e.target.value, 'chartType')}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                        >
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                            <option value="pie">Pie Chart</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">Chart Title</label>
                        <input
                            type="text"
                            value={element.content || ''}
                            onChange={(e) => handleChange('content', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>
            )}

            {/* Image Content */}
            {element.type === 'image' && (
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase">Image URL</label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={element.src || ''}
                            onChange={(e) => handleChange('src', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase block mb-1">Or Upload File</label>
                        <label className="flex items-center justify-center gap-2 w-full p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 border-dashed rounded cursor-pointer transition-colors">
                            <Upload size={14} className="text-zinc-400" />
                            <span className="text-xs text-zinc-300">Choose Image</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                    </div>
                     <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase">Object Fit</label>
                        <select
                            value={element.style.objectFit || 'cover'}
                            onChange={(e) => handleChange('style', e.target.value, 'objectFit')}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none"
                        >
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                            <option value="fill">Fill</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Placeholder Key */}
            {element.type === 'placeholder' && (
                <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 uppercase">Variable Key</label>
                    <div className="relative group">
                    <span className="absolute left-3 top-2 text-primary font-mono text-xs font-bold">{`{{`}</span>
                    <input
                        type="text"
                        value={element.key || ''}
                        onChange={(e) => handleChange('key', e.target.value.replace(/\s/g, '_'))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded pl-8 pr-8 py-2 text-xs text-primary font-mono font-medium focus:outline-none focus:border-primary group-hover:border-zinc-600 transition-colors"
                    />
                    <span className="absolute right-3 top-2 text-primary font-mono text-xs font-bold">{`}}`}</span>
                    </div>
                </div>
            )}
        </section>

        <hr className="border-zinc-800" />

        {/* Table Specific Design Section */}
        {element.type === 'table' && (
            <>
                {/* Column Manager */}
                <section className="space-y-4">
                     <div className="flex justify-between items-center">
                         <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Grid3X3 size={12} /> Columns
                         </h3>
                         <button 
                            onClick={addColumn}
                            className="p-1 bg-primary hover:bg-primaryHover text-white rounded transition-colors"
                         >
                             <Plus size={14} />
                         </button>
                     </div>
                     
                     <div className="space-y-2">
                        {(element.columns || []).map((col) => (
                            <div key={col.id} className="bg-zinc-900 border border-zinc-700 rounded p-2 space-y-2">
                                <div className="flex gap-2">
                                     <div className="flex-1 space-y-1">
                                         <label className="text-[10px] text-zinc-500">Header</label>
                                         <input 
                                            value={col.header} 
                                            onChange={(e) => handleColumnUpdate(col.id, 'header', e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:border-primary focus:outline-none"
                                         />
                                     </div>
                                     <button onClick={() => removeColumn(col.id)} className="text-zinc-600 hover:text-red-500 mt-4">
                                         <Trash2 size={14} />
                                     </button>
                                </div>
                                <div className="flex gap-2">
                                     <div className="flex-1 space-y-1">
                                         <label className="text-[10px] text-zinc-500">Key</label>
                                         <input 
                                            value={col.accessorKey} 
                                            onChange={(e) => handleColumnUpdate(col.id, 'accessorKey', e.target.value)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:border-primary focus:outline-none"
                                         />
                                     </div>
                                     <div className="w-16 space-y-1">
                                         <label className="text-[10px] text-zinc-500">Width</label>
                                         <input 
                                            type="number"
                                            value={col.width || ''}
                                            placeholder="Auto"
                                            onChange={(e) => handleColumnUpdate(col.id, 'width', parseInt(e.target.value))}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:border-primary focus:outline-none"
                                         />
                                     </div>
                                </div>
                            </div>
                        ))}
                     </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <PaintBucket size={12} /> Table Styling
                    </h3>
                    
                    <div className="space-y-3">
                        {/* Header Styles */}
                         <div className="grid grid-cols-2 gap-2">
                             <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase">Header BG</label>
                                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded p-1">
                                    <input
                                        type="color"
                                        value={element.style.tableHeaderBg || '#f4f4f5'}
                                        onChange={(e) => handleChange('style', e.target.value, 'tableHeaderBg')}
                                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                                    />
                                    <span className="text-[10px] text-zinc-400 font-mono">{element.style.tableHeaderBg}</span>
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] text-zinc-500 uppercase">Header Text</label>
                                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded p-1">
                                    <input
                                        type="color"
                                        value={element.style.tableHeaderColor || '#18181b'}
                                        onChange={(e) => handleChange('style', e.target.value, 'tableHeaderColor')}
                                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                                    />
                                    <span className="text-[10px] text-zinc-400 font-mono">{element.style.tableHeaderColor}</span>
                                </div>
                             </div>
                         </div>

                        {/* Row Styles */}
                         <div className="space-y-1">
                             <label className="text-[10px] text-zinc-500 uppercase">Row Background</label>
                             <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded p-1">
                                <input
                                    type="color"
                                    value={element.style.tableRowBg || '#ffffff'} // default usually transparent/white
                                    onChange={(e) => handleChange('style', e.target.value, 'tableRowBg')}
                                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                                />
                                <span className="text-[10px] text-zinc-400 font-mono">{element.style.tableRowBg || 'None'}</span>
                             </div>
                         </div>

                         {/* Striping */}
                         <div className="space-y-2 pt-1">
                             <div className="flex items-center justify-between">
                                 <label className="text-[10px] text-zinc-500 uppercase">Zebra Striping</label>
                                 <input 
                                    type="checkbox" 
                                    checked={element.style.tableStriped || false}
                                    onChange={(e) => handleChange('style', e.target.checked, 'tableStriped')}
                                    className="accent-primary"
                                 />
                             </div>
                             {element.style.tableStriped && (
                                 <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded p-1 animate-in fade-in slide-in-from-top-1">
                                    <span className="text-[10px] text-zinc-500 pl-1">Stripe Color:</span>
                                    <input
                                        type="color"
                                        value={element.style.tableStripeColor || '#f8fafc'}
                                        onChange={(e) => handleChange('style', e.target.value, 'tableStripeColor')}
                                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0 ml-auto"
                                    />
                                 </div>
                             )}
                         </div>

                         {/* Grid Lines */}
                         <div className="flex items-center justify-between pt-1">
                                 <label className="text-[10px] text-zinc-500 uppercase">Show Grid Lines</label>
                                 <input 
                                    type="checkbox" 
                                    checked={element.style.tableShowGrid !== false}
                                    onChange={(e) => handleChange('style', e.target.checked, 'tableShowGrid')}
                                    className="accent-primary"
                                 />
                         </div>
                    </div>
                </section>
                <hr className="border-zinc-800" />
            </>
        )}


        {/* Typography Section */}
        {(element.type === 'text' || element.type === 'list' || element.type === 'placeholder' || element.type === 'header' || element.type === 'footer') && (
            <section className="space-y-4">
                 <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <Type size={12} />
                    Typography
                </h3>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                         <div className="space-y-1 flex-1">
                            <label className="text-[10px] text-zinc-500 uppercase">Size</label>
                            <div className="flex items-center gap-2">
                                <input
                                type="range"
                                min="8"
                                max="72"
                                value={element.style.fontSize || 14}
                                onChange={(e) => handleChange('style', parseInt(e.target.value), 'fontSize')}
                                className="w-full accent-primary h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="text-xs w-8 text-right text-zinc-400">{element.style.fontSize || 14}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {/* Font Weight */}
                        <button
                            onClick={() => handleChange('style', element.style.fontWeight === 'bold' ? 'normal' : 'bold', 'fontWeight')}
                            className={`flex-1 flex items-center justify-center gap-1 p-2 rounded text-xs border ${element.style.fontWeight === 'bold' ? 'bg-primary/20 border-primary text-primary' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                        >
                            <Bold size={14} />
                            <span>Bold</span>
                        </button>

                         {/* Text Color Picker */}
                         <div className="flex-1 relative">
                            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded p-1 pl-2 gap-2 h-full">
                                <span className="text-[10px] text-zinc-500 uppercase flex-1">Color</span>
                                <input
                                    type="color"
                                    value={element.style.color || '#ffffff'}
                                    onChange={(e) => handleChange('style', e.target.value, 'color')}
                                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Alignment */}
                    <div className="flex bg-zinc-900 rounded border border-zinc-700 p-0.5">
                        {['left', 'center', 'right'].map((align) => (
                             <button
                                key={align}
                                onClick={() => handleChange('style', align, 'textAlign')}
                                className={`flex-1 p-1.5 rounded flex items-center justify-center transition-colors ${element.style.textAlign === align || (!element.style.textAlign && align === 'left') ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                             >
                                {align === 'left' && <AlignLeft size={14} />}
                                {align === 'center' && <AlignCenter size={14} />}
                                {align === 'right' && <AlignRight size={14} />}
                             </button>
                        ))}
                    </div>
                </div>
            </section>
        )}

        {(element.type === 'text' || element.type === 'placeholder' || element.type === 'header' || element.type === 'footer') && (
            <hr className="border-zinc-800" />
        )}

        {/* Appearance Section */}
        <section className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <PaintBucket size={12} />
                Appearance
            </h3>

            <div className="space-y-3">
                 {/* Background Color */}
                 {element.type !== 'line' && (
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded p-2">
                        <span className="text-xs text-zinc-400">Background</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">{element.style.backgroundColor || 'None'}</span>
                            <input
                                type="color"
                                value={element.style.backgroundColor || '#000000'}
                                onChange={(e) => handleChange('style', e.target.value, 'backgroundColor')}
                                className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                            />
                        </div>
                    </div>
                 )}

                 {/* Border Color & Width */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                         <label className="text-[10px] text-zinc-500 uppercase">{element.type === 'line' ? 'Line Color' : 'Border'}</label>
                         <input
                            type="color"
                            value={element.style.borderColor || '#000000'}
                            onChange={(e) => handleChange('style', e.target.value, 'borderColor')}
                            className="w-4 h-4 rounded cursor-pointer bg-transparent border-none p-0"
                        />
                    </div>
                    {element.type !== 'line' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={element.style.borderWidth || 0}
                                onChange={(e) => handleChange('style', parseInt(e.target.value), 'borderWidth')}
                                className="w-full accent-zinc-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs w-6 text-right text-zinc-400">{element.style.borderWidth || 0}</span>
                        </div>
                    )}
                    {element.type === 'line' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={element.style.height || 2}
                                onChange={(e) => handleChange('style', parseInt(e.target.value), 'height')}
                                className="w-full accent-zinc-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs w-6 text-right text-zinc-400">{element.style.height || 2}</span>
                        </div>
                    )}
                 </div>

                 {/* Radius */}
                 {element.type !== 'line' && (
                 <div className="space-y-1">
                    <div className="flex justify-between">
                        <label className="text-[10px] text-zinc-500 uppercase">Corner Radius</label>
                        <span className="text-xs text-zinc-400">{element.style.borderRadius || 0}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="24"
                        value={element.style.borderRadius || 0}
                        onChange={(e) => handleChange('style', parseInt(e.target.value), 'borderRadius')}
                        className="w-full accent-zinc-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                 </div>
                 )}

                 {/* Padding */}
                 {element.type !== 'line' && (
                 <div className="space-y-1">
                    <div className="flex justify-between">
                        <label className="text-[10px] text-zinc-500 uppercase">Padding</label>
                        <span className="text-xs text-zinc-400">{element.style.padding || 0}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="40"
                        value={element.style.padding || 0}
                        onChange={(e) => handleChange('style', parseInt(e.target.value), 'padding')}
                        className="w-full accent-zinc-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                 </div>
                 )}

                 {/* Width/Height for non-text items or explicit sizing */}
                 <div className="grid grid-cols-2 gap-3 pt-2">
                     <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                             <Maximize size={10} className="rotate-90" /> Width
                        </label>
                        <input
                            type="number"
                            placeholder="Auto"
                            value={element.style.width || ''}
                            onChange={(e) => handleChange('style', parseInt(e.target.value) || undefined, 'width')}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none placeholder:text-zinc-600"
                        />
                     </div>
                     {element.type !== 'line' && (
                        <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                                <Maximize size={10} /> Height
                            </label>
                            <input
                                type="number"
                                placeholder="Auto"
                                value={element.style.height || ''}
                                onChange={(e) => handleChange('style', parseInt(e.target.value) || undefined, 'height')}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white focus:border-primary focus:outline-none placeholder:text-zinc-600"
                            />
                        </div>
                     )}
                 </div>

            </div>
        </section>

      </div>
    </aside>
  );
};
