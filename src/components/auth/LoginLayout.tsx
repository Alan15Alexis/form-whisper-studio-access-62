
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

interface LoginLayoutProps {
  children: ReactNode;
  activeTab: "login" | "register" | "register-user";
}

const LoginLayout = ({ children, activeTab }: LoginLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b py-4">
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

      {/* Main content */}
      <main className="flex-grow flex items-center justify-center bg-gray-50 p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4 text-center text-sm text-gray-500">
        <div className="container mx-auto px-4">
          <p>© 2025. All rights reserved. | Proudly ⭐️ Powered by <a href="https://beed.studio" className="text-[#686df3] hover:underline">beedStudio</a></p>
        </div>
      </footer>
    </div>
  );
};

export const LoginFooter = ({ activeTab }: { activeTab: "login" | "register" | "register-user" }) => {
  return (
    <CardFooter className="flex flex-col space-y-4">
      <Link to="/" className="w-full">
        <Button variant="outline" className="w-full">
          Volver al inicio
        </Button>
      </Link>
    </CardFooter>
  );
};

export default LoginLayout;
