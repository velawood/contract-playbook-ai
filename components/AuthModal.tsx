
import React, { useState } from 'react';
import { X, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { api, RegisterRequest } from '../services/api';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const formData = new URLSearchParams();
                formData.append('username', email); // OAuth2 standard expects username
                formData.append('password', password);

                await api.login(formData);
                onLoginSuccess();
                onClose();
            } else {
                const req: RegisterRequest = {
                    email,
                    password,
                    full_name: fullName
                };
                await api.register(req);
                // Auto login after register
                const formData = new URLSearchParams();
                formData.append('username', email);
                formData.append('password', password);
                await api.login(formData);

                onLoginSuccess();
                onClose();
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        {mode === 'login' ? <LogIn className="w-5 h-5 text-blue-600" /> : <UserPlus className="w-5 h-5 text-green-600" />}
                        {mode === 'login' ? 'Log In' : 'Create Account'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {mode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2
                            ${loading ? 'bg-gray-400' : mode === 'login' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
                        `}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {mode === 'login' ? 'Log In' : 'Sign Up'}
                    </button>

                    <div className="text-center text-sm text-gray-500 mt-4">
                        {mode === 'login' ? (
                            <>
                                Don't have an account?{' '}
                                <button type="button" onClick={() => setMode('register')} className="text-blue-600 font-medium hover:underline">
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button type="button" onClick={() => setMode('login')} className="text-blue-600 font-medium hover:underline">
                                    Log in
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
