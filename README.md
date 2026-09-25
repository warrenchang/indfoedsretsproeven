# Prøveklar — gratis øvelse til to danske prøver

Free, unofficial preparation for Indfødsretsprøven and Medborgerskabsprøven, by [Huanren Zhang](https://sites.google.com/site/huanrenzhang/). The website offers 1,800 questions in two separate study paths. Indfødsretsprøven has 1,200 questions with explanations and sources, chapter-based practice, 45-minute mock exams, exam information and links to official reading material and past papers. Medborgerskabsprøven has a bank of 600 questions covering all 26 fact sheets from its August 2026 textbook, and 25-question, 30-minute mock exams with a pass threshold of 20. There is no separate news section or values threshold for that exam. Danish is the language of the practice material.

All 1,000 original questions and 200 current-affairs questions are included. News coverage: 1 May 2026 through 2026-09-25. Earlier news versions remain in the private local archive. Difficulty and topic weights are editorial, not calibrated to the official exam.

## Publish and update

GitHub Pages: Settings → Pages → Deploy from a branch → main → /(root) → Save. The entry point is `index.html`. No dependencies or build command are required. Keep `.nojekyll` in the root.

After configuring a GitHub `origin`, commit updated website files and run `git push`. The initial push uses `git push -u origin main`. The generated `.gitignore` allows only public assets. Make authoring changes in the original study workspace and regenerate this folder; rebuilding preserves Git history. The workspace's `publishing/GITHUB_PAGES_GUIDE.md` documents the update workflow.

Titles, descriptions, navigation, structured site information and readable static HTML support search discovery. Once the public website URL is known, set `public_url` in the authoring workspace's `web/site_config.json` and rebuild to add canonical URLs and `sitemap.xml`. No placeholder domain is published. See `publishing/SEARCH_DISCOVERY.md` in the workspace for the remaining publication steps.

## Privacy and practice

Indfødsretsprøven mock exams have 45 questions in 35 reading / 5 news / 5 values blocks, with requirements of 36 correct overall and 4 values answers. All practice items have three answer options. Answers and explanations appear after submission. Active attempts and the latest ten scores stay in the visitor's browser. Personal daily quiz records, schedules and local source PDFs are not included. Official documents are linked at their publishers. GitHub Pages does not run private news-refresh or daily-quiz automations.

© 2026 Huanren Zhang. All rights reserved where applicable. See [copyright and attribution](COPYRIGHT.md). This project is not affiliated with or endorsed by SIRI. No open-source or Creative Commons license has been selected.
