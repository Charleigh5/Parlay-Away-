#!/bin/bash
# Test Setup Verification Script
echo "=========================================="
echo "Verifying Test Suite Setup"
echo "=========================================="
echo ""

# Check if test files exist
echo "Checking test files..."
test_files=(
  "vitest.config.ts"
  "src/test/setup.ts"
  "src/contexts/ChatHistoryContext.test.tsx"
  "src/services/geminiService.test.ts"
)

all_present=true
for file in "${test_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
    all_present=false
  fi
done

echo ""
echo "Checking documentation..."
doc_files=(
  "TEST_DOCUMENTATION.md"
  "TESTING_SUMMARY.md"
)

for file in "${doc_files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ $file (MISSING)"
    all_present=false
  fi
done

echo ""
echo "Checking package.json configuration..."
if grep -q '"test":' package.json && grep -q '"vitest":' package.json; then
  echo "  ✓ Test scripts configured"
  echo "  ✓ Vitest dependency present"
else
  echo "  ✗ Test configuration incomplete"
  all_present=false
fi

echo ""
if [ "$all_present" = true ]; then
  echo "✅ All test files and configuration are in place!"
  echo ""
  echo "Next steps:"
  echo "  1. Run 'npm install' to install dependencies"
  echo "  2. Run 'npm test' to execute tests"
else
  echo "⚠️  Some files are missing. Please check the output above."
fi
echo "=========================================="