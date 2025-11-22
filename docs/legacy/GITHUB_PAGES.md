# GitHub Pages Setup Guide

This guide will help you enable GitHub Pages for your ReUseIt documentation.

## Quick Setup (5 minutes)

### Step 1: Enable GitHub Pages

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Navigate to **Pages** in the left sidebar
4. Under **Source**, select:
   - Source: **GitHub Actions**
5. Click **Save**

### Step 2: Push Your Changes

```bash
# Add all the new files
git add _config.yml index.md .github/workflows/pages.yml docs/

# Commit the changes
git commit -m "feat: Add GitHub Pages integration"

# Push to main branch
git push origin main
```

### Step 3: Wait for Deployment

1. Go to the **Actions** tab in your repository
2. Wait for the "Deploy GitHub Pages" workflow to complete (usually 1-2 minutes)
3. Once complete, your documentation will be live at:
   ```
   https://your-username.github.io/reuseit/
   ```

## 📝 What Was Created

### `_config.yml`
Jekyll configuration file that:
- Sets the theme to "Cayman" (clean, modern theme)
- Configures site title and description
- Sets up navigation structure
- Excludes unnecessary files from the site

### `index.md`
The homepage of your documentation site that:
- Provides an overview of the project
- Lists key features
- Links to all documentation sections
- Shows quick start instructions
- Displays project status

### `.github/workflows/pages.yml`
GitHub Actions workflow that:
- Automatically builds and deploys your site
- Triggers on pushes to main branch
- Triggers when docs files change
- Can be manually triggered

## 🎨 Customization

### Change Theme

Edit `_config.yml` and replace the theme with one of these:
```yaml
theme: jekyll-theme-minimal
theme: jekyll-theme-architect
theme: jekyll-theme-slate
theme: jekyll-theme-modernist
```

### Add Google Analytics

Uncomment and update in `_config.yml`:
```yaml
google_analytics: UA-XXXXXXXXX-X
```

### Update Repository Info

In `_config.yml`, update:
```yaml
github_username: your-actual-username
repository: reuseit
```

### Customize Homepage

Edit `index.md` to change:
- Project description
- Feature highlights
- Quick start instructions
- Project status

## 🔗 Adding Links Between Pages

In your markdown files, link to other docs using relative paths:

```markdown
See the [Getting Started Guide](./docs/GETTING_STARTED.md) for setup instructions.

Check out the [API Documentation](./docs/API.md) for GraphQL queries.
```

## 📱 Custom Domain (Optional)

To use a custom domain like `docs.reuseit.com`:

1. Create a file named `CNAME` in the root:
   ```
   docs.reuseit.com
   ```

2. Add a DNS record with your domain provider:
   - Type: CNAME
   - Name: docs (or your subdomain)
   - Value: your-username.github.io

3. In GitHub Settings > Pages, enter your custom domain

## 🐛 Troubleshooting

### Build Failed
- Check the Actions tab for error details
- Ensure all markdown files have valid syntax
- Verify `_config.yml` is valid YAML

### 404 Error
- Wait a few minutes after the first deployment
- Ensure the repository is public (or you have GitHub Pro for private repos)
- Check that the Pages source is set to "GitHub Actions"

### Links Not Working
- Use relative paths: `./docs/FILE.md` not `/docs/FILE.md`
- Ensure file names match exactly (case-sensitive)

### Styles Not Loading
- Clear browser cache
- Check that `_config.yml` has valid theme setting
- Wait for the build to complete fully

## 📊 Monitoring

### View Build Status
- Go to **Actions** tab
- Click on "Deploy GitHub Pages" workflow
- See build logs and deployment status

### Analytics
- Add Google Analytics to track visitors
- Use GitHub Insights to see repository traffic
- Monitor which pages are most popular

## 🚀 Advanced Features

### Add Search
Install the Just-the-Docs theme for built-in search:
```yaml
remote_theme: just-the-docs/just-the-docs
```

### Add Comments
Integrate with utterances for GitHub-based comments on pages.

### Custom Layouts
Create `_layouts/` directory and add custom Jekyll templates.

---

**Need Help?**
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Supported Themes](https://pages.github.com/themes/)
