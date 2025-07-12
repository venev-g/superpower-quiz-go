# CI/CD Setup Guide

This project is configured with GitHub Actions for Continuous Integration and Continuous Deployment.

## Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`

**Permissions:**
- `contents: read` - Required for checking out code
- `pages: write` - Required for GitHub Pages deployment
- `id-token: write` - Required for OIDC authentication with GitHub Pages
- `actions: read` - Required for accessing workflow artifacts

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
3. Set Source to "GitHub Actions" (NOT "Deploy from a branch")
4. The site will be available at: `https://venev-g.github.io/superpower-quiz-go/`

**Important**: When using "GitHub Actions" as the source, the workflow uses the official GitHub Pages deployment actions instead of pushing to a gh-pages branch.

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
5. **404 Error on GitHub Pages (SPA Routing)**: 
   - This project now includes automatic SPA routing support
   - A `404.html` file redirects all routes to `index.html`
   - React Router is configured with the correct basename for GitHub Pages
   - Client-side routing works properly for all routes (/, /dashboard, /admin, etc.)
6. **GitHub Actions deployment fails**: 
   - Ensure proper permissions are set in the workflow
   - Verify that GitHub Pages is enabled in repository settings
   - Check that the workflow is using the correct GitHub Actions deployment actions

### GitHub Actions Deployment

The workflow now uses the official GitHub Pages deployment actions:

```yaml
- name: Setup Pages
  uses: actions/configure-pages@v4

- name: Upload to GitHub Pages
  uses: actions/upload-pages-artifact@v3
  with:
    path: ./dist

- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v4
```

This approach is recommended when using "GitHub Actions" as the source in Pages settings, as it:
- Uses official GitHub Actions for deployment
- Provides better security with OIDC authentication
- Eliminates the need to push to a gh-pages branch
- Works seamlessly with GitHub's Pages infrastructure

### Single Page Application (SPA) Support

This project is configured to work properly as a Single Page Application on GitHub Pages:

**Features:**
- **404.html Fallback**: All unknown routes redirect to the main application
- **Client-side Routing**: React Router handles all navigation
- **Conditional Base Path**: Uses `/superpower-quiz-go/` in production, `/` in development
- **Proper Navigation**: All internal links use React Router instead of direct URL changes

**How it works:**
1. GitHub Pages serves `404.html` for any route that doesn't exist
2. The `404.html` script converts the path to a query parameter and redirects to `index.html`
3. A script in `index.html` reads the query parameter and restores the original route
4. React Router takes over and renders the appropriate component

**Supported Routes:**
- `/` - Main quiz application
- `/auth` - Authentication page
- `/dashboard` - User dashboard
- `/admin` - Admin panel (for authorized users)
- `/mentor` - Mentor page

All routes work correctly when accessed directly or shared as links.

If issues persist:
1. Check that GitHub Pages is enabled in Settings → Pages
2. Ensure the source is set to "GitHub Actions" (not "Deploy from a branch")
3. Verify the workflow completed successfully in the Actions tab
4. Wait a few minutes for deployment to propagate

### Getting Help

- Check the [Actions tab](../../actions) for detailed logs
- Create an issue using our issue templates
- Review the pull request template for contribution guidelines
