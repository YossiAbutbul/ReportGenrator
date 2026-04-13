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
  3D radiation pattern inspection, and 2D azimuth/elevation analysis.
</p>

<p align="center">
  <a href="https://yossiabutbul.github.io/ReportGenrator/">
    <img src="https://img.shields.io/badge/Live%20App-Open%20ReportGenrator-1A365D?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Open live app" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-2F74C0?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

---

## Features

### Report Setup
Upload `.xlsx` / `.xlsm` workbooks, edit metadata fields, search and filter rows by unit type, ID, or frequency. Generate a document snapshot when ready.

### Report Area
A4-style document viewer with zoom controls, page headers and footers, unit placement photo upload, skeleton loading states. Export as formatted Word document.

### 3D Graph Viewer
Three.js-powered radiation pattern surface with vertex-colored heatmap, spherical wireframe grid (theta/phi), orbit controls, animated camera reset, and PNG export. TRP calculated as power sum in watts.

### 2D Graph Viewer
Polar azimuth and elevation plots with circular grid, spline interpolation, and adaptive marker density. Adjustable reference ranges, power statistics, H-Pol / V-Pol / Both-Pols views.

### Dark Mode
Neutral charcoal theme with no blue tint. Animated toggle, persisted to localStorage, 3D scene re-renders on switch.

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Supported File Formats

| Format | Usage |
|--------|-------|
| `.xlsx` / `.xlsm` | Report workbooks with embedded graph images |
| `.txt` (Howland WTL) | TRP measurement exports (15° and 5° resolution) |

---

## Author

**Yossi Abutbul** — RF Technician & BSc Computer Science Student

[![GitHub](https://img.shields.io/badge/GitHub-YossiAbutbul-1A365D?style=flat-square&logo=github)](https://github.com/YossiAbutbul)
