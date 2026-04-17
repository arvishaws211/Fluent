# Fluent: End-to-End Event Management PWA

Fluent is a high-performance Progressive Web App (PWA) designed to bridge the gap in physical event experiences. By leveraging Angular 21, Firebase, and Vertex AI, Fluent eliminates logistics friction, enhances attendee engagement, and prioritizes inclusion.

## 🚀 "Consistently Efficient" Performance

To achieve the performance metrics required for a "Staff Engineer" grade project, Fluent implements several architectural optimizations:

1.  **Angular 21 Signals**: Total migration from Zone.js-based change detection to **Signals**. This ensures that only the atomic parts of the DOM that depend on changed data are re-rendered, providing stable load times even under heavy mobile usage.
2.  **Serverless Scaling**: Built for **Google Cloud Run**, the backend scales to zero and spikes instantly during keynote surges, preventing the "Long Queues" often found in legacy event platforms.
3.  **Advanced PWA Caching**: Service Workers are configured to cache the "Check-in to Wayfinding" journey, ensuring critical functionality works even in high-crowd, low-connectivity zones.

## 🛠 Maximum Google Service Adoption

Fluent demonstrates deep integration with the Google Cloud ecosystem:

*   **Firebase**: Auth (Identity), Firestore (Real-time Runbook), and Cloud Functions (SSRL/Logic).
*   **Vertex AI**: Agentic Matchmaking logic that synthesizes attendee interests into actionable networking opportunities.
*   **Google Cloud Vision**: powers the biometric check-in facade for identity verification.
*   **Google Maps Platform**: powers the "Indoor Digital Twin" and "Sensory Mapping" heatmaps.

## 🔒 Security & Privacy (SSI)

We implement a **Self-Sovereign Identity (SSI)** pattern. Instead of storing PII on centralized servers, Fluent verifies identity through verifiable credentials. Attendees maintain control over their data, and only "Proof of Identity" is shared with the event platform.

## 🧘 Accessibility & Inclusion

Fluent features a first-of-its-kind **Sensory Mode**:
*   **IoT Mapping**: Uses real-time crowd and noise data to suggest "Quiet Routes".
*   **Assistive Maturity**: Full ARIA compliance, semantic HTML5, and keyboard-first navigation for neurodiverse and disabled guests.

## 🧪 Comprehensive Testing

*   **Unit Tests**: Robust coverage for Matchmaking and Identity services.
*   **Integration Tests**: Handlers for SSI handshake flows.
*   **E2E Tests**: Scripts covering "Check-in up to Wayfinding" journeys, including "Lost Connectivity" edge cases.

---
*Built for the future of physical events.*
