import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, BarChart3, Share2, Clock, ArrowRight, Plus, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Form } from "@/types/form";
import { useForm } from "@/contexts/form/FormContext";
import { format } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { forms } = useForm();
  const [publicForms, setPublicForms] = useState<Form[]>([]);
  const [latestForms, setLatestForms] = useState<Form[]>([]);

  useEffect(() => {
    // Filter public forms
    const publicFormsData = forms.filter(form => !form.isPrivate);
    setPublicForms(publicFormsData);

    // Get latest 5 forms
    const sortedForms = [...forms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestFormsData = sortedForms.slice(0, 5);
    setLatestForms(latestFormsData);
  }, [forms]);

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">
              Bienvenido a Formulario App <Sparkles className="inline-block h-6 w-6 ml-2 text-yellow-500" />
            </h1>
            <p className="text-gray-600">
              Crea y comparte formularios fácilmente. Recolecta información y obtén feedback de tu audiencia.
            </p>
          </div>

          {isAuthenticated ? (
            <div className="text-center">
              <p className="text-lg text-gray-700 mb-4">
                Hola, {currentUser?.name || currentUser?.email}! ¿Listo para crear algo nuevo?
              </p>
              <Button asChild variant="primary" size="lg">
                <Link to={currentUser?.role === 'admin' ? "/dashboard-admin" : "/assigned-forms"}>
                  Ir a mi Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md rounded-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">¿Ya tienes una cuenta?</CardTitle>
                  <CardDescription>Inicia sesión para acceder a tus formularios.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="secondary" className="w-full">
                    <Link to="/login">
                      Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-md rounded-md">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">¿Eres nuevo aquí?</CardTitle>
                  <CardDescription>Regístrate y comienza a crear formularios hoy mismo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/register">
                      Registrarse <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Explora los últimos formularios públicos
          </h2>
          {publicForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicForms.map(form => (
                <Card key={form.id} className="bg-white shadow-md rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{form.title}</CardTitle>
                    <CardDescription className="text-gray-600">{form.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 text-gray-500 mb-3">
                      <FileText className="h-4 w-4" />
                      <span>{form.fields.length} preguntas</span>
                      <Users className="h-4 w-4" />
                      <span>{form.allowedUsers?.length || 0} participantes</span>
                    </div>
                    <Button asChild variant="secondary" className="w-full">
                      <Link to={`/forms/${form.id}`}>
                        Completar Formulario <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500">No hay formularios públicos disponibles por el momento.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Últimos Formularios Creados
          </h2>
          {latestForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestForms.map(form => (
                <Card key={form.id} className="bg-white shadow-md rounded-md">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{form.title}</CardTitle>
                    <CardDescription className="text-gray-600">{form.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 text-gray-500 mb-3">
                      <Clock className="h-4 w-4" />
                      <span>Creado el {format(new Date(form.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    <Button asChild variant="secondary" className="w-full">
                      <Link to={`/forms/${form.id}`}>
                        Ver Formulario <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500">No hay formularios creados recientemente.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Index;
