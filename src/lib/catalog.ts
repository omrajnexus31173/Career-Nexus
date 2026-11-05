/* Career Nexus knowledge base: skill taxonomy + career taxonomy.
 * Used by the rule-based analyzer and roadmap engine, and seeded into the database.
 */

export const SKILL_CATEGORIES: Record<string, string[]> = {
  "Programming Languages": [
    "Python","C","C++","C#","Java","JavaScript","TypeScript","SQL","HTML","CSS","PHP","Go","Rust","Kotlin","Swift","Ruby","Scala","R","MATLAB","Perl","Haskell","Elixir","Dart","Lua","Assembly","Shell Scripting","Bash","PowerShell","Solidity","Clojure","F#","Objective-C","Julia","Groovy","VBA",
  ],
  "Web Development": [
    "React","Next.js","Vue.js","Angular","Svelte","Node.js","Express","Django","Flask","FastAPI","Laravel","Ruby on Rails","ASP.NET","Spring Boot","Tailwind CSS","Sass","REST APIs","GraphQL","Web Accessibility","Webpack","Vite","Server-Side Rendering","Progressive Web Apps","Web Performance Optimization","OAuth 2.0","WebSockets","jQuery","HTML5 Semantics","Responsive Design","Browser DevTools",
  ],
  "Mobile Development": [
    "React Native","Flutter","Android SDK","iOS Development","SwiftUI","Jetpack Compose","Kotlin Multiplatform","Expo","Mobile UI/UX","App Store Optimization","Push Notifications","Offline-First Architecture","Mobile Security","Xamarin","Ionic",
  ],
  "Database Management": [
    "PostgreSQL","MySQL","MongoDB","Redis","SQLite","Oracle Database","Microsoft SQL Server","MariaDB","Cassandra","DynamoDB","Elasticsearch","Supabase","Firebase","Database Design","Query Optimization","Data Modeling","Migrations","Drizzle ORM","Prisma","TimescaleDB","Neo4j","Snowflake","BigQuery",
  ],
  "Cloud Computing": [
    "AWS","Microsoft Azure","Google Cloud Platform","Oracle Cloud","IBM Cloud","Cloud Architecture","Serverless","AWS Lambda","Azure Functions","Kubernetes","Docker","Terraform","Ansible","CloudFormation","Pulumi","CI/CD","GitHub Actions","GitLab CI","Jenkins","Cloud Cost Optimization","Load Balancing","CDN","Cloud Networking","Cloud Migration","Site Reliability Engineering","Observability","Prometheus","Grafana","Datadog",
  ],
  Cybersecurity: [
    "Network Security","Penetration Testing","Ethical Hacking","Vulnerability Assessment","SIEM","Incident Response","Digital Forensics","Cryptography","Identity & Access Management","Zero Trust Architecture","OWASP Top 10","Security Auditing","Threat Modeling","Malware Analysis","Security Compliance","ISO 27001","SOC 2","GDPR Compliance","Firewall Administration","Endpoint Security","Security Awareness Training","Burp Suite","Nmap","Metasploit","Wireshark",
  ],
  "Artificial Intelligence": [
    "Machine Learning","Deep Learning","Natural Language Processing","Computer Vision","Reinforcement Learning","Generative AI","Prompt Engineering","Large Language Models","MLOps","Model Evaluation","Neural Networks","Transformers","PyTorch","TensorFlow","Scikit-learn","Keras","OpenCV","Hugging Face","LangChain","AI Ethics","Feature Engineering","Model Deployment","Vector Databases","RAG Pipelines","Speech Recognition",
  ],
  "Data Science": [
    "Data Analysis","Statistics","Data Visualization","Pandas","NumPy","Matplotlib","Seaborn","Power BI","Tableau","Looker","Excel","Google Sheets","SQL Analytics","ETL Pipelines","Data Cleaning","A/B Testing","Predictive Modeling","Time Series Analysis","Data Warehousing","dbt","Apache Spark","Airflow","Business Intelligence","Statistical Inference","Data Storytelling",
  ],
  "Software Engineering": [
    "Data Structures","Algorithms","Object-Oriented Programming","Functional Programming","System Design","Software Architecture","Microservices","Design Patterns","Unit Testing","Test-Driven Development","Integration Testing","Code Review","Refactoring","Git","Agile","Scrum","Kanban","Debugging","Version Control","API Design","Distributed Systems","Caching Strategies","Message Queues","Domain-Driven Design","Technical Documentation","Software Estimation",
  ],
  "Design": [
    "UI Design","UX Design","Figma","Adobe Photoshop","Adobe Illustrator","Adobe InDesign","Adobe After Effects","Sketch","Adobe XD","Prototyping","Wireframing","User Research","Design Systems","Interaction Design","Typography","Color Theory","Information Architecture","Usability Testing","Motion Design","3D Modeling","Blender","AutoCAD","SolidWorks","Branding","Logo Design","Print Design","Canva","Accessibility Design",
  ],
  "Business Management": [
    "Strategic Planning","Business Analysis","Operations Management","Supply Chain Management","Process Improvement","Lean Six Sigma","Change Management","Vendor Management","Contract Negotiation","Business Development","Stakeholder Management","OKRs","KPI Tracking","Business Process Modeling","Risk Management","Quality Management","P&L Management","Resource Planning","Consulting","Facilitation",
  ],
  Finance: [
    "Financial Accounting","Management Accounting","Financial Modeling","Valuation","Budgeting","Forecasting","Auditing","Taxation","Bookkeeping","QuickBooks","Xero","SAP FI","Cost Analysis","Investment Analysis","Portfolio Management","Risk Analysis","Corporate Finance","Treasury","Payroll","IFRS","GAAP","Excel Finance","Capital Markets","Credit Analysis",
  ],
  Marketing: [
    "Digital Marketing","SEO","SEM","Google Ads","Meta Ads","LinkedIn Ads","Content Marketing","Email Marketing","Social Media Marketing","Marketing Automation","HubSpot","Salesforce Marketing Cloud","Google Analytics","Copywriting","Brand Strategy","Market Research","Conversion Rate Optimization","Affiliate Marketing","Influencer Marketing","Growth Marketing","Public Relations","Campaign Management","Marketing Analytics","Community Management",
  ],
  "Communication": [
    "Public Speaking","Business Writing","Presentation Skills","Negotiation","Active Listening","Conflict Resolution","Storytelling","Technical Writing","Report Writing","Cross-Cultural Communication","Media Relations","Interviewing","Facilitation","Persuasion","Customer Communication","Written Communication","Verbal Communication","Video Conferencing Etiquette",
  ],
  Leadership: [
    "Team Leadership","People Management","Coaching","Mentoring","Decision Making","Emotional Intelligence","Performance Management","Hiring & Recruiting","Delegation","Vision Setting","Organizational Development","Executive Presence","Servant Leadership","Remote Team Management","Succession Planning","Motivation","Feedback Delivery",
  ],
  "Project Management": [
    "Project Planning","Scope Management","Risk Management","Gantt Charts","Jira","Asana","Trello","Microsoft Project","Notion","PMP Methodology","PRINCE2","Agile Project Management","Scrum Master","Sprint Planning","Budget Management","Resource Allocation","Project Documentation","Status Reporting","Dependency Management","Retrospectives",
  ],
  Research: [
    "Literature Review","Qualitative Research","Quantitative Research","Survey Design","Experimental Design","Academic Writing","Citation Management","Data Collection","Hypothesis Testing","Peer Review","Grant Writing","Research Ethics","Systematic Reviews","SPSS","NVivo","LaTeX","Scientific Communication","Field Research","Clinical Research","Meta-Analysis",
  ],
  Engineering: [
    "Mechanical Engineering","Electrical Engineering","Civil Engineering","Structural Analysis","Thermodynamics","Fluid Mechanics","Circuit Design","PCB Design","Control Systems","CAD","Finite Element Analysis","PLC Programming","Robotics","Mechatronics","Materials Science","Quality Control","Manufacturing Processes","Industrial Automation","SCADA","Instrumentation","Embedded Systems","Arduino","Raspberry Pi","Prototyping","Technical Drawing","Lean Manufacturing",
  ],
  Healthcare: [
    "Patient Care","Clinical Assessment","Nursing","Phlebotomy","Vital Signs Monitoring","Medical Terminology","Electronic Health Records","HIPAA Compliance","Infection Control","Medication Administration","Emergency Response","BLS/CPR","Diagnostics","Public Health","Health Education","Rehabilitation","Mental Health Support","Triage","Laboratory Techniques","Radiology","Pharmacy Practice","Dental Care","Nutrition Counseling","Telehealth",
  ],
  Education: [
    "Lesson Planning","Curriculum Development","Classroom Management","Assessment Design","Differentiated Instruction","Special Education","Educational Technology","E-Learning","Instructional Design","LMS Administration","Tutoring","Student Counseling","Educational Psychology","Grading","Parent Communication","Articulate 360","Moodle","Canvas LMS","Gamification","Adult Learning Theory",
  ],
  "Creative Skills": [
    "Photography","Videography","Video Editing","Premiere Pro","Final Cut Pro","DaVinci Resolve","Audio Editing","Sound Design","Music Production","Copywriting","Creative Writing","Screenwriting","Animation","Illustration","Digital Painting","Voice Over","Podcasting","Storyboarding","Art Direction","Photo Retouching","Lightroom","Content Creation","Social Media Content",
  ],
  "Technical Trades": [
    "Electrical Wiring","Plumbing","HVAC","Welding","Carpentry","Masonry","Automotive Repair","Machining","CNC Operation","Blueprint Reading","Safety Compliance","Equipment Maintenance","Refrigeration","Solar Installation","Landscaping","Painting","Roofing","Forklift Operation","Preventive Maintenance","Troubleshooting","OSHA Standards","Pipefitting","Metal Fabrication",
  ],
  "Sales & Customer Success": [
    "B2B Sales","B2C Sales","Lead Generation","Cold Calling","CRM Management","Salesforce","HubSpot CRM","Pipeline Management","Objection Handling","Closing Techniques","Account Management","Customer Onboarding","Customer Retention","Upselling","Sales Forecasting","Product Demos","Territory Management","Customer Support","Zendesk","Intercom","Service Recovery","Customer Satisfaction",
  ],
  "Human Resources": [
    "Recruiting","Talent Acquisition","Onboarding","Employee Relations","Compensation & Benefits","HRIS","Performance Reviews","Employment Law","Diversity & Inclusion","Workforce Planning","Training & Development","Payroll Administration","Policy Development","Conflict Mediation","Exit Interviews","Applicant Tracking Systems","Labor Relations","Job Analysis",
  ],
  "Legal & Compliance": [
    "Contract Drafting","Legal Research","Regulatory Compliance","Intellectual Property","Corporate Law","Employment Law","Data Protection Law","Litigation Support","Document Review","Legal Writing","Privacy Compliance","Anti-Money Laundering","Due Diligence","Case Management","Notarization","Statutory Interpretation",
  ],
  "Agriculture & Environment": [
    "Crop Management","Soil Science","Irrigation Systems","Sustainable Farming","AgriTech","Livestock Management","Environmental Impact Assessment","Waste Management","Water Treatment","Renewable Energy","Solar Energy","Wind Energy","GIS Mapping","Remote Sensing","Conservation","Food Safety","Horticulture","Precision Agriculture","Carbon Accounting","ESG Reporting",
  ],
  "Hospitality & Service": [
    "Hotel Management","Event Planning","Catering","Food & Beverage Service","Culinary Skills","Baking","Bartending","Front Desk Operations","Revenue Management","Reservation Systems","Housekeeping Management","Tourism Management","Travel Coordination","Guest Relations","Menu Planning","Food Hygiene","Banquet Operations","Point of Sale Systems",
  ],
  "Logistics & Operations": [
    "Inventory Management","Warehouse Management","Freight Forwarding","Transportation Planning","Route Optimization","Customs Compliance","Procurement","Strategic Sourcing","Order Fulfillment","Distribution Planning","3PL Management","Demand Planning","ERP Systems","SAP","Oracle NetSuite","Barcode Systems","Last-Mile Delivery","Fleet Management",
  ],
  "Other Professional Skills": [
    "Time Management","Critical Thinking","Problem Solving","Adaptability","Attention to Detail","Collaboration","Self-Motivation","Work Ethic","Creativity","Multitasking","Microsoft Office","Microsoft Excel","Microsoft Word","Microsoft PowerPoint","Google Workspace","Notion","Slack","Zoom","Data Entry","Record Keeping","Report Preparation","Networking","Personal Branding","Freelancing","Entrepreneurship","Financial Literacy","Digital Literacy","Remote Work",
  ],
};

