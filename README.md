# Test Report Generator

<p align="center">
  <img src="./public/favicon.svg" alt="Test Report Generator icon" width="88" height="88" />
</p>

<p align="center">
  <img
    src="https://readme-typing-svg.demolab.com?font=Montserrat&weight=800&size=28&duration=2800&pause=900&color=1A365D&center=true&vCenter=true&width=820&lines=RF+reporting+workspace;3D+radiation+pattern+analysis;Word-ready+report+generation"
    alt="Animated project banner"
  />
</p>

<p align="center">
  An RF reporting workspace for turning measurement files into structured reports,<br/>
  interactive 3D radiation pattern inspection, and precise 2D azimuth/elevation analysis.
</p>

<p align="center">
  <a href="https://yossiabutbul.github.io/ReportGenrator/">
    <img src="https://img.shields.io/badge/Live%20App-Open%20ReportGenrator-1A365D?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open live app" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-19.x-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-2F74C0?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Three.js-3D%20Engine-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Plotly-2D%20Graphs-2C3E50?style=for-the-badge" alt="Plotly" />
  <img src="https://img.shields.io/badge/GitHub%20Pages-Auto%20Deploy-1F6FEB?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" />
</p>

---

## Features

### Report Setup
- Upload `.xlsx` / `.xlsm` workbooks with embedded 3D graph images
- Edit report metadata (title, author, date, scope, firmware/hardware versions)
- Search, filter, and preview table rows by unit type, ID, or frequency
- Generate a document-ready report snapshot on demand

### Report Area
- Document viewer with zoom controls (Ctrl+Scroll or toolbar), A4-style page layout
- Page headers with report title and date, footers with page numbers
- Upload unit placement photo (shown on test setup page, included in Word export)
- Skeleton loading states with shimmer animation
- Export as Word (.docx) with full formatting, images, and tables

### 3D Graph Viewer
- Load TXT measurement files (Howland WTL format)
- Three.js-powered 3D radiation pattern surface with vertex-colored heatmap
- Spherical wireframe grid (theta rings + phi meridians) rendered on the surface
- Orbit controls: rotate (drag), zoom (scroll), pan (right-click)
- Animated camera reset with spherical interpolation
- Technical metadata panel: frequency, TRP, max peak, V-Pol factor, samples
- Download current view as high-res PNG
- Correct TRP calculation: power-sum in watts (not max)

### 2D Graph Viewer
- Azimuth and elevation polar plots with Plotly.js
- Circular grid, spline interpolation, adaptive marker density
- Switch between H-Pol, V-Pol, and Both-Pols (TRP power sum)
- Adjustable reference range per slice mode
- Min/max/average power statistics table
- Blank radar charts as placeholders when no data loaded

### Dark Mode
- System-wide dark/light toggle with animated icon swap
- Neutral charcoal palette (no blue tint)
- Theme persists to localStorage, inline script prevents flash
- 3D plot re-renders with correct background on toggle

### Unified Design System
- Consistent button styles across all pages (`#1A365D` primary)
- Unified font sizes, heights, border-radius
- Status bar with copyright and page count
- Responsive filter panel with redesigned dropdowns
- Help center with workflow guide and tips

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 7 |
| 3D Engine | Three.js (surface mesh + wireframe + OrbitControls) |
| 2D Charts | Plotly.js (polar/radar plots) |
| Excel Parsing | ExcelJS + JSZip |
| Word Export | JSZip (DOCX template manipulation) |
| Icons | Lucide React |
| Hosting | GitHub Pages (auto deploy) |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Production build
npm run build
```

---

## File Format Support

### Report Workbook (`.xlsx` / `.xlsm`)
Worksheets are parsed as unit types. Columns: Unit ID, Frequency, TRP (dBm), Peak (dBm). Embedded graph images are extracted automatically.

### Measurement TXT (Howland WTL)
Standard TRP measurement export with metadata headers and `Test Data Results` section containing theta, phi, H-Pol, and V-Pol columns. Supports both 15-degree and 5-degree resolution files.

---

## Author

**Yossi Abutbul** - RF Technician & BSc Computer Science Student

[![GitHub](https://img.shields.io/badge/GitHub-YossiAbutbul-1A365D?style=flat-square&logo=github)](https://github.com/YossiAbutbul)
