
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PersonalityType {
  title: string;
  description: string;
  emoji: string;
  color: string;
  traits: string[];
}

const personalityTypes: PersonalityType[] = [
  {
    title: "The Analytical Strategist",
    description: "You excel at breaking down complex problems and finding logical solutions. Your systematic approach and attention to detail make you a natural problem-solver.",
    emoji: "🧠",
    color: "from-blue-500 to-cyan-500",
    traits: ["analytical", "systematic", "logical", "detail-oriented"]
  },
  {
    title: "The Visionary Leader",
    description: "You inspire others with your big-picture thinking and innovative ideas. Your ability to see possibilities where others see obstacles sets you apart.",
    emoji: "🚀",
    color: "from-purple-500 to-pink-500",
    traits: ["visionary", "inspiring", "innovative", "optimistic"]
  },
  {
    title: "The Collaborative Harmonizer",
    description: "You bring people together and create environments where everyone can thrive. Your empathy and communication skills make you a natural team builder.",
    emoji: "🤝",
    color: "from-green-500 to-teal-500",
    traits: ["collaborative", "empathetic", "diplomatic", "supportive"]
  },
  {
    title: "The Adaptive Innovator",
    description: "You thrive in changing environments and excel at finding creative solutions. Your flexibility and resourcefulness make you invaluable in dynamic situations.",
    emoji: "⚡",
    color: "from-orange-500 to-red-500",
    traits: ["adaptive", "creative", "flexible", "resourceful"]
  }
];

function calculatePersonalityScore(answers: number[]): { personality: PersonalityType; score: number } {
  console.log('Calculating personality for answers:', answers);
  
  // Advanced scoring algorithm based on answer patterns
  const scores = personalityTypes.map(() => 0);
  
  answers.forEach((answer, questionIndex) => {
    // Different questions map to different personality traits
    switch (questionIndex) {
      case 0: // Problem solving approach
        if (answer === 0) scores[0] += 3; // Analytical
        if (answer === 1) scores[0] += 2; // Analytical
        if (answer === 2) scores[3] += 3; // Adaptive
        if (answer === 3) scores[2] += 3; // Collaborative
        break;
      case 1: // Work environment
        if (answer === 0) scores[0] += 3; // Analytical
        if (answer === 1) scores[2] += 3; // Collaborative
        if (answer === 2) scores[3] += 3; // Adaptive
        if (answer === 3) scores[3] += 2; // Adaptive
        break;
      case 2: // Learning style
        if (answer === 0) scores[0] += 3; // Analytical
        if (answer === 1) scores[3] += 3; // Adaptive
        if (answer === 2) scores[2] += 3; // Collaborative
        if (answer === 3) scores[1] += 3; // Visionary
        break;
      case 3: // Leadership approach
        if (answer === 0) scores[0] += 2; // Analytical
        if (answer === 1) scores[1] += 3; // Visionary
        if (answer === 2) scores[2] += 3; // Collaborative
        if (answer === 3) scores[3] += 3; // Adaptive
        break;
      case 4: // Decision making
        if (answer === 0) scores[0] += 3; // Analytical
        if (answer === 1) scores[2] += 3; // Collaborative
        if (answer === 2) scores[3] += 2; // Adaptive
        if (answer === 3) scores[2] += 2; // Collaborative
        break;
      default:
        // For remaining questions, distribute based on answer index
        scores[answer % 4] += 1;
    }
  });
  
  // Find the highest scoring personality type
  const maxScore = Math.max(...scores);
  const personalityIndex = scores.indexOf(maxScore);
  
  // Calculate percentage score (0-100)
  const totalPossibleScore = answers.length * 3;
  const percentageScore = Math.min(100, Math.round((maxScore / totalPossibleScore) * 100) + Math.floor(Math.random() * 20) + 60);
  
  console.log('Scores:', scores, 'Selected:', personalityIndex, 'Score:', percentageScore);
  
  return {
    personality: personalityTypes[personalityIndex],
    score: percentageScore
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const { answers } = await req.json();
    
    if (!answers || !Array.isArray(answers)) {
      throw new Error('Invalid answers provided');
    }

    const result = calculatePersonalityScore(answers);
    
    const response = {
      title: result.personality.title,
      description: result.personality.description,
      emoji: result.personality.emoji,
      color: result.personality.color,
      score: result.score,
      traits: result.personality.traits
    };

    console.log('Personality calculation result:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in calculate-personality function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate personality',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
