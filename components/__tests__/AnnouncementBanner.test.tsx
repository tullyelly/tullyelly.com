import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

describe('AnnouncementBanner', () => {
  it('renders message and optional link', () => {
    render(<AnnouncementBanner message="Hello" href="#" />);
    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /hello/i });
    expect(link).toHaveAttribute('href');
  });

  it('supports dismissal', () => {
    render(<AnnouncementBanner message="Bye" dismissible />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText('Bye')).toBeNull();
  });

  it('has no obvious accessibility violations', async () => {
    const { container } = render(<AnnouncementBanner message="A11y" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

