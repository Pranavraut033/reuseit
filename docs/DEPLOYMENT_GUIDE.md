# GitHub Pages Deployment Guide

This guide explains how to publish and maintain the ReUseIt documentation using **MkDocs Material** on **GitHub Pages**.

---

## 1. Overview

The documentation is located in the `docs/` directory and configured via `docs/mkdocs.yml`. A GitHub Actions workflow (`.github/workflows/docs.yml`) automatically builds and deploys the site on every push to `main` affecting documentation files.

---

## 2. Prerequisites

- Repository hosted on GitHub (`Pranavraut033/reuseit`)
- `main` branch is the default branch
- Actions enabled for the repository

---

## 3. Local Preview

To preview the documentation locally:

```bash
cd docs
pip install mkdocs-material mkdocs-minify-plugin
mkdocs serve
```

Open `http://127.0.0.1:8000` in your browser.

---

## 4. Deployment Workflow

The workflow file at `.github/workflows/docs.yml` performs these steps:

1. Checkout repository
2. Install MkDocs dependencies
3. Build static site into `docs/site`
4. Upload build artifact
5. Deploy to GitHub Pages using `actions/deploy-pages`

You do not need to manually run any commands—deployment is automatic.

---

## 5. Manual Trigger

You can manually trigger deployment using the "Run workflow" button in the GitHub Actions UI (Workflow: `Deploy Documentation to GitHub Pages`).

---

## 6. Adding / Updating Content

1. Create or edit Markdown files in `docs/`
2. Update navigation in `docs/mkdocs.yml` if adding a new page
3. Commit and push changes:

```bash
git add docs/*
git commit -m "docs: update architecture section"
git push origin main
```

The site will rebuild automatically (typical build time: <1 min).

---

## 7. Custom Domain (Optional)

If you want to use a custom domain:

1. Go to repository Settings → Pages
2. Add your custom domain (e.g., `docs.reuseit.app`)
3. Create a `CNAME` file in `docs/` with your domain name:

```text
docs.reuseit.app
```

4. Commit and push.

---

## 8. Analytics (Optional)

To enable Google Analytics:

1. Replace `G-XXXXXXXXXX` in `docs/mkdocs.yml` under `extra.analytics.property`
2. Commit and push changes

---

## 9. Theme Customization

Modify the `theme:` section in `docs/mkdocs.yml` to adjust colors, icons, or features.

Example change (primary color):

```yaml
theme:
  palette:
    - media: '(prefers-color-scheme: light)'
      primary: teal
```

---

## 10. Common Issues

| Issue             | Cause                  | Solution                               |
| ----------------- | ---------------------- | -------------------------------------- |
| 404 on Pages site | Build artifact missing | Verify workflow ran successfully       |
| Styling broken    | Cached CSS             | Hard refresh (Cmd+Shift+R)             |
| Page not listed   | Missing nav entry      | Add page to `nav:` in `mkdocs.yml`     |
| Broken links      | Renamed files          | Use relative links & update navigation |

---

## 11. Cleanup

To remove old deployment artifacts:

1. Go to Actions → Select latest run
2. Click "Artifacts" → Delete (optional maintenance)

---

## 12. Verification Checklist

After deployment:

- [ ] Site accessible at `https://pranavraut033.github.io/reuseit/`
- [ ] Navigation contains all expected pages
- [ ] Dark/light mode toggle works
- [ ] Search bar returns results
- [ ] External links function

---

## 13. Example Commit

```bash
git add docs/04-implementation.md docs/mkdocs.yml
git commit -m "docs: add performance benchmarks section"
git push origin main
```

---

## 14. Rollback Strategy

If a deployment introduces issues:

1. Revert commit locally:

```bash
git revert <commit-sha>
```

2. Push revert:

```bash
git push origin main
```

3. Workflow redeploys previous stable version automatically.

---

## 15. Updating MkDocs Version

To update dependencies:

```bash
pip install --upgrade mkdocs-material mkdocs-minify-plugin
```

Commit changes only if configuration requires updates.

---

## 16. Security Considerations

- GitHub Pages serves static content only (no backend exposure)
- No secrets stored in documentation
- Avoid embedding sensitive environment variables or credentials in markdown files.

---

## 17. File Summary

| File                         | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `docs/mkdocs.yml`            | MkDocs configuration (navigation, theme)              |
| `.github/workflows/docs.yml` | Automation workflow for deployment                    |
| `docs/*.md`                  | Documentation content                                 |
| `docs/site/`                 | Generated build output (ignored from version control) |

---

## 18. Next Steps

For enhancements:

- Add versioning (via `mike` tool)
- Integrate diagrams (Mermaid via `pymdownx.superfences`)
- Add changelog page generated from Conventional Commits

---

**Back to:** [Home](README.md)