export const ALL_SKILLS = Object.entries(SKILL_CATEGORIES).flatMap(([category, list]) =>
  list.map((name) => ({ name, category })),
);

export const LANGUAGES = [
  "English","Spanish","Mandarin Chinese","Hindi","Arabic","Bengali","Portuguese","Russian","Japanese","Punjabi",
  "German","Javanese","French","Korean","Italian","Turkish","Vietnamese","Urdu","Indonesian","Dutch",
  "Thai","Polish","Swahili","Malay","Ukrainian","Persian","Tagalog","Romanian","Greek","Hebrew",
  "Czech","Swedish","Hungarian","Tamil","Telugu","Marathi","Gujarati","Kannada","Malayalam","Nepali",
  "Sinhala","Burmese","Khmer","Lao","Amharic","Somali","Yoruba","Igbo","Hausa","Zulu",
  "Afrikaans","Norwegian","Danish","Finnish","Croatian","Serbian","Bulgarian","Slovak","Lithuanian","Latvian",
];

export type CareerRecord = {
  id: string;
  title: string;
  family: string;
  summary: string;
  minEducation: string;
  coreSkills: string[];
  bonusSkills: string[];
  certifications: string[];
  projectIdeas: { title: string; detail: string }[];
  opportunities: string[];
  salaryRange: string;
  outlook: string;
};

