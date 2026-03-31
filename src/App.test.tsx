import { render, screen } from '@testing-library/react';
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
});
