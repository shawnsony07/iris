# Project Iris 👁️

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![LiveKit](https://img.shields.io/badge/WebRTC-LiveKit-red)](https://livekit.io/)
[![WebLLM](https://img.shields.io/badge/WebLLM-Llama_3.2_1B-blue)](https://webllm.mlc.ai/)
[![Transformers.js](https://img.shields.io/badge/STT-Whisper-green)](https://huggingface.co/docs/transformers.js/index)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceLandmarker-orange)](https://developers.google.com/mediapipe)
[![Python](https://img.shields.io/badge/Python-LiveKit_Agents-yellow)](https://python.org/)

**Project Iris** is a highly-advanced, completely accessible, eye-tracking communication platform (AAC) built for patients with severe neurodegenerative diseases (like ALS). It operates with near-zero latency, running primarily client-side with cutting-edge Local AI, WebRTC telemedicine streaming, and a high-performance Python backend for complex Voice Activity Detection (VAD) and cloud transcription.

Iris features a robust Neobrutalist UI strictly designed around **Fitts's Law** to mitigate gaze jitter, ensuring absolute autonomy without catastrophic misclicks.

---

## ⚙️ Technical Architecture & Topologies

Project Iris utilizes a distributed local-cloud architecture. It heavily leverages client-side processing (WebGPU / WebAssembly) to protect sensitive patient data, falling back to secure cloud pipelines exclusively for doctor telemedicine connections.

### 1. Vision & Gaze Tracking Layer
* **Engine:** MediaPipe FaceLandmarker (via WebAssembly).
* **Processing Topology:** CPU-bound. Offloading the massive facial mesh computation (478 3D landmarks) to the CPU ensures stable frames-per-second (FPS) across low-end integrated graphics, explicitly reserving device VRAM for local LLM inference.
* **Intention Mapping:** Iris projects the exact eye-to-screen intersection vectors. These raw X/Y coordinates are fed continuously into a customized **Kalman Filter** that mathematically smooths out pupil micro-saccades and locks onto UI elements, triggering dwell-click events.

### 2. Telemedicine & WebRTC Streaming Layer
* **Engine:** LiveKit SDK (`livekit-client`, `@livekit/components-react`).
* **Topology:** A dedicated Next.js Serverless API route (`/api/livekit/token`) dynamically signs JWT security tokens, authorizing peer-to-peer WebRTC rooms. 
* **Data Channels:** Instantly transmits exact patient-generated Speech-to-Text (`patient_text`) and Doctor transcriptions (`doctor_transcript`) bi-directionally over an ultra-low latency, reliable WebRTC DataChannel (UDP/TCP fallback), syncing both UI states simultaneously.

### 3. Local AI & Inference Layer
* **Predictive Engine:** `@mlc-ai/web-llm` utilizing raw WebGPU hardware acceleration in the browser.
* **Model Pipeline:** `Llama-3.2-1B-Instruct-q4f16_1-MLC`. The 1.2 Billion parameter quantized Llama model has a microscopic VRAM footprint (~700MB), operating securely inside Chrome's strict WebGPU constraints.
* **Capabilities:** When ambient context is captured, the local LLM predicts exactly 3 logical, first-person responses inside milliseconds, bypassing medical refusal guardrails and providing the patient with zero-typing communication options.

### 4. Dual-Topology Speech-To-Text (STT) Pipelines
To ensure 100% reliable transcriptions, Iris utilizes two concurrent audio-processing topologies:
1. **Local Ambient STT (Patient Side):** 
   * **Engine:** Transformers.js (`@xenova/transformers`) running Xenova's `whisper-tiny.en`.
   * **Implementation:** Operates in an isolated Web Worker (`stt.worker.js`) via an `AudioContext` ScriptProcessor, converting float32 PCM audio to WebAssembly tensors. It runs purely on the local browser for absolute privacy during daily patient use.
2. **Cloud Telemedicine STT:**
   * **Engine:** LiveKit Agents Python SDK.
   * **Implementation:** The `worker/agent.py` script continuously monitors the WebRTC room. It implements **Silero VAD** for frame-perfect Voice Activity Detection and **Deepgram STT** via the LiveKit plugin. This ensures maximum transcription accuracy for the doctor over noisy network conditions.

### 5. Text-To-Speech (TTS):
   * **Engine:** `onnxruntime-web` running `tinytts.onnx`.
   * **Implementation:** To bypass the browser's native `window.speechSynthesis` API (which often relies on cloud connections and suffers from robotic voices), Iris generates high-quality audio locally via a dedicated Web Worker (`tts.worker.ts`). This guarantees offline availability and consistent vocal latency across all platforms.

### 6. UI / UX Engineering
* **Neobrutalism:** High-contrast, stark \#FDF1D0 backgrounds with intense \#000000 block borders mitigate glare and maximize visual clarity for patients experiencing vision degradation.
* **Ergonomics (Fitts's Law Compliance):** Enormous interactive blocks separated by calculated 80px dead-zones completely eliminate unintentional dwell-triggers.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **Python:** v3.9 or higher (Required for LiveKit STT Agent)
* **Browser:** Google Chrome or Microsoft Edge (Required for WebGPU and WebRTC functionality).

### Installation & Automation

1. **Clone & Install Dependencies**
   ```bash
   npm install
   cd worker
   pip install -r requirements.txt
   cd ..
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory AND a `.env` file in the `/worker` directory:
   ```env
   # LiveKit Credentials (Required for Telemedicine & STT)
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret

   # Deepgram API Key (Inside /worker/.env)
   DEEPGRAM_API_KEY=your_deepgram_key
   ```

3. **Automated Bootstrapping**
   We utilize local `.bat` scripts to effortlessly orchestrate the Next.js frontend, Python LiveKit Agent, and port conflicts in one click.
   
   **Start the Platform:**
   ```bash
   ./start.bat
   ```
   *This automatically frees port 3000, starts Next.js, boots the Python agent (`worker/agent.py`), and opens the Patient and Doctor portals.*

   **Stop the Platform:**
   ```bash
   ./end.bat
   ```
   *This gracefully terminates the Node processes and Python background agents.*

---

## 🛠️ Tech Stack & Dependencies
* **Frontend Framework:** Next.js 14 (App Router), React 18
* **Language:** TypeScript, Python 3
* **State Management:** Zustand (Global Client-Side State)
* **WebRTC & Realtime:** LiveKit Server SDK, LiveKit React Components, LiveKit Python Agents
* **Machine Learning & AI:** 
  * WebLLM (Llama 3.2 1B via WebGPU)
  * Transformers.js (Whisper Tiny via WASM)
  * MediaPipe (FaceLandmarker via WASM)
  * Deepgram & Silero VAD (Python)
* **Styling:** Tailwind CSS, Framer Motion
