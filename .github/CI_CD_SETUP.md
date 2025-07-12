# CI/CD Setup Guide

This project is configured with GitHub Actions for Continuous Integration and Continuous Deployment.

## Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Permissions:**
- `contents: write` - Required for pushing to gh-pages branch
- `pages: write` - Required for GitHub Pages deployment
- `id-token: write` - Required for OIDC authentication

**Jobs:**
- **Test & Lint**: Runs ESLint, TypeScript checking, and builds the project
- **Security**: Performs security audits and checks for outdated packages
- **Deploy Production**: Deploys to GitHub Pages when pushing to `main`
- **Deploy Staging**: Deploys to staging when pushing to `develop`

### 2. Code Quality (`code-quality.yml`)

**Triggers:**
- Pull requests to `main` or `develop`

**Features:**
- ESLint with inline annotations
- TypeScript checking
- Bundle size analysis

### 3. Dependency Updates (`dependency-update.yml`)

**Triggers:**
- Scheduled weekly (Mondays at 9 AM UTC)
- Manual trigger

**Features:**
- Automatically updates dependencies
- Creates pull requests for updates
- Runs security fixes

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to Pages section
3. Set Source to "GitHub Actions"
4. The site will be available at: `https://venev-g.github.io/superpower-quiz-go/`

### 2. Configure Environment Variables

Add these secrets in your repository settings (Settings → Secrets → Actions):

```bash
# Required for Supabase integration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# For staging environment (optional)
STAGING_VITE_SUPABASE_URL=your_staging_supabase_url
STAGING_VITE_SUPABASE_ANON_KEY=your_staging_supabase_anon_key
```

### 3. Branch Protection Rules (Recommended)

Set up branch protection for `main`:

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require a pull request before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Include administrators

### 4. Environment Configuration

The workflows create two environments:
- **production**: Deploys from `main` branch
- **staging**: Deploys from `develop` branch

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment Process

### Production Deployment
1. Create a pull request to `main`
2. Code quality checks run automatically
3. Review and merge the PR
4. Production deployment triggers automatically
5. Site is live at GitHub Pages URL

### Staging Deployment
1. Push to `develop` branch
2. Staging deployment triggers automatically
3. Test your changes in the staging environment

## Troubleshooting

### Common Issues

1. **Build fails**: Check the build logs in Actions tab
2. **ESLint errors**: Run `npm run lint` locally to see issues
3. **TypeScript errors**: Run `npx tsc --noEmit` to check types
4. **Deployment fails**: Check environment variables and secrets
5. **Permission denied to push to gh-pages**: 
   - Ensure the workflow has proper permissions set at the top level
   - Verify that `contents: write` and `pages: write` are configured
   - Check that GitHub Pages is enabled in repository settings
   - Confirm the `GITHUB_TOKEN` is being used correctly in the deployment step

### Permission Issues Fix

If you encounter a 403 error like:
```
remote: Permission to user/repo.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/user/repo.git/': The requested URL returned error: 403
```

This means the workflow lacks proper permissions. The workflow file already includes the necessary permissions:

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
```

If issues persist:
1. Check that GitHub Pages is enabled in Settings → Pages
2. Ensure the repository allows GitHub Actions to push to protected branches
3. Verify no branch protection rules are blocking the gh-pages branch

### Getting Help

- Check the [Actions tab](../../actions) for detailed logs
- Create an issue using our issue templates
- Review the pull request template for contribution guidelines
