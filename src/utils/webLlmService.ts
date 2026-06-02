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

    // Hardcode bypass for extremely basic single-word affirmations/negations
    // to prevent the 1B model from hallucinating unnecessary context.
    if (keywords.length === 1) {
      const word = keywords[0].toLowerCase();
      if (word === "yes") return "Yes.";
      if (word === "no") return "No.";
    }

    const systemMessage = `Your task is to translate short keywords into a single, natural, first-person spoken sentence ("I").
You are speaking as a human who needs assistance with daily tasks.
RULES:
1. Words like "Toilet", "Thirsty", or "Physical" mean you need help (e.g., "I need to go to the toilet", "I need some water", "Please adjust my position").
2. "Social" means you want to socialize, talk, or have company.
3. If the keyword is a simple greeting or answer like "Yes" or "No", just output that word directly. Do not invent extra requests.
4. Output ONLY the final spoken sentence. No quotes, no intro text, no conversational filler.`;

    const activeTone = useIrisStore.getState().activeTone;
    const toneInstruction = activeTone ? `Please apply a ${activeTone.toUpperCase()} tone to the sentence.` : "";

    const userPrompt = `Keywords: [${keywords.join(", ")}]
    
${toneInstruction}
Write the single sentence now:`;

    let temperature = 0.4; // Default predictable response
    if (activeTone === "Sarcastic") temperature = 0.8;
    else if (activeTone === "Joyful") temperature = 0.7;
    else if (activeTone === "Polite") temperature = 0.5;
    else if (activeTone === "Urgent") temperature = 0.3;

    try {
      const reply = await this.enqueue(() => this.engine!.chat.completions.create({
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 256, // Mitigate resource exhaustion by enforcing a strict token limit
        temperature,
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
      const parsedArray = content.split(/,|\n/)
        .map(w => w.replace(/^\d+\.\s*/, "").replace(/["']/g, "").trim())
        .filter(w => w.length > 0)
        .slice(0, 3);
      
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
      content = content.replace(/["']/g, "");
      
      // Split by commas OR newlines, then clean up numbers (e.g. "1. Yes")
      const parsedArray = content.split(/,|\n/)
        .map(w => w.replace(/^\d+\.\s*/, "").trim())
        .filter(w => w.length > 0)
        .slice(0, 3);
      
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
