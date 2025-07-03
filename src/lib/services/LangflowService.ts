export interface LangflowResponse {
  result: {
    text: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Session {
  id: string;
  name: string;
  topic: string;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

export class LangflowService {
  private static readonly API_URL = process.env.NEXT_PUBLIC_LANGFLOW_API_URL || "http://127.0.0.1:7860/api/v1/run/4177053d-460a-4d98-b9e8-c6b4d0222f75";
  private static readonly SESSIONS_KEY = 'langflow_sessions';
  private static readonly MESSAGES_KEY = 'langflow_messages';
  private static readonly QUIZ_STATE_KEY = 'langflow_quiz_state';
  private static readonly FIVE_YEAR_OLD_STATE_KEY = 'langflow_five_year_old_state';
  private static readonly QUIZ_MODE_STATE_KEY = 'langflow_quiz_mode_state';
  
  // Get all sessions from localStorage
  static getSessions(): Session[] {
    if (typeof window === 'undefined') return [];
    try {
      const sessions = localStorage.getItem(this.SESSIONS_KEY);
      return sessions ? JSON.parse(sessions).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        lastMessageAt: new Date(s.lastMessageAt)
      })) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  // Save sessions to localStorage
  private static saveSessions(sessions: Session[]): void {
    if (typeof window === 'undefined') {
      console.log('Window is undefined, skipping localStorage save');
      return;
    }
    try {
      console.log('Saving sessions to localStorage:', sessions);
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
      console.log('Sessions successfully saved to localStorage');
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  // Get messages for a specific session
  static getSessionMessages(sessionId: string): any[] {
    if (typeof window === 'undefined') return [];
    try {
      const allMessages = localStorage.getItem(this.MESSAGES_KEY);
      const messages = allMessages ? JSON.parse(allMessages) : {};
      return messages[sessionId] || [];
    } catch (error) {
      console.error('Error loading session messages:', error);
      return [];
    }
  }

  // Save messages for a specific session
  static saveSessionMessages(sessionId: string, messages: any[]): void {
    if (typeof window === 'undefined') return;
    try {
      const allMessages = localStorage.getItem(this.MESSAGES_KEY);
      const messagesObj = allMessages ? JSON.parse(allMessages) : {};
      messagesObj[sessionId] = messages;
      localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messagesObj));
    } catch (error) {
      console.error('Error saving session messages:', error);
    }
  }

  // Add a single message to a session
  static addMessageToSession(sessionId: string, message: any): void {
    if (typeof window === 'undefined') return;
    try {
      const messages = this.getSessionMessages(sessionId);
      messages.push(message);
      this.saveSessionMessages(sessionId, messages);
    } catch (error) {
      console.error('Error adding message to session:', error);
    }
  }

  // Delete messages for a session (when session is deleted)
  static deleteSessionMessages(sessionId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const allMessages = localStorage.getItem(this.MESSAGES_KEY);
      if (allMessages) {
        const messagesObj = JSON.parse(allMessages);
        delete messagesObj[sessionId];
        localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messagesObj));
      }
    } catch (error) {
      console.error('Error deleting session messages:', error);
    }
  }

  // Create a new session
  static createSession(topic: string, name?: string): Session {
    console.log('LangflowService.createSession called with topic:', topic, 'name:', name);
    
    const sessions = this.getSessions();
    console.log('Current sessions:', sessions);
    
    const newSession: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Session ${sessions.length + 1}`,
      topic,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0
    };
    
    console.log('Created new session object:', newSession);
    
    sessions.unshift(newSession); // Add to beginning
    console.log('Updated sessions array:', sessions);
    
    this.saveSessions(sessions);
    console.log('Sessions saved to localStorage');
    
    return newSession;
  }

  // Update session
  static updateSession(sessionId: string, updates: Partial<Session>): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      this.saveSessions(sessions);
    }
  }

  // Delete session
  static deleteSession(sessionId: string): void {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    this.saveSessions(filteredSessions);
    this.deleteSessionMessages(sessionId);
    this.deleteSessionQuizState(sessionId);
    this.deleteSessionFiveYearOldState(sessionId);
    this.deleteSessionQuizModeState(sessionId);
  }

  // Get session by ID
  static getSession(sessionId: string): Session | undefined {
    return this.getSessions().find(s => s.id === sessionId);
  }
  
  static async sendMessage(message: string, sessionId?: string): Promise<string> {
    try {
      // Debug: Log the API URL being used
      console.log('LangflowService: Using API URL:', this.API_URL);
      console.log('LangflowService: Environment variable value:', process.env.NEXT_PUBLIC_LANGFLOW_API_URL);

      const payload = {
        input_value: message,
        output_type: "chat",
        input_type: "chat",
        session_id: sessionId || "default" // Add session ID to payload
      };

      const headers = {
        "Content-Type": "application/json"
      };

      console.log('Sending message to Langflow API:', { url: this.API_URL, payload });

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data: LangflowResponse = await response.json();
      console.log('Langflow API response:', data);
      console.log('Full response data:', JSON.stringify(data, null, 2));
      
      // Update session message count and last message time
      if (sessionId) {
        const session = this.getSession(sessionId);
        if (session) {
          this.updateSession(sessionId, {
            messageCount: session.messageCount + 1,
            lastMessageAt: new Date()
          });
        }
      }
      
      // 0. Try to extract from outputs[0].outputs[0].results.message.data.text
      let responseText = '';
      try {
        if (
          data.outputs &&
          Array.isArray(data.outputs) &&
          data.outputs[0] &&
          data.outputs[0].outputs &&
          Array.isArray(data.outputs[0].outputs) &&
          data.outputs[0].outputs[0] &&
          data.outputs[0].outputs[0].results &&
          data.outputs[0].outputs[0].results.message &&
          data.outputs[0].outputs[0].results.message.data &&
          typeof data.outputs[0].outputs[0].results.message.data.text === 'string'
        ) {
          responseText = data.outputs[0].outputs[0].results.message.data.text;
        }
      } catch (e) {
        // ignore, fallback to other logic
      }
      // If not found, fallback to previous logic
      if (!responseText) {
        // 1. If result.text exists and is a long string, use it
        if (data.result && typeof data.result.text === 'string' && data.result.text.length > 20) {
          responseText = data.result.text;
        }
        // 2. If result.text is an array, join it
        else if (data.result && Array.isArray(data.result.text)) {
          responseText = data.result.text.join('\n');
        }
        // 3. If result is an array, join all text fields
        else if (Array.isArray(data.result)) {
          responseText = data.result.map((item: any) => item.text || JSON.stringify(item)).join('\n');
        }
        // 4. If result is a string
        else if (typeof data.result === 'string') {
          responseText = data.result;
        }
        // 5. If data.text exists
        else if (data.text) {
          responseText = data.text;
        }
        // 6. If data.message exists
        else if (data.message) {
          responseText = data.message;
        }
        // 7. If data.content exists
        else if (data.content) {
          responseText = data.content;
        }
        // 8. If data.output exists
        else if (data.output) {
          responseText = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
        }
        // 9. If data.response exists
        else if (data.response) {
          responseText = typeof data.response === 'string' ? data.response : JSON.stringify(data.response);
        }
        // 10. Fallback: try to find any text field in the response
        else {
          const responseString = JSON.stringify(data);
          console.log('Searching for text in response:', responseString);
          // Look for common text patterns
          const textPatterns = [
            /"text":\s*"([^"]+)"/g,
            /"message":\s*"([^"]+)"/g,
            /"content":\s*"([^"]+)"/g,
            /"output":\s*"([^"]+)"/g,
            /"response":\s*"([^"]+)"/g
          ];
          for (const pattern of textPatterns) {
            const matches = responseString.match(pattern);
            if (matches && matches[1]) {
              responseText = matches[1];
              break;
            }
          }
          // If still no text found, return the full response for debugging
          if (!responseText) {
            console.warn('Could not extract text from response, returning full response for debugging');
            return `[DEBUG] Full response: ${JSON.stringify(data, null, 2)}`;
          }
        }
      }
      // If the extracted text is suspiciously short, show the full response for debugging
      if (responseText.length < 30) {
        return `[DEBUG] Full response: ${JSON.stringify(data, null, 2)}`;
      }
      console.log('Extracted response text:', responseText);
      console.log('Response text length:', responseText.length);
      return responseText;
    } catch (error) {
      console.error("Error calling Langflow API:", error);
      
      // Provide a fallback mock response when API is not available
      console.warn("Langflow API not available, using fallback response");
      return this.getFallbackResponse(message);
    }
  }

  // Fallback response when Langflow API is not available
  private static getFallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Check if it's a mentor request
    if (lowerMessage.includes('learning steps') || lowerMessage.includes('micro-modules') || lowerMessage.includes('curriculum')) {
      return `🎓 **AI Mentor Response (Demo Mode)**

I'll help you create a learning module for your topic! Here's a structured approach:

## 📚 **4-Step Learning Framework**

### 1. **Foundation Building** 
- Start with core concepts and definitions
- Create visual concept maps to connect ideas
- Use analogies and real-world examples

### 2. **Problem-Solving Practice**
- Break down complex problems into smaller parts
- Practice with guided examples
- Build logical thinking skills step by step

### 3. **Visual & Spatial Learning**
- Use diagrams, charts, and spatial representations
- Create mental models and visual frameworks
- Connect abstract concepts to concrete visuals

### 4. **Mastery & Application**
- Challenge-based learning activities
- Real-world application projects
- Assessment and feedback loops

## 🎯 **Implementation Tips**
- Keep each step focused and achievable
- Use multimedia resources (videos, interactive tools)
- Provide immediate feedback and encouragement
- Allow for different learning paces

*Note: This is a demo response. Connect to Langflow API for personalized AI mentoring.*`;
    }
    
    // Handle quick response buttons
    if (lowerMessage.includes('i understand')) {
      return `🎉 **Great! I'm glad you understand! (Demo Mode)**

That's fantastic! Understanding is the first step to mastery. 

## 🚀 **What's Next?**
- **Practice**: Try applying what you learned to a real problem
- **Teach**: Explain it to someone else to reinforce your knowledge
- **Explore**: Dive deeper into related concepts
- **Quiz**: Test your understanding with some practice questions

Would you like to:
- Take a quick quiz to test your knowledge?
- Explore a related topic?
- Get more examples or practice problems?

*Note: This is a demo response. Connect to Langflow API for personalized follow-up.*`;
    }
    
    if (lowerMessage.includes('i want to take quiz')) {
      return `🧠 **Quiz Time! (Demo Mode)**

Excellent choice! Let's test your understanding with some questions.

## 📝 **Sample Quiz Questions:**

### **Question 1:**
What are the four main learning approaches we discussed?
- A) Reading, Writing, Speaking, Listening
- B) Visual maps, Problem-solving, Spatial learning, Mastery challenges
- C) Theory, Practice, Test, Review
- D) Watch, Learn, Do, Forget

