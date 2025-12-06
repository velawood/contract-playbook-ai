# Contributing to AI Contract Playbook Reviewer

Welcome to the team! 👋

We’re building a high-performance, client-side legal AI tool that pushes the boundaries of what browser-based applications can do. Because this is a specialized, single-developer project, your contributions—whether they are user-facing features or deep engineering fixes—have an immediate and massive impact.

This guide outlines where we need help the most. We’ve organized tasks into **Features** (what users see) and **Engineering Challenges** (architectural improvements).

---

## 🚀 Features / Enhancements

These are high-impact additions that improve the workflow for legal professionals.

### **Issue 3 — Comment after Tracked Changes**
**Goal:** When the LLM suggests an edit and the user accepts it, we currently apply the redline. We need to attach an external-facing comment explaining *why* the change was made.
*   **Task:** Implement logic to generate comments attached to the modified range.
*   **Detail:** Allow the system to set a specific author name (e.g., "AI Assistant" or "Legal Dept") for these comments so they look professional in Word.

### **Issue 4 — Playbook Embeddings**
**Goal:** Improve the accuracy of clause matching.
*   **Current State:** We use keyword heuristics (`services/classifier.ts`).
*   **Task:** Re-enable and optimize vector embeddings for playbook rules. This allows the system to match a "Limitation of Liability" clause even if the contract calls it "Exclusions of Damages," based on semantic similarity rather than just exact words.

### **Issue 8 — General LLM Chat Window**
**Goal:** Allow interactive dialogue with the document.
*   **Task:** Build a UI (sidebar or modal) where users can ask ad-hoc questions ("Does this contract have a non-solicit?") or instruct the AI to refine a specific finding interactively.

---

## 🛠️ Technical / Engineering Challenges

These are complex tasks involving the core engine, data serialization, and backend architecture.

### **Issue 1 — DOCX Export Stability (High Priority)**
**Goal:** Full-fidelity Word export.
*   **Problem:** Our current export strategy involves "aggressive flattening" of the document structure (converting tables/lists to paragraphs) to prevent the serializer from crashing on custom nodes.
*   **Task:** Design a robust serialization pipeline that creates a valid `.docx` file while preserving complex formatting (tables, nested lists, headers) *and* retaining the Redline/Tracked Changes state.

### **Issue 2 — Multi-Provider LLM Architecture**
**Goal:** Decouple the app from Google Gemini.
*   **Task:** Refactor `services/geminiService.ts` into a provider-agnostic interface.
*   **Future Proofing:** Implement support for OpenAI (GPT-4), Anthropic (Claude 3), or local models (Ollama). Ensure the architecture can handle different API signatures and token limits.

### **Issue 5 — Multi-layer Tracked Changes**
**Goal:** handle documents that already have tracked changes.
*   **Task:** enhance the `SuperdocEditor` and `diff-match-patch` logic to recognize existing redlines. The AI should understand the *final* proposed text, not just the original text, and apply its new edits on top of (or replacing) previous human edits correctly.

### **Issue 6 — Formatting Edge Cases**
**Goal:** Bulletproof document parsing.
*   **Task:** Improve `services/wordAdapter.ts` and the test suite to handle weird DOCX edge cases: floating images, text boxes, multi-column layouts, and nested fields.

### **Issue 7 — Intermediate Representation (IR) for Playbook Generation**
**Goal:** Move away from fragile JSON output.
*   **Current State:** We use a custom IR for *contract review* (`irParser.ts`), but *playbook generation* still relies on the LLM outputting raw JSON, which breaks on long documents.
*   **Task:** Update the playbook generation prompt and parser to use the robust `<<RULE>>...<<END_RULE>>` tag format, significantly improving reliability for large inputs.

---

## 💡 Guidelines & Best Practices

*   **Modularity:** Keep AI logic (`services/geminiService.ts`) separate from UI logic (`components/`).
*   **Type Safety:** We use strict TypeScript. Ensure `types.ts` is updated if you change data models.
*   **Testing:** We rely heavily on `services/testSuiteService.ts`. If you touch the export logic or the parser, **run the tests** (`TestSuiteRunner`) to ensure no regressions.
*   **Editor Core:** The editor (`components/superdoc/`) is complex. Changes here usually require understanding ProseMirror transactions.

## Thank You!

Building a browser-based legal editor is hard. Your help makes it possible to keep this tool fast, private, and powerful. If you have questions, just ask in the issues or pull requests. Happy coding!
