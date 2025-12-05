
import React, { useState } from 'react';
import { runIRTestSuite, runLiveLLMTestSuite, runBatchComplexityTest, TestResult } from '../services/testSuiteService';
import { Play, Loader2, CheckCircle, AlertTriangle, XCircle, Terminal, Zap, Bug } from 'lucide-react';

const TestSuiteRunner: React.FC = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [isLiveRunning, setIsLiveRunning] = useState(false);
    const [results, setResults] = useState<TestResult[]>([]);
    const [progress, setProgress] = useState('');
    const [debugLogs, setDebugLogs] = useState<{key: string, data: any}[]>([]);

    const runMockTests = async () => {
        if (isLiveRunning) return;
        setIsRunning(true);
        setResults([]);
        setProgress('');
        setDebugLogs([]);
        
        // Simulate async operation for realism
        await new Promise(r => setTimeout(r, 500));
        
        const testResults = await runIRTestSuite();
        setResults(testResults);
        setIsRunning(false);
    };

    const runLiveTests = async () => {
        if (isRunning) return;
        setIsLiveRunning(true);
        setResults([]);
        setDebugLogs([]);
        setProgress('Initializing live session...');

        try {
            const testResults = await runLiveLLMTestSuite((msg) => setProgress(msg));
            setResults(testResults);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLiveRunning(false);
            setProgress('');
        }
    };

    const runF2Test = async () => {
        if (isRunning) return;
        setIsLiveRunning(true);
        setResults([]);
        setDebugLogs([]);
        setProgress('Initializing F2 Batch Stress...');

        try {
            const testResults = await runBatchComplexityTest(
                (msg) => setProgress(msg),
                (key, data) => setDebugLogs(prev => [...prev, {key, data}])
            );
            setResults(testResults);
        } catch (e) {
             console.error(e);
        } finally {
            setIsLiveRunning(false);
            setProgress('');
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'PASS': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'WARN': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'FAIL': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 h-full flex flex-col">
            <div className="bg-slate-900 text-white p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="font-bold flex items-center gap-2">
                            <Terminal className="w-5 h-5" />
                            System Integrity Suite
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">Verify parser logic and LLM pipeline robustness</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <button 
                            onClick={runMockTests}
                            disabled={isRunning || isLiveRunning}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors text-xs"
                        >
                            {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} 
                            Parser Logic (Offline)
                        </button>
                        <button 
                            onClick={runLiveTests}
                            disabled={isRunning || isLiveRunning}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors text-xs"
                        >
                            {isLiveRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} 
                            Live LLM (Full)
                        </button>
                    </div>
                    <button 
                        onClick={runF2Test}
                        disabled={isRunning || isLiveRunning}
                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-3 py-2 rounded font-medium flex items-center justify-center gap-2 transition-colors text-xs"
                    >
                        {isLiveRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bug className="w-3 h-3" />} 
                        Run F2 (Batch Stress Only)
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-0 relative flex flex-col">
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 text-gray-500 font-semibold sticky top-0">
                        <tr>
                            <th className="p-3 w-20">Status</th>
                            <th className="p-3 w-1/3">Test Case</th>
                            <th className="p-3">Result Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {results.map((r, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                                <td className="p-3">
                                    <div className="flex items-center gap-2 font-bold">
                                        {getStatusIcon(r.status)}
                                        <span className={
                                            r.status === 'PASS' ? 'text-green-600' :
                                            r.status === 'WARN' ? 'text-yellow-600' : 'text-red-600'
                                        }>{r.status}</span>
                                    </div>
                                </td>
                                <td className="p-3 font-medium text-gray-800">{r.name}</td>
                                <td className="p-3 text-gray-600 break-words">{r.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Debug Logs Section */}
                {debugLogs.length > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 p-3 mt-auto">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Debug Logs</h4>
                        <div className="space-y-2">
                            {debugLogs.map((log, i) => (
                                <div key={i} className="text-[10px] font-mono bg-white border border-gray-200 p-2 rounded max-h-32 overflow-auto">
                                    <span className="text-blue-600 font-bold block mb-1">{log.key}</span>
                                    <div className="whitespace-pre-wrap text-gray-700">{typeof log.data === 'string' ? log.data : JSON.stringify(log.data)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Live Progress Overlay */}
                {isLiveRunning && (
                    <div className="absolute inset-x-0 bottom-0 bg-indigo-600/90 text-white p-2 text-xs text-center backdrop-blur-sm animate-in slide-in-from-bottom z-10">
                         <div className="flex items-center justify-center gap-2">
                             <Loader2 className="w-3 h-3 animate-spin" />
                             {progress || 'Processing...'}
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSuiteRunner;
