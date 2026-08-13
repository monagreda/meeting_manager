import { useState } from 'react';

interface AuthModalProps {
    onLoginSuccess: (token: string, user: any) => void;
}

export default function AuthModal({ onLoginSuccess }: AuthModalProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState(''); // 👈 Cambiado de name a username
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 👈 Ahora enviamos `username` en lugar de `name`
        const payload = isRegister
            ? {
                username: username.trim(),
                email: email.trim().toLowerCase(),
                password: password.trim(),
                timezone: userTimezone
            }
            : { email: email.trim().toLowerCase(), password: password.trim(), timezone: userTimezone };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error en las credenciales');
            }

            if (data.token) {
                localStorage.setItem('token', data.token);
                onLoginSuccess(data.token, data.user);
            } else if (isRegister) {
                alert('¡Cuenta creada con éxito! Por favor inicia sesión.');
                setIsRegister(false);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">
                        {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {isRegister
                            ? 'Regístrate para gestionar tu disponibilidad'
                            : 'Ingresa tus credenciales para acceder a Meeting Manager'}
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-300 rounded-xl text-xs text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Nombre de Usuario</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="ej: luismonagreda"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Correo Electrónico</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition cursor-pointer disabled:bg-slate-800 mt-2"
                    >
                        {loading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Entrar'}
                    </button>
                </form>

                <div className="text-center pt-2 border-t border-slate-800/80">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                        }}
                        className="text-xs text-violet-400 hover:underline"
                    >
                        {isRegister
                            ? '¿Ya tienes una cuenta? Inicia sesión aquí'
                            : '¿No tienes cuenta? Regístrate gratis'}
                    </button>
                </div>
            </div>
        </div>
    );
}