### **Question 2:**
Which learning method involves breaking down complex problems?
- A) Visual concept maps
- B) Logical problem-solving
- C) Spatial representations
- D) Mastery-based challenges

### **Question 3:**
What should you do after understanding a concept?
- A) Move to the next topic immediately
- B) Practice and apply your knowledge
- C) Forget about it
- D) Only read about it

**Answers:** 1-B, 2-B, 3-B

## 🎯 **How did you do?**
- **3/3**: Excellent! You've mastered the concepts
- **2/3**: Good! Review the missed question
- **1/3**: Let's review the concepts together

*Note: This is a demo quiz. Connect to Langflow API for personalized assessments.*`;
    }
    
    if (lowerMessage.includes('explain like a 5-year-old')) {
      return `👶 **Super Simple Explanation! (Demo Mode)**

Okay, let me explain this like you're 5 years old! 🌟

## 🎈 **Learning is like building with blocks:**

### **1. Foundation Blocks** 🧱
- Start with the big, easy blocks at the bottom
- These are the basic ideas you need to know first
- Like learning your ABCs before reading books

### **2. Problem-Solving Blocks** 🧩
- When something is too hard, break it into smaller pieces
- Like when you can't eat a whole cookie, you break it into bites
- Take one small step at a time!

### **3. Picture Blocks** 🎨
- Draw pictures in your head to understand things
- Like imagining a story while someone reads to you
- Pictures help you remember better than just words

