import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import ShoutOut from '@/components/shout-out'

test('renders inline by default', () => {
  render(<p>hi <ShoutOut>hello</ShoutOut> there</p>)
  const el = screen.getByText('hello').closest('span')
  expect(el?.tagName).toBe('SPAN')
})

test('respects variant/as/icon props', () => {
  render(
    <ShoutOut as="div" variant="note" icon="sprout">
      hello
    </ShoutOut>
  )
  const el = screen.getByRole('note')
  expect(el.tagName).toBe('DIV')
  expect(el).toHaveAttribute('data-variant', 'note')
  expect(el.querySelector('svg')).toBeTruthy()
})

test('a11y attributes present', async () => {
  const { container } = render(<ShoutOut>hi</ShoutOut>)
  const el = screen.getByRole('note')
  expect(el).toHaveAttribute('aria-label', 'Shout out')
  expect(await axe(container)).toHaveNoViolations()
})
