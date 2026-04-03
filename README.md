# Test Report Generator

<p align="center">
  <img src="./public/favicon.svg" alt="Test Report Generator icon" width="88" height="88" />
</p>

<p align="center">
  A focused RF reporting workspace for turning measurement files into a clean report workflow,
  interactive 3D inspection, and precise 2D azimuth/elevation analysis.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-19.x-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-2F74C0?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Plotly-3D%20%2B%202D-2C3E50?style=for-the-badge" alt="Plotly" />
  <img src="https://img.shields.io/badge/GitHub%20Pages-Auto%20Deploy-1F6FEB?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" />
</p>

---

## Why This App Exists

RF test data usually lives in multiple places at once:

- Excel workbooks for report rows
- TXT exports for chamber graph data
- Word-based report structure
- Manual review before release

This app pulls those steps into one workflow so you can:

1. prepare report metadata and source rows
2. inspect measurements visually in 3D and 2D
3. generate a report preview
4. export a Word report from the same working session

---

## Core Experience

### Report Setup
- Upload Excel or CSV source data
- Edit report metadata
- Search and filter table rows
- Generate a stable report snapshot only when you choose to

### Report Area
- Review a document-style preview
- See template-based pages like cover, setup, details, results, and notes
- Export the generated report as Word

### 3D Graph Viewer
- Load TXT measurement exports
- Inspect 3D graph data visually
- Compare measurement behavior interactively

### 2D Graph Viewer
- Switch between `Azimuth` and `Elvation`
- Support both `Elvation 1` and `Elvation 2`
- Inspect `H-Pol`, `V-Pol`, and `Both-Pols`
- Tune graph reference range independently for azimuth and elevation
- Use reusable tooltip cards prepared for future 3D reuse

---

## Highlights

| Feature | What it does |
| --- | --- |
| Generate-on-demand report flow | Prevents stale previews while metadata is still changing |
| Workbook parsing | Converts uploaded source rows into report-ready sections |
| Word export | Builds a document-style output from the generated preview |
| Separate 2D/3D upload state | Keeps analysis tabs independent |
| Azimuth + Elvation workflows | Supports multiple 2D inspection modes from TXT data |
| Shared notifications | Shows consistent upload and parse errors across the app |
| Help Center modal | Gives in-app guidance without interrupting the workflow |
| GitHub Pages deployment | Publishes the app automatically from `main` |

---

## Workflow

```text
Excel / CSV source data
        +
TXT measurement export
        |
        v
  Report Setup  --->  3D Graph Viewer
        |                 |
        |                 v
        |           2D Graph Viewer
        v
   Generate Report
        |
        v
    Report Preview
        |
        v
     Word Export
```

---

## Tech Stack

- React 19
- TypeScript
- Vite
- Plotly.js
- ExcelJS
- JSZip
- Lucide React
- Vitest

---

## Project Structure

```text
src/
  components/
    common/
    graphViewer/
    help/
    layout/
    reportMetadata/
    upload/
  pages/
    ReportSetupPage.tsx
    ReportAreaPage.tsx
    GraphViewerPage.tsx
    GraphViewer2DPage.tsx
  services/
    excel/
    graph/
    report/
  store/
  styles/
public/
  templates/
  report-template-assets/
```

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npm run dev
```

### 3. Run tests

```bash
npm run test
```

### 4. Create a production build

```bash
npm run build
```

---

## Deployment

This project is configured for GitHub Pages deployment from `main` using GitHub Actions.

### Production URL

`https://yossiabutbul.github.io/ReportGenrator/`

### How deployment works

- pushes to `main` trigger the Pages workflow
- GitHub Actions runs `npm ci`
- GitHub Actions runs `npm run build`
- the generated `dist/` output is deployed to GitHub Pages

### GitHub Pages setup

In the repository settings:

1. open `Settings`
2. open `Pages`
3. set `Source` to `GitHub Actions`

---

## Notes

<details>
<summary><strong>How "Both-Pols" works in the 2D viewer</strong></summary>

The 2D viewer currently calculates `Both-Pols` as a combined power value in `dBm`, not simply the stronger of H-Pol or V-Pol.

</details>

<details>
<summary><strong>Why some asset paths use the Vite base URL</strong></summary>

Because the app is deployed under `/ReportGenrator/` on GitHub Pages, assets such as the favicon, templates, and report images must use the app base path instead of root-relative URLs.

</details>

---

## Vision

The long-term goal is not just generating reports faster.

It is building a tighter RF review environment where:

- raw measurement files are easier to inspect
- report structure is easier to trust
- visual analysis is part of the reporting flow
- export becomes the last step, not the first struggle

---

## License

This repository currently does not declare a license.
