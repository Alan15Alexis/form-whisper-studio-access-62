
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Menu, X, ClipboardList, LogIn } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
}

const Layout = ({ children, title, hideNav = false }: LayoutProps) => {
  const { isAuthenticated, logout, isAdmin, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Simplificamos los enlaces de navegación
  const navLinks = [
    // Solo mostramos el enlace de inicio para usuarios no autenticados
    { to: '/', label: 'Home', icon: <Home className="mr-2 h-4 w-4" />, hideForAdmin: false, hideForUser: false },
    // Solo mostramos "Mis Formularios" para usuarios regulares
    { to: '/assigned-forms', label: 'Mis Formularios', icon: <ClipboardList className="mr-2 h-4 w-4" />, authRequired: true, adminOnly: false, userOnly: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {!hideNav && (
        <>
          {/* Desktop Navigation */}
          <header className="border-b shadow-sm bg-white">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center">
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
              
              <div className="hidden md:flex items-center space-x-6">
                {navLinks.map((link) => {
                  // Omitir enlaces según condiciones
                  if (link.authRequired && !isAuthenticated) return null;
                  if (link.adminOnly && !isAdmin) return null;
                  if (link.userOnly && isAdmin) return null;
                  if (link.hideForAdmin && isAdmin) return null;
                  if (link.hideForUser && !isAdmin) return null;

                  return (
                    <Link 
                      key={link.to} 
                      to={link.to}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        isActive(link.to) 
                          ? 'text-[#686df3] font-medium bg-[#686df3]/5' 
                          : 'text-gray-600 hover:text-[#686df3] hover:bg-gray-50'
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  );
                })}

                {isAuthenticated ? (
                  <Button variant="ghost" onClick={handleLogout} className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link to="/login">
                      <Button variant="outline" className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Admin Login
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button>Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button 
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-[#686df3] hover:bg-gray-100"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </header>
          
          {/* Mobile Navigation */}
          {menuOpen && (
            <div className="md:hidden bg-white border-b shadow-md animate-fadeIn">
              <div className="container mx-auto px-4 py-3 flex flex-col space-y-2">
                {navLinks.map((link) => {
                  // Omitir enlaces según condiciones (igual que escritorio)
                  if (link.authRequired && !isAuthenticated) return null;
                  if (link.adminOnly && !isAdmin) return null;
                  if (link.userOnly && isAdmin) return null;
                  if (link.hideForAdmin && isAdmin) return null;
                  if (link.hideForUser && !isAdmin) return null;

                  return (
                    <Link 
                      key={link.to} 
                      to={link.to}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        isActive(link.to) 
                          ? 'text-[#686df3] font-medium bg-[#686df3]/5' 
                          : 'text-gray-600 hover:text-[#686df3] hover:bg-gray-50'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  );
                })}

                {isAuthenticated ? (
                  <Button variant="ghost" onClick={handleLogout} className="flex items-center justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <div className="flex flex-col space-y-2 py-2">
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      <Button variant="outline" className="w-full flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Admin Login
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)}>
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <main className="container mx-auto px-4 py-6">
        {title && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          </div>
        )}
        {children}
      </main>
      
      <footer className="bg-white border-t py-6">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2025. All rights reserved. | Proudly ⭐️ Powered by <a href="https://beed.studio" className="text-[#686df3] hover:underline">beedStudio</a></p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
