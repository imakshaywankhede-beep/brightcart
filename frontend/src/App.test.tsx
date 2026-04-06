import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders BrightCart title', () => {
  render(<App />);
  const element = screen.getByText(/BrightCart/i);
  expect(element).toBeInTheDocument();
});
