import type { ReactElement } from 'react';
import { FileText, Radar, Settings2, ChartColumnBig, Lightbulb } from 'lucide-react';
import { Modal } from '../common/Modal';

type HelpCenterModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const guideSections = [
  {
    description: 'Upload the Excel workbook, fill in the metadata fields, and press Generate Report when the setup is ready.',
    icon: Settings2,
    title: 'Report Setup',
  },
  {
    description: 'Review the generated preview and download the Word report once everything looks correct.',
    icon: FileText,
    title: 'Report Area',
  },
  {
    description: 'Upload a TXT measurement file to inspect the 3D surface view and compare the live graph results.',
    icon: ChartColumnBig,
    title: '3D Graph Viewer',
  },
  {
    description: 'Upload a TXT file, choose theta and polarization, then press Enter in the reference inputs to update the graph range.',
    icon: Radar,
    title: '2D Graph Viewer',
  },
] as const;

const quickTips = [
  'Generate the report again after changing metadata so the preview stays up to date.',
  'Theta angle and graph color update instantly in the 2D viewer.',
  'Reference changes in the 2D viewer apply when you press Enter.',
];

export function HelpCenterModal({
  isOpen,
  onClose,
}: HelpCenterModalProps): ReactElement {
  return (
    <Modal
      className="modal__dialog--help-center"
      isOpen={isOpen}
      title="Help Center"
      onClose={onClose}
    >
      <div className="help-center">
        <section className="help-center__section">
          <h3 className="help-center__heading">Quick Guide</h3>
          <div className="help-center__grid">
            {guideSections.map((section) => (
              <article key={section.title} className="help-center__card">
                <div className="help-center__card-title">
                  <span className="help-center__icon" aria-hidden="true">
                    <section.icon aria-hidden="true" />
                  </span>
                  <h4>{section.title}</h4>
                </div>
                <p>{section.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="help-center__section">
          <div className="help-center__tips-header">
            <span className="help-center__icon help-center__icon--tip" aria-hidden="true">
              <Lightbulb aria-hidden="true" />
            </span>
            <h3 className="help-center__heading">Quick Tips</h3>
          </div>
          <ul className="help-center__tips">
            {quickTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
