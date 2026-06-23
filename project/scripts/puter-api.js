/**
 * Puter API Integration for AdCraft
 * Handles AI chat, image generation, and other Puter services
 */

class PuterAPI {
  constructor() {
    this.baseURL = 'https://api.puter.ai/v1';
    this.authToken = process.env.PUTER_AUTH_TOKEN || null;
    this.defaultModel = 'openai/gpt-5.4-nano';
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  setModel(model) {
    this.defaultModel = model;
  }

  async chat(message, conversationId = 'default', options = {}) {
    if (!this.authToken) {
      throw new Error('Puter auth token not set. Set PUTER_AUTH_TOKEN environment variable.');
    }

    const requestBody = {
      model: options.model || this.defaultModel,
      messages: [{ role: 'user', content: message }],
      conversationId,
      stream: options.stream || false,
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Puter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Puter API error:', error);
      throw error;
    }
  }

  async generateImage(prompt, options = {}) {
    if (!this.authToken) {
      throw new Error('Puter auth token not set.');
    }

    const requestBody = {
      model: options.model || 'flux-1.1',
      prompt,
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}/images/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Image generation error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Puter image generation error:', error);
      throw error;
    }
  }

  async ocr(imageUrl, options = {}) {
    if (!this.authToken) {
      throw new Error('Puter auth token not set.');
    }

    const requestBody = {
      imageUrl,
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`OCR error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Puter OCR error:', error);
      throw error;
    }
  }

  async listModels() {
    if (!this.authToken) {
      throw new error('Puter auth token not set.');
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      if (!response.ok) {
        throw new error(`Models error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Puter models error:', error);
      throw error;
    }
  }

  // Helper method for AdCraft-specific use cases
  async explainConcept(lessonContent, concept) {
    const prompt = `
      Given this lesson content: "${lessonContent}"
      Explain the concept: "${concept}"
      Provide a clear, educational explanation suitable for learners with no prior knowledge.
      Include analogies and examples where helpful.
    `;
    
    return await this.chat(prompt, 'lesson_explanation');
  }

  async generateQuiz(lessonContent, numQuestions = 5) {
    const prompt = `
      Generate ${numQuestions} multiple-choice quiz questions from this lesson content:
      "${lessonContent}"
      
      For each question, provide:
      - Question text
      - 4 answer options (A, B, C, D)
      - Correct answer indicator
      - Brief explanation for the correct answer
    `;
    
    return await this.chat(prompt, 'quiz_generation');
  }

  async getContentSuggestion(topic) {
    const prompt = `
      Generate educational content about: "${topic}"
      Make it suitable for teaching beginners.
      Include:
      - Clear definition
      - Real-world examples
      - Key concepts to remember
      - A suggested structure for lesson
    `;
    
    return await this.chat(prompt, 'content_generation');
  }
}

// Singleton instance
const puter = new PuterAPI();

export default puter;
export { PuterAPI };
