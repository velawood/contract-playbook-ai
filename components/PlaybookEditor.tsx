
import React, { useState } from 'react';
import { Playbook } from '../types';
import PlaybookTable from './PlaybookTable';
import SettingsModal, { AppSettings } from './SettingsModal';
import { BookOpen, Settings, RotateCcw } from 'lucide-react';

interface PlaybookEditorProps {
    playbook: Playbook;
    onUpdate: (pb: Playbook) => void;
    onRestart: () => void;
    initialSettings: AppSettings;
    onSaveSettings: (s: AppSettings) => void;
    mode: 'edit' | 'generate';
    apiKey?: string;
    onRequestApiKey: () => void;
}

/**
 * A modular workspace for viewing and editing Playbooks.
 * Used by both "Generate Playbook" (after generation) and "Edit Playbook" (standalone) modes.
 */
const PlaybookEditor: React.FC<PlaybookEditorProps> = ({
    playbook, onUpdate, onRestart, initialSettings, onSaveSettings, mode, apiKey, onRequestApiKey
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
            <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 text-lg leading-tight">
                            {mode === 'generate' ? 'Generated Playbook' : 'Playbook Editor'}
                        </h1>
                        <div className="text-xs text-gray-500">
                             {playbook.metadata.name} • {playbook.rules.length} Rules
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" 
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onRestart} 
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" 
                        title={mode === 'generate' ? "Start Over" : "Close Editor"}
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden p-6">
                <PlaybookTable 
                    playbook={playbook} 
                    onUpdate={onUpdate} 
                    apiKey={apiKey}
                    onRequestApiKey={onRequestApiKey}
                />
            </div>
            
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                onSave={onSaveSettings}
                initialSettings={initialSettings}
            />
        </div>
    );
};

export default PlaybookEditor;