### **4. Practice Blocks** 🎯
- Keep trying until you get it right
- Like learning to ride a bike - you fall, you get up, you try again
- Practice makes perfect!

## 🌈 **Remember:**
- It's okay to not understand everything right away
- Ask questions when you're confused
- Take breaks when you're tired
- Celebrate when you learn something new!

*Note: This is a demo response. Connect to Langflow API for personalized simple explanations.*`;
    }
    
    // General conversation fallback
    return `🤖 **AI Mentor Response (Demo Mode)**

Thank you for your message! I'm here to help with your learning journey.

## 💡 **How I Can Help You:**
- Break down complex topics into manageable steps
- Create personalized learning paths
- Provide visual and spatial learning strategies
- Design mastery-based challenges
- Offer problem-solving frameworks

## 🚀 **Getting Started:**
Try asking me to help you with:
- "Create a learning module for [your topic]"
- "Break down [concept] into simple steps"
- "Design a visual learning approach for [subject]"

*Note: This is a demo response. Connect to Langflow API for full AI mentoring capabilities.*`;
  }

  static async sendMentorRequest(formData: {
    topic: string;
    objectives: string;
    prerequisites: string;
    standards: string;
  }, sessionId?: string): Promise<string> {
    const prompt = `Suggest 4 simple learning steps for "${formData.topic}".

