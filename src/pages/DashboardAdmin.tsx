
import React, { useEffect } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import FormCard from "@/components/FormCard";

const DashboardAdmin = () => {
  const { forms } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Filter forms owned by the current user
  const userForms = forms.filter(form => form.ownerId === currentUser?.id);
  
  // Filter by public/private status
  const publicForms = userForms.filter(form => !form.isPrivate);
  const privateForms = userForms.filter(form => form.isPrivate);

  return (
    <Layout title="Tus Formularios">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">
          Bienvenido, {currentUser?.name || currentUser?.email}
        </h2>
        <Button asChild>
          <Link to="/forms/new">
            Crear nuevo formulario
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos los formularios</TabsTrigger>
          <TabsTrigger value="public">Formularios públicos</TabsTrigger>
          <TabsTrigger value="private">Formularios privados</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {userForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userForms.map(form => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-xl text-gray-500 mb-2">No tienes formularios creados</p>
              <p className="text-gray-400">
                Crea tu primer formulario para comenzar.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="public">
          {publicForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicForms.map(form => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">No tienes formularios públicos</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="private">
          {privateForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {privateForms.map(form => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">No tienes formularios privados</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default DashboardAdmin;
