import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the TRP generator dashboard shell', () => {
    render(<App />);

    expect(screen.getByText(/TRP Generator/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Upload Source Data/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Generate Word Report/i })
    ).toBeInTheDocument();
  });

  it('shows the uploaded file name after choosing a file', () => {
    render(<App />);

    const fileInput = screen.getByLabelText(/Upload source data file/i);
    const file = new File(['demo'], 'trp-source.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    expect(screen.getByText(/trp-source\.xlsx/i)).toBeInTheDocument();
  });
});
