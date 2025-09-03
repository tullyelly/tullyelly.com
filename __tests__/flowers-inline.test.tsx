import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlowersInline from '@/components/flowers/FlowersInline';

describe('FlowersInline', () => {
  it('hides emoji from screen readers and uses Acknowledgments aria-label', () => {
    render(<FlowersInline>Demo</FlowersInline>);
    const container = screen.getByLabelText('Acknowledgments');
    expect(container).toBeInTheDocument();
    const emoji = screen.getByText('💐');
    expect(emoji).toHaveAttribute('aria-hidden', 'true');
  });
});