const c = (
  id: string,
  title: string,
  family: string,
  summary: string,
  minEducation: string,
  coreSkills: string[],
  bonusSkills: string[],
  certifications: string[],
  projectIdeas: { title: string; detail: string }[],
  opportunities: string[],
  salaryRange: string,
  outlook: string,
): CareerRecord => ({
  id, title, family, summary, minEducation, coreSkills, bonusSkills, certifications, projectIdeas, opportunities, salaryRange, outlook,
});

export const CAREERS: CareerRecord[] = [
  c("software-engineer","Software Engineer","Technology","Designs, builds and maintains software systems across the stack, translating requirements into reliable, tested code.","Bachelor's in Computer Science or equivalent portfolio",
    ["JavaScript","TypeScript","Data Structures","Algorithms","Git","REST APIs","Unit Testing","Object-Oriented Programming","SQL","System Design","Agile","Debugging"],
    ["Docker","Kubernetes","GraphQL","CI/CD","Cloud Architecture","Technical Documentation","Microservices","Code Review"],
    ["AWS Certified Developer – Associate","Azure Developer Associate","Oracle Certified Professional Java Programmer"],
    [{title:"Full-stack task manager",detail:"Build a multi-user task app with auth, roles and a REST API deployed to the cloud."},{title:"Open-source contribution streak",detail:"Ship 10 merged pull requests to established repositories to prove collaborative engineering."},{title:"Performance case study",detail:"Profile a slow endpoint, reduce p95 latency by 60% and document the before/after."}],
    ["Junior → Mid → Senior Engineer","Engineering Manager","Staff / Principal Engineer","Founding engineer at a startup"],
    "$70k – $180k","Strong demand across every industry"),
  c("data-analyst","Data Analyst","Data & AI","Turns raw data into answers: cleans datasets, builds dashboards and communicates findings that change decisions.","Bachelor's in any quantitative field, or a strong analytics portfolio",
    ["SQL","Excel","Data Cleaning","Data Visualization","Statistics","Tableau","Power BI","Data Analysis","Google Analytics","Report Writing","Business Intelligence"],
    ["Python","Pandas","A/B Testing","dbt","ETL Pipelines","Data Storytelling","Looker"],
    ["Google Data Analytics Professional Certificate","Microsoft Power BI Data Analyst (PL-300)","Tableau Desktop Specialist"],
    [{title:"End-to-end dashboard",detail:"Take a public dataset from raw CSV to an interactive executive dashboard with documented assumptions."},{title:"Churn analysis",detail:"Model why customers leave and quantify the top three drivers with confidence intervals."},{title:"Automated reporting",detail:"Replace a manual weekly report with a scheduled SQL + visualization pipeline."}],
    ["Business Intelligence Analyst","Analytics Manager","Data Scientist","Revenue / Marketing Analyst"],
    "$55k – $120k","Growing steadily as data becomes core to operations"),
  c("data-scientist","Data Scientist","Data & AI","Builds predictive models and experiments that turn uncertainty into measurable, repeatable outcomes.","Bachelor's/Master's in Statistics, CS, Maths or related",
    ["Python","Statistics","Machine Learning","Pandas","NumPy","Scikit-learn","Data Visualization","Feature Engineering","SQL","A/B Testing","Model Evaluation","Predictive Modeling"],
    ["PyTorch","TensorFlow","Apache Spark","MLOps","Deep Learning","Time Series Analysis","Cloud Computing"],
    ["AWS Certified Machine Learning – Specialty","Google Professional Machine Learning Engineer","Databricks Certified Data Scientist"],
    [{title:"Forecasting model",detail:"Build and backtest a demand forecast, reporting MAPE against a naive baseline."},{title:"Classification case study",detail:"Predict a binary outcome, handle class imbalance, and explain features with SHAP values."},{title:"Deployed ML API",detail:"Serve a model behind a versioned API with monitoring for drift."}],
    ["Machine Learning Engineer","Analytics Lead","Research Scientist","Head of Data"],
    "$90k – $200k","High demand, especially with generative AI skills"),
  c("ml-engineer","Machine Learning Engineer","Data & AI","Productionises models: pipelines, serving infrastructure, monitoring and cost/performance trade-offs.","Bachelor's in CS or related plus demonstrable MLOps work",
    ["Python","Machine Learning","PyTorch","MLOps","Docker","Kubernetes","Model Deployment","Feature Engineering","SQL","Deep Learning","CI/CD","Cloud Computing"],
    ["Large Language Models","RAG Pipelines","Vector Databases","Apache Spark","Terraform","Model Evaluation","Prompt Engineering"],
    ["Google Professional Machine Learning Engineer","AWS Certified Machine Learning – Specialty","Databricks Machine Learning Professional"],
    [{title:"RAG assistant",detail:"Build a retrieval-augmented assistant over your own documents with evaluation of answer quality."},{title:"Feature store",detail:"Implement offline/online feature parity and measure training-serving skew."},{title:"Model monitoring",detail:"Add drift, latency and cost dashboards with automated alerts."}],
    ["Senior ML Engineer","AI Platform Lead","Research Engineer","ML Architect"],
    "$110k – $220k","Very strong; driven by applied AI adoption"),
  c("ai-specialist","AI / Generative AI Specialist","Data & AI","Applies foundation models to real products: prompt systems, retrieval, agents, evaluation and safety.","Bachelor's plus hands-on LLM projects",
    ["Prompt Engineering","Large Language Models","Python","Natural Language Processing","RAG Pipelines","Vector Databases","AI Ethics","Model Evaluation","Machine Learning","API Design"],
    ["LangChain","PyTorch","Hugging Face","Cloud Computing","MLOps","Transformers","Fine-Tuning"],
    ["Microsoft Azure AI Engineer Associate (AI-102)","AWS Certified AI Practitioner","NVIDIA Generative AI Certification"],
    [{title:"Domain assistant",detail:"Ship an assistant scoped to one industry with grounded answers and citations."},{title:"Eval harness",detail:"Build an automated evaluation suite of 200+ cases and publish pass rates per version."},{title:"Cost/latency study",detail:"Compare models on quality vs cost and document the selection framework."}],
    ["Applied AI Engineer","AI Product Lead","Head of AI","AI Consultant"],
    "$100k – $210k","Fastest-growing technical specialty"),
  c("cybersecurity-analyst","Cybersecurity Analyst","Cybersecurity","Monitors, detects and responds to threats; hardens systems and proves compliance posture.","Bachelor's in IT/CS or equivalent certification path",
    ["Network Security","SIEM","Incident Response","Vulnerability Assessment","OWASP Top 10","Identity & Access Management","Cryptography","Security Compliance","Firewall Administration","Endpoint Security","Wireshark","Threat Modeling"],
    ["Penetration Testing","Burp Suite","Nmap","Digital Forensics","Zero Trust Architecture","Python","Cloud Security"],
    ["CompTIA Security+","Certified Ethical Hacker (CEH)","CISSP","CompTIA CySA+","ISO 27001 Lead Implementer"],
    [{title:"Home SOC lab",detail:"Deploy a SIEM with honeypots and write three incident reports from real detections."},{title:"Vulnerability assessment",detail:"Scan, triage and remediate a deliberately vulnerable app, documenting CVSS scores."},{title:"Phishing simulation",detail:"Run a controlled campaign and measure improvement after awareness training."}],
    ["Security Engineer","SOC Lead","Penetration Tester","CISO track"],
    "$75k – $160k","Strong; skills shortage persists globally"),
  c("devops-engineer","DevOps / Platform Engineer","Technology","Automates delivery and operates platforms so product teams ship safely and quickly.","Bachelor's in CS/IT or demonstrable infrastructure portfolio",
    ["Docker","Kubernetes","CI/CD","Terraform","Linux","Cloud Computing","AWS","Monitoring","Scripting","Bash","Git","Site Reliability Engineering"],
    ["Python","Go","Prometheus","Grafana","Ansible","Security Compliance","Cloud Cost Optimization","Observability"],
    ["AWS Certified DevOps Engineer – Professional","Certified Kubernetes Administrator (CKA)","HashiCorp Terraform Associate"],
    [{title:"Zero-downtime pipeline",detail:"Build a CI/CD pipeline with automated tests, canary deploys and instant rollback."},{title:"Infrastructure as code",detail:"Recreate an entire environment from Terraform in under 30 minutes."},{title:"SLO dashboard",detail:"Define SLOs, error budgets and alerting for a real service."}],
    ["Senior Platform Engineer","SRE","Cloud Architect","Head of Infrastructure"],
    "$90k – $180k","Consistently strong demand"),
  c("ux-designer","UX Designer","Design & Creative","Researches user needs and shapes interfaces that are usable, accessible and valuable.","Bachelor's in design/HCI or a strong case-study portfolio",
    ["User Research","Wireframing","Prototyping","Figma","Usability Testing","Information Architecture","UI Design","Interaction Design","Design Systems","Accessibility Design","UX Design","Typography"],
    ["HTML","CSS","Motion Design","Data Analysis","Content Strategy","Adobe XD","Facilitation"],
    ["Google UX Design Professional Certificate","Nielsen Norman Group UX Certification","IAAP Accessibility Certification"],
    [{title:"End-to-end case study",detail:"Take one product from discovery interviews to tested high-fidelity prototype."},{title:"Accessibility audit",detail:"Audit a live product against WCAG 2.2 AA and document fixes by severity."},{title:"Design system",detail:"Build a tokenised component library with usage documentation."}],
    ["Product Designer","UX Researcher","Design Lead","Head of Design"],
    "$65k – $140k","Steady; research-heavy profiles most resilient"),
  c("graphic-designer","Graphic Designer","Design & Creative","Creates visual identity and communication across print, digital and brand systems.","Diploma/Bachelor's in design or a compelling portfolio",
    ["Adobe Illustrator","Adobe Photoshop","Typography","Color Theory","Branding","Layout Design","Figma","Adobe InDesign","Logo Design","Print Design","Visual Communication"],
    ["Motion Design","Adobe After Effects","Canva","UI Design","Photography","Illustration","Copywriting"],
    ["Adobe Certified Professional","Canva Certified Creative","AIGA mentorship programme"],
    [{title:"Full brand identity",detail:"Deliver logo, type scale, colour system and brand guidelines for a real client."},{title:"Editorial spread",detail:"Design an 8-page magazine spread with grid discipline."},{title:"Campaign kit",detail:"Produce a coordinated multi-channel campaign (social, print, email)."}],
    ["Senior Designer","Art Director","Brand Designer","Creative Director"],
    "$40k – $95k","Stable; motion and brand strategy skills command premiums"),
  c("product-manager","Product Manager","Business & Management","Defines what to build and why, aligning users, business and engineering around outcomes.","Bachelor's in any field plus product experience",
    ["Product Roadmapping","Stakeholder Management","User Research","Data Analysis","Agile","Prioritization","A/B Testing","Business Analysis","OKRs","Communication","Market Research","Product Strategy"],
    ["SQL","Technical Documentation","Jira","Figma","Financial Modeling","Go-to-Market Strategy","Leadership"],
    ["Certified Scrum Product Owner (CSPO)","Pragmatic Institute Certification","AIPMM Product Management Certificate"],
    [{title:"0→1 product spec",detail:"Write a full PRD with problem, metrics, scope and rollout plan for a validated idea."},{title:"Discovery sprint",detail:"Run 12 customer interviews and convert findings into a prioritised backlog."},{title:"Metrics teardown",detail:"Instrument a product and run one experiment to a statistically valid conclusion."}],
    ["Senior PM","Group PM","Director of Product","VP Product / CPO"],
    "$95k – $190k","Strong for outcome-oriented, data-literate PMs"),
  c("project-manager","Project Manager","Business & Management","Plans and delivers projects on time and budget while managing risk and stakeholders.","Bachelor's plus delivery experience",
    ["Project Planning","Risk Management","Agile","Scrum","Budget Management","Stakeholder Management","Resource Allocation","Jira","Status Reporting","Scope Management","Gantt Charts","Dependency Management"],
    ["Lean Six Sigma","Microsoft Project","Change Management","PRINCE2","Negotiation","Business Process Modeling"],
    ["PMP","PRINCE2 Practitioner","Certified ScrumMaster (CSM)","CompTIA Project+"],
    [{title:"Recovery plan",detail:"Take a failing project and produce a credible recovery plan with re-baselined schedule."},{title:"Portfolio dashboard",detail:"Build a live status dashboard across five projects with RAG and risk heatmaps."},{title:"Process improvement",detail:"Run a retrospective-driven change that cuts cycle time measurably."}],
    ["Programme Manager","Delivery Lead","PMO Manager","Operations Director"],
    "$70k – $140k","Steady across all industries"),
  c("digital-marketer","Digital Marketer","Marketing","Grows audiences and revenue through paid, organic, email and content channels.","Bachelor's in marketing/business or proven campaign results",
    ["SEO","Google Ads","Content Marketing","Email Marketing","Google Analytics","Social Media Marketing","Copywriting","Conversion Rate Optimization","Marketing Automation","Market Research","Campaign Management","Meta Ads"],
    ["HubSpot","SQL","Data Visualization","A/B Testing","Growth Marketing","Marketing Analytics","Video Editing"],
    ["Google Ads Search Certification","Google Analytics (GA4) Certification","HubSpot Inbound Marketing","Meta Certified Media Buying Professional"],
    [{title:"Channel experiment",detail:"Run a 6-week paid + organic test and report CAC by channel with creative insights."},{title:"SEO audit",detail:"Audit a site's technical SEO and content gaps, then document ranking movement."},{title:"Lifecycle email flow",detail:"Build a five-email nurture sequence and measure conversion lift."}],
    ["Growth Manager","Head of Marketing","Performance Marketing Lead","CMO track"],
    "$50k – $120k","Strong for full-funnel, analytics-literate marketers"),
  c("content-creator","Content Creator / Copywriter","Media & Communication","Produces written and visual content that builds audience and drives action.","No formal degree required; portfolio is the credential",
    ["Copywriting","Content Marketing","Creative Writing","SEO","Social Media Content","Storytelling","Video Editing","Content Creation","Editing","Brand Voice"],
    ["Photography","Podcasting","Community Management","Adobe Photoshop","Canva","Email Marketing","Analytics"],
    ["HubSpot Content Marketing Certification","Copyblogger U","Google Digital Marketing Certificate"],
    [{title:"Published series",detail:"Ship a 12-part series with growing engagement metrics."},{title:"Portfolio site",detail:"Build a personal site with 6 case studies and measurable traffic."},{title:"Brand voice guide",detail:"Write a voice and style guide used across a real channel."}],
    ["Senior Copywriter","Content Strategist","Creative Lead","Freelance consultant"],
    "$35k – $90k","Growing with creator economy and brand media"),
  c("financial-analyst","Financial Analyst","Finance","Models performance, forecasts results and supports investment and budgeting decisions.","Bachelor's in Finance, Accounting or Economics",
    ["Financial Modeling","Excel","Valuation","Forecasting","Financial Accounting","Budgeting","Data Analysis","Corporate Finance","Investment Analysis","Risk Analysis","GAAP","Cost Analysis"],
    ["SQL","Power BI","Python","IFRS","Capital Markets","Financial Reporting"],
    ["CFA Level I","FMVA (Financial Modeling & Valuation Analyst)","CPA","CMA"],
    [{title:"Three-statement model",detail:"Build a linked model with scenarios and sensitivity tables for a public company."},{title:"Valuation memo",detail:"Produce a DCF and comparables valuation with an investment recommendation."},{title:"Budget variance tool",detail:"Automate monthly variance reporting with driver-level explanations."}],
    ["Senior Analyst","Associate","FP&A Manager","CFO track"],
    "$65k – $150k","Stable, with premium for modelling and CFA progress"),
  c("accountant","Accountant","Finance","Records, reconciles and reports financial activity, ensuring accuracy and compliance.","Bachelor's in Accounting",
    ["Financial Accounting","Bookkeeping","Taxation","Auditing","Excel","QuickBooks","GAAP","Payroll","Reconciliation","Financial Reporting","Attention to Detail"],
    ["Xero","SAP FI","IFRS","Management Accounting","Data Analysis","Internal Controls"],
    ["CPA","ACCA","CMA","Certified Bookkeeper (CB)"],
    [{title:"Full-cycle close",detail:"Run a month-end close for a small business and produce a complete reporting pack."},{title:"Audit file",detail:"Prepare a documentation set that survives an external audit with zero adjustments."},{title:"Automation project",detail:"Automate bank reconciliation and quantify hours saved."}],
    ["Senior Accountant","Audit Manager","Controller","Finance Director"],
    "$50k – $110k","Consistent demand; advisory skills rising in value"),
  c("registered-nurse","Registered Nurse","Healthcare","Delivers and coordinates patient care across clinical settings with safety and empathy.","Nursing diploma/degree plus licensure",
    ["Patient Care","Clinical Assessment","Medication Administration","Vital Signs Monitoring","Infection Control","Medical Terminology","Electronic Health Records","Emergency Response","HIPAA Compliance","Documentation","Teamwork"],
    ["Triage","IV Therapy","Wound Care","Telehealth","Health Education","Mental Health Support"],
    ["RN Licensure (NCLEX-RN)","BLS/CPR","ACLS","Specialty certification (ICU, ER, Paediatrics)"],
    [{title:"Care plan portfolio",detail:"Document five complex care plans with outcomes and rationale."},{title:"Quality improvement",detail:"Lead a small QI project (e.g. fall reduction) and report results."},{title:"Community health clinic",detail:"Volunteer 50 hours in screening/education and log competencies."}],
    ["Charge Nurse","Nurse Practitioner","Clinical Nurse Specialist","Nurse Manager"],
    "$55k – $105k","Very strong; global shortage"),
  c("teacher","Teacher / Educator","Education","Plans and delivers instruction that measurably improves student understanding.","Bachelor's in Education or subject area plus teaching credential",
    ["Lesson Planning","Classroom Management","Curriculum Development","Assessment Design","Differentiated Instruction","Student Counseling","Educational Psychology","Communication","Record Keeping","Safeguarding"],
    ["Educational Technology","E-Learning","Instructional Design","Special Education","LMS Administration","Gamification"],
    ["Teaching License / QTS","CELTA / TEFL (for language teaching)","Google Certified Educator","National Board Certification"],
    [{title:"Unit plan + assessment",detail:"Design a full unit with formative assessments and rubrics, then analyse results."},{title:"Blended learning pilot",detail:"Run a hybrid unit and compare outcomes to the traditional cohort."},{title:"Parent engagement system",detail:"Build a communication cadence that raises attendance/homework completion."}],
    ["Head of Department","Curriculum Lead","Principal","EdTech Specialist"],
    "$38k – $75k","Steady demand, especially STEM and special education"),
  c("instructional-designer","Instructional Designer","Education","Designs learning experiences and materials for schools, companies and platforms.","Bachelor's/Master's in Education, Psychology or related",
    ["Instructional Design","Adult Learning Theory","E-Learning","Curriculum Development","Articulate 360","Assessment Design","Multimedia Development","LMS Administration","Storyboarding","Learning Evaluation"],
    ["Figma","Video Editing","HTML","UX Design","Gamification","Data Analysis"],
    ["ATD APLD Certification","Articulate 360 Certification","Quality Matters Certification"],
    [{title:"Full course build",detail:"Design and build a 4-hour course with assessments and completion analytics."},{title:"Needs analysis",detail:"Run a skills-gap analysis and propose a learning intervention with ROI estimate."},{title:"Accessibility retrofit",detail:"Bring existing e-learning to WCAG AA compliance."}],
    ["Senior Instructional Designer","Learning Experience Lead","Head of L&D","EdTech Product Designer"],
    "$55k – $105k","Growing with corporate upskilling"),
  c("civil-engineer","Civil Engineer","Engineering","Plans and oversees infrastructure: structures, transport, water and site works.","Bachelor's in Civil Engineering plus licensure track",
    ["Structural Analysis","AutoCAD","Site Supervision","Surveying","Materials Science","Technical Drawing","Project Management","Safety Compliance","Cost Estimation","Hydraulics"],
    ["Revit","Civil 3D","Finite Element Analysis","GIS Mapping","Lean Construction","BIM"],
    ["FE/EIT then PE License","LEED Green Associate","PMP","OSHA 30"],
    [{title:"Structural design package",detail:"Produce calculations, drawings and a bill of quantities for a small structure."},{title:"Site management plan",detail:"Write a programme, logistics and safety plan for a mock build."},{title:"Cost optimisation",detail:"Compare two design options on cost, carbon and schedule."}],
    ["Project Engineer","Senior Engineer","Project Manager","Technical Director"],
    "$60k – $120k","Stable, driven by infrastructure investment"),
  c("electrical-engineer","Electrical Engineer","Engineering","Designs and tests electrical systems, electronics and control installations.","Bachelor's in Electrical Engineering",
    ["Circuit Design","Electrical Engineering","PLC Programming","Instrumentation","Control Systems","PCB Design","Technical Drawing","Testing & Commissioning","MATLAB","Safety Compliance"],
    ["Embedded Systems","SCADA","AutoCAD Electrical","Renewable Energy","Robotics","Power Systems"],
    ["FE/EIT then PE License","CompTIA Network+ (industrial)","Siemens/Allen-Bradley PLC certifications","IPC Certification"],
    [{title:"Control system build",detail:"Design, program and commission a PLC-based control rig with documented I/O."},{title:"PCB project",detail:"Take a board from schematic to fabricated prototype with test results."},{title:"Energy audit",detail:"Audit a facility and quantify savings from proposed electrical upgrades."}],
    ["Senior Engineer","Automation Lead","Design Authority","Engineering Manager"],
    "$65k – $130k","Strong in energy, automation and hardware"),
  c("mechanical-engineer","Mechanical Engineer","Engineering","Designs mechanical systems and products from concept through manufacture.","Bachelor's in Mechanical Engineering",
    ["CAD","Mechanical Engineering","Thermodynamics","Finite Element Analysis","Materials Science","Prototyping","Manufacturing Processes","Technical Drawing","SolidWorks","Quality Control"],
    ["Mechatronics","3D Modeling","Lean Manufacturing","Robotics","CFD","GD&T"],
    ["FE/EIT then PE License","Certified SolidWorks Professional","Six Sigma Green Belt"],
    [{title:"Design for manufacture",detail:"Redesign a part to cut machining time 30% while meeting tolerances."},{title:"Thermal analysis",detail:"Simulate and validate cooling for an enclosure against measured data."},{title:"Prototype build",detail:"Design, print and test a functional mechanism end-to-end."}],
    ["Senior Design Engineer","Manufacturing Engineer","Engineering Manager","R&D Lead"],
    "$62k – $125k","Stable across automotive, aerospace, energy"),
  c("business-analyst","Business Analyst","Business & Management","Bridges business needs and technical delivery through analysis and specification.","Bachelor's in business/IT",
    ["Business Analysis","Requirements Gathering","Business Process Modeling","Stakeholder Management","SQL","Data Analysis","Documentation","Agile","Jira","UAT Coordination","Critical Thinking"],
    ["Power BI","Python","Scrum","Systems Thinking","Change Management","BPMN"],
    ["CBAP","ECBA / CCBA (IIBA)","Certified ScrumMaster","Microsoft Power BI Data Analyst"],
    [{title:"Process redesign",detail:"Map an as-is process, quantify waste and specify a to-be with savings."},{title:"Requirements pack",detail:"Write a full BRD with user stories, acceptance criteria and traceability matrix."},{title:"Data-driven recommendation",detail:"Analyse operational data to recommend one change with projected impact."}],
    ["Senior BA","Product Owner","Consultant","Head of Business Operations"],
    "$60k – $120k","Strong across transformation programmes"),
  c("hr-specialist","Human Resources Specialist","Business & Management","Manages hiring, employee relations, compensation and development.","Bachelor's in HR, Psychology or Business",
    ["Recruiting","Talent Acquisition","Onboarding","Employee Relations","Compensation & Benefits","HRIS","Employment Law","Performance Reviews","Conflict Mediation","Confidentiality"],
    ["Workforce Planning","Diversity & Inclusion","Training & Development","Data Analysis","Payroll Administration","Coaching"],
    ["SHRM-CP / SHRM-SCP","PHR / SPHR","CIPD Level 3/5","Certified Compensation Professional"],
    [{title:"Hiring funnel analysis",detail:"Analyse time-to-hire and drop-off by stage, then implement one improvement."},{title:"Onboarding redesign",detail:"Build a 30-60-90 onboarding programme and measure 90-day retention."},{title:"Policy handbook",detail:"Draft a compliant handbook covering leave, conduct and remote work."}],
    ["HR Business Partner","Talent Lead","HR Manager","HR Director"],
    "$48k – $100k","Steady; analytics-literate HR in demand"),
  c("sales-executive","Sales Executive","Sales & Customer Success","Builds pipeline, runs discovery and closes deals against quota.","No degree required; results and communication matter most",
    ["B2B Sales","Lead Generation","CRM Management","Negotiation","Objection Handling","Closing Techniques","Pipeline Management","Active Listening","Sales Forecasting","Product Demos"],
    ["Salesforce","HubSpot CRM","LinkedIn Ads","Public Speaking","Market Research","Account Management"],
    ["Salesforce Certified Administrator","HubSpot Sales Software Certification","Sandler Training","MEDDIC certification"],
    [{title:"Outbound playbook",detail:"Write and test sequences for one ICP, reporting reply and meeting rates."},{title:"Pipeline hygiene system",detail:"Implement stage criteria and forecast accuracy reporting in a CRM."},{title:"Full-cycle deal",detail:"Document a real deal from prospecting to signed contract."}],
    ["Account Executive","Sales Manager","Head of Sales","Revenue Leader"],
    "$45k base + commission ($80k–$200k OTE)","Strong; quota-carrying roles always hiring"),
  c("customer-success-manager","Customer Success Manager","Sales & Customer Success","Onboards, retains and expands customers through measurable value delivery.","Bachelor's preferred; support/CS experience valued",
    ["Customer Onboarding","Customer Retention","Zendesk","Communication","CRM Management","Problem Solving","Upselling","Customer Satisfaction","Data Analysis","Empathy"],
    ["Intercom","SQL","Product Knowledge","Conflict Resolution","Project Management","Customer Support"],
    ["HubSpot Customer Success Certification","Gainsight Certification","Zendesk Certification"],
    [{title:"Onboarding programme",detail:"Design a value-milestone onboarding flow and measure time-to-first-value."},{title:"Health scoring",detail:"Build a churn-risk score from usage data and act on the top decile."},{title:"QBR template",detail:"Create a quarterly business review deck with outcome reporting."}],
    ["Senior CSM","CS Team Lead","Head of Customer Success","Account Director"],
    "$55k – $120k","Growing with subscription business models"),
  c("entrepreneur","Founder / Entrepreneur","Entrepreneurship","Identifies problems, builds solutions and grows a sustainable business.","No formal requirement; execution and judgment matter",
    ["Entrepreneurship","Business Development","Financial Literacy","Marketing","Sales","Strategic Planning","Leadership","Problem Solving","Negotiation","Time Management","Customer Discovery"],
    ["Fundraising","Product Strategy","Basic Accounting","Digital Marketing","Public Speaking","Networking"],
    ["Y Combinator / accelerator programmes","Kauffman FastTrak","Google Digital Marketing Certificate"],
    [{title:"Validated MVP",detail:"Get 10 paying customers or 100 active users for a real product."},{title:"Investor deck",detail:"Produce a 12-slide deck backed by traction data and unit economics."},{title:"90-day growth plan",detail:"Set, execute and report against measurable acquisition goals."}],
    ["Full-time founder","Operating partner","Small business owner","Venture/Growth roles"],
    "$0 – unlimited (venture or profit dependent)","High variance, high upside"),
  c("freelance-consultant","Freelance Consultant","Business & Management","Sells and delivers specialist expertise directly to multiple clients.","Domain expertise; degree optional",
    ["Consulting","Client Management","Proposal Writing","Contract Negotiation","Time Management","Business Writing","Marketing","Project Management","Self-Motivation","Freelancing"],
    ["Personal Branding","Financial Literacy","Public Speaking","Networking","Specialist tooling"],
    ["Domain certification (PMP, CPA, AWS, SHRM etc.)","Freelancers Union / IPSE resources"],
    [{title:"Service offer",detail:"Define one productised service with pricing and delivery SLA."},{title:"Case study library",detail:"Write three client case studies with quantified results."},{title:"Pipeline system",detail:"Build a repeatable lead generation and proposal system."}],
    ["Agency founder","Retainer-based consultant","Productised service owner","Fractional executive"],
    "$40 – $250/hour","Growing with remote and contract work"),
  c("environmental-scientist","Environmental Scientist","Science & Research","Assesses environmental impact and designs mitigation and compliance programmes.","Bachelor's/Master's in Environmental Science",
    ["Environmental Impact Assessment","Data Collection","GIS Mapping","Research","Regulatory Compliance","Report Writing","Water Treatment","Waste Management","Field Research","Statistics"],
    ["Remote Sensing","Carbon Accounting","ESG Reporting","Python","Sustainability Strategy","Conservation"],
    ["CEP (Certified Environmental Professional)","LEED Green Associate","IEMA Practitioner","GIS Certification"],
    [{title:"Site assessment",detail:"Complete a Phase I/II style assessment with sampling plan and findings."},{title:"Carbon inventory",detail:"Build a Scope 1–3 emissions inventory for an organisation."},{title:"ESG report",detail:"Draft an ESG disclosure aligned to a recognised framework."}],
    ["Consultant","Sustainability Manager","Policy Advisor","Research Lead"],
    "$50k – $105k","Growing with regulation and ESG reporting"),
  c("logistics-manager","Logistics & Supply Chain Manager","Logistics & Operations","Moves goods efficiently: planning, procurement, warehousing and distribution.","Bachelor's in supply chain/business or operational experience",
    ["Inventory Management","Warehouse Management","Procurement","Supply Chain Management","Transportation Planning","ERP Systems","Demand Planning","Route Optimization","Excel","Vendor Management"],
    ["SAP","Lean Six Sigma","Data Analysis","Customs Compliance","Fleet Management","Negotiation"],
    ["CSCP (APICS)","CLTD (APICS)","Six Sigma Green Belt","ISM CPSM"],
    [{title:"Inventory optimisation",detail:"Reduce stock-outs and carrying cost with a reorder-point model."},{title:"Network redesign",detail:"Model warehouse locations against delivery cost and speed."},{title:"Supplier scorecard",detail:"Build and run a supplier performance system."}],
    ["Supply Chain Manager","Operations Director","Head of Logistics","Procurement Lead"],
    "$60k – $125k","Steady; e-commerce keeps demand high"),
  c("electrician","Electrician (Skilled Trade)","Trades & Technical","Installs, inspects and repairs electrical systems in buildings and industry.","Apprenticeship / vocational certification + licence",
    ["Electrical Wiring","Blueprint Reading","Safety Compliance","Troubleshooting","Equipment Maintenance","Code Compliance","Testing","Conduit Bending","OSHA Standards"],
    ["PLC Programming","Solar Installation","Industrial Automation","Customer Communication","Estimating"],
    ["Journeyman / Master Electrician License","OSHA 10/30","NFPA 70E Training","Solar PV Installer (NABCEP)"],
    [{title:"Residential service upgrade",detail:"Complete a panel upgrade with permits, inspection and documentation."},{title:"Troubleshooting log",detail:"Document 20 fault diagnoses with root cause and fix."},{title:"Solar install",detail:"Assist/lead a residential PV install through commissioning."}],
    ["Journeyman → Master Electrician","Foreman","Electrical Contractor","Inspector"],
    "$45k – $95k","Strong demand; shortage of licensed tradespeople"),
  c("lawyer","Legal Professional","Legal & Compliance","Advises on and litigates legal matters, drafting instruments that protect clients.","Law degree plus bar admission",
    ["Legal Research","Contract Drafting","Legal Writing","Corporate Law","Regulatory Compliance","Negotiation","Case Management","Document Review","Critical Thinking","Oral Advocacy"],
    ["Intellectual Property","Employment Law","Data Protection Law","Due Diligence","Litigation Support","Mediation"],
    ["Bar Admission","LLM specialisation","Mediation certification","Privacy certification (CIPP/E)"],
    [{title:"Contract template library",detail:"Draft a reusable, jurisdiction-aware set of commercial templates."},{title:"Moot / case note",detail:"Write a published-quality case note on a recent judgment."},{title:"Pro bono matter",detail:"Carry one matter end-to-end under supervision."}],
    ["Associate → Senior Associate → Partner","In-house Counsel","General Counsel","Judiciary"],
    "$80k – $250k+","Competitive; specialisation drives premiums"),
  c("content-strategist","Marketing / Brand Manager","Marketing","Owns brand positioning and multi-channel programmes that drive demand.","Bachelor's in marketing/communications or proven campaign leadership",
    ["Brand Strategy","Market Research","Content Marketing","Campaign Management","Data Analysis","Copywriting","Budget Management","Stakeholder Management","Google Analytics","Positioning"],
    ["SEO","Marketing Automation","Public Relations","Social Media Marketing","Pricing Strategy","Design Sense"],
    ["CIM Diploma in Professional Marketing","HubSpot Marketing Software","Google Analytics Certification"],
    [{title:"Brand repositioning",detail:"Research, define and document a new positioning with messaging architecture."},{title:"Integrated campaign",detail:"Plan and execute a campaign across 3 channels with full attribution."},{title:"Competitive landscape",detail:"Produce a quarterly competitive and share-of-voice analysis."}],
    ["Senior Brand Manager","Marketing Director","Head of Growth","CMO track"],
    "$60k – $140k","Strong for brand + performance hybrids"),
  c("research-analyst","Research Analyst","Science & Research","Designs studies, gathers evidence and publishes defensible conclusions.","Bachelor's/Master's in a research discipline",
    ["Quantitative Research","Qualitative Research","Survey Design","Data Analysis","Academic Writing","Literature Review","Statistics","Experimental Design","SPSS","Critical Thinking"],
    ["Python","R","LaTeX","Data Visualization","Grant Writing","Meta-Analysis"],
    ["CITI Research Ethics","SPSS/R certification","Field-specific society memberships"],
    [{title:"Original study",detail:"Design, run and write up a study with a clear methodology section."},{title:"Systematic review",detail:"Complete a PRISMA-style review of 40+ sources."},{title:"Grant application",detail:"Draft a fundable proposal with budget and impact plan."}],
    ["Senior Researcher","Policy Analyst","PhD track","Insight Lead"],
    "$48k – $100k","Steady in academia, policy and industry R&D"),
  c("hotel-manager","Hospitality Manager","Hospitality & Service","Runs guest-facing operations to hit service, occupancy and revenue targets.","Diploma/Bachelor's in hospitality or operational progression",
    ["Hotel Management","Guest Relations","Revenue Management","Team Leadership","Budget Management","Reservation Systems","Food Hygiene","Problem Solving","Customer Service"],
    ["Event Planning","Marketing","Excel","Housekeeping Management","Point of Sale Systems","Conflict Resolution"],
    ["Certified Hotel Administrator (CHA)","Food Safety Manager","Revenue Management Certification (Cornell)"],
    [{title:"Service recovery system",detail:"Implement a complaint-handling standard and lift satisfaction scores."},{title:"Revenue plan",detail:"Build dynamic pricing for one season and report RevPAR impact."},{title:"Staff training programme",detail:"Design and deliver onboarding that cuts ramp time."}],
    ["General Manager","Regional Manager","Operations Director","Owner-operator"],
    "$40k – $95k","Recovering and growing with travel demand"),
  c("agriculture-specialist","Agriculture Specialist","Agriculture & Environment","Improves yield, sustainability and profitability of farming operations.","Diploma/Bachelor's in agriculture or hands-on farm experience",
    ["Crop Management","Soil Science","Irrigation Systems","Sustainable Farming","Livestock Management","Data Collection","Food Safety","Pest Management","Farm Business Planning"],
    ["Precision Agriculture","AgriTech","GIS Mapping","Renewable Energy","Supply Chain Management","Drone Operation"],
    ["Certified Crop Adviser (CCA)","GlobalG.A.P.","Organic certification","Pesticide application licence"],
    [{title:"Yield trial",detail:"Run a controlled comparison of two practices and report yield/cost."},{title:"Irrigation plan",detail:"Design a schedule that cuts water use while maintaining yield."},{title:"Farm business plan",detail:"Produce a 3-year plan with budgets and risk analysis."}],
    ["Farm Manager","Agronomist","Agribusiness Consultant","Operations Director"],
    "$38k – $85k","Stable; agritech and sustainability roles growing"),
  c("public-health-worker","Public Health / Social Services Worker","Public Service","Designs and delivers programmes that improve community health and welfare.","Bachelor's in public health, social work or nursing",
    ["Health Education","Community Outreach","Programme Management","Data Collection","Case Management","Communication","Cultural Competence","Safeguarding","Report Writing","Advocacy"],
    ["Epidemiology","Statistics","Grant Writing","Policy Analysis","Mental Health Support","Monitoring & Evaluation"],
    ["MPH / CHES Certification","Safeguarding Level 2/3","First Aid & Mental Health First Aid"],
    [{title:"Community programme",detail:"Design, run and evaluate a 12-week community health intervention."},{title:"Needs assessment",detail:"Complete a population needs assessment with data sources."},{title:"Policy brief",detail:"Write a two-page evidence-based brief for decision-makers."}],
    ["Programme Manager","Policy Advisor","Head of Community Services","NGO Director"],
    "$42k – $90k","Growing with preventative health investment"),
];

