import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChatHistoryProvider } from '../contexts/ChatHistoryContext';

// Custom render function that wraps components with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <ChatHistoryProvider>{children}</ChatHistoryProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };