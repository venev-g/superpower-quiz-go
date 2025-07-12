#!/bin/bash

# GitHub Actions Deployment Status Checker
# This script checks the status of your GitHub Actions workflows

REPO="venev-g/superpower-quiz-go"
GITHUB_API="https://api.github.com"

echo "🔍 Checking GitHub Actions status for $REPO..."
echo

# Function to get workflow status
get_workflow_status() {
    local workflow_file=$1
    local workflow_name=$2
    
    echo "📋 $workflow_name:"
    
    # Get the latest workflow run
    response=$(curl -s "$GITHUB_API/repos/$REPO/actions/workflows/$workflow_file/runs?per_page=1")
    
    if [[ $? -eq 0 ]] && [[ $(echo "$response" | jq -r '.workflow_runs | length') -gt 0 ]]; then
        status=$(echo "$response" | jq -r '.workflow_runs[0].status')
        conclusion=$(echo "$response" | jq -r '.workflow_runs[0].conclusion')
        created_at=$(echo "$response" | jq -r '.workflow_runs[0].created_at')
        html_url=$(echo "$response" | jq -r '.workflow_runs[0].html_url')
        
        echo "   Status: $status"
        echo "   Conclusion: $conclusion"
        echo "   Created: $created_at"
        echo "   URL: $html_url"
    else
        echo "   ❌ No workflow runs found or API error"
    fi
    echo
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required but not installed. Please install jq to run this script."
    echo "   On Ubuntu/Debian: sudo apt-get install jq"
    echo "   On macOS: brew install jq"
    exit 1
fi

# Check workflow statuses
get_workflow_status "ci-cd.yml" "CI/CD Pipeline"
get_workflow_status "code-quality.yml" "Code Quality"
get_workflow_status "dependency-update.yml" "Dependency Updates"

echo "✅ Status check complete!"
echo
echo "🌐 Production Site: https://venev-g.github.io/superpower-quiz-go/"
echo "📊 Actions Dashboard: https://github.com/$REPO/actions"
