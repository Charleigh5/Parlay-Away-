import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fs from 'fs';
import * as path from 'path';

describe('Asset Icon Components', () => {
  const iconFiles = fs.readdirSync(path.join(__dirname)).filter(
    (file) => file.endsWith('.tsx') && !file.includes('.test.')
  );

  iconFiles.forEach((file) => {
    const componentName = file.replace('.tsx', '');
    
    describe(componentName, () => {
      it('should be importable', async () => {
        const module = await import(`./${componentName}`);
        expect(module[componentName]).toBeDefined();
      });

      it('should render without crashing', async () => {
        const module = await import(`./${componentName}`);
        const IconComponent = module[componentName];
        
        const { container } = render(<IconComponent />);
        const svg = container.querySelector('svg');
        
        expect(svg).toBeInTheDocument();
      });

      it('should accept className prop', async () => {
        const module = await import(`./${componentName}`);
        const IconComponent = module[componentName];
        
        const { container } = render(<IconComponent className="test-class" />);
        const svg = container.querySelector('svg');
        
        expect(svg).toHaveClass('test-class');
      });

      it('should have standard SVG attributes', async () => {
        const module = await import(`./${componentName}`);
        const IconComponent = module[componentName];
        
        const { container } = render(<IconComponent />);
        const svg = container.querySelector('svg');
        
        expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
        expect(svg).toHaveAttribute('fill', 'none');
        expect(svg).toHaveAttribute('stroke', 'currentColor');
      });
    });
  });

  it('should have consistent API across all icons', async () => {
    for (const file of iconFiles) {
      const componentName = file.replace('.tsx', '');
      const module = await import(`./${componentName}`);
      const IconComponent = module[componentName];
      
      // Test that all icons accept the same props
      const { container: container1 } = render(
        <IconComponent width="16" height="16" className="icon" />
      );
      const svg1 = container1.querySelector('svg');
      expect(svg1).toBeInTheDocument();
      
      // Test with different props
      const { container: container2 } = render(
        <IconComponent strokeWidth="1" />
      );
      const svg2 = container2.querySelector('svg');
      expect(svg2).toBeInTheDocument();
    }
  });
});