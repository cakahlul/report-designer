

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ReportElement } from '../types';
import { Trash2, GripVertical, Image as ImageIcon, BarChart, QrCode } from 'lucide-react';

interface CanvasElementProps {
  element: ReportElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDragEnd: () => void;
}

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  onSelect,
  onDelete,
  onUpdatePosition,
  onDragEnd,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id);
    
    isDragging.current = true;
    dragStart.current = { x: e.clientX - element.x, y: e.clientY - element.y };
    let hasMoved = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging.current) {
        hasMoved = true;
        const newX = moveEvent.clientX - dragStart.current.x;
        const newY = moveEvent.clientY - dragStart.current.y;
        onUpdatePosition(element.id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      const wasDragging = isDragging.current;
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      if (wasDragging && hasMoved) {
        onDragEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Construct dynamic styles
  const containerStyle: React.CSSProperties = {
    left: element.x,
    top: element.y,
    width: element.style.width ? element.style.width : (['header', 'footer', 'line'].includes(element.type) ? '100%' : 'auto'),
    height: element.style.height ? element.style.height : (element.type === 'line' ? 'auto' : 'auto'),
    minWidth: element.type === 'table' ? 300 : (element.type === 'chart' ? 100 : 'auto'),
    minHeight: element.type === 'chart' ? 100 : 'auto',
    backgroundColor: element.type === 'line' ? 'transparent' : (element.style.backgroundColor || 'transparent'),
    borderWidth: element.style.borderWidth ? `${element.style.borderWidth}px` : '0px',
    borderColor: element.style.borderColor || 'transparent',
    borderStyle: element.style.borderWidth ? 'solid' : 'none',
    borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '0px',
    padding: element.style.padding ? `${element.style.padding}px` : '0px',
    opacity: element.style.opacity !== undefined ? element.style.opacity : 1,
    zIndex: ['header', 'footer'].includes(element.type) ? 0 : 10,
  };

  const textStyle: React.CSSProperties = {
    fontSize: element.style.fontSize,
    fontWeight: element.style.fontWeight,
    textAlign: element.style.textAlign || 'left',
    color: element.style.color || 'inherit',
    width: '100%',
  };

  const getRenderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <p style={textStyle} className="whitespace-pre-wrap leading-normal">
            {element.content || 'Double click to edit text...'}
          </p>
        );
      
      case 'list':
        const ListTag = element.style.listStyle === 'decimal' ? 'ol' : 'ul';
        return (
            <ListTag style={{ ...textStyle, listStyleType: element.style.listStyle || 'disc', paddingLeft: '20px' }} className="space-y-1">
                <li>First item</li>
                <li>Second item</li>
                <li>Third item</li>
            </ListTag>
        );

      case 'placeholder':
        return (
          <div className="inline-flex items-center font-mono text-sm w-full" style={{ justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
            <span 
              className="px-2 py-1 rounded bg-primary/10 border border-primary/30 text-primary whitespace-nowrap"
              style={{ fontSize: element.style.fontSize, fontWeight: element.style.fontWeight }}
            >
              {`{{ ${element.key || 'variable_name'} }}`}
            </span>
          </div>
        );
        
      case 'line':
          return (
              <div className="w-full flex items-center justify-center py-2">
                  <div 
                    style={{ 
                        width: '100%', 
                        height: element.style.height || 2, 
                        backgroundColor: element.style.borderColor || '#000000',
                        borderRadius: 1
                    }} 
                  />
              </div>
          );
      
      case 'rectangle':
          // Container style handles bg and border
          return <div className="w-full h-full min-w-[50px] min-h-[50px]"></div>;

      case 'barcode':
          return (
              <div className="flex flex-col items-center justify-center bg-white p-2 w-full h-full">
                  <div 
                    className="h-12 w-full bg-repeat-x" 
                    style={{ 
                        backgroundImage: `linear-gradient(to right, black 2px, transparent 2px, black 4px, transparent 4px, black 1px, transparent 3px)`,
                        backgroundSize: '10px 100%'
                    }}
                  />
                  <span className="font-mono text-[10px] tracking-[0.2em] mt-1 text-black">{element.content || '123456789'}</span>
              </div>
          );

      case 'qrcode':
            return (
                <div className="flex items-center justify-center bg-white p-1 w-full h-full">
                    <QrCode size={element.style.width ? element.style.width - 20 : 64} color="black" />
                </div>
            );

      case 'chart':
            const chartType = element.style.chartType || 'bar';
            
            return (
                <div className="w-full h-full flex flex-col bg-white border border-zinc-200 p-2 overflow-hidden relative">
                    <h4 className="text-center font-semibold text-xs text-zinc-700 mb-2">{element.content || 'Chart Title'}</h4>
                    
                    <div className="flex-1 flex items-end justify-center w-full h-full relative">
                        {chartType === 'bar' && (
                             <div className="flex items-end justify-around gap-1 w-full h-full px-2 pb-2">
                                <div className="w-1/5 bg-blue-400 h-[60%] rounded-t-sm transition-all duration-300"></div>
                                <div className="w-1/5 bg-blue-500 h-[80%] rounded-t-sm transition-all duration-300"></div>
                                <div className="w-1/5 bg-blue-600 h-[40%] rounded-t-sm transition-all duration-300"></div>
                                <div className="w-1/5 bg-blue-700 h-[90%] rounded-t-sm transition-all duration-300"></div>
                            </div>
                        )}

                        {chartType === 'pie' && (
                            <div className="w-full h-full flex items-center justify-center pb-2">
                                <div 
                                    className="rounded-full"
                                    style={{
                                        width: Math.min(element.style.width || 100, element.style.height || 100) * 0.7,
                                        height: Math.min(element.style.width || 100, element.style.height || 100) * 0.7,
                                        background: 'conic-gradient(#60a5fa 0deg 90deg, #3b82f6 90deg 180deg, #2563eb 180deg 270deg, #1d4ed8 270deg 360deg)'
                                    }}
                                ></div>
                            </div>
                        )}

                        {chartType === 'line' && (
                            <svg className="w-full h-full p-2" viewBox="0 0 100 50" preserveAspectRatio="none">
                                <polyline 
                                    points="0,50 20,30 40,40 60,10 80,25 100,5" 
                                    fill="none" 
                                    stroke="#2563eb" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                                <circle cx="20" cy="30" r="1.5" fill="white" stroke="#2563eb" />
                                <circle cx="40" cy="40" r="1.5" fill="white" stroke="#2563eb" />
                                <circle cx="60" cy="10" r="1.5" fill="white" stroke="#2563eb" />
                                <circle cx="80" cy="25" r="1.5" fill="white" stroke="#2563eb" />
                            </svg>
                        )}
                    </div>
                </div>
            );

      case 'table':
        const headerBg = element.style.tableHeaderBg || '#f4f4f5';
        const headerColor = element.style.tableHeaderColor || '#18181b';
        const rowBg = element.style.tableRowBg || 'transparent';
        const stripeColor = element.style.tableStripeColor || '#f8fafc';
        const showGrid = element.style.tableShowGrid !== false;
        const gridColor = element.style.borderColor || '#e4e4e7';
        
        const cellStyle = {
            border: showGrid ? `1px solid ${gridColor}` : 'none',
            padding: '8px 12px',
        };

        return (
          <div className="w-full overflow-hidden" style={{ color: element.style.color }}>
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr style={{ backgroundColor: headerBg, color: headerColor }}>
                        <th style={{ ...cellStyle, textAlign: 'left' }}>Item</th>
                        <th style={{ ...cellStyle, textAlign: 'right' }}>Qty</th>
                        <th style={{ ...cellStyle, textAlign: 'right' }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3].map((row, idx) => {
                        const isEven = idx % 2 !== 0;
                        const rowBackground = element.style.tableStriped && isEven ? stripeColor : rowBg;
                        return (
                            <tr key={row} style={{ backgroundColor: rowBackground }}>
                                <td style={cellStyle}>Product {row}</td>
                                <td style={{ ...cellStyle, textAlign: 'right' }}>{row * 2}</td>
                                <td style={{ ...cellStyle, textAlign: 'right' }}>${(row * 15).toFixed(2)}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
          </div>
        );

      case 'image':
        if (!element.src) {
            return (
                <div className="w-full h-full min-h-[100px] flex flex-col items-center justify-center bg-zinc-100 border-2 border-dashed border-zinc-300 rounded text-zinc-400">
                    <ImageIcon size={24} className="mb-2" />
                    <span className="text-[10px] uppercase font-semibold">Image</span>
                </div>
            )
        }
        return (
            <img 
                src={element.src} 
                alt="Template Asset" 
                className="w-full h-full pointer-events-none block"
                style={{ 
                    objectFit: element.style.objectFit || 'cover',
                    borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '0px'
                }} 
            />
        );
      case 'header':
        return <div style={textStyle} className="w-full h-full flex items-center justify-center bg-zinc-100/50 border-b border-dashed border-zinc-300 text-zinc-400 uppercase tracking-widest text-xs font-bold pointer-events-none">Header Band</div>;
      case 'footer':
        return <div style={textStyle} className="w-full h-full flex items-center justify-center bg-zinc-100/50 border-t border-dashed border-zinc-300 text-zinc-400 uppercase tracking-widest text-xs font-bold pointer-events-none">Footer Band</div>;
      default:
        return <div>Unknown Element</div>;
    }
  };

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute cursor-move group select-none ${isSelected ? 'z-[100]' : ''}`}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      whileHover={{ scale: 1.005 }}
    >
      <div
        className={`relative w-full h-full transition-all duration-200 ${
          isSelected
            ? 'ring-1 ring-primary ring-offset-1 ring-offset-transparent shadow-xl'
            : 'hover:ring-1 hover:ring-primary/30'
        }`}
      >
        {/* Render Content */}
        <div className="w-full h-full overflow-hidden">
            {getRenderContent()}
        </div>

        {/* Selected Controls */}
        {isSelected && (
          <div className="absolute -top-8 right-0 flex items-center gap-1 bg-surface border border-border rounded-md shadow-lg p-1 z-50">
             <div className="p-1 text-zinc-400 cursor-grab active:cursor-grabbing">
                <GripVertical size={14} />
             </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
              className="p-1 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};