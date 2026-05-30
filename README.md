# Project Iris

Project Iris is an advanced, strictly ergonomically-designed, eye-tracking interface built for accessibility and independence. It allows users to control their environment and communicate using only their eyes, leveraging cutting edge on-device AI.

## Key Features

1. **Strict Fitts's Law UI Ergonomics:** The UI features massive dead-zone gaps (80px) and large, easily targetable 120px tall buttons. This eliminates eye-jitter clipping and prevents accidental selections, giving the user safe resting zones.
2. **Context-Aware WebLLM:** Employs an entirely local, in-browser Large Language Model (WebLLM) to intelligently predict the user's intent based on selected nodes and ambient context, operating with extreme speed and preserving complete privacy.
3. **Local AI Voice Synthesis (TinyTTS):** Converts predicted intent to high-quality audio entirely on-device via `onnxruntime-web` WebAssembly logic.
4. **Calibrated Deadzones:** Employs advanced Math mapping directly into the Kalman filter to lock onto the user's exact gaze intention, establishing an unshakeable point of interaction even with a basic webcam.

## Ambient Microphone Requirements

**Explicit Targeting & Browser Requirement:**
The Ambient Microphone feature relies on the native `SpeechRecognition` API. Therefore, this feature **requires Google Chrome or Microsoft Edge** to function. (Edge utilizes Microsoft's Azure backend for the API, which works perfectly). 
If accessed on unsupported browsers, the application will degrade gracefully and present a notification that Chrome or Edge is required.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch Project Iris.