export const CAREER_FAMILIES = Array.from(new Set(CAREERS.map((x) => x.family))).sort();

export function getCareer(id?: string | null): CareerRecord | undefined {
  return CAREERS.find((x) => x.id === id);
}

export const PROFICIENCY_WEIGHT: Record<string, number> = {
  beginner: 0.4,
  intermediate: 0.7,
  advanced: 0.9,
  expert: 1,
};

export const LANG_LEVEL_WEIGHT: Record<string, number> = {
  basic: 0.25,
  conversational: 0.5,
  intermediate: 0.7,
  advanced: 0.9,
  native: 1,
};

export const EDUCATION_RANK: Record<string, number> = {
  "No formal education": 0,
  "Secondary / High school": 1,
  "Vocational / Trade certificate": 2,
  "Associate degree": 3,
  "Bachelor's degree": 4,
  "Postgraduate diploma": 5,
  "Master's degree": 6,
  "Doctorate (PhD)": 7,
};

export const EDUCATION_OPTIONS = Object.keys(EDUCATION_RANK);

export const EMPLOYMENT_OPTIONS = [
  "Student","Unemployed / Seeking work","Employed full-time","Employed part-time","Self-employed / Freelance",
  "Business owner","Intern / Apprentice","Returning to work","Retired","Career changer",
];

