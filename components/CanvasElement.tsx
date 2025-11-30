
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ReportElement, TableColumn, ChartSeries } from '../types';
import { Trash2, GripVertical, Image as ImageIcon, BarChart, QrCode } from 'lucide-react';

interface CanvasElementProps {
  element: ReportElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number, x: number, y: number) => void;
  onDragEnd?: () => void;
  previewMode?: boolean;
  dataContext?: Record<string, any>;
}

const CHART_PALETTE = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  onSelect,
  onDelete,
  onUpdatePosition,
  onResize,
  onDragEnd,
  previewMode = false,
  dataContext = {}
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (previewMode) return; // Disable interaction in preview mode
    
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
      
      if (wasDragging && hasMoved && onDragEnd) {
        onDragEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;

    const el = elementRef.current;
    if (!el) return;

    const startWidth = el.offsetWidth;
    const startHeight = el.offsetHeight;
    const startLeft = element.x;
    const startTop = element.y;

    let hasResized = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      hasResized = true;
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startLeft;
      let newY = startTop;

      if (direction.includes('e')) {
        newWidth = startWidth + deltaX;
      } else if (direction.includes('w')) {
        newWidth = startWidth - deltaX;
        newX = startLeft + deltaX;
      }

      if (direction.includes('s')) {
        newHeight = startHeight + deltaY;
      } else if (direction.includes('n')) {
        newHeight = startHeight - deltaY;
        newY = startTop + deltaY;
      }

      if (newWidth < 20) {
         if (direction.includes('w')) newX = startLeft + (startWidth - 20);
         newWidth = 20;
      }
      if (newHeight < 20) {
         if (direction.includes('n')) newY = startTop + (startHeight - 20);
         newHeight = 20;
      }

      onResize(element.id, newWidth, newHeight, newX, newY);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (hasResized && onDragEnd) onDragEnd();
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
    minWidth: element.type === 'table' ? 300 : (element.type === 'chart' ? 150 : 'auto'),
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
    fontFamily: element.style.fontFamily,
    fontSize: element.style.fontSize,
    fontWeight: element.style.fontWeight,
    textAlign: element.style.textAlign || 'left',
    color: element.style.color || 'inherit',
    width: '100%',
  };

  // Helper to resolve nested keys "user.address.city"
  const resolveData = (path: string, obj: any) => {
    return path.split('.').reduce((prev, curr) => prev ? prev[curr] : undefined, obj);
  };

  // --- CHART RENDERING ---
  const renderChart = () => {
      const chartType = element.style.chartType || 'bar';
      const showLegend = element.style.chartShowLegend !== false;
      const showTotal = element.style.chartShowTotal || false;
      const legendPosition = element.style.chartLegendPosition || 'bottom';
      const showGrid = element.style.chartShowGrid !== false;
      const showLabels = element.style.chartShowDataLabels || false;
      const categoryKey = element.style.chartCategoryKey || 'label';
      const series = element.series || [{ id: '1', dataKey: 'value', label: 'Value', color: '#6366f1' }];
      
      let data: any[] = [];
      let isError = false;
      
      // Data Resolution
      if (previewMode && element.key) {
          const rawData = resolveData(element.key, dataContext);
          if (Array.isArray(rawData)) {
              data = rawData;
          } else {
              isError = true;
          }
      } else {
          // Smart Dummy Data Generation
          // If the user hasn't set up keys yet, default to generic "Item"
          let categories = ['Item A', 'Item B', 'Item C', 'Item D', 'Item E'];
          
          // Heuristic: If they set a key like 'month', 'year', 'date', switch to time-based dummy data
          if (categoryKey.toLowerCase().includes('month')) {
             categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
          } else if (categoryKey.toLowerCase().includes('year')) {
             categories = ['2020', '2021', '2022', '2023', '2024'];
          } else if (categoryKey.toLowerCase().includes('day')) {
             categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          } else if (categoryKey.toLowerCase().includes('product')) {
             categories = ['Laptop', 'Mouse', 'Screen', 'Keyboard', 'Dock'];
          }

          data = categories.map((cat, i) => {
              const row: any = { [categoryKey]: cat };
              series.forEach((s, idx) => {
                  // Generate deterministic pseudo-random data based on index and KEY NAME
                  // This ensures that changing the key name changes the visual chart, giving user feedback
                  const seed = s.dataKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  row[s.dataKey] = Math.floor((Math.sin(i + seed) + 1) * 40) + 20;
              });
              return row;
          });
      }

      if (isError) {
          return (
              <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-500 p-4 border border-red-200">
                  <BarChart size={24} className="mb-2 opacity-50" />
                  <span className="text-[10px] font-bold uppercase">Data Error</span>
                  <span className="text-[10px] text-center mt-1">Key <code>{element.key}</code> is not an array.</span>
              </div>
          );
      }

      // Calculate Total
      const totalValue = data.reduce((acc, row) => {
          return acc + series.reduce((sAcc, s) => {
              const val = Number(resolveData(s.dataKey, row));
              return sAcc + (isNaN(val) ? 0 : val);
          }, 0);
      }, 0);

      // Calculate Max for Scale
      const allValues = data.flatMap(row => series.map(s => Number(resolveData(s.dataKey, row) || 0)));
      const maxValue = Math.max(...allValues, 10) * 1.1; // 10% padding

      const padding = { top: 20, right: 10, bottom: 25, left: 30 };
      
      // Calculate Container Sizes based on Legend Position
      const containerWidth = (element.style.width || 400); 
      const containerHeight = (element.style.height || 300);

      // Determine dimensions available for the actual chart (SVG) vs the legend
      let chartAreaWidth = containerWidth;
      let chartAreaHeight = containerHeight;
      const legendSize = 100; // rough px for side legend width
      const legendHeightPx = 40; // rough px for top/bottom legend height

      if (showLegend) {
          if (legendPosition === 'left' || legendPosition === 'right') {
              chartAreaWidth = containerWidth - legendSize;
          } else {
              chartAreaHeight = containerHeight - legendHeightPx;
          }
      }
      
      // Adjust chart height for title
      if (element.content) {
          chartAreaHeight -= 24;
      }

      const drawWidth = Math.max(0, chartAreaWidth - padding.left - padding.right);
      const drawHeight = Math.max(0, chartAreaHeight - padding.top - padding.bottom);
      
      const barGroupWidth = drawWidth / (data.length || 1);
      const barWidth = (barGroupWidth * 0.7) / series.length;

      // Determine Legend Items
      let legendItems: { label: string, color: string }[] = [];
      if (chartType === 'pie') {
          legendItems = data.map((row, i) => ({
              label: String(resolveData(categoryKey, row) || `Item ${i + 1}`),
              color: CHART_PALETTE[i % CHART_PALETTE.length]
          }));
      } else {
          legendItems = series.map(s => ({
              label: s.label || s.dataKey, // Fallback to dataKey if label is empty
              color: s.color
          }));
      }

      // Flex container classes based on legend position
      const isHorizontal = legendPosition === 'left' || legendPosition === 'right';
      const containerClasses = `w-full h-full flex overflow-hidden bg-white ${isHorizontal ? 'flex-row' : 'flex-col'}`;
      
      // Order classes
      const legendOrderClass = (legendPosition === 'top' || legendPosition === 'left') ? 'order-first' : 'order-last';

      return (
          <div className="w-full h-full flex flex-col bg-white overflow-hidden relative" style={{ color: element.style.color }}>
             {/* Chart Title */}
              {element.content && (
                  <h4 className="text-center font-bold text-sm text-zinc-700 py-1 shrink-0">{element.content}</h4>
              )}
              
              <div className={`flex-1 ${containerClasses}`}>
                
                {/* SVG Chart Area */}
                <div className="relative overflow-hidden" style={{ flex: 1 }}>
                    {/* Total Overlay for Bar/Line */}
                    {showTotal && chartType !== 'pie' && (
                        <div className="absolute top-2 right-4 z-10 bg-white/80 px-2 py-1 rounded shadow-sm border border-zinc-100 pointer-events-none">
                            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Total</div>
                            <div className="text-lg font-bold text-zinc-800 leading-none">{totalValue.toLocaleString()}</div>
                        </div>
                    )}

                    <svg viewBox={`0 0 ${chartAreaWidth} ${chartAreaHeight}`} preserveAspectRatio="none" className="w-full h-full">
                        
                        {/* Grid Lines */}
                        {showGrid && chartType !== 'pie' && (
                            <g className="grid-lines">
                                {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
                                    const y = padding.top + drawHeight * (1 - tick);
                                    return (
                                        <React.Fragment key={i}>
                                            <line x1={padding.left} y1={y} x2={padding.left + drawWidth} y2={y} stroke="#e4e4e7" strokeDasharray="3 3" />
                                            <text x={padding.left - 5} y={y + 3} textAnchor="end" fontSize="10" fill="#a1a1aa">
                                                {Math.round(maxValue * tick)}
                                            </text>
                                        </React.Fragment>
                                    );
                                })}
                            </g>
                        )}

                        {/* Chart Content */}
                        <g transform={`translate(${padding.left}, ${padding.top})`}>
                            {/* Axes */}
                            {chartType !== 'pie' && (
                                <>
                                    <line x1={0} y1={drawHeight} x2={drawWidth} y2={drawHeight} stroke="#71717a" strokeWidth="1" />
                                    <line x1={0} y1={0} x2={0} y2={drawHeight} stroke="#71717a" strokeWidth="1" />
                                </>
                            )}

                            {/* Data Rendering */}
                            {chartType === 'bar' && data.map((row, i) => {
                                const xGroup = i * barGroupWidth + (barGroupWidth * 0.15);
                                return series.map((s, si) => {
                                    const val = Number(resolveData(s.dataKey, row) || 0);
                                    const barH = (val / (maxValue || 1)) * drawHeight; // Prevent div by zero
                                    const x = xGroup + (si * barWidth);
                                    const y = drawHeight - barH;
                                    return (
                                        <g key={`${i}-${si}`}>
                                            <rect 
                                                x={x} 
                                                y={y} 
                                                width={barWidth} 
                                                height={Math.max(0, barH)} 
                                                fill={s.color} 
                                                className="hover:opacity-80 transition-opacity"
                                            />
                                            {showLabels && (
                                                <text x={x + barWidth/2} y={y - 5} textAnchor="middle" fontSize="9" fill="#555">{val}</text>
                                            )}
                                        </g>
                                    );
                                });
                            })}

                            {chartType === 'line' && series.map((s, si) => {
                                const points = data.map((row, i) => {
                                    const val = Number(resolveData(s.dataKey, row) || 0);
                                    const x = (i * barGroupWidth) + (barGroupWidth / 2);
                                    const y = drawHeight - ((val / (maxValue || 1)) * drawHeight);
                                    return `${x},${y}`;
                                }).join(' ');
                                
                                return (
                                    <g key={si}>
                                        <polyline points={points} fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        {data.map((row, i) => {
                                            const val = Number(resolveData(s.dataKey, row) || 0);
                                            const x = (i * barGroupWidth) + (barGroupWidth / 2);
                                            const y = drawHeight - ((val / (maxValue || 1)) * drawHeight);
                                            return (
                                                <circle key={i} cx={x} cy={y} r="3" fill="white" stroke={s.color} strokeWidth="2" />
                                            )
                                        })}
                                    </g>
                                );
                            })}

                            {chartType === 'pie' && (
                            <g transform={`translate(${drawWidth / 2}, ${drawHeight / 2})`}>
                                {/* Simple PIE implementation */}
                                {(() => {
                                    const primarySeries = series[0];
                                    const total = data.reduce((acc, row) => acc + Number(resolveData(primarySeries?.dataKey || '', row) || 0), 0);
                                    let startAngle = 0;
                                    const radius = Math.min(drawWidth, drawHeight) / 2;
                                    
                                    // Handle empty data
                                    if (total === 0) return <text textAnchor="middle" fontSize="10" fill="#a1a1aa">No Data</text>;

                                    const pieSlices = data.map((row, i) => {
                                        const val = Number(resolveData(primarySeries?.dataKey || '', row) || 0);
                                        if (val <= 0) return null;
                                        
                                        const sliceAngle = (val / total) * 2 * Math.PI;
                                        const x1 = Math.cos(startAngle) * radius;
                                        const y1 = Math.sin(startAngle) * radius;
                                        const x2 = Math.cos(startAngle + sliceAngle) * radius;
                                        const y2 = Math.sin(startAngle + sliceAngle) * radius;
                                        
                                        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
                                        
                                        const pathData = [
                                            `M 0 0`,
                                            `L ${x1} ${y1}`,
                                            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                            `Z`
                                        ].join(' ');
                                        
                                        const currentStart = startAngle;
                                        startAngle += sliceAngle;
                                        const color = CHART_PALETTE[i % CHART_PALETTE.length];

                                        return (
                                            <g key={i}>
                                                <path d={pathData} fill={color} stroke="white" strokeWidth="1" />
                                            </g>
                                        );
                                    });

                                    return (
                                        <>
                                            {pieSlices}
                                            {/* Donut Hole if Total is shown */}
                                            {showTotal && (
                                                <g>
                                                    <circle cx={0} cy={0} r={radius * 0.6} fill="white" />
                                                    <text x={0} y={-5} textAnchor="middle" fontSize="10" fill="#71717a" fontWeight="bold" textTransform="uppercase">Total</text>
                                                    <text x={0} y={15} textAnchor="middle" fontSize="16" fill="#18181b" fontWeight="bold">{total.toLocaleString()}</text>
                                                </g>
                                            )}
                                        </>
                                    );
                                })()}
                            </g>
                            )}

                            {/* X-Axis Labels */}
                            {chartType !== 'pie' && data.map((row, i) => {
                                const label = String(resolveData(categoryKey, row) || '');
                                const x = i * barGroupWidth + (barGroupWidth / 2);
                                return (
                                    <text key={i} x={x} y={drawHeight + 15} textAnchor="middle" fontSize="10" fill="#71717a">
                                        {label.substring(0, 10)}
                                    </text>
                                )
                            })}
                        </g>
                    </svg>
                </div>

                {/* Legend Area */}
                {showLegend && (
                    <div 
                        className={`${legendOrderClass} flex flex-wrap content-center gap-x-4 gap-y-1 p-2 bg-white/50 border-zinc-100 ${isHorizontal ? 'flex-col border-l min-w-[100px] justify-center' : 'border-t justify-center min-h-[40px]'}`}
                        style={{
                            maxWidth: isHorizontal ? '100px' : '100%',
                            maxHeight: isHorizontal ? '100%' : '60px',
                            overflowY: 'auto'
                        }}
                    >
                        {legendItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-1.5 mb-1">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-[9px] text-zinc-600 font-medium leading-none break-words">{item.label}</span>
                            </div>
                        ))}
                    </div>
                )}
              </div>
          </div>
      );
  };

  const renderTable = () => {
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

        const columns: TableColumn[] = element.columns || [
            { id: '1', header: 'Col 1', accessorKey: 'col1' },
            { id: '2', header: 'Col 2', accessorKey: 'col2' }
        ];

        // Data resolution
        let tableData = [1, 2, 3]; // Default dummy rows
        let isBoundData = false;

        if (previewMode && element.key) {
            const data = resolveData(element.key, dataContext);
            if (Array.isArray(data)) {
                tableData = data;
                isBoundData = true;
            }
        }

        return (
          <div className="w-full overflow-hidden relative" style={{ color: element.style.color, fontFamily: element.style.fontFamily }}>
            {element.key && !previewMode && (
                <div className="absolute top-0 right-0 bg-primary/10 text-primary border border-primary/20 text-[9px] px-1.5 py-0.5 rounded-bl font-mono z-10">
                    {`{{${element.key}}}`}
                </div>
            )}
            <table className="w-full border-collapse text-sm table-fixed">
                <colgroup>
                    {columns.map(col => <col key={col.id} style={{ width: col.width ? `${col.width}px` : 'auto' }} />)}
                </colgroup>
                <thead>
                    <tr style={{ backgroundColor: headerBg, color: headerColor }}>
                        {columns.map(col => (
                            <th key={col.id} style={{ ...cellStyle, textAlign: col.align || 'left' }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((row, idx) => {
                        const isEven = idx % 2 !== 0;
                        const rowBackground = element.style.tableStriped && isEven ? stripeColor : rowBg;
                        return (
                            <tr key={idx} style={{ backgroundColor: rowBackground }}>
                                {columns.map(col => {
                                    let cellContent;
                                    if (isBoundData) {
                                        // Real Data
                                        cellContent = resolveData(col.accessorKey, row);
                                    } else {
                                        // Mock Data
                                        cellContent = <span className="opacity-50 text-xs">[{col.accessorKey}]</span>;
                                    }

                                    return (
                                        <td key={col.id} style={{ ...cellStyle, textAlign: col.align || 'left' }}>
                                            {cellContent !== undefined ? String(cellContent) : ''}
                                        </td>
                                    );
                                })}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
          </div>
        );
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
        // Parse content: If content exists, split by newline. If not, use defaults.
        const items = element.content 
            ? element.content.split('\n').filter(line => line.trim() !== '')
            : ['First item', 'Second item', 'Third item'];
            
        return (
            <ListTag style={{ ...textStyle, listStyleType: element.style.listStyle || 'disc', paddingLeft: '20px' }} className="space-y-1">
                {items.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ListTag>
        );

      case 'placeholder':
        let displayValue = `{{ ${element.key || 'variable_name'} }}`;
        
        if (previewMode && element.key) {
             const val = resolveData(element.key, dataContext);
             if (val !== undefined) displayValue = String(val);
        }

        return (
          <div className="inline-flex items-center font-mono text-sm w-full" style={{ justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
            <span 
              className={`px-2 py-1 rounded whitespace-nowrap ${previewMode ? '' : 'bg-primary/10 border border-primary/30 text-primary'}`}
              style={{ 
                  fontSize: element.style.fontSize, 
                  fontWeight: element.style.fontWeight,
                  fontFamily: element.style.fontFamily,
                  color: previewMode ? (element.style.color || 'inherit') : undefined
              }}
            >
              {displayValue}
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
            return renderChart();

      case 'table':
        return renderTable();

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

  const MotionDiv = motion.div as any;

  return (
    <MotionDiv
      ref={elementRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`absolute ${previewMode ? '' : 'cursor-move'} group select-none ${isSelected && !previewMode ? 'z-[100]' : ''}`}
      style={containerStyle}
      onMouseDown={handleMouseDown}
      onClick={(e: React.MouseEvent) => !previewMode && e.stopPropagation()}
      whileHover={{ scale: previewMode ? 1 : 1.005 }}
    >
      <div
        className={`relative w-full h-full transition-all duration-200 ${
          isSelected && !previewMode
            ? 'ring-1 ring-primary ring-offset-1 ring-offset-transparent shadow-xl'
            : (!previewMode ? 'hover:ring-1 hover:ring-primary/30' : '')
        }`}
      >
        {/* Render Content */}
        <div className="w-full h-full overflow-hidden">
            {getRenderContent()}
        </div>

        {/* Selected Controls - Only show if not in preview mode */}
        {isSelected && !previewMode && (
          <>
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

            {/* Resize Handles */}
            <>
                <div className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-nwse-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                <div className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-nesw-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                <div className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-nesw-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                <div className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-nwse-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'se')} />
                
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-ns-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'n')} />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-ns-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 's')} />
                <div className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-ew-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'w')} />
                <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-2.5 bg-white border border-primary rounded-full cursor-ew-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'e')} />
            </>
          </>
        )}
      </div>
    </MotionDiv>
  );
};