Learning Objectives: ${formData.objectives}
Prerequisite Knowledge: ${formData.prerequisites}
Curriculum Standards: ${formData.standards}

Keep it concise and easy for a beginner.`;

    try {
      return await this.sendMessage(prompt, sessionId);
    } catch (error) {
      // If the API call fails, provide a specific fallback response for mentor requests
      console.warn("Langflow API not available for mentor request, using fallback response");
      return this.getMentorRequestFallback(formData);
    }
  }

  // Specific fallback for mentor requests
  private static getMentorRequestFallback(formData: {
    topic: string;
    objectives: string;
    prerequisites: string;
    standards: string;
  }): string {
    return `🎓 **AI Mentor Response for "${formData.topic}" (Demo Mode)**

I'll help you create a comprehensive learning module for **${formData.topic}**! Here's a structured approach tailored to your needs:

## 📚 **4-Step Learning Framework**

### 1. **Foundation Building** 
- **Core Concepts**: Start with fundamental principles of ${formData.topic}
- **Visual Mapping**: Create concept maps connecting key ideas
- **Real-world Examples**: Use relatable analogies and applications

### 2. **Problem-Solving Practice**
- **Step-by-step Breakdown**: Decompose complex ${formData.topic} problems
- **Guided Practice**: Work through examples with detailed explanations
- **Logical Thinking**: Build systematic problem-solving approaches

### 3. **Visual & Spatial Learning**
- **Diagrams & Charts**: Visual representations of ${formData.topic} concepts
- **Mental Models**: Create frameworks for understanding relationships
- **Spatial Connections**: Link abstract concepts to concrete visualizations

### 4. **Mastery & Application**
- **Challenge Activities**: Hands-on projects related to ${formData.topic}
- **Real-world Projects**: Apply knowledge to practical scenarios
- **Assessment & Feedback**: Continuous evaluation and improvement

## 🎯 **Learning Objectives Alignment**
${formData.objectives ? `Based on your objectives: ${formData.objectives}` : 'Focus on building a strong foundation and practical skills.'}

## 📋 **Prerequisites Consideration**
${formData.prerequisites ? `Building on: ${formData.prerequisites}` : 'Starting from basic concepts and building up.'}

## 📏 **Standards Integration**
${formData.standards ? `Aligning with: ${formData.standards}` : 'Following best practices for effective learning.'}

## 💡 **Implementation Tips**
- **Pace Yourself**: Take time to master each step before moving forward
- **Use Multiple Resources**: Combine videos, interactive tools, and practice exercises
- **Seek Feedback**: Regular check-ins to ensure understanding
- **Apply Knowledge**: Practice with real-world examples and scenarios

