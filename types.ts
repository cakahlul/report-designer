
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
  key?: string; // For placeholders (e.g., employee_name)
  src?: string; // For images
  style: ElementStyle;
  columns?: TableColumn[];
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