
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { FileText, Users, Settings, ArrowRight, ClipboardCheck } from "lucide-react";
import Layout from "@/components/Layout";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="h-8 w-8 text-blue-600" />,
      title: "Creación de Formularios",
      description: "Crea formularios personalizados con múltiples tipos de campos y opciones avanzadas."
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Gestión de Usuarios",
      description: "Administra usuarios invitados y controla el acceso a formularios privados."
    },
    {
      icon: <ClipboardCheck className="h-8 w-8 text-purple-600" />,
      title: "Recolección de Respuestas",
      description: "Recopila y analiza respuestas con herramientas de visualización integradas."
    },
    {
      icon: <Settings className="h-8 w-8 text-orange-600" />,
      title: "Configuración Avanzada",
      description: "Personaliza formularios con puntuación, colores y configuraciones HTTP."
    }
  ];

  return (
    <Layout hideNav>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-4">
              Plataforma de Formularios
            </Badge>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Crea, Comparte y Analiza
              <span className="block text-blue-600">Formularios Inteligentes</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Una solución completa para crear formularios personalizados, 
              gestionar usuarios y recopilar datos de manera eficiente.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/login")}
                className="text-lg px-8 py-3"
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/register")}
                className="text-lg px-8 py-3"
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Características Principales
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Descubre todas las herramientas que necesitas para crear 
              formularios profesionales y gestionar respuestas eficientemente.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              ¿Listo para crear tu primer formulario?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Únete a miles de usuarios que ya confían en nuestra plataforma.
            </p>
            <Button 
              size="lg"
              variant="secondary"
              onClick={() => navigate("/login")}
              className="text-lg px-8 py-3"
            >
              Empezar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
