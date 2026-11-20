# Impact Zone

One landing page for all my tools. It pulls public repos from GitHub on its own, so new projects show up without any edits.

## Setup

1. Open `config.js` and set `githubUser` to your GitHub username.
2. Optional: hide repos, pin favourites with `featured`, or rewrite names and descriptions in `overrides`.

## Host on GitHub Pages

1. Create a repo named **`<your-username>.github.io`**. That name makes it your root site at `https://<your-username>.github.io/`.
2. Push these files to the `main` branch.
3. In the repo, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, then pick `main` and `/ (root)`.

Any other repo with Pages turned on is served at `https://<your-username>.github.io/<repo>/`. The page finds those automatically and gives them an **Open tool** button. To link a tool hosted somewhere else, put its URL in the repo's **Website** field (the ⚙ next to About) or add it under `overrides`.

## Preview locally

Opening `index.html` directly works. To get closer to how GitHub Pages serves it, run:

```
python -m http.server 8000
```

Then open http://localhost:8000.