export const AGE_RANGES = ["Under 16","16–18","19–22","23–27","28–34","35–44","45–54","55–64","65+","Prefer not to say"];

export const LEARNING_STYLES = ["Video courses","Reading & documentation","Hands-on projects","Live classes / cohorts","Mentorship","Self-paced practice"];

export const INDUSTRIES = [
  "Technology","Healthcare","Finance & Banking","Education","Manufacturing","Retail & E-commerce","Government & Public Sector",
  "Energy & Utilities","Construction & Real Estate","Media & Entertainment","Hospitality & Tourism","Agriculture","Logistics & Transport",
  "Non-profit & NGO","Legal","Telecommunications","Aerospace & Defence","Pharmaceuticals","Automotive","Consulting","Creative & Design",
];

export const INTERESTS = [
  "Building products","Analysing data","Helping people","Design & creativity","Leadership & management","Research & discovery",
  "Sales & growth","Working with my hands","Teaching","Writing & communication","Technology & automation","Business & strategy",
  "Healthcare & wellbeing","Environment & sustainability","Entrepreneurship","Finance & investing",
];

/** Free learning resources referenced by the roadmap engine. */
export const RESOURCE_LIBRARY: Record<string, { name: string; url: string }[]> = {
  default: [
    { name: "Khan Academy", url: "https://www.khanacademy.org" },
    { name: "Coursera (free audit)", url: "https://www.coursera.org" },
    { name: "edX", url: "https://www.edx.org" },
    { name: "MIT OpenCourseWare", url: "https://ocw.mit.edu" },
    { name: "freeCodeCamp", url: "https://www.freecodecamp.org" },
  ],
};
