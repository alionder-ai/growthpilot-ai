#!/bin/bash

# Run locale property-based tests
# This script runs Property 44 and Property 45 tests

echo "=========================================="
echo "Running Locale Property-Based Tests"
echo "Property 44: Turkish Locale Formatting"
echo "Property 45: Language Switching"
echo "=========================================="
echo ""

# Check if jest is available
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Run the tests
echo "Running tests with 100 iterations per property..."
echo ""

npx jest __tests__/property/locale.test.ts --verbose

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ All locale tests passed!"
    echo "=========================================="
    exit 0
else
    echo ""
    echo "=========================================="
    echo "❌ Some locale tests failed"
    echo "=========================================="
    exit 1
fi
