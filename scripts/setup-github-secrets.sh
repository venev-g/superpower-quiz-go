#!/bin/bash

# GitHub Secrets Setup Script
# This script helps you set up the required GitHub secrets for CI/CD

REPO="venev-g/superpower-quiz-go"

echo "🔐 GitHub Secrets Setup for $REPO"
echo "================================================"
echo

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is required but not installed."
    echo "   Please install it from: https://cli.github.com/"
    echo "   On Ubuntu: sudo apt install gh"
    echo "   On macOS: brew install gh"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Please authenticate with GitHub CLI first:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo

# Load environment variables from .env.local
if [[ -f ".env.local" ]]; then
    echo "📄 Loading environment variables from .env.local..."
    
    # Read VITE_SUPABASE_URL
    VITE_SUPABASE_URL=$(grep "^VITE_SUPABASE_URL=" .env.local | cut -d'=' -f2)
    VITE_SUPABASE_ANON_KEY=$(grep "^VITE_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2)
    
    if [[ -n "$VITE_SUPABASE_URL" ]] && [[ -n "$VITE_SUPABASE_ANON_KEY" ]]; then
        echo "✅ Found Supabase credentials in .env.local"
        
        # Set production secrets
        echo "🚀 Setting production secrets..."
        echo "$VITE_SUPABASE_URL" | gh secret set VITE_SUPABASE_URL --repo="$REPO"
        echo "$VITE_SUPABASE_ANON_KEY" | gh secret set VITE_SUPABASE_ANON_KEY --repo="$REPO"
        
        # Set staging secrets (same as production for now)
        echo "🧪 Setting staging secrets..."
        echo "$VITE_SUPABASE_URL" | gh secret set STAGING_VITE_SUPABASE_URL --repo="$REPO"
        echo "$VITE_SUPABASE_ANON_KEY" | gh secret set STAGING_VITE_SUPABASE_ANON_KEY --repo="$REPO"
        
        echo "✅ All secrets have been set successfully!"
    else
        echo "❌ Could not find VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local"
        exit 1
    fi
else
    echo "❌ .env.local file not found"
    echo "   Please create .env.local with your Supabase credentials"
    exit 1
fi

echo
echo "🎉 Setup complete! Your GitHub Actions workflows can now access:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - STAGING_VITE_SUPABASE_URL"
echo "   - STAGING_VITE_SUPABASE_ANON_KEY"
echo
echo "📊 Next steps:"
echo "   1. Push your changes to trigger the CI/CD pipeline"
echo "   2. Go to Settings → Pages to enable GitHub Pages"
echo "   3. Check the Actions tab to monitor deployments"
echo
echo "🌐 Your site will be available at:"
echo "   https://venev-g.github.io/superpower-quiz-go/"
