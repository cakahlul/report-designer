
import React, { useRef, useState } from 'react';
import { ReportElement, ElementType, ElementStyle, TableColumn, SnapGuide } from '../types';
import { CanvasElement } from './CanvasElement';

interface CanvasProps {
  elements: ReportElement[];
  setElements: React.Dispatch<React.SetStateAction<ReportElement[]>>;
  addToHistory: (elements: ReportElement[]) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  previewMode?: boolean;
  dataContext?: Record<string, any>;
  onClearSelection: () => void;
}

// A4 Dimensions in Pixels (approx 96 DPI)
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const SNAP_THRESHOLD = 5;

// Helper to generate UUIDs locally
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

export const Canvas: React.FC<CanvasProps> = ({ 
  elements, 
  setElements, 
  addToHistory, 
  selectedId, 
  setSelectedId, 
  previewMode = false,
  dataContext = {},
  onClearSelection
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    if (previewMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (previewMode) return;
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-dnd-type') as ElementType;
    const label = e.dataTransfer.getData('application/react-dnd-label');
    const payloadString = e.dataTransfer.getData('application/react-dnd-payload');

    if (!type || !canvasRef.current) return;

    let initialStyle: Partial<ElementStyle> = {};
    let initialContent: string | undefined = undefined;
    let initialColumns: TableColumn[] | undefined = undefined;

    if (payloadString) {
        try {
            const payload = JSON.parse(payloadString);
            initialStyle = payload.initialStyle || {};
            initialContent = payload.initialContent;
            initialColumns = payload.initialColumns;
        } catch (err) {
            console.error("Failed to parse drop payload", err);
        }
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Initial snap to grid
    const snappedX = Math.round(x / 10) * 10;
    const snappedY = Math.round(y / 10) * 10;

    const defaultStyles: ElementStyle = {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#000000',
        width: type === 'rectangle' || type === 'chart' ? 200 : type === 'table' ? 400 : undefined,
        height: type === 'rectangle' || type === 'chart' ? 150 : undefined,
        borderColor: type === 'line' ? '#000000' : undefined,
        borderWidth: type === 'rectangle' ? 1 : 0,
        ...initialStyle
    };

    const newElement: ReportElement = {
      id: generateUUID(),
      type,
      label,
      x: snappedX,
      y: snappedY,
      content: initialContent || (
        type === 'text' ? 'New Text Block' : 
        type === 'list' ? 'Item 1\nItem 2\nItem 3' : 
        (type === 'barcode' || type === 'qrcode' ? '123456' : 
        type === 'chart' ? 'New Chart' : undefined)
      ),
      key: type === 'placeholder' ? 'new_variable' : undefined,
      style: defaultStyles,
      columns: initialColumns
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    addToHistory(updatedElements);
    setSelectedId(newElement.id);
  };

  // --- Smart Snapping Logic ---
  const calculateSnap = (activeId: string, x: number, y: number, width: number, height: number) => {
    const guides: SnapGuide[] = [];
    let newX = x;
    let newY = y;

    // Define edges of the moving element
    const activeLeft = x;
    const activeCenter = x + width / 2;
    const activeRight = x + width;
    const activeTop = y;
    const activeMiddle = y + height / 2;
    const activeBottom = y + height;

    // Iterate through other elements
    elements.forEach(other => {
        if (other.id === activeId) return;

        // Determine dimensions of the other element
        const otherWidth = other.style.width || (['header', 'footer', 'line'].includes(other.type) ? A4_WIDTH : 200); // Approximation if width not set
        const otherHeight = other.style.height || 50;
        
        const otherLeft = other.x;
        const otherCenter = other.x + otherWidth / 2;
        const otherRight = other.x + otherWidth;
        const otherTop = other.y;
        const otherMiddle = other.y + otherHeight / 2;
        const otherBottom = other.y + otherHeight;

        // --- Vertical Alignment Checking ---
        const checkVertical = (val1: number, val2: number, targetX: number) => {
            if (Math.abs(val1 - val2) < SNAP_THRESHOLD) {
                newX = targetX; // Snap!
                guides.push({ 
                    type: 'vertical', 
                    position: val2, 
                    start: Math.min(activeTop, otherTop) - 20, 
                    end: Math.max(activeBottom, otherBottom) + 20 
                });
            }
        };

        checkVertical(activeLeft, otherLeft, otherLeft);
        checkVertical(activeLeft, otherRight, otherRight);
        checkVertical(activeRight, otherRight, otherRight - width); // Snap right edge to right edge
        checkVertical(activeRight, otherLeft, otherLeft - width);   // Snap right edge to left edge
        checkVertical(activeCenter, otherCenter, otherCenter - width / 2);

        // --- Horizontal Alignment Checking ---
        const checkHorizontal = (val1: number, val2: number, targetY: number) => {
             if (Math.abs(val1 - val2) < SNAP_THRESHOLD) {
                newY = targetY; // Snap!
                guides.push({ 
                    type: 'horizontal', 
                    position: val2, 
                    start: Math.min(activeLeft, otherLeft) - 20, 
                    end: Math.max(activeRight, otherRight) + 20 
                });
            }
        };

        checkHorizontal(activeTop, otherTop, otherTop);
        checkHorizontal(activeTop, otherBottom, otherBottom);
        checkHorizontal(activeBottom, otherBottom, otherBottom - height);
        checkHorizontal(activeBottom, otherTop, otherTop - height);
        checkHorizontal(activeMiddle, otherMiddle, otherMiddle - height / 2);
    });

    return { x: newX, y: newY, guides };
  };

  const handleUpdatePosition = (id: string, x: number, y: number) => {
    const element = elements.find(e => e.id === id);
    if (!element) return;
    
    // Estimate width/height for snapping (since real DOM rect is hard to get synchronously here)
    // In a production app, we would cache rects on selection.
    const width = element.style.width || 200; 
    const height = element.style.height || 50;

    const { x: snappedX, y: snappedY, guides } = calculateSnap(id, x, y, width, height);

    setSnapGuides(guides);

    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x: snappedX, y: snappedY } : el))
    );
  };

  const handleResize = (id: string, width: number, height: number, x: number, y: number) => {
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== id) return el;
        return {
          ...el,
          x,
          y,
          style: {
            ...el.style,
            width,
            height,
          },
        };
      })
    );
  };

  const handleDragEnd = () => {
      setSnapGuides([]); // Clear guides
      // Save state to history after drag completes
      addToHistory(elements);
  };
  
  const handleDelete = (id: string) => {
    const updatedElements = elements.filter((el) => el.id !== id);
    setElements(updatedElements);
    addToHistory(updatedElements);
    setSelectedId(null);
  };

  return (
    <div 
      className="flex-1 bg-zinc-900/50 overflow-auto flex justify-center p-8 relative"
      onClick={() => onClearSelection()}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      
      <div
        id="report-canvas"
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="bg-white shadow-2xl transition-all duration-300 relative overflow-hidden ring-1 ring-white/10"
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          minWidth: A4_WIDTH,
          minHeight: A4_HEIGHT,
          pointerEvents: previewMode ? 'none' : 'auto', // Disable dropping in preview
        }}
        onClick={(e) => { e.stopPropagation(); onClearSelection(); }} 
      >
        <div className="absolute inset-0 pointer-events-none" 
             style={{ 
               backgroundImage: previewMode ? 'none' : 'linear-gradient(to right, #f4f4f5 1px, transparent 1px), linear-gradient(to bottom, #f4f4f5 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />

        {/* --- Layout Assistant (Snap Guides) --- */}
        {!previewMode && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[200]">
            {snapGuides.map((guide, i) => (
                <line 
                    key={i}
                    x1={guide.type === 'vertical' ? guide.position : guide.start}
                    y1={guide.type === 'vertical' ? guide.start : guide.position}
                    x2={guide.type === 'vertical' ? guide.position : guide.end}
                    y2={guide.type === 'vertical' ? guide.end : guide.position}
                    stroke="#ec4899" 
                    strokeWidth="1" 
                    strokeDasharray="4 2"
                />
            ))}
        </svg>
        )}

        {elements.map((el) => (
          <CanvasElement
            key={el.id}
            element={el}
            isSelected={selectedId === el.id}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onUpdatePosition={handleUpdatePosition}
            onResize={handleResize}
            onDragEnd={handleDragEnd}
            previewMode={previewMode}
            dataContext={dataContext}
          />
        ))}

        {elements.length === 0 && !previewMode && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-zinc-300 text-center">
              <p className="text-xl font-medium mb-2">Empty Template</p>
              <p className="text-sm">Drag elements from the sidebar to start designing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
