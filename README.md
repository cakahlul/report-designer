# Report Template Designer

An interactive drag-and-drop report template designer built with React and TypeScript. Design professional report layouts with data binding capabilities and AI-powered features.

## Features

### Core Features
- **Drag & Drop Interface** - Intuitive element placement on an A4 canvas (794x1123px)
- **12 Element Types** - Text, Table, Header, Footer, Image, Line, Rectangle, Barcode, QR Code, Chart, List, Placeholder
- **Real-time Properties Editing** - Customize fonts, colors, sizes, borders, and more
- **Smart Snapping** - Alignment guides for precise element positioning
- **Undo/Redo** - Full history management with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- **Copy/Paste** - Duplicate elements quickly (Ctrl+C / Ctrl+V)
- **Keyboard Navigation** - Move elements with arrow keys (hold Shift for 10px steps)

### Data Binding
- **Dynamic Placeholders** - Bind template variables to data sources
- **Table Data Binding** - Connect tables to array data with column mapping
- **Chart Data Binding** - Link charts to datasets for dynamic visualization
- **Preview Mode** - Test templates with sample data in real-time
- **Test Data Editor** - Built-in JSON editor for managing test data

### AI-Powered Features (Requires Gemini API Key)
- **Magic Layout Fix** - Auto-align and organize messy layouts using AI
- **AI Fill** - Generate realistic test data and professional content themes

### Export Options
- **JSON Export** - Save templates as JSON for programmatic use
- **PDF Export** - Generate print-ready PDF documents
- **HTML Export** - Export as standalone HTML files

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI Framework |
| TypeScript | 5.8.2 | Type Safety |
| Vite | 6.2.0 | Build Tool & Dev Server |
| Tailwind CSS | CDN | Styling |
| Framer Motion | 12.23.24 | Animations |
| Lucide React | 0.555.0 | Icons |
| html2canvas | 1.4.1 | Canvas to Image |
| jsPDF | 2.5.1 | PDF Generation |
| Google GenAI | 1.30.0 | AI Features (Gemini) |

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd report-designer

# Install dependencies
npm install
```

### Environment Setup (Optional - for AI features)

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
report-designer/
├── index.html          # HTML entry point with Tailwind config
├── index.tsx           # React root mount point
├── App.tsx             # Main application component
├── types.ts            # TypeScript interfaces
├── vite.config.ts      # Vite configuration
├── package.json        # Dependencies
├── components/
│   ├── Canvas.tsx          # A4 canvas container with snap guides
│   ├── CanvasElement.tsx   # Individual element renderer
│   ├── Sidebar.tsx         # Component library panel
│   └── PropertiesPanel.tsx # Element properties editor
└── .env                # Environment variables (create this)
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Ctrl + C` | Copy selected element |
| `Ctrl + V` | Paste element |
| `Delete` / `Backspace` | Delete selected element |
| `Arrow Keys` | Move element by 1px |
| `Shift + Arrow Keys` | Move element by 10px |

## Usage

1. **Add Elements** - Drag components from the sidebar onto the canvas
2. **Select & Edit** - Click elements to select, use the properties panel to customize
3. **Bind Data** - Set data keys on elements to connect them to your data source
4. **Preview** - Toggle preview mode to see the template with test data
5. **Export** - Export as JSON, PDF, or HTML

## License

MIT
