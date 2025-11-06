import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrainCircuitIcon } from './BrainCircuitIcon';

describe('BrainCircuitIcon', () => {
  it('should render SVG element', () => {
    const { container } = render(<BrainCircuitIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toBeInTheDocument();
  });

  it('should have correct SVG attributes', () => {
    const { container } = render(<BrainCircuitIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('should accept custom className', () => {
    const { container } = render(<BrainCircuitIcon className="custom-class" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveClass('custom-class');
  });

  it('should accept custom size props', () => {
    const { container } = render(<BrainCircuitIcon width="32" height="32" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });

  it('should accept custom stroke props', () => {
    const { container } = render(<BrainCircuitIcon strokeWidth="3" />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('strokeWidth', '3');
  });

  it('should contain path elements', () => {
    const { container } = render(<BrainCircuitIcon />);
    const paths = container.querySelectorAll('path');
    
    expect(paths.length).toBeGreaterThan(0);
  });

  it('should merge additional props', () => {
    const { container } = render(
      <BrainCircuitIcon data-testid="brain-icon" aria-label="Brain Circuit" />
    );
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('data-testid', 'brain-icon');
    expect(svg).toHaveAttribute('aria-label', 'Brain Circuit');
  });

  it('should handle onClick event', () => {
    const handleClick = vi.fn();
    const { container } = render(<BrainCircuitIcon onClick={handleClick} />);
    const svg = container.querySelector('svg');
    
    svg?.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply style prop', () => {
    const { container } = render(
      <BrainCircuitIcon style={{ color: 'red' }} />
    );
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveStyle({ color: 'red' });
  });

  it('should maintain currentColor for stroke', () => {
    const { container } = render(<BrainCircuitIcon />);
    const svg = container.querySelector('svg');
    
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });
});