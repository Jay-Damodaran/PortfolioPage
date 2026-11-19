/**
 * content.js — THE single place to edit when adding/removing/reordering content.
 *
 * To add a portfolio item: create a .md file in content/ (see README.md for the
 * frontmatter schema) and add its path to PORTFOLIO_PATHS below. Same pattern
 * for education, certifications, and endorsements in their subfolders.
 *
 * Hero photos and "I'm a…" statements are also configured here.
 */

/* ------------------------------------------------------------------ */
/* Portfolio items (Timeline / List / Detailed List)                   */
/* ------------------------------------------------------------------ */
export const PORTFOLIO_PATHS = [
  'content/HeartFailureClassification.md',
  'content/ImageClassificationWebApp.md',
  'content/ChestXrayPneumonia.md',
  'content/MLProjectLead.md',
  'content/EMGDirector.md',
  'content/NegativeEmissionsTech.md',
  'content/TexasDatahack.md',
  'content/MoodMuse.md',
  'content/EnergyAI.md',
  'content/GlobalNeuroHack.md',
  'content/ADHDResearch.md',
  'content/CTVasculatureResearch.md',
  'content/SureStreak.md',
  'content/TexasHHSC.md',
  'content/TremorLogger.md',
  'content/BubblesOdyssey.md',
  'content/Sepsor.md',
  'content/NightNight.md',
  'content/ESSTutoring.md',
  'content/Civassist.md',
  'content/LearningAssistant.md',
  'content/ARcher.md'
];

/* ------------------------------------------------------------------ */
/* Education entries (animated step-reveal section)                    */
/* ------------------------------------------------------------------ */
export const EDUCATION_PATHS = [
  'content/education/HSdiploma.md',
  'content/education/CSminor.md',
  'content/education/BSBME.md',
];

/* ------------------------------------------------------------------ */
/* Certifications (grouped under the categories below)                 */
/* ------------------------------------------------------------------ */
export const CERTIFICATION_PATHS = [
  'content/certifications/MathforML.md',
  'content/certifications/AzureRAG.md',
  'content/certifications/MSSQLServer.md',
  'content/certifications/MSSQLServerAdvanced.md',
  'content/certifications/GANs.md'
];

/** Category headings, in display order. Add a heading here to create a new column. */
export const CERTIFICATION_CATEGORIES = ['ML', 'DBMS', 'Cloud'];

/* ------------------------------------------------------------------ */
/* Endorsements                                                        */
/* ------------------------------------------------------------------ */
export const ENDORSEMENT_PATHS = [
  'content/endorsements/Dev.md',
];

/* ------------------------------------------------------------------ */
/* Hero: rotating photos + cycling "I'm a…" statements                 */
/* ------------------------------------------------------------------ */
export const HERO_IMAGES = [
  { src: 'images/ProfessionalPhoto.jpeg', alt: 'Jay — professional photo' },
  { src: 'images/GlobalNeurohack.jpeg', alt: 'Jay at Global NeuroHack' },
  { src: 'images/SEPSOR.jpg', alt: 'Jay working on the SEPSOR device' },
  { src: 'images/Tremor_Logger.jpg', alt: 'Jay custom human activity recognition wearable' },
  { src: 'images/Micro_Soldering.png', alt: 'Jay soldering under a microscope' },
  { src: 'images/BME343_Teaching.png', alt: 'Jay leading signals review' },
  { src: 'images/EMG_Director.png', alt: 'Jay leading emg project' }
];

export const HERO_STATEMENTS = [
  "I'm a biomedical engineer.",
  "I'm passionate about AI in healthcare.",
  "I love medical device development.",
  "I'm working on edge AI wearables.",
  "I'm a builder.",
  "I'm a mentor.",
  "I'm a hands-on leader."
];

/** Milliseconds between hero transitions — photos and statements advance
    together on this one shared timer. */
export const HERO_CYCLE_INTERVAL_MS = 2500;
