/*
 * ============================================================
 *  PORTFOLIO CONTENT  (edit this file to update the site)
 * ============================================================
 *  Every planet's text lives here. Anything marked
 *  `placeholder: true` shows a "PLACEHOLDER" badge on its planet
 *  page. Replace the text, then set placeholder to false.
 *
 *  theme: which planet landscape to draw. One of:
 *    "asoma" | "da" | "basta" | "carter" | "peer" | "justice"
 *  links: optional [{ label, href }] buttons under the dossier.
 * ============================================================
 */
window.PORTFOLIO = {
  experience: [
    {
      id: "asoma",
      theme: "asoma",
      planet: "Calmara",
      role: "Software Developer",
      org: "asoma digital",
      blurb: "ADHD productivity startup app",
      dates: "[Dates]",
      location: "[Location]",
      placeholder: true,
      experience: "[Placeholder] What asoma digital is building and the problem the ADHD productivity app solves.",
      myRole: "[Placeholder] Your role on the team, what you owned, and who you worked with.",
      accomplishments: [
        "[Placeholder] Accomplishment or feature shipped #1",
        "[Placeholder] Accomplishment or feature shipped #2",
        "[Placeholder] Impact or metric"
      ],
      tags: ["[Tech]", "[Tech]", "[Tech]"],
      links: []
    },
    {
      id: "dekalb-da",
      theme: "da",
      planet: "Lex Aurelia",
      role: "Software Engineer",
      org: "The DeKalb County District Attorney's Office",
      blurb: "Legal data engineering and analytics",
      dates: "[Dates]",
      location: "[Location]",
      placeholder: true,
      experience: "[Placeholder] Overview of the work at the District Attorney's Office.",
      myRole: "[Placeholder] Your role, the data you worked with, and who you presented to.",
      accomplishments: [
        "[Placeholder] Pipeline / system you built",
        "[Placeholder] Analysis you ran and what it showed",
        "[Placeholder] Outcome for the office"
      ],
      tags: ["[Tech]", "[Tech]", "[Tech]"],
      links: []
    },
    {
      id: "basta-google",
      theme: "basta",
      planet: "Chroma-9",
      role: "Software Engineer Apprentice",
      org: "BASTA x Google",
      blurb: "Software Engineering Apprenticeship",
      dates: "[Dates]",
      location: "[Location]",
      placeholder: true,
      experience: "[Placeholder] What the BASTA x Google apprenticeship covered.",
      myRole: "[Placeholder] Projects you worked on and skills you built.",
      accomplishments: [
        "[Placeholder] Accomplishment #1",
        "[Placeholder] Accomplishment #2",
        "[Placeholder] Accomplishment #3"
      ],
      tags: ["[Tech]", "[Tech]", "[Tech]"],
      links: []
    },
    {
      id: "carter-center",
      theme: "carter",
      planet: "Verdana",
      role: "Data Engineer",
      org: "The Carter Center",
      blurb: "Data engineering for humanitarian work",
      dates: "[Dates]",
      location: "[Location]",
      placeholder: true,
      experience: "[Placeholder] Overview of the work at The Carter Center.",
      myRole: "[Placeholder] Your role and the data systems you worked on.",
      accomplishments: [
        "[Placeholder] Accomplishment #1",
        "[Placeholder] Accomplishment #2",
        "[Placeholder] Accomplishment #3"
      ],
      tags: ["[Tech]", "[Tech]", "[Tech]"],
      links: []
    }
  ],

  projects: [
    {
      id: "peer",
      theme: "peer",
      planet: "Synapse",
      role: "Fullstack Engineer",
      org: "Peer",
      blurb: "Unified portfolio / markets tracker",
      dates: "[Dates]",
      location: "",
      placeholder: true,
      experience: "[Placeholder] What Peer is and who it's for.",
      myRole: "[Placeholder] What you built across the stack.",
      accomplishments: [
        "[Placeholder] Feature #1",
        "[Placeholder] Feature #2",
        "[Placeholder] Result"
      ],
      tags: ["[Tech]", "[Tech]", "[Tech]"],
      links: [{ label: "View live project", href: "https://peer-topaz.vercel.app" }]
    },
    {
      id: "justice-ai",
      theme: "justice",
      planet: "Themis Prime",
      role: "Software Developer",
      org: "Justice AI",
      blurb: "Offline, citation-backed legal assistant",
      dates: "[Dates]",
      location: "",
      placeholder: true,
      experience: "[Placeholder] What Justice AI does and why it was built.",
      myRole: "[Placeholder] Your part in building it.",
      accomplishments: [
        "[Placeholder] Feature #1",
        "[Placeholder] Feature #2",
        "[Placeholder] Result"
      ],
      tags: ["[Tech]", "[Tech]", "[Tech]"],
      links: []
    }
  ],

  /* Contact links shown on the landing page */
  links: [
    { label: "GitHub", href: "https://github.com/JustJokan" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/joseph-imeikanukpong/" },
    { label: "Resume", href: "assets/ResumeAug26.pdf" },
    { label: "Email", href: "mailto:imeikan.ukpong@emory.edu" },
    { label: "Classic site", href: "classic/" }
  ]
};

/*
 * Star catalogue for the Mission Control screen (cycles every 20 s).
 * Values are approximate, taken from each star's English Wikipedia
 * article infobox (retrieved Nov 2026). R☉ = solar radii, L☉ = solar
 * luminosities. Where estimates disagree a range is shown.
 */
window.STARS = [
  { name: "The Sun", cls: "G2V · yellow dwarf", tempK: 5772, temp: "5,772 K", radiusSol: 1, radius: "1 R☉ (696,000 km)", lum: "1 L☉", dist: "8.3 light-minutes (1 AU)",
    fate: "About 4.6 billion years into a ~10 billion-year main-sequence life. In ~5 billion years it swells into a red giant, then ends as a white dwarf." },
  { name: "Sirius A", cls: "A1V · white main-sequence", tempK: 9845, temp: "9,845 K", radiusSol: 1.71, radius: "1.71 R☉", lum: "24.7 L☉", dist: "8.6 light-years",
    fate: "~240 million years old, with a main-sequence life of about 1 billion years. Will become a red giant, then a white dwarf like its companion Sirius B." },
  { name: "Betelgeuse", cls: "M1–M2 Ia-ab · red supergiant", tempK: 3779, temp: "~3,780 K", radiusSol: 764, radius: "~640–764 R☉", lum: "~65,000–87,100 L☉", dist: "~548 light-years (estimates 408–548)",
    fate: "A young (~10–14 million years) massive star expected to explode as a core-collapse supernova within roughly the next 100,000 years, likely leaving a neutron star." },
  { name: "Rigel", cls: "B8 Ia · blue supergiant", tempK: 12100, temp: "12,100 K", radiusSol: 74.1, radius: "~74 R☉", lum: "~120,000 L☉", dist: "~848 light-years",
    fate: "About 8 million years old and ~21 solar masses. Expected to end its life in a core-collapse supernova." },
  { name: "Vega", cls: "A0V · white main-sequence", tempK: 9500, temp: "~8,900 K (equator) – 10,100 K (pole)", radiusSol: 2.7, radius: "2.4–2.7 R☉ (fast-spinning, oblate)", lum: "~47 L☉", dist: "25 light-years",
    fate: "~700 million years old, well into a main-sequence life of about 1 billion years. Will become a red giant, then a white dwarf." },
  { name: "Polaris", cls: "F7Ib · Cepheid supergiant", tempK: 6015, temp: "6,015 K", radiusSol: 46.3, radius: "~46 R☉", lum: "~1,260 L☉", dist: "~447 light-years",
    fate: "A pulsating yellow supergiant of ~5 solar masses, only tens of millions of years old. Too light to go supernova; expected to end as a white dwarf." },
  { name: "Proxima Centauri", cls: "M5.5Ve · red dwarf", tempK: 2900, temp: "~2,830–3,040 K", radiusSol: 0.162, radius: "0.16 R☉", lum: "0.0016 L☉", dist: "4.25 light-years (closest star to the Sun)",
    fate: "A ~4.85 billion-year-old flare star. Red dwarfs this small burn for roughly 4 trillion years, far longer than the universe has existed, before fading to a white dwarf." },
  { name: "Antares", cls: "M1.5Iab · red supergiant", tempK: 3660, temp: "3,660 K", radiusSol: 680, radius: "~680 R☉", lum: "~75,900 L☉", dist: "~550 light-years",
    fate: "About 15 million years old and 12–16 solar masses. Expected to explode as a supernova." },
  { name: "Arcturus", cls: "K1.5III · red giant", tempK: 4286, temp: "4,286 K", radiusSol: 25.4, radius: "25.4 R☉", lum: "~170 L☉", dist: "36.7 light-years",
    fate: "An old (~7 billion years) star of about 1.1 solar masses that has left the main sequence. Will shed its outer layers as a planetary nebula and end as a white dwarf." },
  { name: "Alpha Centauri A", cls: "G2V · yellow dwarf", tempK: 5750, temp: "~5,750 K", radiusSol: 1.22, radius: "1.22 R☉", lum: "1.51 L☉", dist: "4.34 light-years",
    fate: "A Sun-like star roughly 5–6 billion years old. Will become a red giant, then a white dwarf." }
];
