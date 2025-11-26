

import React, { useRef } from 'react';
import { ReportElement, ElementType, ElementStyle } from '../types';
import { CanvasElement } from './CanvasElement';
import { v4 as uuidv4 } from 'uuid';

interface CanvasProps {
  elements: ReportElement[];
  setElements: React.Dispatch<React.SetStateAction<ReportElement[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

// A4 Dimensions in Pixels (approx 96 DPI)
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export const Canvas: React.FC<CanvasProps> = ({ elements, setElements, selectedId, setSelectedId }) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-dnd-type') as ElementType;
    const label = e.dataTransfer.getData('application/react-dnd-label');
    const payloadString = e.dataTransfer.getData('application/react-dnd-payload');

    if (!type || !canvasRef.current) return;

    let initialStyle: Partial<ElementStyle> = {};
    let initialContent: string | undefined = undefined;

    if (payloadString) {
        try {
            const payload = JSON.parse(payloadString);
            initialStyle = payload.initialStyle || {};
            initialContent = payload.initialContent;
        } catch (err) {
            console.error("Failed to parse drop payload", err);
        }
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Snap to grid (optional, currently 10px)
    const snappedX = Math.round(x / 10) * 10;
    const snappedY = Math.round(y / 10) * 10;

    // Default styles based on type if not provided by preset
    const defaultStyles: ElementStyle = {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#000000',
        width: type === 'rectangle' || type === 'chart' ? 200 : undefined,
        height: type === 'rectangle' || type === 'chart' ? 150 : undefined,
        borderColor: type === 'line' ? '#000000' : undefined,
        borderWidth: type === 'rectangle' ? 1 : 0,
        ...initialStyle // Merge preset styles last
    };

    const newElement: ReportElement = {
      id: uuidv4(),
      type,
      label,
      x: snappedX,
      y: snappedY,
      content: initialContent || (type === 'text' ? 'New Text Block' : (type === 'barcode' || type === 'qrcode' ? '123456' : type === 'chart' ? 'New Chart' : undefined)),
      key: type === 'placeholder' ? 'new_variable' : undefined,
      style: defaultStyles,
    };

    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
  };

  const handleUpdatePosition = (id: string, x: number, y: number) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, x, y } : el))
    );
  };

  const handleDelete = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId(null);
  };

  return (
    <div 
      className="flex-1 bg-zinc-900/50 overflow-auto flex justify-center p-8 relative"
      onClick={() => setSelectedId(null)}
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
        }}
        onClick={(e) => e.stopPropagation()} // Prevent deselection when clicking empty canvas area
      >
        {/* Helper grid lines (subtle) */}
        <div className="absolute inset-0 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(to right, #f4f4f5 1px, transparent 1px), linear-gradient(to bottom, #f4f4f5 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />

        {elements.map((el) => (
          <CanvasElement
            key={el.id}
            element={el}
            isSelected={selectedId === el.id}
            onSelect={setSelectedId}
            onDelete={handleDelete}
            onUpdatePosition={handleUpdatePosition}
          />
        ))}

        {elements.length === 0 && (
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