# Project Iris 👁️

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![WebLLM](https://img.shields.io/badge/WebLLM-Llama_3.2_1B-blue)](https://webllm.mlc.ai/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-FaceLandmarker-orange)](https://developers.google.com/mediapipe)
[![Zustand](https://img.shields.io/badge/State-Zustand-yellow)](https://github.com/pmndrs/zustand)
[![Twilio](https://img.shields.io/badge/Integration-Twilio-red)](https://www.twilio.com/)

**Project Iris** is a highly-advanced, deeply accessible, eye-tracking communication platform (AAC) built for independence. Operating completely client-side in the browser, Iris leverages cutting-edge WebGPU-accelerated Large Language Models (LLMs) and advanced mathematical filters to map gaze intention.

It guarantees zero-latency execution, uncompromised user privacy, and an unshakeable Fitts's Law-compliant Neobrutalist UI designed specifically to mitigate gaze jitter.

---

## ⚙️ Technical Architecture

Project Iris runs almost entirely on the client side, removing the need for expensive cloud GPU hosting and ensuring sensitive medical/personal data never leaves the user's local machine.

### 1. Vision & Gaze Tracking Layer
* **Engine:** MediaPipe FaceLandmarker (via WebAssembly).
* **Processing Unit:** CPU-bound. Offloading facial mesh computation to the CPU ensures stable performance across lower-end integrated graphics devices, reserving VRAM explicitly for the LLM.
* **Intention Mapping:** Employs advanced spatial mapping directly fed into a **Kalman filter** to smooth out pupil micro-saccades and lock onto exact target coordinates.

### 2. Local AI & Inference Layer
* **Engine:** `@mlc-ai/web-llm` utilizing WebGPU hardware acceleration.
* **Model:** `Llama-3.2-1B-Instruct-q4f16_1-MLC`. 
* **Implementation Details:** The 1.2 Billion parameter model has a memory footprint of ~700MB, safely operating under Chrome's strict WebGPU VRAM limits without crashing standard hardware. We utilize a strict `requestLock` and global instance cache to prevent React double-initialization leaks during hot-reloads.
* **Capabilities:** Instantly expands raw keyword fragments (e.g., `["Thirsty", "Social"]`) into natural, polite, first-person speech while bypassing strict medical safety refusals.

### 3. Contextual Awareness & Audio
* **Ambient Microphone:** Uses the native `SpeechRecognition` API (requires Chrome/Edge). Iris continuously listens to ambient conversation (e.g., a caregiver asking a question) to intelligently predict 3 logical response blocks in real-time.
* **Speech Synthesis:** Utilizes the Web Speech API / TinyTTS for immediate, local, high-quality audio playback of the generated intent.

### 4. UI / UX Engineering
* **Neobrutalist Design:** High-contrast, sharp black borders, and stark shadows drastically improve visual clarity for visually impaired users.
* **Ergonomics (Fitts's Law):** 120px tall buttons isolated by 80px dead-zone gaps. This architectural layout prevents catastrophic misclicks and provides safe resting zones for the eyes.

### 5. Backend & Integrations
* **Twilio Emergency Lifeline:** A dedicated Next.js Serverless API route (`/api/twilio`) that securely connects to the Twilio SDK. Dwell-clicking the `EMERGENCY` block instantly fires a real-time SMS to a designated caregiver.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **Browser:** Google Chrome or Microsoft Edge (Required for WebGPU and Ambient `SpeechRecognition` API support).

### Installation
1. **Clone and Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory to configure the Twilio SMS lifeline:
   ```env
   # Twilio Account Credentials
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Emergency Contact
   EMERGENCY_CONTACT_NUMBER=+0987654321
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```

4. **Launch**
   Open [http://localhost:3000](http://localhost:3000) in your Chromium-based browser. Grant Camera and Microphone permissions when prompted to initialize the tracking and ambient context engines.

---

## 🛠️ Tech Stack
* **Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **State Management:** Zustand
* **Styling:** Tailwind CSS (Neobrutalism UI Patterns)
* **Machine Learning:** MediaPipe (FaceLandmarker), WebLLM (Llama 3.2 1B)
* **Telephony:** Twilio Node SDK
