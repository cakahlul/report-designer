
export type ElementType = 
  | 'text' 
  | 'table' 
  | 'placeholder' 
  | 'header' 
  | 'footer' 
  | 'image' 
  | 'line' 
  | 'rectangle' 
  | 'barcode' 
  | 'qrcode' 
  | 'chart' 
  | 'list';

export interface ChartSeries {
  id: string;
  dataKey: string;
  label: string;
  color: string;
}

export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  width?: number;
  height?: number;
  opacity?: number;
  
  // Table Specifics
  tableHeaderBg?: string;
  tableHeaderColor?: string;
  tableRowBg?: string;
  tableStriped?: boolean;
  tableStripeColor?: string;
  tableShowGrid?: boolean;

  // Image Specifics
  objectFit?: 'contain' | 'cover' | 'fill';

  // Chart Specifics
  chartType?: 'bar' | 'line' | 'pie';
  chartCategoryKey?: string; // Key for X-axis or Segment Labels
  chartShowLegend?: boolean;
  chartShowGrid?: boolean;
  chartShowDataLabels?: boolean;
  chartAxisColor?: string;
  chartGridColor?: string;

  // List Specifics
  listStyle?: 'disc' | 'decimal';
}

export interface TableColumn {
  id: string;
  header: string;
  accessorKey: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  group?: string;
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
}

export interface ReportElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  label: string;
  content?: string; // For static text, barcode value
  key?: string; // For placeholders (e.g., employee_name) or Data Source Array
  src?: string; // For images
  style: ElementStyle;
  columns?: TableColumn[]; // For Tables
  series?: ChartSeries[]; // For Charts
}

export interface TemplateMetadata {
  name: string;
  outputFormat: 'PDF' | 'HTML' | 'DOCX';
  sqlQuery?: string;
}

export interface DragItem {
  type: ElementType;
  label: string;
}
