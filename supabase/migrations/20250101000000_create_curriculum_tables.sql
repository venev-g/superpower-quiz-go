-- Create curriculum tables for dropdown functionality
-- Migration: 20250101000000_create_curriculum_tables.sql

-- Table: Standards
CREATE TABLE IF NOT EXISTS standards (
    id SERIAL PRIMARY KEY,
    standard_name VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    standard_id INTEGER REFERENCES standards(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(standard_id, subject_name)
);

-- Table: Chapters
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    chapter_number INTEGER,
    chapter_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, chapter_number)
);

-- Table: Topics
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    topic_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chapter_id, topic_name)
);

-- Insert initial data - Only 9th and 10th standards
INSERT INTO standards (standard_name) VALUES 
('9'), 
('10')
ON CONFLICT (standard_name) DO NOTHING;

-- Insert subjects for 9th standard
INSERT INTO subjects (standard_id, subject_name) VALUES 
(1, 'Mathematics'), 
(1, 'Science & Technology'), 
(1, 'Social Science'),
(1, 'English'),
(1, 'Marathi'),
(1, 'Hindi'),
(1, 'Sanskrit'),
(1, 'ICT')
ON CONFLICT (standard_id, subject_name) DO NOTHING;

-- Insert subjects for 10th standard
INSERT INTO subjects (standard_id, subject_name) VALUES 
(2, 'Mathematics (Algebra)'), 
(2, 'Mathematics (Geometry)'), 
(2, 'Science & Technology Part 1'), 
(2, 'Science & Technology Part 2'), 
(2, 'Social Science'),
(2, 'English'),
(2, 'Marathi'),
(2, 'Hindi'),
(2, 'Sanskrit'),
(2, 'ICT')
ON CONFLICT (standard_id, subject_name) DO NOTHING;

-- Insert chapters for 9th Mathematics
INSERT INTO chapters (subject_id, chapter_number, chapter_name) VALUES 
(1, 1, 'Sets'), (1, 2, 'Real Numbers'), (1, 3, 'Polynomials'), (1, 4, 'Ratio and Proportion'), 
(1, 5, 'Linear Equations in Two Variables'), (1, 6, 'Financial Planning'), (1, 7, 'Statistics'), 
(1, 8, 'Basic Concepts in Geometry'), (1, 9, 'Parallel Lines and Transversals'), (1, 10, 'Triangles'), 
(1, 11, 'Constructions of Triangles'), (1, 12, 'Quadrilaterals'), (1, 13, 'Circles'), 
(1, 14, 'Coordinate Geometry'), (1, 15, 'Trigonometry'), (1, 16, 'Surface Area and Volume')
ON CONFLICT (subject_id, chapter_number) DO NOTHING;

-- Insert topics for 9th Mathematics chapters
INSERT INTO topics (chapter_id, topic_name) VALUES 
(1, 'Definition of Sets'), (1, 'Types of Sets'), (1, 'Operations on Sets'),
(2, 'Irrational Numbers'), (2, 'Laws of Exponents'), (2, 'Representation on Number Line'),
(3, 'Types of Polynomials'), (3, 'Operations on Polynomials'),
(4, 'Direct and Inverse Proportion'),
(5, 'Graphical Representation'), (5, 'Solutions of Linear Equations'),
(6, 'Budgeting'), (6, 'Profit and Loss'),
(7, 'Mean, Median, Mode'), (7, 'Data Interpretation'),
(8, 'Basic Terms in Geometry'),
(9, 'Angle Sum Property'),
(10, 'Types of Triangles'), (10, 'Congruency in Triangles'),
(11, 'Construction Techniques'),
(12, 'Properties of Quadrilaterals'),
(13, 'Parts of a Circle'), (13, 'Angles in Circles'),
(14, 'Cartesian Plane'), (14, 'Plotting Points'),
(15, 'Trigonometric Ratios'), (15, 'Applications in Real Life'),
(16, 'Volume and Surface Area of Solids')
ON CONFLICT (chapter_id, topic_name) DO NOTHING;

-- Insert chapters for 9th Science & Technology
INSERT INTO chapters (subject_id, chapter_number, chapter_name) VALUES 
(2, 1, 'Laws of Motion'), (2, 2, 'Work and Energy'), (2, 3, 'Current Electricity'), (2, 4, 'Measurement of Matter'), 
(2, 5, 'Acids, Bases and Salts'), (2, 6, 'Classification of Plants'), (2, 7, 'Energy Flow in Ecosystem'), 
(2, 8, 'Useful and Harmful Microbes'), (2, 9, 'Environmental Management'), (2, 10, 'Information Communication Technology'), 
(2, 11, 'Reflection of Light'), (2, 12, 'Sound'), (2, 13, 'Carbon: An Important Element'), 
(2, 14, 'Substances in Common Use'), (2, 15, 'Life Processes in Living Organisms'), (2, 16, 'Heredity and Variation')
ON CONFLICT (subject_id, chapter_number) DO NOTHING;

