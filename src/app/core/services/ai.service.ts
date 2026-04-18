import { Injectable, inject } from '@angular/core';
import { AI, getGenerativeModel } from '@angular/fire/ai';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private ai = inject(AI);
  private model = getGenerativeModel(this.ai, { model: 'gemini-1.5-flash' });

  async generateMatchReasoning(userName: string, partnerName: string, commonInterests: string[]): Promise<string> {
    const prompt = `
      You are an AI networking agent for the "Fluent" event platform. 
      Professional 1: ${userName}
      Professional 2: ${partnerName}
      Common Interests: ${commonInterests.join(', ')}
      
      Generate a short, compelling one-sentence explanation for why they should connect. 
      Focus on technical synergy and project potential.
      Keep it under 100 characters.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
       console.error('AI Match Generation Error:', error);
       return `Connect with ${partnerName} to discuss ${commonInterests[0]} and collaboration.`;
    }
  }

  async getSensoryAdvice(location: string, noiseLevel: number): Promise<string> {
     const prompt = `
       Location: ${location}
       Noise Level: ${noiseLevel}/100
       
       Give a one-sentence empathetic advice for someone with sensory sensitivities about this location.
       Be concise.
     `;
     
     try {
       const result = await this.model.generateContent(prompt);
       const response = await result.response;
       return response.text().trim();
     } catch (error) {
       return noiseLevel > 70 ? 'This area is quite lively. Consider a quiet retreat if you feel overwhelmed.' : 'This area is relatively calm.';
     }
  }
}
