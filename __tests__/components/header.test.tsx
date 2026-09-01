import { render, screen } from '@/tests/test-utils'
import Header from '@/components/navigation/Header'

describe('Header Component', () => {
  it('renders navigation links', () => {
    render(<Header />)
    
    // Check if navigation links are present (using getAllByText for multiple matches)
    expect(screen.getAllByText(/home/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/projects/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/skills/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/journey/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/code review/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/^AI$/i)).not.toBeInTheDocument()
    expect(screen.getAllByText(/contact/i).length).toBeGreaterThan(0)
  })

  it('renders without crashing', () => {
    const { container } = render(<Header />)
    expect(container).toBeInTheDocument()
  })

  it('renders the Mouaz logo', () => {
    render(<Header />)
    const logos = screen.getAllByRole('img', { name: 'Mouaz' })
    expect(logos.length).toBeGreaterThan(0)
  })

  it('shows the same active indicator for Home as other current pages', () => {
    render(<Header />)

    for (const homeButton of screen.getAllByRole('link', { name: 'Home' })) {
      expect(homeButton).toHaveAttribute('aria-current', 'page')
      expect(homeButton.querySelector('.site-header-active-line')).toBeInTheDocument()
    }
  })
})