-- Insert topics for 9th Science & Technology chapters
INSERT INTO topics (chapter_id, topic_name) VALUES 
(17, 'Newton\'s Laws'), (17, 'Momentum'), (17, 'Inertia'),
(18, 'Concept of Work'), (18, 'Kinetic and Potential Energy'), (18, 'Power and its Units'),
(19, 'Electric Current'), (19, 'Ohm\'s Law'), (19, 'Resistance and Factors'),
(20, 'Units and Measurement'), (20, 'Mole Concept'),
(21, 'Properties of Acids'), (21, 'Properties of Bases'), (21, 'pH and its Applications'),
(22, 'Plant Classification'), (22, 'Characteristics of Plant Groups'),
(23, 'Energy Transfer in Ecosystem'), (23, 'Food Chains and Webs'),
(24, 'Beneficial Microbes'), (24, 'Harmful Microbes'),
(25, 'Environmental Conservation'), (25, 'Pollution Control'),
(26, 'Use of ICT in Daily Life'),
(27, 'Reflection of Light'), (27, 'Mirrors and Lenses'),
(28, 'Production and Propagation of Sound'), (28, 'Characteristics of Sound'),
(29, 'Carbon Compounds'), (29, 'Uses of Carbon in Daily Life'),
(30, 'Synthetic and Natural Materials'),
(31, 'Nutrition in Living Organisms'), (31, 'Respiration'),
(32, 'Heredity Principles'), (32, 'Variation and Evolution')
ON CONFLICT (chapter_id, topic_name) DO NOTHING;

-- Insert chapters for 10th Mathematics (Algebra)
INSERT INTO chapters (subject_id, chapter_number, chapter_name) VALUES 
(9, 1, 'Linear Equations in Two Variables'), (9, 2, 'Quadratic Equations'), (9, 3, 'Arithmetic Progression'), 
(9, 4, 'Financial Planning'), (9, 5, 'Probability'), (9, 6, 'Statistics')
ON CONFLICT (subject_id, chapter_number) DO NOTHING;

-- Insert topics for 10th Mathematics (Algebra)
INSERT INTO topics (chapter_id, topic_name) VALUES 
(33, 'Graphical Solution'), (33, 'System of Equations'),
(34, 'Roots of Quadratic Equation'), (34, 'Factorisation and Formula Method'),
(35, 'General Term of AP'), (35, 'Sum of n Terms'),
(36, 'Income and Expenditure Planning'), (36, 'Loans and Interest'),
(37, 'Concept of Probability'),
(38, 'Mean, Median, Mode')
ON CONFLICT (chapter_id, topic_name) DO NOTHING;

-- Insert chapters for 10th Mathematics (Geometry)
INSERT INTO chapters (subject_id, chapter_number, chapter_name) VALUES 
(10, 1, 'Similarity'), (10, 2, 'Pythagoras Theorem'), (10, 3, 'Circles'), 
(10, 4, 'Constructions'), (10, 5, 'Coordinate Geometry'), (10, 6, 'Trigonometry'), (10, 7, 'Mensuration')
ON CONFLICT (subject_id, chapter_number) DO NOTHING;

-- Insert topics for 10th Mathematics (Geometry)
INSERT INTO topics (chapter_id, topic_name) VALUES 
(39, 'Similar Triangles'),
(40, 'Proof and Applications'),
(41, 'Tangents and Secants'),
(42, 'Division of Line Segment'),
(43, 'Distance Between Two Points'),
(44, 'Trigonometric Ratios and Identities'), (44, 'Heights and Distances'),
(45, 'Surface Area and Volume of Solids')
ON CONFLICT (chapter_id, topic_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_standard_id ON subjects(standard_id);
CREATE INDEX IF NOT EXISTS idx_chapters_subject_id ON chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON topics(chapter_id);

-- Create RLS policies
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access to curriculum data
CREATE POLICY "Allow public read access to standards" ON standards FOR SELECT USING (true);
CREATE POLICY "Allow public read access to subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Allow public read access to topics" ON topics FOR SELECT USING (true); 