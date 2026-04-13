import type { ReactElement } from 'react';
import {
  ChartColumnBig,
  FileText,
  Lightbulb,
  Radar,
  Settings2,
} from 'lucide-react';
import { Modal } from '../common/Modal';

type HelpCenterModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const workflows = [
  {
    step: '01',
    icon: Settings2,
    title: 'Report Setup',
    description: 'Upload Excel workbook, fill metadata fields, press Generate Report.',
    accent: '#2563eb',
  },
  {
    step: '02',
    icon: FileText,
    title: 'Report Area',
    description: 'Review document preview, add unit placement photo, export as Word.',
    accent: '#059669',
  },
  {
    step: '03',
    icon: ChartColumnBig,
    title: '3D Graph Viewer',
    description: 'Upload TXT measurement file, inspect 3D radiation pattern surface.',
    accent: '#d97706',
  },
  {
    step: '04',
    icon: Radar,
    title: '2D Graph Viewer',
    description: 'Analyze azimuth/elevation slices, adjust reference range, compare polarizations.',
    accent: '#dc2626',
  },
] as const;

const tips = [
  'Regenerate report after changing metadata to keep the preview current.',
  'Theta angle and graph color update instantly in the 2D viewer.',
  'Use the Discard button to clear loaded graph data and start fresh.',
  'The 3D viewer supports Both-Pols (H+V power sum), H-Pol, and V-Pol views.',
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
        {/* Workflow Steps */}
        <section className="help-center__section">
          <div className="help-center__section-header">
            <h3 className="help-center__heading">Workflow</h3>
            <p className="help-center__subheading">Follow these steps to generate your report</p>
          </div>
          <div className="help-center__steps">
            {workflows.map((item) => (
              <article key={item.title} className="help-center__step">
                <div className="help-center__step-number" style={{ color: item.accent }}>{item.step}</div>
                <div className="help-center__step-body">
                  <div className="help-center__step-title">
                    <item.icon aria-hidden="true" className="help-center__step-icon" style={{ color: item.accent }} />
                    <h4>{item.title}</h4>
                  </div>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="help-center__section">
          <div className="help-center__section-header">
            <div className="help-center__heading-row">
              <Lightbulb aria-hidden="true" className="help-center__heading-icon help-center__heading-icon--tip" />
              <h3 className="help-center__heading">Tips</h3>
            </div>
          </div>
          <ul className="help-center__tip-list">
            {tips.map((tip) => (
              <li key={tip} className="help-center__tip">{tip}</li>
            ))}
          </ul>
        </section>

        {/* Footer */}
        <div className="help-center__footer">
          <span>Test Report Generator v1.0</span>
          <span>&middot;</span>
          <a href="https://github.com/YossiAbutbul" target="_blank" rel="noopener noreferrer">
            Yossi Abutbul
          </a>
        </div>
      </div>
    </Modal>
  );
}
