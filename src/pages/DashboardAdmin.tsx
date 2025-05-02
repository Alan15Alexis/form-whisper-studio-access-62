import React from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DashboardAdmin = ({ userForms, currentUser }) => {
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
          <p>Contenido de todos los formularios</p>
        </TabsContent>
        <TabsContent value="public">
          <p>Contenido de formularios públicos</p>
        </TabsContent>
        <TabsContent value="private">
          <p>Contenido de formularios privados</p>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default DashboardAdmin;