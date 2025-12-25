/**
 * Subreddit to Career Mappings
 *
 * Maps Reddit subreddits to SOC codes for career testimonial collection.
 * Each entry includes search keywords and confidence level.
 */

export interface SubredditMapping {
  soc_codes: string[];
  keywords: string[];
  confidence: number;
}

export const SUBREDDIT_MAPPINGS: Record<string, SubredditMapping> = {
  // Trades & Construction
  "electricians": {
    soc_codes: ["47-2111"],
    keywords: ["salary", "journeyman", "apprentice", "union", "career", "worth it", "pay"],
    confidence: 0.95
  },
  "IBEW": {
    soc_codes: ["47-2111"],
    keywords: ["local", "pay", "benefits", "organize", "journeyman", "apprentice"],
    confidence: 0.90
  },
  "Plumbing": {
    soc_codes: ["47-2152"],
    keywords: ["plumber", "pipefitter", "salary", "apprentice", "career", "worth it"],
    confidence: 0.95
  },
  "HVAC": {
    soc_codes: ["49-9021"],
    keywords: ["technician", "install", "commercial", "residential", "salary", "career"],
    confidence: 0.95
  },
  "Welding": {
    soc_codes: ["51-4121"],
    keywords: ["welder", "salary", "career", "certification", "union", "pay"],
    confidence: 0.95
  },
  "Carpentry": {
    soc_codes: ["47-2031"],
    keywords: ["carpenter", "salary", "apprentice", "union", "career", "worth it"],
    confidence: 0.95
  },
  "Lineman": {
    soc_codes: ["49-9051"],
    keywords: ["lineman", "salary", "apprentice", "career", "worth it", "pay"],
    confidence: 0.95
  },
  "Construction": {
    soc_codes: ["47-1011", "47-2061"],
    keywords: ["salary", "career", "foreman", "superintendent", "worth it"],
    confidence: 0.80
  },

  // Healthcare
  "nursing": {
    soc_codes: ["29-1141"],
    keywords: ["RN", "BSN", "salary", "floor", "unit", "career", "worth it"],
    confidence: 0.95
  },
  "StudentNurse": {
    soc_codes: ["29-1141"],
    keywords: ["NCLEX", "clinicals", "career", "salary", "worth it"],
    confidence: 0.85
  },
  "medicine": {
    soc_codes: ["29-1211", "29-1216"],
    keywords: ["physician", "salary", "residency", "career", "worth it"],
    confidence: 0.85
  },
  "Residency": {
    soc_codes: ["29-1211", "29-1216"],
    keywords: ["salary", "match", "career", "worth it", "lifestyle"],
    confidence: 0.90
  },
  "physicianassistant": {
    soc_codes: ["29-1071"],
    keywords: ["PA", "salary", "career", "worth it", "school"],
    confidence: 0.95
  },
  "pharmacy": {
    soc_codes: ["29-1051"],
    keywords: ["pharmacist", "salary", "career", "retail", "hospital", "worth it"],
    confidence: 0.95
  },
  "DentalHygiene": {
    soc_codes: ["29-1292"],
    keywords: ["hygienist", "salary", "career", "worth it"],
    confidence: 0.95
  },
  "physicaltherapy": {
    soc_codes: ["29-1123"],
    keywords: ["PT", "DPT", "salary", "career", "worth it"],
    confidence: 0.95
  },
  "occupationaltherapy": {
    soc_codes: ["29-1122"],
    keywords: ["OT", "salary", "career", "worth it"],
    confidence: 0.95
  },
  "respiratorytherapy": {
    soc_codes: ["29-1126"],
    keywords: ["RT", "salary", "career", "worth it"],
    confidence: 0.95
  },
  "radiology": {
    soc_codes: ["29-2034"],
    keywords: ["radiologic", "technologist", "salary", "career", "worth it"],
    confidence: 0.90
  },
  "ems": {
    soc_codes: ["29-2041", "29-2042"],
    keywords: ["EMT", "paramedic", "salary", "career", "worth it"],
    confidence: 0.95
  },

  // Technology
  "cscareerquestions": {
    soc_codes: ["15-1252", "15-1253"],
    keywords: ["TC", "YOE", "offer", "leetcode", "career", "salary", "worth it"],
    confidence: 0.85
  },
  "ExperiencedDevs": {
    soc_codes: ["15-1252", "15-1253"],
    keywords: ["salary", "career", "senior", "staff", "principal"],
    confidence: 0.90
  },
  "devops": {
    soc_codes: ["15-1244"],
    keywords: ["salary", "career", "SRE", "worth it"],
    confidence: 0.90
  },
  "sysadmin": {
    soc_codes: ["15-1244"],
    keywords: ["salary", "career", "worth it", "admin"],
    confidence: 0.90
  },
  "cybersecurity": {
    soc_codes: ["15-1212"],
    keywords: ["salary", "career", "analyst", "engineer", "worth it"],
    confidence: 0.90
  },
  "netsec": {
    soc_codes: ["15-1212"],
    keywords: ["salary", "career", "security", "worth it"],
    confidence: 0.85
  },
  "dataengineering": {
    soc_codes: ["15-1252"],
    keywords: ["salary", "career", "worth it", "data engineer"],
    confidence: 0.90
  },
  "datascience": {
    soc_codes: ["15-2051"],
    keywords: ["salary", "career", "worth it", "data scientist"],
    confidence: 0.90
  },
  "ITCareerQuestions": {
    soc_codes: ["15-1232", "15-1244"],
    keywords: ["salary", "career", "worth it", "help desk", "support"],
    confidence: 0.85
  },

  // Finance & Business
  "Accounting": {
    soc_codes: ["13-2011"],
    keywords: ["CPA", "salary", "career", "big 4", "worth it"],
    confidence: 0.95
  },
  "FinancialCareers": {
    soc_codes: ["13-2051", "13-2052"],
    keywords: ["salary", "career", "analyst", "banking", "worth it"],
    confidence: 0.90
  },
  "actuary": {
    soc_codes: ["15-2011"],
    keywords: ["salary", "career", "exams", "worth it"],
    confidence: 0.95
  },
  "realtors": {
    soc_codes: ["41-9022"],
    keywords: ["salary", "career", "commission", "worth it"],
    confidence: 0.90
  },

  // Legal
  "LawSchool": {
    soc_codes: ["23-1011"],
    keywords: ["salary", "career", "BigLaw", "worth it"],
    confidence: 0.85
  },
  "Lawyers": {
    soc_codes: ["23-1011"],
    keywords: ["salary", "career", "practice", "worth it"],
    confidence: 0.90
  },
  "paralegal": {
    soc_codes: ["23-2011"],
    keywords: ["salary", "career", "worth it"],
    confidence: 0.95
  },

  // Education
  "Teachers": {
    soc_codes: ["25-2021", "25-2031"],
    keywords: ["salary", "career", "worth it", "teaching"],
    confidence: 0.90
  },
  "teaching": {
    soc_codes: ["25-2021", "25-2031"],
    keywords: ["salary", "career", "worth it"],
    confidence: 0.90
  },

  // Transportation & Logistics
  "Truckers": {
    soc_codes: ["53-3032"],
    keywords: ["salary", "career", "CDL", "worth it", "OTR"],
    confidence: 0.95
  },
  "Trucking": {
    soc_codes: ["53-3032"],
    keywords: ["salary", "career", "driver", "worth it"],
    confidence: 0.90
  },
  "flying": {
    soc_codes: ["53-2011"],
    keywords: ["pilot", "salary", "career", "ATP", "worth it"],
    confidence: 0.85
  },
  "pilots": {
    soc_codes: ["53-2011"],
    keywords: ["salary", "career", "airline", "worth it"],
    confidence: 0.95
  },

  // Protective Services
  "ProtectAndServe": {
    soc_codes: ["33-3051"],
    keywords: ["salary", "career", "cop", "officer", "worth it"],
    confidence: 0.85
  },
  "Firefighting": {
    soc_codes: ["33-2011"],
    keywords: ["salary", "career", "firefighter", "worth it"],
    confidence: 0.95
  },
  "911dispatchers": {
    soc_codes: ["43-5031"],
    keywords: ["salary", "career", "dispatcher", "worth it"],
    confidence: 0.95
  },

  // Skilled Manufacturing
  "Machinists": {
    soc_codes: ["51-4041"],
    keywords: ["salary", "career", "CNC", "worth it"],
    confidence: 0.95
  },

  // Food Service
  "Chefit": {
    soc_codes: ["35-1011"],
    keywords: ["salary", "career", "chef", "worth it", "kitchen"],
    confidence: 0.90
  },
  "KitchenConfidential": {
    soc_codes: ["35-1011", "35-2014"],
    keywords: ["salary", "career", "cook", "worth it"],
    confidence: 0.85
  },
};