*Note: This is a demo response. Connect to Langflow API for personalized AI mentoring with advanced capabilities.*`;
  }

  // Get quiz state for a specific session
  static getSessionQuizState(sessionId: string): { isQuizActive: boolean, quizQuestionCount: number } {
    if (typeof window === 'undefined') return { isQuizActive: false, quizQuestionCount: 0 };
    try {
      const allQuizState = localStorage.getItem(this.QUIZ_STATE_KEY);
      const quizState = allQuizState ? JSON.parse(allQuizState) : {};
      return quizState[sessionId] || { isQuizActive: false, quizQuestionCount: 0 };
    } catch (error) {
      console.error('Error loading session quiz state:', error);
      return { isQuizActive: false, quizQuestionCount: 0 };
    }
  }

  // Save quiz state for a specific session
  static saveSessionQuizState(sessionId: string, state: { isQuizActive: boolean, quizQuestionCount: number }): void {
    if (typeof window === 'undefined') return;
    try {
      const allQuizState = localStorage.getItem(this.QUIZ_STATE_KEY);
      const quizStateObj = allQuizState ? JSON.parse(allQuizState) : {};
      quizStateObj[sessionId] = state;
      localStorage.setItem(this.QUIZ_STATE_KEY, JSON.stringify(quizStateObj));
    } catch (error) {
      console.error('Error saving session quiz state:', error);
    }
  }

  // Delete quiz state for a session (when session is deleted)
  static deleteSessionQuizState(sessionId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const allQuizState = localStorage.getItem(this.QUIZ_STATE_KEY);
      if (allQuizState) {
        const quizStateObj = JSON.parse(allQuizState);
        delete quizStateObj[sessionId];
        localStorage.setItem(this.QUIZ_STATE_KEY, JSON.stringify(quizStateObj));
      }
    } catch (error) {
      console.error('Error deleting session quiz state:', error);
    }
  }

  // Get five-year-old state for a specific session
  static getSessionFiveYearOldState(sessionId: string): { isFiveYearOldMode: boolean, fiveYearOldStep: 'initial' | 'after_explanation' | 'after_another_example' } {
    if (typeof window === 'undefined') return { isFiveYearOldMode: false, fiveYearOldStep: 'initial' };
    try {
      const allFiveYearOldState = localStorage.getItem(this.FIVE_YEAR_OLD_STATE_KEY);
      const fiveYearOldState = allFiveYearOldState ? JSON.parse(allFiveYearOldState) : {};
      return fiveYearOldState[sessionId] || { isFiveYearOldMode: false, fiveYearOldStep: 'initial' };
    } catch (error) {
      console.error('Error loading session five-year-old state:', error);
      return { isFiveYearOldMode: false, fiveYearOldStep: 'initial' };
    }
  }

  // Save five-year-old state for a specific session
  static saveSessionFiveYearOldState(sessionId: string, state: { isFiveYearOldMode: boolean, fiveYearOldStep: 'initial' | 'after_explanation' | 'after_another_example' }): void {
    if (typeof window === 'undefined') return;
    try {
      const allFiveYearOldState = localStorage.getItem(this.FIVE_YEAR_OLD_STATE_KEY);
      const fiveYearOldStateObj = allFiveYearOldState ? JSON.parse(allFiveYearOldState) : {};
      fiveYearOldStateObj[sessionId] = state;
      localStorage.setItem(this.FIVE_YEAR_OLD_STATE_KEY, JSON.stringify(fiveYearOldStateObj));
    } catch (error) {
      console.error('Error saving session five-year-old state:', error);
    }
  }

  // Delete five-year-old state for a session (when session is deleted)
  static deleteSessionFiveYearOldState(sessionId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const allFiveYearOldState = localStorage.getItem(this.FIVE_YEAR_OLD_STATE_KEY);
      if (allFiveYearOldState) {
        const fiveYearOldStateObj = JSON.parse(allFiveYearOldState);
        delete fiveYearOldStateObj[sessionId];
        localStorage.setItem(this.FIVE_YEAR_OLD_STATE_KEY, JSON.stringify(fiveYearOldStateObj));
      }
    } catch (error) {
      console.error('Error deleting session five-year-old state:', error);
    }
  }

  // Get quiz mode state for a specific session
  static getSessionQuizModeState(sessionId: string): { isQuizMode: boolean, quizResponseCount: number } {
    if (typeof window === 'undefined') return { isQuizMode: false, quizResponseCount: 0 };
    try {
      const allQuizModeState = localStorage.getItem(this.QUIZ_MODE_STATE_KEY);
      const quizModeState = allQuizModeState ? JSON.parse(allQuizModeState) : {};
      return quizModeState[sessionId] || { isQuizMode: false, quizResponseCount: 0 };
    } catch (error) {
      console.error('Error loading session quiz mode state:', error);
      return { isQuizMode: false, quizResponseCount: 0 };
    }
  }

  // Save quiz mode state for a specific session
  static saveSessionQuizModeState(sessionId: string, state: { isQuizMode: boolean, quizResponseCount: number }): void {
    if (typeof window === 'undefined') return;
    try {
      const allQuizModeState = localStorage.getItem(this.QUIZ_MODE_STATE_KEY);
      const quizModeStateObj = allQuizModeState ? JSON.parse(allQuizModeState) : {};
      quizModeStateObj[sessionId] = state;
      localStorage.setItem(this.QUIZ_MODE_STATE_KEY, JSON.stringify(quizModeStateObj));
    } catch (error) {
      console.error('Error saving session quiz mode state:', error);
    }
  }

  // Delete quiz mode state for a session (when session is deleted)
  static deleteSessionQuizModeState(sessionId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const allQuizModeState = localStorage.getItem(this.QUIZ_MODE_STATE_KEY);
      if (allQuizModeState) {
        const quizModeStateObj = JSON.parse(allQuizModeState);
        delete quizModeStateObj[sessionId];
        localStorage.setItem(this.QUIZ_MODE_STATE_KEY, JSON.stringify(quizModeStateObj));
      }
    } catch (error) {
      console.error('Error deleting session quiz mode state:', error);
    }
  }
} 