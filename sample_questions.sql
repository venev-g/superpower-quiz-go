-- Insert sample questions for Multi Intelligence (Dominant Intelligence)
INSERT INTO questions (category_id, title, subtitle, options, sequence_order, is_active) VALUES
(
  'd37936ca-a151-4b1c-94db-496948513ab7',  -- Dominant Intelligence category
  'How do you prefer to learn new information?',
  'Choose the approach that feels most natural to you.',
  '["By reading and writing detailed notes", "Through hands-on practice and experimentation", "By discussing with others and asking questions", "Through visual aids like diagrams and charts"]',
  1,
  true
),
(
  'd37936ca-a151-4b1c-94db-496948513ab7',
  'When solving a problem, what''s your first instinct?',
  'Think about your natural problem-solving approach.',
  '["Analyze the situation logically step by step", "Try different approaches until something works", "Seek advice from others", "Visualize the problem in your mind"]',
  2,
  true
),
(
  'd37936ca-a151-4b1c-94db-496948513ab7',
  'What type of activities energize you most?',
  'Consider what makes you feel most alive and engaged.',
  '["Solving complex puzzles or math problems", "Building or creating things with your hands", "Leading group discussions or presentations", "Creating art or visual presentations"]',
  3,
  true
);

-- Insert sample questions for Personality Type (Personality Pattern)
INSERT INTO questions (category_id, title, subtitle, options, sequence_order, is_active) VALUES
(
  '42e636ee-0b79-450a-966a-830056fb9875',  -- Personality Pattern category
  'In social situations, you tend to:',
  'How do you naturally behave in groups?',
  '["Take charge and lead the conversation", "Listen carefully and contribute thoughtfully", "Adapt your behavior to fit the group", "Prefer one-on-one conversations"]',
  1,
  true
),
(
  '42e636ee-0b79-450a-966a-830056fb9875',
  'When making decisions, you rely most on:',
  'What guides your decision-making process?',
  '["Logical analysis and facts", "Your gut feelings and intuition", "Input from trusted friends or colleagues", "Past experiences and proven methods"]',
  2,
  true
),
(
  '42e636ee-0b79-450a-966a-830056fb9875',
  'Your ideal work environment would be:',
  'Where do you thrive professionally?',
  '["Fast-paced with new challenges daily", "Structured with clear goals and deadlines", "Collaborative with team interaction", "Quiet with minimal distractions"]',
  3,
  true
);

-- Insert sample questions for Learning Style (VARK)
INSERT INTO questions (category_id, title, subtitle, options, sequence_order, is_active) VALUES
(
  '3a1e7454-01e4-4a7b-bde2-c52c242d1d7d',  -- Learning Style category
  'When learning a new skill, you prefer:',
  'How do you absorb information best?',
  '["Reading detailed instructions and manuals", "Watching demonstrations and tutorials", "Listening to explanations and discussions", "Practicing hands-on with trial and error"]',
  1,
  true
),
(
  '3a1e7454-01e4-4a7b-bde2-c52c242d1d7d',
  'To remember information better, you:',
  'What memory techniques work best for you?',
  '["Write notes and create lists", "Use visual aids like mind maps", "Repeat information out loud", "Create physical associations or movements"]',
  2,
  true
),
(
  '3a1e7454-01e4-4a7b-bde2-c52c242d1d7d',
  'When studying for a test, you would:',
  'What is your preferred study method?',
  '["Read textbooks and highlight key points", "Create diagrams and visual summaries", "Form study groups and discuss topics", "Make flashcards and practice actively"]',
  3,
  true
);
