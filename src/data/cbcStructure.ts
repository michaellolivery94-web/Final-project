export interface CBCTopic {
  name: string;
  description?: string;
}

export interface CBCSubject {
  [key: string]: CBCTopic[];
}

export interface CBCStructure {
  [grade: string]: CBCSubject;
}

export const cbcStructure: CBCStructure = {
  "Grade 1": {
    "Literacy Activities": [
      { name: "Letter recognition", description: "Identifying and naming letters A-Z" },
      { name: "Simple sentences", description: "Reading and writing basic sentences" },
      { name: "Story listening", description: "Understanding simple stories" },
      { name: "Phonics basics", description: "Learning letter sounds" },
    ],
    "Mathematical Activities": [
      { name: "Counting 1-100", description: "Number recognition and counting" },
      { name: "Basic shapes", description: "Identifying circles, squares, triangles" },
      { name: "Simple patterns", description: "Creating and completing patterns" },
      { name: "Addition basics", description: "Adding numbers up to 10" },
    ],
    "Environmental Activities": [
      { name: "My home", description: "Understanding family and home environment" },
      { name: "Living things", description: "Plants and animals around us" },
      { name: "Weather", description: "Sunny, rainy, cloudy days" },
    ],
  },

  "Grade 2": {
    "Literacy Activities": [
      { name: "Reading comprehension", description: "Understanding short stories" },
      { name: "Creative writing", description: "Writing simple compositions" },
      { name: "Vocabulary building", description: "Learning new words daily" },
      { name: "Grammar basics", description: "Nouns and verbs" },
    ],
    "Mathematical Activities": [
      { name: "Addition & Subtraction", description: "Operations up to 99" },
      { name: "Measurement", description: "Length, weight, capacity" },
      { name: "Time telling", description: "Reading clocks" },
      { name: "Money basics", description: "Kenyan coins and notes" },
    ],
    "Environmental Activities": [
      { name: "Our community", description: "Community helpers and places" },
      { name: "Plants & animals", description: "Classification basics" },
      { name: "Safety", description: "Road safety and personal safety" },
    ],
  },

  "Grade 3": {
    "English": [
      { name: "Reading fluency", description: "Reading aloud with expression" },
      { name: "Writing compositions", description: "Paragraphs and stories" },
      { name: "Grammar", description: "Tenses and sentence structure" },
      { name: "Oral literature", description: "Riddles, proverbs, songs" },
    ],
    "Kiswahili": [
      { name: "Kusoma na kuelewa", description: "Reading comprehension in Kiswahili" },
      { name: "Kuandika insha", description: "Writing compositions" },
      { name: "Sarufi", description: "Basic grammar" },
      { name: "Mazungumzo", description: "Conversations" },
    ],
    "Mathematics": [
      { name: "Multiplication", description: "Times tables 1-12" },
      { name: "Division", description: "Basic division facts" },
      { name: "Fractions", description: "Halves, quarters, thirds" },
      { name: "Geometry", description: "2D and 3D shapes" },
    ],
    "Science & Technology": [
      { name: "Matter", description: "Solids, liquids, gases" },
      { name: "Energy", description: "Forms of energy" },
      { name: "Human body", description: "Body systems basics" },
    ],
    "Social Studies": [
      { name: "Our county", description: "Geography and features" },
      { name: "History", description: "Early communities in Kenya" },
      { name: "Citizenship", description: "Rights and responsibilities" },
    ],
  },

  "Grade 4": {
    "English": [
      { name: "Advanced reading", description: "Longer texts and comprehension" },
      { name: "Essay writing", description: "Structured compositions" },
      { name: "Grammar mastery", description: "Parts of speech" },
      { name: "Vocabulary expansion", description: "Synonyms, antonyms, homophones" },
    ],
    "Kiswahili": [
      { name: "Usomaji", description: "Advanced reading skills" },
      { name: "Uandishi", description: "Letter and essay writing" },
      { name: "Sarufi ya kina", description: "Advanced grammar" },
    ],
    "Mathematics": [
      { name: "Large numbers", description: "Operations up to millions" },
      { name: "Decimal fractions", description: "Introduction to decimals" },
      { name: "Perimeter & area", description: "Measuring shapes" },
      { name: "Data handling", description: "Graphs and charts" },
    ],
    "Science & Technology": [
      { name: "Plants", description: "Parts and functions" },
      { name: "Animals", description: "Classification and habitats" },
      { name: "Simple machines", description: "Levers, pulleys, wheels" },
    ],
    "Social Studies": [
      { name: "Kenya's regions", description: "Geographic features" },
      { name: "Economic activities", description: "Farming, trade, industry" },
    ],
  },

  "Grade 5": {
    "English": [
      { name: "Critical reading", description: "Analysis and inference" },
      { name: "Persuasive writing", description: "Arguments and opinions" },
      { name: "Grammar complexity", description: "Active/passive voice, clauses" },
      { name: "Poetry", description: "Understanding and writing poems" },
    ],
    "Kiswahili": [
      { name: "Fasihi simulizi", description: "Oral literature" },
      { name: "Uandishi wa kazi", description: "Functional writing" },
      { name: "Methali na milio", description: "Proverbs and sayings" },
    ],
    "Mathematics": [
      { name: "Percentages", description: "Finding percentages of amounts" },
      { name: "Ratio & proportion", description: "Comparing quantities" },
      { name: "Volume", description: "Calculating volume of solids" },
      { name: "Angles", description: "Types and measurement" },
    ],
    "Integrated Science": [
      { name: "Forces & motion", description: "Newton's laws basics" },
      { name: "Energy forms", description: "Light, sound, heat" },
      { name: "Electricity", description: "Simple circuits" },
      { name: "Reproduction", description: "Plant and animal reproduction" },
    ],
    "Social Studies": [
      { name: "East Africa", description: "Geography and history" },
      { name: "Trade", description: "International trade basics" },
      { name: "Government", description: "National governance structure" },
    ],
  },

  "Grade 6": {
    "English": [
      { name: "Literature study", description: "Novels and plays" },
      { name: "Debate & speech", description: "Oral presentations" },
      { name: "Advanced grammar", description: "Complex sentences" },
      { name: "Research skills", description: "Finding and citing sources" },
    ],
    "Kiswahili": [
      { name: "Utungaji", description: "Creative composition" },
      { name: "Uchunguzi wa lugha", description: "Language investigation" },
      { name: "Hadithi na riwaya", description: "Stories and novels" },
    ],
    "Mathematics": [
      { name: "Algebraic expressions", description: "Introduction to algebra" },
      { name: "Equations", description: "Solving simple equations" },
      { name: "Statistics", description: "Mean, median, mode" },
      { name: "Probability", description: "Basic probability concepts" },
    ],
    "Integrated Science": [
      { name: "Chemical reactions", description: "Acids, bases, indicators" },
      { name: "Ecosystems", description: "Food chains and webs" },
      { name: "Space science", description: "Solar system" },
    ],
    "Social Studies": [
      { name: "African history", description: "Pre-colonial Africa" },
      { name: "Constitution", description: "Kenya's constitution" },
      { name: "Maps & coordinates", description: "Using maps effectively" },
    ],
  },

  "Grade 7": {
    "English": [
      { name: "Literary analysis", description: "Themes and symbolism" },
      { name: "Formal writing", description: "Reports and articles" },
      { name: "Public speaking", description: "Presentations and debates" },
      { name: "Media literacy", description: "Understanding media messages" },
    ],
    "Kiswahili": [
      { name: "Fasihi andishi", description: "Written literature" },
      { name: "Utafiti", description: "Research projects" },
      { name: "Uhariri", description: "Editing and proofreading" },
    ],
    "Mathematics": [
      { name: "Linear equations", description: "Solving and graphing" },
      { name: "Inequalities", description: "Working with inequalities" },
      { name: "Coordinate geometry", description: "Plotting points and lines" },
      { name: "Transformations", description: "Reflection, rotation, translation" },
    ],
    "Integrated Science": [
      { name: "Matter & energy", description: "Advanced concepts" },
      { name: "Cell biology", description: "Cell structure and function" },
      { name: "Genetics basics", description: "Inheritance patterns" },
      { name: "Physics principles", description: "Pressure, density, momentum" },
    ],
    "Social Studies": [
      { name: "World geography", description: "Continents and cultures" },
      { name: "Democracy", description: "Democratic principles" },
      { name: "Human rights", description: "Universal human rights" },
    ],
  },

  "Grade 8": {
    "English": [
      { name: "Advanced literature", description: "Complex texts analysis" },
      { name: "Academic writing", description: "Research papers" },
      { name: "Critical thinking", description: "Evaluating arguments" },
      { name: "Digital literacy", description: "Online research and safety" },
    ],
    "Kiswahili": [
      { name: "Fasihi ya Kiswahili", description: "Swahili literature studies" },
      { name: "Uandishi wa kitaalamu", description: "Professional writing" },
      { name: "Taaluma ya lugha", description: "Language scholarship" },
    ],
    "Mathematics": [
      { name: "Quadratic equations", description: "Solving quadratics" },
      { name: "Functions", description: "Linear and quadratic functions" },
      { name: "Trigonometry", description: "Basic ratios and angles" },
      { name: "Mensuration", description: "Surface area and volume" },
    ],
    "Integrated Science": [
      { name: "Chemical bonding", description: "Ionic and covalent bonds" },
      { name: "Evolution", description: "Natural selection" },
      { name: "Energy transfer", description: "Thermodynamics basics" },
      { name: "Electronics", description: "Circuit design" },
    ],
    "Social Studies": [
      { name: "Global economics", description: "Economic systems" },
      { name: "Kenya's development", description: "Vision 2030" },
      { name: "Conflict resolution", description: "Peaceful coexistence" },
    ],
  },

  "Grade 9": {
    "English": [
      { name: "Literature mastery", description: "In-depth textual analysis" },
      { name: "Professional writing", description: "Business communication" },
      { name: "Rhetorical skills", description: "Persuasion and argumentation" },
      { name: "Information literacy", description: "Evaluating sources" },
    ],
    "Kiswahili": [
      { name: "Fasihi simulizi na andishi", description: "Comprehensive literature" },
      { name: "Uchambuzi wa lugha", description: "Language analysis" },
      { name: "Mawasiliano", description: "Advanced communication" },
    ],
    "Mathematics": [
      { name: "Advanced algebra", description: "Simultaneous equations" },
      { name: "Calculus introduction", description: "Basic differentiation" },
      { name: "Sequences & series", description: "Arithmetic and geometric" },
      { name: "Matrices", description: "Matrix operations" },
    ],
    "Integrated Science": [
      { name: "Organic chemistry", description: "Hydrocarbons and compounds" },
      { name: "Genetics", description: "DNA and heredity" },
      { name: "Physics applications", description: "Real-world applications" },
      { name: "Scientific method", description: "Research and experimentation" },
    ],
    "Social Studies": [
      { name: "Globalization", description: "Global interconnections" },
      { name: "Sustainable development", description: "Environmental stewardship" },
      { name: "Career pathways", description: "Future planning" },
    ],
  },
};

export const gradesList = Object.keys(cbcStructure);

export const getSubjectsForGrade = (grade: string): string[] => {
  return Object.keys(cbcStructure[grade] || {});
};

export const getTopicsForSubject = (grade: string, subject: string): CBCTopic[] => {
  return cbcStructure[grade]?.[subject] || [];
};