// Career slang dictionary for text analysis
export const CAREER_SLANG: Record<string, string> = {
  // Electrical
  "sparky": "47-2111",
  "wireman": "47-2111",
  "jman": "47-2111",
  "journeyman": "47-2111",

  // Line work
  "lineman": "49-9051",
  "lineworker": "49-9051",
  "groundman": "49-9051",

  // HVAC
  "tin knocker": "47-2211",
  "sheet metal": "47-2211",

  // Plumbing
  "pipe fitter": "47-2152",
  "pipefitter": "47-2152",

  // Nursing
  "floor nurse": "29-1141",
  "bedside nurse": "29-1141",
  "travel nurse": "29-1141",

  // Tech
  "SWE": "15-1252",
  "dev": "15-1252",
  "developer": "15-1252",
  "programmer": "15-1252",
  "SRE": "15-1244",
  "sysadmin": "15-1244",

  // Trucking
  "OTR": "53-3032",
  "trucker": "53-3032",
  "CDL holder": "53-3032",

  // Finance
  "big 4": "13-2011",
  "B4": "13-2011",
};

// Keywords that indicate career-relevant content
export const CAREER_KEYWORDS = [
  // Compensation
  "salary", "pay", "wage", "hourly", "annual", "income", "compensation", "TC", "total comp",

  // Career trajectory
  "career", "job", "work", "profession", "occupation",
  "started", "years in", "experience", "YOE",
  "promotion", "advancement", "growth",

  // Sentiment
  "advice", "worth it", "recommend", "regret", "love", "hate",
  "pros", "cons", "benefits", "downsides",

  // Training
  "apprentice", "journey", "training", "school", "degree", "certification",
  "license", "cert", "program",

  // Work conditions
  "day to day", "typical day", "daily", "routine",
  "hours", "overtime", "schedule", "shift",
  "physical", "demanding", "stress",

  // Employment
  "union", "non-union", "benefits", "pension", "401k", "health insurance",
  "contractor", "self-employed", "W2", "1099",
];
