import { CreateMLCEngine, InitProgressReport, MLCEngine } from "@mlc-ai/web-llm";
import { useIrisStore } from "@/store/useIrisStore";

class WebLlmService {
  private engine: MLCEngine | null = null;
  private isLoaded = false;
  private requestLock: Promise<void> = Promise.resolve();
  private initPromise: Promise<void> | null = null;
  
  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const previous = this.requestLock;
    let resolveLock!: () => void;
    this.requestLock = new Promise(r => { resolveLock = r; });
    
    try {
      await previous;
      return await task();
    } finally {
      resolveLock();
    }
  }

  async init(setProgress: (msg: string) => void) {
    if (this.engine) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.engine = await CreateMLCEngine("Llama-3.2-1B-Instruct-q4f16_1-MLC", {
          initProgressCallback: (report: InitProgressReport) => {
            setProgress(report.text);
          }
        });
        this.isLoaded = true;
      } catch (e) {
        console.error(e);
        setProgress("Failed to load model.");
      }
    })();

    return this.initPromise;
  }

  async generate(keywords: string[]): Promise<string> {
    if (!this.engine || !this.isLoaded) return "";

    const activeTone = useIrisStore.getState().activeTone;
    const toneInstruction = activeTone ? `\nWrite the final sentence using a ${activeTone} tone.` : "";

    const systemMessage = `You are the voice for a non-verbal individual using an AAC (Augmentative and Alternative Communication) device. 
Your task is to take a list of selected keywords and formulate a natural, polite, and clear sentence spoken in the first person ("I").
The keywords represent basic needs, physical states, or desires. 
CRITICAL: If keywords seem unrelated (e.g., "Pain" and "Social"), do NOT combine them metaphorically (like "social pain"). Instead, treat them as separate literal thoughts or needs and combine them logically (e.g., "I am in pain, and I would also like some social interaction.").
Output ONLY the final sentence. No quotes, no conversational filler, and no additional commentary.${toneInstruction}`;
    const userPrompt = `Keywords: [${keywords.join(", ")}]`;

    try {
      const reply = await this.enqueue(() => this.engine!.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 256, // Mitigate resource exhaustion by enforcing a strict token limit
      }));
      
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

  async predictNextWords(selectedNodes: string[]): Promise<void> {
    if (!this.engine || !this.isLoaded || selectedNodes.length === 0) return;

    useIrisStore.getState().setIsPredicting(true);

    const systemMessage = `You are a predictive text engine for an AAC device. Predict the next 3 most logical single-word concepts the user might want to say based on their selections. Output ONLY a comma-separated list of exactly 3 words. No pleasantries, no markdown.`;
    const userMessage = `Selected concepts: ${selectedNodes.join(", ")}`;
    
    try {
      const reply = await this.enqueue(() => this.engine!.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        max_tokens: 15, // Extremely low limit for speed
      }));

      const content = reply.choices[0]?.message?.content || "";
      const parsedArray = content.split(",").map(w => w.trim()).filter(w => w.length > 0).slice(0, 3);
      
      useIrisStore.getState().setPredictions(parsedArray);
    } catch (error) {
      console.error("Local LLM Prediction error:", error);
    } finally {
      useIrisStore.getState().setIsPredicting(false);
    }
  }
  async predictFromAmbientContext(ambientContext: string): Promise<void> {
    if (!this.engine || !this.isLoaded || !ambientContext) return;

    useIrisStore.getState().setIsPredicting(true);

    const systemMessage = `You are an AAC predictive UI. The caregiver just asked the patient: '${ambientContext}'.
Provide exactly 3 short, distinct responses the patient might want to give.
Rules:
1. ONLY output a comma-separated list of 3 items.
2. NO conversational filler, NO intro text, NO markdown.
Example output: Yes, No, I don't know`;
    const userMessage = "Output the 3 comma-separated options now.";

    try {
      const reply = await this.enqueue(() => this.engine!.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        max_tokens: 25,
      }));

      let content = reply.choices[0]?.message?.content || "";
      // Strip common LLM conversational filler prefixes
      content = content.replace(/^.*?:\s*/, "");
      content = content.replace(/["'\n\r]/g, "");
      
      const parsedArray = content.split(",").map(w => w.trim()).filter(w => w.length > 0).slice(0, 3);
      
      if (parsedArray.length > 0) {
        useIrisStore.getState().setPredictions(parsedArray);
        useIrisStore.getState().setIsContextResponse(true);
      }
    } catch (error) {
      console.error("Local LLM Context Prediction error:", error);
    } finally {
      useIrisStore.getState().setIsPredicting(false);
    }
  }

  async filterNodesByContext(ambientContext: string, availableNodes: string[]): Promise<void> {
    if (!this.engine || !this.isLoaded || !ambientContext || availableNodes.length === 0) return;

    const systemMessage = `You are a logical filtering engine for an AAC interface. The user is a non-verbal patient. The caregiver has just spoken: '${ambientContext}'. 
Your task is to identify which of the following pre-defined concepts are logically relevant or useful for the patient to respond with. 
Available concepts: [${availableNodes.join(", ")}]. 
Output ONLY a comma-separated list of the relevant concepts from the available list. If none are relevant, output nothing. Do not use quotes, explanation, or conversational filler.`;
    const userMessage = "Output the relevant concepts.";

    try {
      const reply = await this.enqueue(() => this.engine!.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        max_tokens: 50,
      }));

      const content = reply.choices[0]?.message?.content || "";
      const parsedArray = content.split(",")
        .map(w => w.trim())
        .filter(w => availableNodes.includes(w));
      
      if (parsedArray.length > 0) {
        useIrisStore.getState().setActiveContextNodeIds(parsedArray);
      } else {
        useIrisStore.getState().setActiveContextNodeIds(null);
      }
    } catch (error) {
      console.error("Local LLM Context Filtering error:", error);
      useIrisStore.getState().setActiveContextNodeIds(null);
    }
  }
}

const globalForWebLlm = globalThis as unknown as {
  webLlmService: WebLlmService | undefined;
};

export const webLlmService = globalForWebLlm.webLlmService ?? new WebLlmService();

if (process.env.NODE_ENV !== "production") {
  globalForWebLlm.webLlmService = webLlmService;
}
