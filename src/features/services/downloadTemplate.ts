const TEMPLATE_PATH = '/templates/report-generator-template.xlsx';
const TEMPLATE_FILE_NAME = 'report-generator-template.xlsx';

export function downloadReportTemplate(): void {
  const downloadLink = document.createElement('a');
  downloadLink.href = TEMPLATE_PATH;
  downloadLink.download = TEMPLATE_FILE_NAME;
  downloadLink.rel = 'noopener';

  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
