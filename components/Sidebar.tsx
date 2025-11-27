
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, Table, Braces, LayoutTemplate, SquareDashedBottom, Image as ImageIcon, 
  Minus, Square, Barcode, QrCode, BarChart, List, FileText, Grid,
  PieChart, LineChart, Heading1, Heading2, AlignLeft, ListOrdered, Grid3X3
} from 'lucide-react';
import { ElementType, ElementStyle, TableColumn } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface DraggablePresetProps {
  type: ElementType;
  label: string;
  icon: React.ElementType;
  initialStyle?: Partial<ElementStyle>;
  initialContent?: string;
  initialColumns?: TableColumn[];
}

const DraggableItem = ({ type, label, icon: Icon, initialStyle, initialContent, initialColumns }: DraggablePresetProps) => {
  const handleDragStart = (e: any) => {
    e.dataTransfer.setData('application/react-dnd-type', type);
    e.dataTransfer.setData('application/react-dnd-label', label);
    
    // Serialize specific style presets to pass to the canvas
    const payload = {
        initialStyle,
        initialContent,
        initialColumns
    };
    e.dataTransfer.setData('application/react-dnd-payload', JSON.stringify(payload));
    
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <motion.div
      draggable
      onDragStart={handleDragStart}
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-2.5 mb-2 rounded-md bg-surface border border-border cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm group"
    >
      <Icon size={16} className="text-zinc-400 group-hover:text-primary transition-colors" />
      <span className="text-xs font-medium text-zinc-300 select-none group-hover:text-white">{label}</span>
    </motion.div>
  );
};

const SectionHeader = ({ title, icon: Icon }: { title: string; icon: any }) => (
    <h3 className="text-[10px] font-bold text-zinc-500 mb-3 mt-5 ml-1 uppercase tracking-wider flex items-center gap-2">
        <Icon size={12} /> {title}
    </h3>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  
  const defaultColumns: TableColumn[] = [
    { id: 'c1', header: 'Item Name', accessorKey: 'item', align: 'left' },
    { id: 'c2', header: 'Quantity', accessorKey: 'qty', align: 'right', width: 80 },
    { id: 'c3', header: 'Unit Price', accessorKey: 'price', align: 'right', width: 100 }
  ];

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: -250, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -250, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-64 h-full bg-background border-r border-border flex flex-col z-20 shrink-0"
        >
          <div className="p-4 border-b border-border flex justify-between items-center bg-background/50 backdrop-blur">
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">Component Library</h2>
            <button onClick={toggleSidebar} className="lg:hidden text-zinc-400 hover:text-white">
              ✕
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
            
            <SectionHeader title="Typography" icon={FileText} />
            <DraggableItem 
                type="text" 
                label="Heading 1" 
                icon={Heading1} 
                initialStyle={{ fontSize: 32, fontWeight: 'bold' }} 
                initialContent="Heading 1"
            />
            <DraggableItem 
                type="text" 
                label="Heading 2" 
                icon={Heading2} 
                initialStyle={{ fontSize: 24, fontWeight: 'bold', color: '#a1a1aa' }} 
                initialContent="Heading 2"
            />
            <DraggableItem 
                type="text" 
                label="Paragraph" 
                icon={AlignLeft} 
                initialStyle={{ fontSize: 14, fontWeight: 'normal' }} 
                initialContent="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            />
            <DraggableItem 
                type="list" 
                label="Bulleted List" 
                icon={List} 
                initialStyle={{ listStyle: 'disc' }}
            />
            <DraggableItem 
                type="list" 
                label="Numbered List" 
                icon={ListOrdered} 
                initialStyle={{ listStyle: 'decimal' }}
            />
            
            <SectionHeader title="Data Visualization" icon={BarChart} />
             <DraggableItem 
                type="chart" 
                label="Bar Chart" 
                icon={BarChart} 
                initialStyle={{ chartType: 'bar', width: 300, height: 200 }} 
                initialContent="Quarterly Sales"
            />
            <DraggableItem 
                type="chart" 
                label="Line Chart" 
                icon={LineChart} 
                initialStyle={{ chartType: 'line', width: 300, height: 200 }} 
                initialContent="Growth Trend"
            />
            <DraggableItem 
                type="chart" 
                label="Pie Chart" 
                icon={PieChart} 
                initialStyle={{ chartType: 'pie', width: 250, height: 250 }} 
                initialContent="Distribution"
            />
            
            <SectionHeader title="Tables & Grids" icon={Table} />
            <DraggableItem 
                type="table" 
                label="Simple Table" 
                icon={Table} 
                initialStyle={{ tableStriped: false, tableShowGrid: false }}
                initialColumns={defaultColumns}
            />
            <DraggableItem 
                type="table" 
                label="Striped Table" 
                icon={List} 
                initialStyle={{ tableStriped: true, tableShowGrid: false, tableStripeColor: '#f8fafc', tableRowBg: '#ffffff' }}
                initialColumns={defaultColumns}
            />
            <DraggableItem 
                type="table" 
                label="Grid Table" 
                icon={Grid3X3} 
                initialStyle={{ tableStriped: false, tableShowGrid: true, borderColor: '#e4e4e7' }}
                initialColumns={defaultColumns}
            />

            <SectionHeader title="Dynamic Fields" icon={Braces} />
            <DraggableItem type="placeholder" label="Variable Field" icon={Braces} />

            <SectionHeader title="Media & Codes" icon={ImageIcon} />
            <DraggableItem type="image" label="Image" icon={ImageIcon} />
            <DraggableItem type="barcode" label="Barcode (1D)" icon={Barcode} />
            <DraggableItem type="qrcode" label="QR Code (2D)" icon={QrCode} />

            <SectionHeader title="Shapes & Layout" icon={Grid} />
            <DraggableItem type="rectangle" label="Box Container" icon={Square} initialStyle={{ borderWidth: 1, borderColor: '#000000', borderRadius: 4 }} />
            <DraggableItem type="rectangle" label="Solid Box" icon={Square} initialStyle={{ backgroundColor: '#e4e4e7', borderRadius: 0 }} />
            <DraggableItem type="line" label="Divider" icon={Minus} />
            <DraggableItem type="header" label="Header Band" icon={LayoutTemplate} />
            <DraggableItem type="footer" label="Footer Band" icon={SquareDashedBottom} />

          </div>
          
          <div className="p-4 border-t border-border bg-background/50">
            <div className="text-xs text-zinc-500 text-center">
              Drag components to design
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
