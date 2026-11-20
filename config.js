// ─────────────────────────────────────────────────────────────
//  Impact Zone — site config
//  This is the only file you normally need to edit.
// ─────────────────────────────────────────────────────────────
window.SITE_CONFIG = {
  // Your GitHub username. Public repos are pulled in automatically.
  githubUser: "mrbreachie",

  title: "Impact Zone",
  tagline: "A collection of small, sharp tools — all in one place.",

  // Repos to leave off the page (e.g. this landing page itself).
  hide: [
    "Impact-zone",
  ],

  includeForks: false,
  includeArchived: false,

  // Repo names pinned to the top, in this order.
  featured: [
    // "my-best-tool",
  ],

  // Per-repo tweaks. Any field is optional.
  //   description – replaces the GitHub description
  //   live        – link to a hosted version (otherwise uses the repo's
  //                 "Website" field, or its GitHub Pages URL if enabled)
  //   name        – display name instead of the repo slug
  overrides: {
    // "my-best-tool": {
    //   name: "My Best Tool",
    //   description: "Does the one thing, really well.",
    //   live: "https://example.com",
    // },
  },

  // Extra links shown in the header. Leave empty to show just GitHub.
  links: [
    // { label: "YouTube", url: "https://youtube.com/@you" },
  ],
};
