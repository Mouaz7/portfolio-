import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoadingAnimation from '@/components/ui/LoadingAnimation'

describe('LoadingAnimation Component', () => {
  it('renders loading state with text', () => {
    render(<LoadingAnimation text="Loading..." />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders the git terminal prompt', () => {
    const { container } = render(<LoadingAnimation text="Please wait" />)

    // Terminal-style loader shows a git command prompt
    expect(container.textContent).toContain('git pull origin')
  })

  it('renders with custom text', () => {
    const customText = "Fetching data"
    render(<LoadingAnimation text={customText} />)
    
    expect(screen.getByText(customText)).toBeInTheDocument()
  })
})
