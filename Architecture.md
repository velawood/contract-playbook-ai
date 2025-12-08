# Architecture.md

This document sets out the files for a Contract AI platform. There are three main branches: contract playbook generator, contract playbook editor, and review contract against playbook. [Superdoc](https://github.com/Harbour-Enterprises/SuperDoc), a ProseMirror based platform, is the docx editing and viewing engine used. The entire application runs in the browser (Client-Side) using TypeScript/JavaScript libraries.

It currently relies on the Google GenAI SDK (Gemini 2.0 Flash) for LLM calls. The roadmap will include possibility of using other LLMs. 


# Files

### **Root & Configuration**

-   **index.html**: The main HTML entry point. Loads external libraries (Mammoth, JSZip, Superdoc) via CDN.
    
-   **index.tsx**: The React entry point that mounts App.tsx to the DOM.
    
-   **metadata.json**: Configuration file for permissions (camera/mic) and app description.
    
-   **types.ts**: Defines TypeScript interfaces for the application (e.g., Playbook, AnalysisFinding, RiskLevel).
    
-   **constants.ts**: Contains mock data (MOCK_DOC_CONTENT) and the default SAMPLE_PLAYBOOK.
    

### **Main Application Logic**

-   **App.tsx**: The central controller. Manages state (uploading, analysis, modes) and orchestrates the different views (Editor, Dashboard, Settings).
    

### **Services (Business Logic)**

-   **services/geminiService.ts**: Handles all interactions with the Gemini API (analyzing contracts, generating playbooks, refining rules).
    
-   **services/wordAdapter.ts**: A robust DOCX parser. It reads raw XML from .docx files to extract text, styling, and numbering without needing a backend.
    
-   **services/irParser.ts**: Parses the "Intermediate Representation" (custom tag format) aka "IR", returned by the LLM into structured JavaScript objects. We tell the LLM to output IR, a loosely tagged, largely natural language format, instead of JSON because LLM models are unable to reliably and accurately output large amounts of JSON. 
    
-   **services/classifier.ts**: Logic for matching contract clauses to playbook rules using keywords (and previously embeddings). The use of embeddings is a future feature to map playbooks entries with similar to contract clauses containing similar concepts using cosine similarity. It is currently commented out due to implementation difficulties using a pure JS/TS/JSON model without any persistent databases.
    
-   **services/testSuiteService.ts**: Contains the logic for the system self-tests (parsing checks, LLM stress tests).
    

### **UI Components**

-   **components/FileUpload.tsx**: The drag-and-drop zone for uploading contracts or playbooks.
    
-   **components/RiskCard.tsx**: The sidebar card displaying a specific risk/finding detected by the AI.
    
-   **components/DetailView.tsx**: The right-side panel showing the redline diff and allowing users to Accept/Reject changes.
    
-   **components/DiffViewer.tsx**: A utility component that visualizes text differences (red/green highlights) using diff-match-patch.
    
-   **components/PlaybookEditor.tsx**: A wrapper component for the playbook editing interface.
    
-   **components/PlaybookTable.tsx**: The robust table UI for viewing, editing, and AI-refining playbook rules.
    
-   **components/SettingsModal.tsx**: A simple modal for application settings.
    
-   **components/TestSuiteRunner.tsx**: The UI panel for running the system health tests.
    

### **Superdoc Editor (The Text Editor)**

-   **components/superdoc/SuperdocEditor.tsx**: The main wrapper for the Superdoc editor. Handles document structure, track changes, and rendering. It also contains substantive logic to ensure accurate positional amendments given to it by diff-match-patch. It builds all insertions and deletions into a single ProseMirror transaction (Single Transaction Approach) so that Track Changes position mapping is handled correctly by the editor engine. ProseMirror automatically handles position mapping for chained operations within one transaction.
    
    **Architecture Note:** The editor now uses Superdoc's native `sdBlockId` for block identification instead of custom clause nodes. Metadata (risk levels, status) is stored in React state (in `App.tsx`) rather than in document attributes, keeping the document clean. Visual styling (colored borders, hover states) is applied via CSS classes that are dynamically added to DOM elements based on the React state, using `sdBlockId` to target specific blocks.
    
-   **utils/diff.ts**: A wrapper around the Google diff-match-patch library to calculate word-level differences for Track Changes.
    

`
```
