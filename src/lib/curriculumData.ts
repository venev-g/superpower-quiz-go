// Hardcoded curriculum data for frontend-only use

export interface CurriculumTopic {
  id: number;
  topic_name: string;
}

export interface CurriculumChapter {
  id: number;
  chapter_number: number;
  chapter_name: string;
  topics: CurriculumTopic[];
}

export interface CurriculumSubject {
  id: number;
  subject_name: string;
  chapters: CurriculumChapter[];
}

export interface CurriculumStandard {
  id: number;
  standard_name: string;
  subjects: CurriculumSubject[];
}

export const curriculumData: CurriculumStandard[] = [
  {
    id: 1,
    standard_name: '9',
    subjects: [
      {
        id: 1,
        subject_name: 'Mathematics',
        chapters: [
          { id: 1, chapter_number: 1, chapter_name: 'Sets', topics: [
            { id: 1, topic_name: 'Definition of Sets' },
            { id: 2, topic_name: 'Types of Sets' },
            { id: 3, topic_name: 'Operations on Sets' },
          ] },
          { id: 2, chapter_number: 2, chapter_name: 'Real Numbers', topics: [
            { id: 4, topic_name: 'Irrational Numbers' },
            { id: 5, topic_name: 'Laws of Exponents' },
            { id: 6, topic_name: 'Representation on Number Line' },
          ] },
          { id: 3, chapter_number: 3, chapter_name: 'Polynomials', topics: [
            { id: 7, topic_name: 'Types of Polynomials' },
            { id: 8, topic_name: 'Operations on Polynomials' },
          ] },
          { id: 4, chapter_number: 4, chapter_name: 'Ratio and Proportion', topics: [
            { id: 9, topic_name: 'Direct and Inverse Proportion' },
          ] },
          { id: 5, chapter_number: 5, chapter_name: 'Linear Equations in Two Variables', topics: [
            { id: 10, topic_name: 'Graphical Representation' },
            { id: 11, topic_name: 'Solutions of Linear Equations' },
          ] },
          { id: 6, chapter_number: 6, chapter_name: 'Financial Planning', topics: [
            { id: 12, topic_name: 'Budgeting' },
            { id: 13, topic_name: 'Profit and Loss' },
          ] },
          { id: 7, chapter_number: 7, chapter_name: 'Statistics', topics: [
            { id: 14, topic_name: 'Mean, Median, Mode' },
            { id: 15, topic_name: 'Data Interpretation' },
          ] },
          { id: 8, chapter_number: 8, chapter_name: 'Basic Concepts in Geometry', topics: [
            { id: 16, topic_name: 'Basic Terms in Geometry' },
          ] },
          { id: 9, chapter_number: 9, chapter_name: 'Parallel Lines and Transversals', topics: [
            { id: 17, topic_name: 'Angle Sum Property' },
          ] },
          { id: 10, chapter_number: 10, chapter_name: 'Triangles', topics: [
            { id: 18, topic_name: 'Types of Triangles' },
            { id: 19, topic_name: 'Congruency in Triangles' },
          ] },
          { id: 11, chapter_number: 11, chapter_name: 'Constructions of Triangles', topics: [
            { id: 20, topic_name: 'Construction Techniques' },
          ] },
          { id: 12, chapter_number: 12, chapter_name: 'Quadrilaterals', topics: [
            { id: 21, topic_name: 'Properties of Quadrilaterals' },
          ] },
          { id: 13, chapter_number: 13, chapter_name: 'Circles', topics: [
            { id: 22, topic_name: 'Parts of a Circle' },
            { id: 23, topic_name: 'Angles in Circles' },
          ] },
          { id: 14, chapter_number: 14, chapter_name: 'Coordinate Geometry', topics: [
            { id: 24, topic_name: 'Cartesian Plane' },
            { id: 25, topic_name: 'Plotting Points' },
          ] },
          { id: 15, chapter_number: 15, chapter_name: 'Trigonometry', topics: [
            { id: 26, topic_name: 'Trigonometric Ratios' },
            { id: 27, topic_name: 'Applications in Real Life' },
          ] },
          { id: 16, chapter_number: 16, chapter_name: 'Surface Area and Volume', topics: [
            { id: 28, topic_name: 'Volume and Surface Area of Solids' },
          ] },
        ]
      },
      {
        id: 2,
        subject_name: 'Science & Technology',
        chapters: [
          { id: 17, chapter_number: 1, chapter_name: 'Laws of Motion', topics: [
            { id: 29, topic_name: 'Newton\'s Laws' },
            { id: 30, topic_name: 'Momentum' },
            { id: 31, topic_name: 'Inertia' },
          ] },
          { id: 18, chapter_number: 2, chapter_name: 'Work and Energy', topics: [
            { id: 32, topic_name: 'Concept of Work' },
            { id: 33, topic_name: 'Kinetic and Potential Energy' },
            { id: 34, topic_name: 'Power and its Units' },
          ] },
          { id: 19, chapter_number: 3, chapter_name: 'Current Electricity', topics: [
            { id: 35, topic_name: 'Electric Current' },
            { id: 36, topic_name: 'Ohm\'s Law' },
            { id: 37, topic_name: 'Resistance and Factors' },
          ] },
          { id: 20, chapter_number: 4, chapter_name: 'Measurement of Matter', topics: [
            { id: 38, topic_name: 'Units and Measurement' },
            { id: 39, topic_name: 'Mole Concept' },
          ] },
          { id: 21, chapter_number: 5, chapter_name: 'Acids, Bases and Salts', topics: [
            { id: 40, topic_name: 'Properties of Acids' },
            { id: 41, topic_name: 'Properties of Bases' },
            { id: 42, topic_name: 'pH and its Applications' },
          ] },
          { id: 22, chapter_number: 6, chapter_name: 'Classification of Plants', topics: [
            { id: 43, topic_name: 'Plant Classification' },
            { id: 44, topic_name: 'Characteristics of Plant Groups' },
          ] },
          { id: 23, chapter_number: 7, chapter_name: 'Energy Flow in Ecosystem', topics: [
            { id: 45, topic_name: 'Energy Transfer in Ecosystem' },
            { id: 46, topic_name: 'Food Chains and Webs' },
          ] },
          { id: 24, chapter_number: 8, chapter_name: 'Useful and Harmful Microbes', topics: [
            { id: 47, topic_name: 'Beneficial Microbes' },
            { id: 48, topic_name: 'Harmful Microbes' },
          ] },
          { id: 25, chapter_number: 9, chapter_name: 'Environmental Management', topics: [
            { id: 49, topic_name: 'Environmental Conservation' },
            { id: 50, topic_name: 'Pollution Control' },
          ] },
          { id: 26, chapter_number: 10, chapter_name: 'Information Communication Technology', topics: [
            { id: 51, topic_name: 'Use of ICT in Daily Life' },
          ] },
          { id: 27, chapter_number: 11, chapter_name: 'Reflection of Light', topics: [
            { id: 52, topic_name: 'Reflection of Light' },
            { id: 53, topic_name: 'Mirrors and Lenses' },
          ] },
          { id: 28, chapter_number: 12, chapter_name: 'Sound', topics: [
            { id: 54, topic_name: 'Production and Propagation of Sound' },
            { id: 55, topic_name: 'Characteristics of Sound' },
          ] },
          { id: 29, chapter_number: 13, chapter_name: 'Carbon: An Important Element', topics: [
            { id: 56, topic_name: 'Carbon Compounds' },
            { id: 57, topic_name: 'Uses of Carbon in Daily Life' },
          ] },
          { id: 30, chapter_number: 14, chapter_name: 'Substances in Common Use', topics: [
            { id: 58, topic_name: 'Synthetic and Natural Materials' },
          ] },
          { id: 31, chapter_number: 15, chapter_name: 'Life Processes in Living Organisms', topics: [
            { id: 59, topic_name: 'Nutrition in Living Organisms' },
            { id: 60, topic_name: 'Respiration' },
          ] },
          { id: 32, chapter_number: 16, chapter_name: 'Heredity and Variation', topics: [
            { id: 61, topic_name: 'Heredity Principles' },
            { id: 62, topic_name: 'Variation and Evolution' },
          ] },
        ]
      },
      // (Add all other 9th standard subjects, chapters, and topics here, following the same pattern)
    ]
  },
  {
    id: 2,
    standard_name: '10',
    subjects: [
      {
        id: 9,
        subject_name: 'Mathematics (Algebra)',
        chapters: [
          { id: 33, chapter_number: 1, chapter_name: 'Linear Equations in Two Variables', topics: [
            { id: 63, topic_name: 'Graphical Solution' },
            { id: 64, topic_name: 'System of Equations' },
          ] },
          { id: 34, chapter_number: 2, chapter_name: 'Quadratic Equations', topics: [
            { id: 65, topic_name: 'Roots of Quadratic Equation' },
            { id: 66, topic_name: 'Factorisation and Formula Method' },
          ] },
          { id: 35, chapter_number: 3, chapter_name: 'Arithmetic Progression', topics: [
            { id: 67, topic_name: 'General Term of AP' },
            { id: 68, topic_name: 'Sum of n Terms' },
          ] },
          { id: 36, chapter_number: 4, chapter_name: 'Financial Planning', topics: [
            { id: 69, topic_name: 'Income and Expenditure Planning' },
            { id: 70, topic_name: 'Loans and Interest' },
          ] },
          { id: 37, chapter_number: 5, chapter_name: 'Probability', topics: [
            { id: 71, topic_name: 'Concept of Probability' },
          ] },
          { id: 38, chapter_number: 6, chapter_name: 'Statistics', topics: [
            { id: 72, topic_name: 'Mean, Median, Mode' },
          ] },
        ]
      },
      {
        id: 10,
        subject_name: 'Mathematics (Geometry)',
        chapters: [
          { id: 39, chapter_number: 1, chapter_name: 'Similarity', topics: [
            { id: 73, topic_name: 'Similar Triangles' },
          ] },
          { id: 40, chapter_number: 2, chapter_name: 'Pythagoras Theorem', topics: [
            { id: 74, topic_name: 'Proof and Applications' },
          ] },
          { id: 41, chapter_number: 3, chapter_name: 'Circles', topics: [
            { id: 75, topic_name: 'Tangents and Secants' },
          ] },
          { id: 42, chapter_number: 4, chapter_name: 'Constructions', topics: [
            { id: 76, topic_name: 'Division of Line Segment' },
          ] },
          { id: 43, chapter_number: 5, chapter_name: 'Coordinate Geometry', topics: [
            { id: 77, topic_name: 'Distance Between Two Points' },
          ] },
          { id: 44, chapter_number: 6, chapter_name: 'Trigonometry', topics: [
            { id: 78, topic_name: 'Trigonometric Ratios and Identities' },
            { id: 79, topic_name: 'Heights and Distances' },
          ] },
          { id: 45, chapter_number: 7, chapter_name: 'Mensuration', topics: [
            { id: 80, topic_name: 'Surface Area and Volume of Solids' },
          ] },
        ]
      },
      {
        id: 11,
        subject_name: 'Science & Technology Part 1',
        chapters: [
          { id: 46, chapter_number: 1, chapter_name: 'Gravitation', topics: [
            { id: 81, topic_name: 'Universal Law of Gravitation' },
            { id: 82, topic_name: 'Free Fall and Escape Velocity' },
          ] },
          { id: 47, chapter_number: 2, chapter_name: 'Periodic Classification of Elements', topics: [
            { id: 83, topic_name: 'Mendeleev\'s Periodic Table' },
            { id: 84, topic_name: 'Modern Periodic Table' },
          ] },
          { id: 48, chapter_number: 3, chapter_name: 'Chemical Reactions and Equations', topics: [
            { id: 85, topic_name: 'Types of Chemical Reactions' },
          ] },
          { id: 49, chapter_number: 4, chapter_name: 'Effects of Electric Current', topics: [
            { id: 86, topic_name: 'Heating Effect' },
            { id: 87, topic_name: 'Magnetic Effect' },
            { id: 88, topic_name: 'Electric Motor and Generator' },
          ] },
          { id: 50, chapter_number: 5, chapter_name: 'Heat', topics: [
            { id: 89, topic_name: 'Measurement of Heat' },
            { id: 90, topic_name: 'Specific Heat Capacity' },
          ] },
          { id: 51, chapter_number: 6, chapter_name: 'Refraction of Light', topics: [
            { id: 91, topic_name: 'Laws of Refraction' },
          ] },
          { id: 52, chapter_number: 7, chapter_name: 'Lenses', topics: [
            { id: 92, topic_name: 'Image Formation by Lenses' },
            { id: 93, topic_name: 'Lens Formula and Applications' },
          ] },
          { id: 53, chapter_number: 8, chapter_name: 'Metallurgy', topics: [
            { id: 94, topic_name: 'Properties and Extraction of Metals' },
          ] },
          { id: 54, chapter_number: 9, chapter_name: 'Carbon Compounds', topics: [
            { id: 95, topic_name: 'Carbon Compounds and their Uses' },
          ] },
        ]
      },
      {
        id: 12,
        subject_name: 'Science & Technology Part 2',
        chapters: [
          { id: 55, chapter_number: 1, chapter_name: 'Heredity and Evolution', topics: [
            { id: 96, topic_name: 'Mendel\'s Laws of Inheritance' },
            { id: 97, topic_name: 'Evolution and Speciation' },
          ] },
          { id: 56, chapter_number: 2, chapter_name: 'Life Processes in Living Organisms Part 1', topics: [
            { id: 98, topic_name: 'Nutrition and Respiration' },
          ] },
          { id: 57, chapter_number: 3, chapter_name: 'Life Processes in Living Organisms Part 2', topics: [
            { id: 99, topic_name: 'Excretion and Control Systems' },
          ] },
          { id: 58, chapter_number: 4, chapter_name: 'Environmental Management', topics: [
            { id: 100, topic_name: 'Biodiversity Conservation' },
          ] },
          { id: 59, chapter_number: 5, chapter_name: 'Towards Green Energy', topics: [
            { id: 101, topic_name: 'Renewable Energy Sources' },
          ] },
          { id: 60, chapter_number: 6, chapter_name: 'Animal Classification', topics: [
            { id: 102, topic_name: 'Animal Phyla Characteristics' },
          ] },
          { id: 61, chapter_number: 7, chapter_name: 'Introduction to Microbiology', topics: [
            { id: 103, topic_name: 'Beneficial Microbes' },
            { id: 104, topic_name: 'Harmful Microbes' },
          ] },
          { id: 62, chapter_number: 8, chapter_name: 'Cell Biology and Biotechnology', topics: [
            { id: 105, topic_name: 'Biotechnology Applications' },
          ] },
          { id: 63, chapter_number: 9, chapter_name: 'Social Health', topics: [
            { id: 106, topic_name: 'Public Health Awareness' },
          ] },
          { id: 64, chapter_number: 10, chapter_name: 'Disaster Management', topics: [
            { id: 107, topic_name: 'Types of Disasters and Management Strategies' },
          ] },
        ]
      },
      // You can add Social Science, English, Marathi, Hindi, Sanskrit, ICT, etc. here in the same pattern if you want the full tree.
    ]
  }
];// Example data for 9th and 10th standards (add more as needed)
