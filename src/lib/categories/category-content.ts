/**
 * Extended Category Content
 *
 * Rich content for category landing pages including descriptions,
 * typical tasks, skills, education paths, and fit indicators.
 */

import type { CategoryId } from './onet-category-mapping';

export interface CategoryContent {
  longDescription: string;
  typicalTasks: string[];
  coreSkills: string[];
  educationPaths: {
    typical: string;
    alternatives: string[];
    timeRange: string;
    commonCredentials: string[];
  };
  whoItsFor: string[];
  whoItsNotFor: string[];
}

export const CATEGORY_CONTENT: Record<CategoryId, CategoryContent> = {
  'management': {
    longDescription: `Executive and general management careers involve leading organizations, setting strategic direction, and ensuring operational excellence. These roles require a blend of business acumen, leadership skills, and industry expertise.

From CEOs steering Fortune 500 companies to general managers running local operations, management professionals are responsible for making high-stakes decisions that affect employees, customers, and stakeholders.`,
    typicalTasks: [
      "Set organizational goals and strategic direction",
      "Oversee daily operations and resource allocation",
      "Lead and develop teams of employees",
      "Analyze financial reports and business metrics",
      "Make decisions on hiring, budgets, and policies",
      "Represent the organization to stakeholders",
      "Ensure regulatory compliance and risk management"
    ],
    coreSkills: [
      "Strategic thinking and planning",
      "Leadership and team development",
      "Financial management and budgeting",
      "Decision-making under pressure",
      "Communication and negotiation",
      "Problem-solving and crisis management",
      "Industry-specific knowledge"
    ],
    educationPaths: {
      typical: "Bachelor's degree plus significant experience",
      alternatives: [
        "MBA or advanced business degree",
        "Industry experience with demonstrated leadership",
        "Entrepreneurial track record"
      ],
      timeRange: "10-20+ years to executive level",
      commonCredentials: [
        "MBA",
        "Industry certifications",
        "Executive education programs"
      ]
    },
    whoItsFor: [
      "Natural leaders who enjoy guiding others",
      "Strategic thinkers who see the big picture",
      "Those comfortable with high-stakes decision making",
      "People who thrive on responsibility and accountability",
      "Individuals with strong business and financial acumen"
    ],
    whoItsNotFor: [
      "Those who prefer hands-on technical work",
      "People uncomfortable with difficult personnel decisions",
      "Individuals who avoid conflict or confrontation",
      "Those seeking predictable 9-5 schedules"
    ]
  },

  'business-finance': {
    longDescription: `Business and finance careers encompass the operational backbone of every organization - from managing money and resources to analyzing data and developing talent. These roles keep organizations running efficiently and growing sustainably.

Whether you're analyzing market trends, managing human resources, or overseeing supply chains, business and finance professionals translate strategy into action.`,
    typicalTasks: [
      "Analyze financial data and prepare reports",
      "Manage budgets and forecast revenue",
      "Recruit, train, and develop employees",
      "Negotiate contracts and manage vendors",
      "Develop marketing strategies and campaigns",
      "Optimize business processes and operations",
      "Ensure compliance with regulations"
    ],
    coreSkills: [
      "Financial analysis and modeling",
      "Data analysis and Excel proficiency",
      "Communication and presentation",
      "Project management",
      "Negotiation and relationship building",
      "Attention to detail and accuracy",
      "Business software proficiency"
    ],
    educationPaths: {
      typical: "Bachelor's degree in business, finance, or related field",
      alternatives: [
        "Associate's degree with experience",
        "Professional certifications (CPA, PHR, etc.)",
        "Specialized training programs"
      ],
      timeRange: "4-6 years for entry-level roles",
      commonCredentials: [
        "CPA (Certified Public Accountant)",
        "CFA (Chartered Financial Analyst)",
        "PHR/SPHR (Human Resources)",
        "PMP (Project Management)"
      ]
    },
    whoItsFor: [
      "Detail-oriented analytical thinkers",
      "Those who enjoy working with numbers and data",
      "People who like solving business problems",
      "Individuals who value stability and growth potential",
      "Those who work well in office environments"
    ],
    whoItsNotFor: [
      "Those who dislike desk work or computers",
      "People who prefer physical or outdoor work",
      "Individuals uncomfortable with deadlines and pressure",
      "Those seeking highly creative or artistic roles"
    ]
  },

  'technology': {
    longDescription: `Technology careers drive the digital infrastructure that powers modern society. From developing software applications to securing networks and managing IT systems, tech professionals solve complex problems with code and systems.

This rapidly evolving field offers some of the highest salaries and most flexible work arrangements, but requires continuous learning to stay current with new technologies.`,
    typicalTasks: [
      "Design, develop, and test software applications",
      "Manage and secure computer networks",
      "Analyze data and build machine learning models",
      "Support users and troubleshoot technical issues",
      "Plan and implement IT infrastructure",
      "Write technical documentation",
      "Collaborate with cross-functional teams"
    ],
    coreSkills: [
      "Programming languages (Python, JavaScript, etc.)",
      "Problem-solving and logical thinking",
      "System design and architecture",
      "Database management and SQL",
      "Version control and DevOps",
      "Communication and teamwork",
      "Continuous learning mindset"
    ],
    educationPaths: {
      typical: "Bachelor's degree in Computer Science or related field",
      alternatives: [
        "Coding bootcamps (3-6 months)",
        "Self-taught with portfolio",
        "Associate's degree plus certifications",
        "Career transition programs"
      ],
      timeRange: "6 months to 4 years depending on path",
      commonCredentials: [
        "AWS/Azure/GCP certifications",
        "CompTIA certifications",
        "Language-specific certifications",
        "Security certifications (CISSP, CEH)"
      ]
    },
    whoItsFor: [
      "Logical problem-solvers who enjoy puzzles",
      "Those who love learning new technologies",
      "People comfortable working independently",
      "Individuals who want high earning potential",
      "Those seeking remote work opportunities"
    ],
    whoItsNotFor: [
      "Those who dislike sitting at computers",
      "People uncomfortable with constant change",
      "Individuals who prefer face-to-face interaction",
      "Those seeking predictable, routine work"
    ]
  },

  'engineering': {
    longDescription: `Engineering careers apply scientific and mathematical principles to design, build, and maintain the physical and digital systems that shape our world. From bridges and buildings to renewable energy systems and robotics, engineers turn ideas into reality.

This field offers diverse specializations - civil, mechanical, electrical, chemical, and more - each with unique challenges and applications.`,
    typicalTasks: [
      "Design systems, structures, and products",
      "Conduct technical analysis and simulations",
      "Oversee construction and manufacturing",
      "Test and validate designs",
      "Collaborate with architects and contractors",
      "Ensure safety and regulatory compliance",
      "Manage projects and budgets"
    ],
    coreSkills: [
      "Mathematical and scientific reasoning",
      "CAD and engineering software",
      "Technical problem-solving",
      "Project management",
      "Attention to detail and precision",
      "Written and verbal communication",
      "Teamwork and collaboration"
    ],
    educationPaths: {
      typical: "Bachelor's degree in Engineering (ABET accredited)",
      alternatives: [
        "Engineering technology degree",
        "Advanced degrees for specialized roles",
        "Technician roles with associate's degree"
      ],
      timeRange: "4-6 years for bachelor's, longer for PE licensure",
      commonCredentials: [
        "PE (Professional Engineer) license",
        "FE (Fundamentals of Engineering) exam",
        "Industry-specific certifications",
        "PMP for project management"
      ]
    },
    whoItsFor: [
      "Those who love math and science",
      "People who enjoy building and creating things",
      "Logical thinkers who like solving complex problems",
      "Individuals who want tangible impact on the world",
      "Those who value precision and accuracy"
    ],
    whoItsNotFor: [
      "Those who struggle with advanced mathematics",
      "People uncomfortable with technical details",
      "Individuals seeking quick entry to workforce",
      "Those who prefer creative or artistic expression"
    ]
  },

  'science': {
    longDescription: `Science and research careers advance human knowledge through systematic investigation and experimentation. From studying microorganisms to analyzing environmental systems, scientists answer fundamental questions about our world.

These roles span academia, government, and industry, offering opportunities to make groundbreaking discoveries that improve lives.`,
    typicalTasks: [
      "Design and conduct experiments",
      "Collect and analyze data",
      "Write research papers and grant proposals",
      "Present findings at conferences",
      "Collaborate with research teams",
      "Operate specialized laboratory equipment",
      "Review scientific literature"
    ],
    coreSkills: [
      "Scientific method and critical thinking",
      "Statistical analysis and data interpretation",
      "Laboratory techniques and protocols",
      "Technical writing and communication",
      "Attention to detail and documentation",
      "Collaboration and peer review",
      "Grant writing and funding acquisition"
    ],
    educationPaths: {
      typical: "Master's or Doctoral degree in scientific field",
      alternatives: [
        "Bachelor's for technician roles",
        "Postdoctoral training for academic positions",
        "Industry research with bachelor's plus experience"
      ],
      timeRange: "6-12 years for independent researcher positions",
      commonCredentials: [
        "PhD in relevant field",
        "Postdoctoral fellowships",
        "Laboratory certifications",
        "Professional society memberships"
      ]
    },
    whoItsFor: [
      "Curious minds driven to understand how things work",
      "Those who enjoy methodical, detailed work",
      "Patient individuals comfortable with uncertainty",
      "People who value intellectual challenge",
      "Those willing to pursue extended education"
    ],
    whoItsNotFor: [
      "Those seeking immediate practical application",
      "People uncomfortable with academic environments",
      "Individuals wanting high early-career salaries",
      "Those who dislike writing and documentation"
    ]
  },

  'healthcare-clinical': {
    longDescription: `Clinical healthcare careers focus on direct patient care - diagnosing conditions, developing treatment plans, and helping people recover from illness or injury. These roles require both scientific knowledge and strong interpersonal skills.

From primary care physicians to specialized surgeons, physical therapists to mental health counselors, clinical healthcare professionals are the frontline of the American healthcare system.`,
    typicalTasks: [
      "Examine patients and assess symptoms",
      "Order and interpret diagnostic tests",
      "Develop and implement treatment plans",
      "Prescribe medications or therapies",
      "Document patient encounters in medical records",
      "Collaborate with other healthcare providers",
      "Educate patients about health conditions"
    ],
    coreSkills: [
      "Clinical assessment and diagnosis",
      "Patient communication and empathy",
      "Medical knowledge and decision-making",
      "Attention to detail and documentation",
      "Stress management and composure",
      "Collaboration and teamwork",
      "Continuous learning and adaptability"
    ],
    educationPaths: {
      typical: "Bachelor's degree to Doctorate (MD/DO)",
      alternatives: [
        "Associate's degree for some nursing roles",
        "Master's degree for nurse practitioners and PAs",
        "Doctoral degree (PhD/PsyD) for psychologists"
      ],
      timeRange: "4-12 years post-high school",
      commonCredentials: [
        "MD/DO for physicians",
        "RN/BSN/MSN for nurses",
        "State licensure required",
        "Board certifications for specialties"
      ]
    },
    whoItsFor: [
      "People who genuinely want to help others heal",
      "Those who thrive in high-stakes environments",
      "Individuals with strong science aptitude",
      "People who communicate well with diverse populations",
      "Those willing to invest years in education"
    ],
    whoItsNotFor: [
      "Those uncomfortable with bodily fluids or illness",
      "People who struggle with irregular hours",
      "Those seeking quick entry to the workforce",
      "Individuals who prefer working alone"
    ]
  },

  'healthcare-technical': {
    longDescription: `Healthcare technical and support careers provide essential services that enable patient care without direct clinical decision-making. These roles operate sophisticated medical equipment, assist clinical staff, and ensure healthcare facilities run smoothly.

From radiologic technologists capturing diagnostic images to home health aides providing daily care, these professionals are the backbone of healthcare delivery.`,
    typicalTasks: [
      "Operate medical equipment and technology",
      "Assist patients with daily activities",
      "Collect and process laboratory specimens",
      "Maintain medical records and documentation",
      "Prepare patients for procedures",
      "Monitor and report patient conditions",
      "Maintain and calibrate equipment"
    ],
    coreSkills: [
      "Technical equipment operation",
      "Patient care and communication",
      "Attention to safety protocols",
      "Documentation and record-keeping",
      "Physical stamina and dexterity",
      "Teamwork with clinical staff",
      "Empathy and patience"
    ],
    educationPaths: {
      typical: "Associate's degree or certificate program",
      alternatives: [
        "On-the-job training for some aide roles",
        "Bachelor's degree for advanced positions",
        "Military training programs"
      ],
      timeRange: "6 months to 4 years",
      commonCredentials: [
        "State licensure or certification",
        "ARRT for radiologic technologists",
        "Phlebotomy certification",
        "CNA for nursing assistants"
      ]
    },
    whoItsFor: [
      "Those who want healthcare careers without extensive schooling",
      "People who enjoy hands-on technical work",
      "Individuals who like helping others daily",
      "Those seeking stable, in-demand careers",
      "People comfortable with physical work"
    ],
    whoItsNotFor: [
      "Those uncomfortable around illness or injury",
      "People who dislike repetitive tasks",
      "Individuals seeking high autonomy",
      "Those wanting to avoid shift work"
    ]
  },

  'legal': {
    longDescription: `Legal careers involve interpreting and applying the law to protect rights, resolve disputes, and ensure justice. From courtroom advocacy to contract drafting, legal professionals navigate complex regulations that govern society.

This field offers paths from paralegals supporting attorneys to judges presiding over courts, with specializations in everything from criminal law to intellectual property.`,
    typicalTasks: [
      "Research legal precedents and regulations",
      "Draft legal documents and contracts",
      "Represent clients in negotiations and court",
      "Advise clients on legal rights and options",
      "Review and analyze case materials",
      "Conduct depositions and interviews",
      "File documents with courts and agencies"
    ],
    coreSkills: [
      "Legal research and analysis",
      "Written and oral advocacy",
      "Critical thinking and logic",
      "Attention to detail and precision",
      "Client communication and counseling",
      "Negotiation and persuasion",
      "Time management under deadlines"
    ],
    educationPaths: {
      typical: "Juris Doctor (JD) for attorneys",
      alternatives: [
        "Paralegal certificate or degree",
        "Legal secretary training",
        "Law enforcement for court roles"
      ],
      timeRange: "7 years for attorneys (4 undergrad + 3 law school)",
      commonCredentials: [
        "JD degree",
        "State bar admission",
        "Paralegal certifications",
        "Specialty certifications"
      ]
    },
    whoItsFor: [
      "Strong readers and writers who love language",
      "Those passionate about justice and advocacy",
      "Logical thinkers who enjoy argumentation",
      "People comfortable with conflict and debate",
      "Individuals who thrive under pressure"
    ],
    whoItsNotFor: [
      "Those who dislike extensive reading and writing",
      "People uncomfortable with confrontation",
      "Individuals seeking quick career entry",
      "Those who prefer hands-on practical work"
    ]
  },

  'education': {
    longDescription: `Education careers shape the next generation through teaching, mentoring, and curriculum development. From preschool teachers nurturing early development to university professors advancing specialized knowledge, educators make lasting impacts on students' lives.

This field offers opportunities at every level and in every subject, with paths for those who love working directly with students and those who prefer administrative or support roles.`,
    typicalTasks: [
      "Plan and deliver lessons and lectures",
      "Assess student learning and provide feedback",
      "Create curriculum and learning materials",
      "Manage classroom behavior and environment",
      "Communicate with parents and guardians",
      "Advise students on academic and career paths",
      "Participate in professional development"
    ],
    coreSkills: [
      "Subject matter expertise",
      "Communication and presentation",
      "Patience and empathy",
      "Classroom management",
      "Assessment and evaluation",
      "Adaptability to different learners",
      "Organization and planning"
    ],
    educationPaths: {
      typical: "Bachelor's degree plus teaching certification",
      alternatives: [
        "Alternative certification programs",
        "Master's degree for higher education",
        "Specialized credentials for special education"
      ],
      timeRange: "4-6 years for K-12 teaching",
      commonCredentials: [
        "State teaching license",
        "Subject-area endorsements",
        "National Board Certification",
        "Administrative credentials"
      ]
    },
    whoItsFor: [
      "Those passionate about helping others learn",
      "Patient individuals who enjoy young people",
      "People who want summers and holidays off",
      "Those seeking meaningful, purposeful work",
      "Individuals who value job stability"
    ],
    whoItsNotFor: [
      "Those seeking high salaries",
      "People uncomfortable with public speaking",
      "Individuals who need quiet work environments",
      "Those who dislike repetition and routine"
    ]
  },

  'arts-media': {
    longDescription: `Arts, design, and media careers combine creativity with technical skill to inform, entertain, and inspire. From graphic designers shaping brand identities to journalists reporting news, these professionals create the content and experiences that shape culture.

This field rewards originality and artistic vision while increasingly requiring digital proficiency and business savvy.`,
    typicalTasks: [
      "Create visual designs and artwork",
      "Write and edit content for various media",
      "Develop marketing and advertising campaigns",
      "Photograph and video events and subjects",
      "Manage social media and digital presence",
      "Present and perform for audiences",
      "Collaborate with creative teams"
    ],
    coreSkills: [
      "Creativity and artistic vision",
      "Design software proficiency",
      "Written and visual communication",
      "Storytelling and narrative",
      "Technical production skills",
      "Client and audience awareness",
      "Portfolio development"
    ],
    educationPaths: {
      typical: "Bachelor's degree in art, design, or communications",
      alternatives: [
        "Self-taught with strong portfolio",
        "Certificate programs and bootcamps",
        "Apprenticeships and internships"
      ],
      timeRange: "2-4 years formal education, ongoing portfolio building",
      commonCredentials: [
        "Portfolio of work (most important)",
        "Adobe certifications",
        "Specialized technical training",
        "MFA for fine arts"
      ]
    },
    whoItsFor: [
      "Creative individuals with artistic talent",
      "Those who enjoy visual and written expression",
      "People comfortable with subjective feedback",
      "Individuals who thrive in dynamic environments",
      "Those willing to hustle for opportunities"
    ],
    whoItsNotFor: [
      "Those seeking high job security",
      "People uncomfortable with criticism of their work",
      "Individuals who prefer structured environments",
      "Those seeking predictable income"
    ]
  },

  'social-services': {
    longDescription: `Social services careers help individuals and communities overcome challenges and access resources. From counseling people through crises to connecting families with assistance programs, these professionals advocate for vulnerable populations.

This emotionally demanding but deeply rewarding field requires empathy, resilience, and commitment to social justice.`,
    typicalTasks: [
      "Assess client needs and develop care plans",
      "Provide counseling and crisis intervention",
      "Connect clients with resources and services",
      "Advocate for clients with agencies and systems",
      "Document cases and track outcomes",
      "Collaborate with healthcare and legal professionals",
      "Conduct community outreach and education"
    ],
    coreSkills: [
      "Empathy and active listening",
      "Crisis intervention and de-escalation",
      "Cultural competence and sensitivity",
      "Case management and documentation",
      "Resource navigation and referrals",
      "Boundaries and self-care",
      "Advocacy and systems navigation"
    ],
    educationPaths: {
      typical: "Bachelor's or Master's degree in Social Work",
      alternatives: [
        "Psychology or counseling degrees",
        "Human services certificates",
        "Related bachelor's with experience"
      ],
      timeRange: "4-6 years for licensed positions",
      commonCredentials: [
        "LCSW (Licensed Clinical Social Worker)",
        "LMSW (Licensed Master Social Worker)",
        "State counseling licenses",
        "Specialized certifications"
      ]
    },
    whoItsFor: [
      "Those driven to help vulnerable populations",
      "People with high emotional intelligence",
      "Individuals comfortable with difficult conversations",
      "Those seeking meaningful, purpose-driven work",
      "People who advocate for social justice"
    ],
    whoItsNotFor: [
      "Those seeking high salaries",
      "People who absorb others' emotional pain",
      "Individuals uncomfortable with bureaucracy",
      "Those who need immediate, visible results"
    ]
  },

  'protective-services': {
    longDescription: `Protective services careers safeguard people, property, and public safety. From police officers maintaining order to firefighters responding to emergencies, these professionals put themselves at risk to protect others.

This field offers opportunities in law enforcement, fire services, corrections, and security, each with unique demands and rewards.`,
    typicalTasks: [
      "Respond to emergencies and calls for service",
      "Patrol areas and maintain public safety",
      "Investigate crimes and incidents",
      "Rescue people from dangerous situations",
      "Enforce laws and regulations",
      "Write reports and testify in court",
      "Provide first aid and emergency care"
    ],
    coreSkills: [
      "Physical fitness and stamina",
      "Quick decision-making under pressure",
      "Communication and de-escalation",
      "Situational awareness and observation",
      "Integrity and ethical judgment",
      "Teamwork and coordination",
      "Weapons and equipment proficiency"
    ],
    educationPaths: {
      typical: "High school diploma plus academy training",
      alternatives: [
        "Associate's or bachelor's degree preferred for advancement",
        "Military experience valued",
        "EMT certification for some roles"
      ],
      timeRange: "6 months to 2 years for entry, ongoing training",
      commonCredentials: [
        "Police academy certification",
        "Firefighter certification",
        "EMT/Paramedic certification",
        "Security licenses"
      ]
    },
    whoItsFor: [
      "Those driven to serve and protect others",
      "People who stay calm under pressure",
      "Physically fit individuals who enjoy action",
      "Those comfortable with authority and confrontation",
      "People who value camaraderie and teamwork"
    ],
    whoItsNotFor: [
      "Those uncomfortable with physical danger",
      "People who struggle with shift work",
      "Individuals who avoid confrontation",
      "Those with certain criminal backgrounds"
    ]
  },

  'food-service': {
    longDescription: `Food service and hospitality careers nourish communities and create memorable dining experiences. From chefs crafting innovative dishes to restaurant managers ensuring smooth operations, these professionals combine culinary skill with customer service.

This fast-paced industry offers paths from entry-level positions to executive chef or restaurant ownership.`,
    typicalTasks: [
      "Prepare and cook food according to recipes",
      "Ensure food safety and sanitation standards",
      "Manage kitchen operations and staff",
      "Create menus and develop new dishes",
      "Serve customers and handle requests",
      "Manage inventory and order supplies",
      "Handle payments and reservations"
    ],
    coreSkills: [
      "Culinary techniques and food knowledge",
      "Time management and multitasking",
      "Customer service and hospitality",
      "Physical stamina and dexterity",
      "Food safety and sanitation",
      "Team coordination",
      "Stress management"
    ],
    educationPaths: {
      typical: "High school diploma with on-the-job training",
      alternatives: [
        "Culinary school degree",
        "Hospitality management degree",
        "Apprenticeships with established chefs"
      ],
      timeRange: "Entry-level immediate, advancement with experience",
      commonCredentials: [
        "ServSafe certification",
        "Culinary degrees (optional)",
        "Sommelier certification for wine service",
        "Management certifications"
      ]
    },
    whoItsFor: [
      "Those passionate about food and cooking",
      "People who enjoy fast-paced environments",
      "Individuals who like serving others",
      "Those seeking flexible schedules",
      "People who thrive on their feet"
    ],
    whoItsNotFor: [
      "Those seeking high salaries initially",
      "People who dislike hot, busy environments",
      "Individuals wanting standard work hours",
      "Those uncomfortable with customer complaints"
    ]
  },

  'building-grounds': {
    longDescription: `Building and grounds maintenance careers keep facilities clean, functional, and attractive. From janitors maintaining office buildings to groundskeepers beautifying landscapes, these professionals create safe, pleasant environments.

This field offers steady employment with opportunities to specialize in areas like landscaping, pest control, or facility management.`,
    typicalTasks: [
      "Clean and maintain building interiors",
      "Mow, trim, and maintain landscapes",
      "Perform minor repairs and maintenance",
      "Monitor and control pests",
      "Set up spaces for events and meetings",
      "Manage waste and recycling",
      "Report maintenance needs and safety hazards"
    ],
    coreSkills: [
      "Physical stamina and strength",
      "Attention to detail and thoroughness",
      "Equipment operation and maintenance",
      "Time management and efficiency",
      "Safety awareness",
      "Reliability and work ethic",
      "Basic repair skills"
    ],
    educationPaths: {
      typical: "High school diploma with on-the-job training",
      alternatives: [
        "Vocational training programs",
        "Landscaping certifications",
        "Pest control licensing"
      ],
      timeRange: "Entry-level immediate, certifications optional",
      commonCredentials: [
        "Pesticide applicator license",
        "OSHA safety certifications",
        "Landscape industry certifications",
        "Building maintenance certifications"
      ]
    },
    whoItsFor: [
      "Those who take pride in clean, well-maintained spaces",
      "People who prefer physical, active work",
      "Individuals seeking stable, steady employment",
      "Those who like working independently",
      "People who enjoy outdoor work"
    ],
    whoItsNotFor: [
      "Those seeking high salaries",
      "People uncomfortable with physical labor",
      "Individuals wanting office environments",
      "Those who dislike repetitive tasks"
    ]
  },

  'personal-care': {
    longDescription: `Personal care and service careers enhance people's appearance, well-being, and daily lives. From hairstylists creating new looks to fitness trainers improving health, these professionals provide one-on-one services that make clients feel their best.

This field offers flexibility, creativity, and the satisfaction of directly helping others.`,
    typicalTasks: [
      "Consult with clients about their needs",
      "Provide beauty, fitness, or personal services",
      "Maintain clean and safe work environments",
      "Build and maintain client relationships",
      "Stay current with trends and techniques",
      "Manage appointments and schedules",
      "Sell products and services"
    ],
    coreSkills: [
      "Customer service and communication",
      "Technical skills in specialty area",
      "Creativity and artistic ability",
      "Physical stamina (standing for long periods)",
      "Sales and marketing",
      "Time management",
      "Empathy and listening"
    ],
    educationPaths: {
      typical: "Certificate or license program (varies by specialty)",
      alternatives: [
        "Apprenticeships",
        "On-the-job training for some roles",
        "Bachelor's for funeral services"
      ],
      timeRange: "Several months to 2 years for most roles",
      commonCredentials: [
        "State cosmetology license",
        "Personal trainer certifications",
        "Massage therapy license",
        "Mortuary science license"
      ]
    },
    whoItsFor: [
      "Those who enjoy one-on-one client interaction",
      "People with artistic or creative talents",
      "Individuals seeking schedule flexibility",
      "Those who want to be their own boss",
      "People who derive satisfaction from helping others look/feel good"
    ],
    whoItsNotFor: [
      "Those uncomfortable with close physical contact",
      "People who dislike sales or upselling",
      "Individuals seeking stable salary (often tip-based)",
      "Those who prefer working behind the scenes"
    ]
  },

  'sales': {
    longDescription: `Sales careers drive business revenue by connecting products and services with customers who need them. From retail associates helping shoppers to account executives closing major deals, sales professionals are the front line of commerce.

This field rewards persuasion, persistence, and relationship-building, often with uncapped earning potential.`,
    typicalTasks: [
      "Prospect and qualify potential customers",
      "Present products and services to clients",
      "Negotiate prices and close deals",
      "Build and maintain customer relationships",
      "Meet sales quotas and targets",
      "Process orders and handle transactions",
      "Follow up on leads and referrals"
    ],
    coreSkills: [
      "Persuasion and negotiation",
      "Communication and presentation",
      "Resilience and persistence",
      "Product knowledge",
      "Relationship building",
      "Goal orientation and drive",
      "Active listening"
    ],
    educationPaths: {
      typical: "High school diploma to bachelor's degree",
      alternatives: [
        "Industry experience valued over education",
        "Sales training programs",
        "Technical knowledge for specialized sales"
      ],
      timeRange: "Entry-level immediate, advancement with results",
      commonCredentials: [
        "Industry-specific product certifications",
        "Sales methodology certifications",
        "Real estate or insurance licenses for those fields"
      ]
    },
    whoItsFor: [
      "Competitive individuals motivated by earning potential",
      "People who enjoy meeting new people",
      "Those who handle rejection well",
      "Individuals who thrive on goals and targets",
      "Natural persuaders and negotiators"
    ],
    whoItsNotFor: [
      "Those uncomfortable with rejection",
      "People who dislike commission-based pay",
      "Individuals who prefer routine and predictability",
      "Those who avoid persuading others"
    ]
  },

  'office-admin': {
    longDescription: `Office and administrative careers keep organizations running smoothly through coordination, communication, and record-keeping. From receptionists greeting visitors to executive assistants managing complex schedules, these professionals are organizational linchpins.

This field offers stable employment with paths to specialized roles in areas like medical administration or legal support.`,
    typicalTasks: [
      "Answer phones and greet visitors",
      "Manage calendars and schedule appointments",
      "Prepare documents and correspondence",
      "Maintain files and databases",
      "Process invoices and expense reports",
      "Coordinate meetings and travel",
      "Handle mail and deliveries"
    ],
    coreSkills: [
      "Organization and attention to detail",
      "Written and verbal communication",
      "Microsoft Office and computer proficiency",
      "Time management and prioritization",
      "Customer service",
      "Discretion and confidentiality",
      "Multitasking"
    ],
    educationPaths: {
      typical: "High school diploma to associate's degree",
      alternatives: [
        "Administrative training programs",
        "Industry-specific certifications",
        "Bachelor's for executive roles"
      ],
      timeRange: "Entry-level immediate, advancement with experience",
      commonCredentials: [
        "CAP (Certified Administrative Professional)",
        "Microsoft Office certifications",
        "Industry-specific certifications (medical, legal)",
        "Notary public"
      ]
    },
    whoItsFor: [
      "Organized individuals who love order and systems",
      "People who enjoy supporting others' success",
      "Those seeking stable, predictable schedules",
      "Individuals comfortable with computer work",
      "Detail-oriented multitaskers"
    ],
    whoItsNotFor: [
      "Those seeking high salaries",
      "People who dislike routine tasks",
      "Individuals wanting autonomy and independence",
      "Those who prefer physical or outdoor work"
    ]
  },

  'agriculture': {
    longDescription: `Agriculture and natural resources careers produce the food and materials that sustain society while stewarding the land. From farmers growing crops to conservation specialists protecting ecosystems, these professionals work with nature to meet human needs.

This field combines physical outdoor work with increasingly sophisticated technology and environmental science.`,
    typicalTasks: [
      "Plant, cultivate, and harvest crops",
      "Raise and care for livestock",
      "Operate farm equipment and machinery",
      "Monitor soil, water, and environmental conditions",
      "Manage pests and diseases",
      "Maintain equipment and facilities",
      "Plan and manage operations"
    ],
    coreSkills: [
      "Agricultural knowledge and practices",
      "Equipment operation and maintenance",
      "Physical stamina and strength",
      "Problem-solving and adaptability",
      "Business and financial management",
      "Weather and environmental awareness",
      "Technology and precision agriculture"
    ],
    educationPaths: {
      typical: "High school diploma with on-farm experience",
      alternatives: [
        "Associate's or bachelor's in agriculture",
        "Vocational training programs",
        "Apprenticeships on working farms"
      ],
      timeRange: "Entry-level immediate, expertise with experience",
      commonCredentials: [
        "Commercial driver's license",
        "Pesticide applicator license",
        "Agricultural certifications",
        "Organic certifications"
      ]
    },
    whoItsFor: [
      "Those who love working outdoors",
      "People connected to the land and nature",
      "Individuals who value independence",
      "Those comfortable with physical labor",
      "People who enjoy seeing tangible results"
    ],
    whoItsNotFor: [
      "Those seeking high, stable salaries",
      "People uncomfortable with weather extremes",
      "Individuals wanting 9-5 schedules",
      "Those who dislike uncertainty and risk"
    ]
  },

  'construction': {
    longDescription: `Construction careers build and renovate the structures where we live, work, and play. From carpenters framing houses to heavy equipment operators moving earth, these skilled tradespeople transform blueprints into reality.

This field offers high earning potential, tangible accomplishment, and paths from apprentice to business owner.`,
    typicalTasks: [
      "Read blueprints and technical drawings",
      "Measure, cut, and assemble materials",
      "Operate power tools and heavy equipment",
      "Install systems and components",
      "Ensure work meets codes and specifications",
      "Coordinate with other trades",
      "Maintain a safe work site"
    ],
    coreSkills: [
      "Physical strength and stamina",
      "Manual dexterity and coordination",
      "Math and measurement skills",
      "Blueprint reading",
      "Tool and equipment proficiency",
      "Problem-solving",
      "Safety awareness"
    ],
    educationPaths: {
      typical: "High school diploma plus apprenticeship",
      alternatives: [
        "Vocational training programs",
        "Union apprenticeships",
        "On-the-job training"
      ],
      timeRange: "3-5 years apprenticeship for journeyman status",
      commonCredentials: [
        "Trade-specific licenses",
        "OSHA safety certifications",
        "Union certifications",
        "Contractor licenses"
      ]
    },
    whoItsFor: [
      "Those who enjoy physical, hands-on work",
      "People who like seeing tangible results",
      "Individuals seeking high earning potential without college",
      "Those who value craftsmanship and skill",
      "People who prefer outdoor work"
    ],
    whoItsNotFor: [
      "Those uncomfortable with heights or physical risk",
      "People who dislike outdoor work in weather",
      "Individuals seeking desk jobs",
      "Those who prefer predictable schedules"
    ]
  },

  'installation-repair': {
    longDescription: `Installation, maintenance, and repair careers keep essential systems running. From HVAC technicians maintaining climate control to automotive mechanics fixing vehicles, these skilled technicians diagnose problems and restore functionality.

This field offers steady demand, good pay, and the satisfaction of solving practical problems.`,
    typicalTasks: [
      "Diagnose equipment problems and malfunctions",
      "Install and configure systems and equipment",
      "Perform preventive maintenance",
      "Repair or replace faulty components",
      "Test systems to ensure proper operation",
      "Read technical manuals and schematics",
      "Maintain service records and documentation"
    ],
    coreSkills: [
      "Technical troubleshooting and diagnosis",
      "Mechanical aptitude and dexterity",
      "Electrical and electronic knowledge",
      "Tool and equipment proficiency",
      "Customer service",
      "Physical stamina",
      "Attention to safety"
    ],
    educationPaths: {
      typical: "Vocational training or associate's degree",
      alternatives: [
        "Apprenticeships",
        "Manufacturer training programs",
        "Military training"
      ],
      timeRange: "1-4 years depending on specialty",
      commonCredentials: [
        "EPA 608 certification (HVAC)",
        "ASE certifications (automotive)",
        "Manufacturer certifications",
        "Journeyman licenses"
      ]
    },
    whoItsFor: [
      "Those who enjoy figuring out how things work",
      "People good with their hands and tools",
      "Individuals who like solving problems",
      "Those seeking stable, in-demand careers",
      "People who prefer variety in their work"
    ],
    whoItsNotFor: [
      "Those uncomfortable with physical labor",
      "People who dislike working in cramped spaces",
      "Individuals seeking desk jobs",
      "Those who don't like technical problem-solving"
    ]
  },

  'production': {
    longDescription: `Manufacturing and production careers create the goods that fill our stores and fuel our economy. From machine operators running assembly lines to quality inspectors ensuring standards, these workers transform raw materials into finished products.

This field is evolving with automation and offers paths from entry-level to skilled technical roles.`,
    typicalTasks: [
      "Set up and operate production machinery",
      "Assemble products and components",
      "Monitor quality and inspect products",
      "Maintain and troubleshoot equipment",
      "Follow safety protocols and procedures",
      "Meet production quotas and deadlines",
      "Document production data"
    ],
    coreSkills: [
      "Machine operation and setup",
      "Attention to detail and quality",
      "Physical stamina and dexterity",
      "Math and measurement",
      "Safety awareness",
      "Teamwork and reliability",
      "Basic computer skills"
    ],
    educationPaths: {
      typical: "High school diploma with on-the-job training",
      alternatives: [
        "Vocational training programs",
        "Manufacturing certifications",
        "Apprenticeships for skilled trades"
      ],
      timeRange: "Entry-level immediate, advancement with training",
      commonCredentials: [
        "OSHA safety certifications",
        "Forklift operator certification",
        "CNC machinist certifications",
        "Quality certifications (Six Sigma)"
      ]
    },
    whoItsFor: [
      "Those who enjoy repetitive, hands-on work",
      "People seeking stable manufacturing jobs",
      "Individuals who work well in team environments",
      "Those who take pride in quality work",
      "People comfortable with physical labor"
    ],
    whoItsNotFor: [
      "Those seeking variety and creativity",
      "People uncomfortable with loud environments",
      "Individuals who dislike shift work",
      "Those seeking high autonomy"
    ]
  },

  'transportation': {
    longDescription: `Transportation and logistics careers move people and goods across local streets and global supply chains. From truck drivers delivering products to logistics analysts optimizing routes, these professionals keep commerce flowing.

This essential field offers opportunities at every education level with growing demand for skilled workers.`,
    typicalTasks: [
      "Operate vehicles and transportation equipment",
      "Load, unload, and secure cargo",
      "Plan and optimize delivery routes",
      "Maintain vehicles and equipment",
      "Track shipments and manage logistics",
      "Ensure safety and regulatory compliance",
      "Communicate with dispatchers and customers"
    ],
    coreSkills: [
      "Vehicle operation and safety",
      "Navigation and route planning",
      "Physical stamina for loading/unloading",
      "Time management and punctuality",
      "Problem-solving and adaptability",
      "Documentation and record-keeping",
      "Customer service"
    ],
    educationPaths: {
      typical: "High school diploma plus licensing/training",
      alternatives: [
        "Commercial driving schools",
        "Bachelor's degree for logistics management",
        "Military transportation experience"
      ],
      timeRange: "Weeks to months for licensing, ongoing training",
      commonCredentials: [
        "Commercial Driver's License (CDL)",
        "Hazmat endorsement",
        "Forklift certification",
        "Logistics certifications (CSCP, CLTD)"
      ]
    },
    whoItsFor: [
      "Those who enjoy driving and travel",
      "People seeking independence on the road",
      "Individuals looking for quick career entry",
      "Those comfortable with physical work",
      "People who value job security in essential industry"
    ],
    whoItsNotFor: [
      "Those who want to be home every night",
      "People uncomfortable with long hours sitting",
      "Individuals seeking career advancement without additional training",
      "Those who dislike driving or traffic"
    ]
  },

  'military': {
    longDescription: `Military careers defend the nation through service in the armed forces. From combat roles to technical specialties, military personnel develop discipline, leadership, and specialized skills while serving their country.

Military service offers training, education benefits, and career paths that transfer to civilian employment.`,
    typicalTasks: [
      "Complete training and maintain readiness",
      "Perform specialty duties (varies by role)",
      "Follow orders and military protocols",
      "Maintain equipment and facilities",
      "Participate in missions and operations",
      "Lead and mentor junior personnel",
      "Uphold military standards and values"
    ],
    coreSkills: [
      "Discipline and following orders",
      "Physical fitness and endurance",
      "Teamwork and unit cohesion",
      "Specialty technical skills",
      "Leadership and decision-making",
      "Adaptability and resilience",
      "Attention to detail"
    ],
    educationPaths: {
      typical: "High school diploma for enlisted, bachelor's for officers",
      alternatives: [
        "GED with additional qualifications",
        "ROTC programs",
        "Military academies",
        "Officer Candidate School"
      ],
      timeRange: "4-6 year initial commitment typical",
      commonCredentials: [
        "Military Occupational Specialty (MOS) training",
        "Security clearances",
        "Professional military education",
        "Transferable civilian certifications"
      ]
    },
    whoItsFor: [
      "Those driven to serve their country",
      "People seeking structure and discipline",
      "Individuals wanting education and training benefits",
      "Those comfortable with physical demands",
      "People who value camaraderie and teamwork"
    ],
    whoItsNotFor: [
      "Those uncomfortable with hierarchy and orders",
      "People unable to meet physical requirements",
      "Individuals unwilling to relocate frequently",
      "Those seeking immediate family stability"
    ]
  }
};

/**
 * Get extended content for a category
 */
export function getCategoryContent(id: CategoryId): CategoryContent {
  return CATEGORY_CONTENT[id];
}
