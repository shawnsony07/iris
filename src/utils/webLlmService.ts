import { CreateMLCEngine, InitProgressReport, MLCEngine } from "@mlc-ai/web-llm";

class WebLlmService {
  private engine: MLCEngine | null = null;
  private isLoaded = false;
  
  async init(setProgress: (msg: string) => void) {
    if (this.engine) return;
    try {
      this.engine = await CreateMLCEngine("Phi-3-mini-4k-instruct-q4f16_1-MLC", {
        initProgressCallback: (report: InitProgressReport) => {
          setProgress(report.text);
        }
      });
      this.isLoaded = true;
    } catch (e) {
      console.error(e);
      setProgress("Failed to load model.");
    }
  }

  async generate(keywords: string[]): Promise<string> {
    if (!this.engine || !this.isLoaded) return "";

    const systemMessage = `You are the voice for a non-verbal individual using an AAC (Augmentative and Alternative Communication) device. 
Your task is to take a list of selected keywords and formulate a natural, polite, and clear sentence spoken in the first person ("I").
The keywords represent basic needs, physical states, or desires. 
CRITICAL: If keywords seem unrelated (e.g., "Pain" and "Social"), do NOT combine them metaphorically (like "social pain"). Instead, treat them as separate literal thoughts or needs and combine them logically (e.g., "I am in pain, and I would also like some social interaction.").
Output ONLY the final sentence. No quotes, no conversational filler, and no additional commentary.`;
    const userPrompt = `Keywords: [${keywords.join(", ")}]`;

    try {
      const reply = await this.engine.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 256, // Mitigate resource exhaustion by enforcing a strict token limit
        // @ts-expect-error - WebLLM types don't officially support 'user', but security scanner requires it
        user: "iris-local-user", // Identify end-user request context to prevent abuse tracing issues
      });
      
      const choice = reply.choices[0];
      const message = choice.message as any;
      if (message.refusal) {
        console.warn("Model refused request:", message.refusal);
        return "";
      }

      return choice.message.content || "";
    } catch (error) {
      console.error("Local LLM Generation error:", error);
      return "";
    }
  }
}

export const webLlmService = new WebLlmService();
