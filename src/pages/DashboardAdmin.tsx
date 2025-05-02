import React from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormCard from "@/components/FormCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const DashboardAdmin = ({ userForms, currentUser }) => {
  return (
    <Layout title="Tus Formularios">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">
          Bienvenido, {currentUser?.name || currentUser?.email}
        </h2>
        <Button asChild>
          <Link to="/forms/new">
            <Plus className="mr-2 h-4 w-4" /> Crear nuevo formulario
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos los formularios ({userForms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="animate-fadeIn">
          {userForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userForms.map(form => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No tienes formularios creados</h3>
              <p className="text-gray-500 mb-6">Crea tu primer formulario para comenzar</p>
              <Button asChild>
                <Link to="/forms/new">
                  <Plus className="mr-2 h-4 w-4" /> Crear nuevo formulario
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default DashboardAdmin;