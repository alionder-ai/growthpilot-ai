#!/bin/bash

# Script to run database schema property tests
# This script checks prerequisites and runs the schema validation test

echo "🔍 GrowthPilot AI - Database Schema Property Test"
echo "=================================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo ""
    echo "Please create a .env.local file with the following variables:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo ""
    exit 1
fi

# Check if SUPABASE_SERVICE_ROLE_KEY is set
if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
    echo ""
    echo "Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file"
    echo ""
    exit 1
fi

echo "✅ Environment variables found"
echo ""

# Check if migrations have been applied
echo "📋 Checking database migrations..."
echo ""
echo "Please ensure you have applied all migrations:"
echo "  npx supabase db push"
echo ""
echo "Required migration: 20240101000004_schema_validation_function.sql"
echo ""

# Run the test
echo "🧪 Running property-based schema validation test..."
echo ""

npm run test __tests__/property/database-schema.test.ts

echo ""
echo "✨ Test complete!"
