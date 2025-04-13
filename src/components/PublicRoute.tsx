
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, LockKeyhole, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface PublicRouteProps {
  children: JSX.Element;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  
  // Get the redirect path from the location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  if (isLoading) {
    // Return loading state while authentication status is being checked
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-purple-200 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-purple-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-purple-200 rounded col-span-2"></div>
                <div className="h-2 bg-purple-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-purple-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If already authenticated, redirect to the original requested page or dashboard
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // If not authenticated, render the enhanced access verification page
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simplified Header */}
      <header className="bg-black/95 shadow-md py-3">
        <div className="container mx-auto px-4">
          <a href="https://beed.studio" target="_blank" rel="noopener noreferrer">
            <img 
              src="/lovable-uploads/90fe245b-54ef-4362-85ea-387a90015ebb.png" 
              alt="beedStudio" 
              className="h-8" 
              width="192" 
              height="32"
            />
          </a>
        </div>
      </header>

      {/* Main content with gradient background */}
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
        <div className="w-full max-w-md">
          {/* Animated Card */}
          <div className="bg-black/70 backdrop-blur-lg border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-slideUp">
            {/* Card Header with Purple Accent */}
            <div className="bg-gradient-to-r from-[#9b87f5] to-[#686df3] p-6 text-white">
              <div className="flex items-center space-x-3">
                <LockKeyhole className="h-6 w-6" />
                <h2 className="text-xl font-bold">Acceso Restringido</h2>
              </div>
              <p className="mt-2 text-white/80">Por favor, verifica tu identidad para continuar</p>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-6">
              {/* Welcome Message */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-white">Bienvenido al Sistema</h3>
                <p className="text-gray-300 text-sm">
                  Esta aplicación requiere autenticación para proteger tu información
                </p>
              </div>

              {/* Access Form */}
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="email"
                    placeholder="Ingresa tu correo electrónico"
                    className="pl-10 bg-gray-800/60 border-gray-700 text-white placeholder:text-gray-400 focus:border-purple-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-[#9b87f5] to-[#686df3] hover:from-[#8a76e4] hover:to-[#575ce2] text-white font-medium py-2 flex items-center justify-center gap-2"
                  onClick={() => {}}
                >
                  <span>Verificar Acceso</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Login Options */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-center text-gray-400">
                  ¿Ya tienes una cuenta?{' '}
                  <a href="/login" className="text-[#9b87f5] hover:text-[#686df3] font-medium">
                    Iniciar sesión
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Info Text */}
          <p className="text-center text-gray-400 text-xs mt-6">
            Si necesitas ayuda, contacta al administrador del sistema
          </p>
        </div>
      </main>

      {/* Simplified Footer */}
      <footer className="bg-black/95 py-4 text-center text-gray-400 text-sm">
        <div className="container mx-auto px-4">
          <p>© 2025. All rights reserved. | Proudly ⭐️ Powered by <a href="https://beed.studio" className="text-[#9b87f5] hover:underline">beedStudio</a></p>
        </div>
      </footer>
    </div>
  );
};

export default PublicRoute;
