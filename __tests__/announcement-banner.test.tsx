import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import AnnouncementBanner from '@/components/AnnouncementBanner';

test('renders with default props and has no a11y violations', async () => {
  const { container } = render(<AnnouncementBanner message="hello" />);
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

test('can be dismissed', () => {
  const onDismiss = jest.fn();
  render(<AnnouncementBanner message="bye" dismissible onDismiss={onDismiss} />);
  fireEvent.click(screen.getByLabelText(/dismiss announcement/i));
  expect(onDismiss).toHaveBeenCalled();
  expect(screen.queryByText('bye')).toBeNull();
});

test('link renders focusable when href provided', () => {
  render(<AnnouncementBanner message="hello" href="/about" />);
  const link = screen.getByRole('link', { name: /hello/i });
  link.focus();
  expect(link).toHaveFocus();
});

test('variants apply classes', () => {
  const { rerender, container } = render(<AnnouncementBanner message="v" variant="info" />);
  expect(container.firstChild).toHaveClass('bg-blue');
  expect(container.firstChild).toHaveClass('text-text-on-blue');
  rerender(<AnnouncementBanner message="v" variant="success" />);
  expect(container.firstChild).toHaveClass('bg-green');
  expect(container.firstChild).toHaveClass('text-text-on-green');
  rerender(<AnnouncementBanner message="v" variant="warning" />);
  expect(container.firstChild).toHaveClass('bg-amber-200');
  expect(container.firstChild).toHaveClass('text-black');
  rerender(<AnnouncementBanner message="v" variant="error" />);
  expect(container.firstChild).toHaveClass('bg-red-600');
  expect(container.firstChild).toHaveClass('text-white');
});
