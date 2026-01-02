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
  "TalesFromYourServer": {
    soc_codes: ["35-3031"],
    keywords: ["salary", "career", "server", "waiter", "tips", "worth it"],
    confidence: 0.90
  },
  "bartenders": {
    soc_codes: ["35-3011"],
    keywords: ["salary", "career", "bartender", "tips", "worth it"],
    confidence: 0.95
  },
  "barista": {
    soc_codes: ["35-3023"],
    keywords: ["salary", "career", "coffee", "worth it"],
    confidence: 0.90
  },

  // Sales
  "sales": {
    soc_codes: ["41-3091", "41-4011"],
    keywords: ["salary", "career", "commission", "quota", "worth it", "OTE"],
    confidence: 0.85
  },
  "InsuranceAgent": {
    soc_codes: ["41-3021"],
    keywords: ["salary", "career", "commission", "worth it", "policy"],
    confidence: 0.95
  },
  "CarSales": {
    soc_codes: ["41-4011"],
    keywords: ["salary", "career", "commission", "worth it", "dealership"],
    confidence: 0.95
  },
  "RealEstateAgents": {
    soc_codes: ["41-9022"],
    keywords: ["salary", "career", "commission", "worth it", "market"],
    confidence: 0.90
  },
  "pharmaceutical_sales": {
    soc_codes: ["41-4011"],
    keywords: ["salary", "career", "pharma", "rep", "worth it"],
    confidence: 0.90
  },

  // Office & Administrative
  "ExecutiveAssistants": {
    soc_codes: ["43-6011"],
    keywords: ["salary", "career", "executive", "worth it", "EA"],
    confidence: 0.95
  },
  "OfficeWorkers": {
    soc_codes: ["43-9061", "43-4051"],
    keywords: ["salary", "career", "office", "worth it", "admin"],
    confidence: 0.80
  },
  "humanresources": {
    soc_codes: ["13-1071", "13-1151"],
    keywords: ["salary", "career", "HR", "worth it", "recruiting"],
    confidence: 0.90
  },
  "recruiting": {
    soc_codes: ["13-1071", "13-1151"],
    keywords: ["salary", "career", "recruiter", "worth it", "hiring"],
    confidence: 0.90
  },
  "CustomerService": {
    soc_codes: ["43-4051"],
    keywords: ["salary", "career", "call center", "worth it", "support"],
    confidence: 0.85
  },

  // Agriculture & Natural Resources
  "farming": {
    soc_codes: ["11-9013", "45-2091"],
    keywords: ["salary", "career", "farm", "worth it", "crop"],
    confidence: 0.90
  },
  "agriculture": {
    soc_codes: ["45-2091", "45-2092"],
    keywords: ["salary", "career", "ag", "worth it", "farming"],
    confidence: 0.85
  },
  "forestry": {
    soc_codes: ["45-4011", "19-1032"],
    keywords: ["salary", "career", "forester", "worth it", "logging"],
    confidence: 0.90
  },
  "Ranching": {
    soc_codes: ["45-2093", "11-9013"],
    keywords: ["salary", "career", "ranch", "cattle", "worth it"],
    confidence: 0.90
  },
  "Landscaping": {
    soc_codes: ["37-3011", "37-1012"],
    keywords: ["salary", "career", "landscape", "worth it", "lawn"],
    confidence: 0.90
  },

  // Arts, Design & Media
  "graphic_design": {
    soc_codes: ["27-1024"],
    keywords: ["salary", "career", "design", "freelance", "worth it"],
    confidence: 0.95
  },
  "photography": {
    soc_codes: ["27-4021"],
    keywords: ["salary", "career", "photographer", "worth it", "freelance"],
    confidence: 0.90
  },
  "Filmmakers": {
    soc_codes: ["27-4031", "27-4032"],
    keywords: ["salary", "career", "film", "worth it", "production"],
    confidence: 0.85
  },
  "videography": {
    soc_codes: ["27-4031"],
    keywords: ["salary", "career", "video", "worth it", "production"],
    confidence: 0.90
  },
  "animation": {
    soc_codes: ["27-1014"],
    keywords: ["salary", "career", "animator", "worth it", "studio"],
    confidence: 0.90
  },
  "gamedev": {
    soc_codes: ["15-1252", "27-1014"],
    keywords: ["salary", "career", "game", "developer", "worth it"],
    confidence: 0.85
  },
  "UXDesign": {
    soc_codes: ["27-1021"],
    keywords: ["salary", "career", "UX", "worth it", "product"],
    confidence: 0.90
  },
  "InteriorDesign": {
    soc_codes: ["27-1025"],
    keywords: ["salary", "career", "interior", "worth it", "design"],
    confidence: 0.95
  },
  "Journalism": {
    soc_codes: ["27-3023"],
    keywords: ["salary", "career", "reporter", "worth it", "news"],
    confidence: 0.90
  },
  "audioengineering": {
    soc_codes: ["27-4014"],
    keywords: ["salary", "career", "audio", "worth it", "studio"],
    confidence: 0.90
  },
  "Theatre": {
    soc_codes: ["27-2011", "27-2012"],
    keywords: ["salary", "career", "actor", "worth it", "stage"],
    confidence: 0.80
  },
  "weddingplanning": {
    soc_codes: ["13-1121"],
    keywords: ["salary", "career", "wedding", "planner", "worth it"],
    confidence: 0.90
  },

  // Social Services & Community
  "socialwork": {
    soc_codes: ["21-1021", "21-1022", "21-1029"],
    keywords: ["salary", "career", "MSW", "worth it", "casework"],
    confidence: 0.95
  },
  "nonprofit": {
    soc_codes: ["11-9151", "21-1099"],
    keywords: ["salary", "career", "nonprofit", "worth it", "mission"],
    confidence: 0.80
  },
  "counseling": {
    soc_codes: ["21-1011", "21-1012", "21-1013"],
    keywords: ["salary", "career", "counselor", "worth it", "therapy"],
    confidence: 0.90
  },
  "therapy": {
    soc_codes: ["21-1011", "21-1013", "29-1125"],
    keywords: ["salary", "career", "therapist", "worth it", "mental health"],
    confidence: 0.85
  },
  "schoolcounseling": {
    soc_codes: ["21-1012"],
    keywords: ["salary", "career", "school counselor", "worth it"],
    confidence: 0.95
  },

  // Engineering
  "engineering": {
    soc_codes: ["17-2199", "17-2141"],
    keywords: ["salary", "career", "engineer", "worth it", "PE"],
    confidence: 0.75
  },
  "civilengineering": {
    soc_codes: ["17-2051"],
    keywords: ["salary", "career", "civil", "worth it", "PE"],
    confidence: 0.95
  },
  "MechanicalEngineering": {
    soc_codes: ["17-2141"],
    keywords: ["salary", "career", "mechanical", "worth it"],
    confidence: 0.95
  },
  "ElectricalEngineering": {
    soc_codes: ["17-2071"],
    keywords: ["salary", "career", "electrical", "worth it", "EE"],
    confidence: 0.95
  },
  "ChemicalEngineering": {
    soc_codes: ["17-2041"],
    keywords: ["salary", "career", "chemical", "worth it", "ChemE"],
    confidence: 0.95
  },
  "AerospaceEngineering": {
    soc_codes: ["17-2011"],
    keywords: ["salary", "career", "aerospace", "worth it"],
    confidence: 0.95
  },
  "bioengineering": {
    soc_codes: ["17-2031"],
    keywords: ["salary", "career", "biomedical", "worth it"],
    confidence: 0.90
  },
  "EngineeringStudents": {
    soc_codes: ["17-2199"],
    keywords: ["salary", "career", "internship", "worth it"],
    confidence: 0.70
  },
  "AskEngineers": {
    soc_codes: ["17-2199"],
    keywords: ["salary", "career", "engineer", "worth it"],
    confidence: 0.75
  },

  // Manufacturing & Production
  "manufacturing": {
    soc_codes: ["51-1011", "17-2112"],
    keywords: ["salary", "career", "plant", "worth it", "production"],
    confidence: 0.80
  },
  "QualityControl": {
    soc_codes: ["51-9061"],
    keywords: ["salary", "career", "QC", "worth it", "inspector"],
    confidence: 0.90
  },

  // Military
  "Military": {
    soc_codes: ["55-1011", "55-2011", "55-3011"],
    keywords: ["salary", "career", "enlisted", "officer", "worth it"],
    confidence: 0.85
  },
  "army": {
    soc_codes: ["55-1011", "55-3011"],
    keywords: ["salary", "career", "soldier", "worth it", "MOS"],
    confidence: 0.90
  },
  "AirForce": {
    soc_codes: ["55-1011", "55-3011"],
    keywords: ["salary", "career", "airman", "worth it", "AFSC"],
    confidence: 0.90
  },
  "navy": {
    soc_codes: ["55-1011", "55-3011"],
    keywords: ["salary", "career", "sailor", "worth it", "rate"],
    confidence: 0.90
  },
  "USMC": {
    soc_codes: ["55-1011", "55-3011"],
    keywords: ["salary", "career", "marine", "worth it", "MOS"],
    confidence: 0.90
  },
  "Veterans": {
    soc_codes: ["55-1011", "55-2011", "55-3011"],
    keywords: ["salary", "career", "transition", "worth it", "veteran"],
    confidence: 0.75
  },

  // Personal Care & Service
  "Hair": {
    soc_codes: ["39-5012"],
    keywords: ["salary", "career", "stylist", "worth it", "salon"],
    confidence: 0.90
  },
  "Estheticians": {
    soc_codes: ["39-5094"],
    keywords: ["salary", "career", "esthetician", "worth it", "spa"],
    confidence: 0.95
  },
  "MassageTherapists": {
    soc_codes: ["31-9011"],
    keywords: ["salary", "career", "massage", "worth it", "LMT"],
    confidence: 0.95
  },
  "Nanny": {
    soc_codes: ["39-9011"],
    keywords: ["salary", "career", "nanny", "worth it", "childcare"],
    confidence: 0.95
  },
  "funeraldirector": {
    soc_codes: ["39-4031"],
    keywords: ["salary", "career", "funeral", "mortician", "worth it"],
    confidence: 0.95
  },
  "PersonalTraining": {
    soc_codes: ["39-9031"],
    keywords: ["salary", "career", "trainer", "worth it", "fitness"],
    confidence: 0.90
  },

  // Building & Grounds
  "Janitors": {
    soc_codes: ["37-2011"],
    keywords: ["salary", "career", "custodian", "worth it", "cleaning"],
    confidence: 0.90
  },
  "pestcontrol": {
    soc_codes: ["37-2021"],
    keywords: ["salary", "career", "exterminator", "worth it", "pest"],
    confidence: 0.95
  },

  // Healthcare - Additional
  "psychotherapy": {
    soc_codes: ["19-3033", "21-1011"],
    keywords: ["salary", "career", "psychologist", "worth it", "therapy"],
    confidence: 0.90
  },
  "labrats": {
    soc_codes: ["29-2011", "29-2012"],
    keywords: ["salary", "career", "lab", "worth it", "technician"],
    confidence: 0.85
  },
  "Veterinary": {
    soc_codes: ["29-1131"],
    keywords: ["salary", "career", "vet", "worth it", "DVM"],
    confidence: 0.95
  },
  "VetTech": {
    soc_codes: ["29-2056"],
    keywords: ["salary", "career", "vet tech", "worth it"],
    confidence: 0.95
  },
  "Optometry": {
    soc_codes: ["29-1041"],
    keywords: ["salary", "career", "optometrist", "worth it", "OD"],
    confidence: 0.95
  },
  "audiology": {
    soc_codes: ["29-1181"],
    keywords: ["salary", "career", "audiologist", "worth it"],
    confidence: 0.95
  },
  "SLP": {
    soc_codes: ["29-1127"],
    keywords: ["salary", "career", "speech", "worth it", "pathologist"],
    confidence: 0.95
  },
  "MedicalLab": {
    soc_codes: ["29-2011", "29-2012"],
    keywords: ["salary", "career", "MLT", "worth it", "lab"],
    confidence: 0.90
  },
  "surgicaltechs": {
    soc_codes: ["29-2055"],
    keywords: ["salary", "career", "surgical tech", "worth it", "OR"],
    confidence: 0.95
  },
  "dietetics": {
    soc_codes: ["29-1031"],
    keywords: ["salary", "career", "dietitian", "RD", "worth it"],
    confidence: 0.95
  },
  "medicalschool": {
    soc_codes: ["29-1211", "29-1216"],
    keywords: ["salary", "career", "doctor", "worth it", "residency"],
    confidence: 0.80
  },
  "dentistry": {
    soc_codes: ["29-1021"],
    keywords: ["salary", "career", "dentist", "worth it", "DDS"],
    confidence: 0.95
  },

  // Science & Research
  "labscience": {
    soc_codes: ["19-1042", "19-2031"],
    keywords: ["salary", "career", "scientist", "worth it", "research"],
    confidence: 0.85
  },
  "Biochemistry": {
    soc_codes: ["19-1021"],
    keywords: ["salary", "career", "biochemist", "worth it", "PhD"],
    confidence: 0.90
  },
  "biology": {
    soc_codes: ["19-1029"],
    keywords: ["salary", "career", "biologist", "worth it", "research"],
    confidence: 0.80
  },
  "chemistry": {
    soc_codes: ["19-2031"],
    keywords: ["salary", "career", "chemist", "worth it", "lab"],
    confidence: 0.85
  },
  "geology": {
    soc_codes: ["19-2042"],
    keywords: ["salary", "career", "geologist", "worth it", "field"],
    confidence: 0.90
  },
  "environmental_science": {
    soc_codes: ["19-2041"],
    keywords: ["salary", "career", "environmental", "worth it"],
    confidence: 0.90
  },

  // Installation, Maintenance & Repair
  "Appliances": {
    soc_codes: ["49-9031"],
    keywords: ["salary", "career", "appliance", "technician", "worth it"],
    confidence: 0.90
  },
  "AutoMechanics": {
    soc_codes: ["49-3023"],
    keywords: ["salary", "career", "mechanic", "worth it", "ASE"],
    confidence: 0.95
  },
  "mechanics": {
    soc_codes: ["49-3023", "49-3031"],
    keywords: ["salary", "career", "mechanic", "worth it"],
    confidence: 0.85
  },
  "aviation": {
    soc_codes: ["49-3011"],
    keywords: ["salary", "career", "aircraft", "worth it", "A&P"],
    confidence: 0.85
  },
  "Locksmith": {
    soc_codes: ["49-9094"],
    keywords: ["salary", "career", "locksmith", "worth it"],
    confidence: 0.95
  },
  "elevators": {
    soc_codes: ["47-4021"],
    keywords: ["salary", "career", "elevator", "worth it", "mechanic"],
    confidence: 0.95
  },

  // General Career Subreddits (for broad search)
  "jobs": {
    soc_codes: [],  // Requires text analysis to determine
    keywords: ["salary", "career", "worth it", "job offer", "negotiate"],
    confidence: 0.50
  },
  "careerguidance": {
    soc_codes: [],
    keywords: ["salary", "career", "worth it", "switch", "advice"],
    confidence: 0.50
  },
  "personalfinance": {
    soc_codes: [],
    keywords: ["salary", "career", "worth it", "income", "job"],
    confidence: 0.40
  },
  "antiwork": {
    soc_codes: [],
    keywords: ["salary", "career", "worth it", "job", "pay", "wage"],
    confidence: 0.40
  },
  "work": {
    soc_codes: [],
    keywords: ["salary", "career", "worth it", "job"],
    confidence: 0.40
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

  // Sales
  "AE": "41-4011",  // Account Executive
  "SDR": "41-3091", // Sales Dev Rep
  "BDR": "41-3091", // Business Dev Rep
  "OTE": "41-4011", // On-Target Earnings (sales context)

  // Medical
  "RN": "29-1141",
  "LPN": "29-2061",
  "PA": "29-1071",
  "NP": "29-1171",
  "MD": "29-1211",
  "DO": "29-1211",
  "DPT": "29-1123",
  "OT": "29-1122",
  "SLP": "29-1127",
  "RT": "29-1126",
  "RD": "29-1031",
  "MLT": "29-2011",
  "CNA": "31-1131",
  "MA": "31-9092",
  "EMT": "29-2041",

  // Legal
  "JD": "23-1011",
  "BigLaw": "23-1011",

  // Engineering
  "PE": "17-2051",
  "EE": "17-2071",
  "ChemE": "17-2041",
  "ME": "17-2141",

  // Military
  "MOS": "55-3011",
  "AFSC": "55-3011",
  "rate": "55-3011",
  "E-4": "55-3011",
  "E-5": "55-3011",
  "O-3": "55-1011",

  // Trades
  "A&P": "49-3011",  // Aircraft & Powerplant
  "ASE": "49-3023",
  "CNC": "51-4041",

  // Personal care
  "LMT": "31-9011",

  // Food service
  "FOH": "35-3031",  // Front of house
  "BOH": "35-2014",  // Back of house

  // HR/Admin
  "SHRM": "13-1071",
  "HRBP": "13-1071",
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
