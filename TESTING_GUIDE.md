# Complete Testing Guide for Project Synoptic Edge

## 🎯 Overview

This test suite provides comprehensive coverage for the changes made in the current branch, focusing on:
- **ChatHistoryContext.tsx** - Complete refactoring with state management changes
- **geminiService.ts** - API key configuration update

## 📦 Installation

```bash
# Install all dependencies including test framework
npm install
```

## 🚀 Running Tests

### Basic Commands
```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm test -- --watch

# Run tests with interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Filtering Tests
```bash
# Run only ChatHistoryContext tests
npm test -- ChatHistoryContext

# Run only geminiService tests
npm test -- geminiService

# Run specific test by name pattern
npm test -- "should initialize with a single empty chat"
```

## 📁 Test File Structure