# GitHub Project Manager Chrome Extension

> A powerful Chrome extension for managing GitHub projects with advanced analytics, Gantt charts, and sprint management capabilities.

## Overview

This Chrome extension enhances GitHub's project management experience by providing comprehensive dashboard analytics, Gantt chart visualization, and sprint tracking features. Built with modern web technologies including React, TypeScript, and TailwindCSS, it integrates seamlessly with GitHub's interface to offer project managers and development teams powerful insights into their workflow.

## Folder Tree

```
src/
├── background.ts                    # Background script for extension
├── index.tsx                       # Main entry point
├── types.ts                        # TypeScript type definitions
├── components/
│   ├── input-number.tsx            # Number input component
│   ├── muti-date-selector.tsx      # Multi-date selection component
│   ├── board/                      # Dashboard components
│   │   ├── bug-counter-chart.tsx   # Bug tracking chart
│   │   ├── dashboard-shell.tsx     # Main dashboard layout
│   │   ├── gantt-chart.tsx         # Gantt chart visualization
│   │   ├── index.tsx               # Board main component
│   │   ├── sprint-burndown-chart.tsx    # Sprint burndown analytics
│   │   ├── sprint-progress-cards.tsx    # Sprint progress widgets
│   │   ├── sprint-selector.tsx     # Sprint selection dropdown
│   │   ├── sprint-velocity-chart.tsx    # Team velocity metrics
│   │   ├── sprint-workload-chart.tsx    # Workload distribution
│   │   ├── task-completion-chart.tsx    # Task completion analytics
│   │   └── task-list.tsx           # Task list management
│   ├── icons/
│   │   └── csv.tsx                 # CSV export icon
│   ├── issue/                      # Issue management components
│   ├── project/                    # Project management components
│   │   ├── board.tsx               # Project board view
│   │   ├── column-map.tsx          # Column mapping configuration
│   │   ├── export.tsx              # CSV export functionality
│   │   └── project.tsx             # Main project component
│   └── ui/                         # Reusable UI components
├── lib/
│   ├── contains.ts                 # Utility constants
│   ├── error-boundary.tsx          # Error handling component
│   ├── fetch-json.ts               # HTTP request utilities
│   ├── load-config.ts              # Configuration loader
│   └── utils.ts                    # General utilities
├── providers/
│   └── app-provider.tsx            # React context provider
├── storage/
│   ├── project.ts                  # Project data storage
│   └── token.ts                    # Token management
└── styles/
    └── globals.css                 # Global styles
```

## Functions

### 📊 Dashboard Analytics

- **Sprint Progress**: Real-time sprint progress tracking with completion percentages
- **Bug Counter Chart**: Visual bug tracking across sprints with trend analysis
- **Sprint Velocity Chart**: Team velocity metrics and historical performance
- **Sprint Burndown Chart**: Track sprint progress against planned work
- **Task Completion Chart**: Pie chart showing task status distribution
- **Team Workload Chart**: Individual and team workload visualization

### 📅 Gantt Chart Visualization

- **Interactive Timeline**: Drag-and-drop task scheduling with dependency management
- **Task Dependencies**: Visual arrows showing task relationships
- **Resource Management**: Assignee avatars and workload distribution
- **Sprint Planning**: Visual sprint boundaries and milestone tracking
- **Holiday Integration**: Automatic holiday detection and weekend highlighting

### 🔧 Project Management Tools

- **Column Mapping**: Configure custom column mappings for different project structures
- **Sprint Selector**: Easy switching between different sprints and iterations
- **CSV Export**: Export project data with customizable field selection
- **Multi-Sprint Support**: Manage multiple sprints simultaneously

### 🎯 Advanced Features

- **Real-time Updates**: Automatic synchronization with GitHub project changes
- **Status Tracking**: Visual status indicators with custom color coding
- **Assignee Management**: Team member assignment and workload tracking
- **Date Range Selection**: Flexible date filtering and sprint duration management

## Using

### Installation

1. **Install Dependencies**:

   ```bash
   bun install
   ```

2. **Development Mode**:

   ```bash
   bun run dev
   ```

3. **Build for Production**:

   ```bash
   bun run build
   ```

4. **Package for Chrome Web Store**:
   ```bash
   bun run pack
   ```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `build` folder
4. The extension will appear in your extensions toolbar

### Configuration

1. Navigate to any GitHub project page
2. Click the extension icon to open the configuration panel
3. Map your project columns to the dashboard

### Features Usage

**Dashboard View**:

- Select your desired sprint from the dropdown
- View comprehensive analytics across multiple chart types
- Switch between Dashboard and Gantt chart views

**Gantt Chart**:

- View task dependencies with connecting arrows
- See assignee information and workload distribution
- Track progress against sprint timelines

**Export Functionality**:

- Click the CSV export button
- Select specific sprints to export
- Choose which data fields to include
- Download formatted CSV file

## License

This project is licensed under the [MIT](/license) License.
