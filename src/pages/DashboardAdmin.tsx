
import React, { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/form";
import { useAuth } from "@/contexts/AuthContext";
import FormCard from "@/components/FormCard";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/types/form";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";

const DashboardAdmin = () => {
  const { forms, setForms } = useForm();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch forms from Supabase on component mount
  useEffect(() => {
    const fetchFormsFromSupabase = async () => {
      setLoading(true);
      try {
        console.log("Fetching forms from Supabase...");
        console.log("Current user email:", currentUser?.email);
        
        // Add admin filter to only fetch forms created by this admin
        let query = supabase
          .from('formulario_construccion')
          .select('*')
          .order('created_at', { ascending: false });
          
        // If user is logged in, filter by their email
        if (currentUser?.email) {
          query = query.eq('administrador', currentUser.email);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching forms:', error);
          toast({
            title: "Error al cargar formularios",
            description: "No se pudieron cargar los formularios desde la base de datos",
            variant: "destructive",
          });
          return;
        }
        
        if (data) {
          console.log("Forms fetched successfully:", data);
          console.log("Current user:", currentUser);
          console.log("Number of forms found:", data.length);
          
          // Transform Supabase data to match our Form interface
          const transformedForms: Form[] = data.map(item => {
            const config = item.configuracion || {};
            
            // Process score ranges from rangos_mensajes
            let scoreRanges = [];
            if (item.rangos_mensajes && Array.isArray(item.rangos_mensajes)) {
              scoreRanges = item.rangos_mensajes.filter(range => 
                range && 
                typeof range.min === 'number' && 
                typeof range.max === 'number' && 
                typeof range.message === 'string' &&
                range.min <= range.max
              );
              console.log(`Form "${item.titulo}" has ${scoreRanges.length} valid score ranges from database`);
            }
            
            // Process showTotalScore from configuration
            const showTotalScore = Boolean(config.showTotalScore);
            
            console.log(`DashboardAdmin - Processing form "${item.titulo}":`, {
              hasRangosMensajes: !!item.rangos_mensajes,
              rangosMensajesLength: Array.isArray(item.rangos_mensajes) ? item.rangos_mensajes.length : 0,
              scoreRangesLength: scoreRanges.length,
              showTotalScore,
              configShowTotalScore: config.showTotalScore
            });
            
            return {
              id: uuidv4(), // Generate a unique ID for the client
              title: item.titulo || 'Sin título',
              description: item.descripcion || '',
              fields: item.preguntas || [],
              isPrivate: config.isPrivate || false,
              allowedUsers: item.acceso || [],
              createdAt: item.created_at || new Date().toISOString(),
              updatedAt: item.created_at || new Date().toISOString(),
              accessLink: uuidv4(), // Generate a unique access link
              ownerId: currentUser?.id ? String(currentUser.id) : 'unknown', // Ensure ownerId is always a string
              enableScoring: config.enableScoring || false,
              showTotalScore: showTotalScore,
              scoreRanges: scoreRanges,
              formColor: config.formColor || '#3b82f6',
              allowViewOwnResponses: config.allowViewOwnResponses || false,
              allowEditOwnResponses: config.allowEditOwnResponses || false,
              httpConfig: config.httpConfig || undefined,
            };
          });
          
          console.log("Transformed forms with score ranges:", transformedForms.map(f => ({
            title: f.title,
            showTotalScore: f.showTotalScore,
            scoreRangesCount: f.scoreRanges?.length || 0,
            scoreRanges: f.scoreRanges
          })));
          
          // Update forms in context
          setForms(transformedForms);
        }
      } catch (error) {
        console.error('Error in fetchFormsFromSupabase:', error);
        toast({
          title: "Error al cargar formularios",
          description: "Ocurrió un error inesperado al cargar los formularios",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser?.email) {
      console.log("User is authenticated, fetching forms...");
      fetchFormsFromSupabase();
    } else {
      console.log("User is not authenticated or email is missing");
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.email, setForms]);
  
  // No need to filter by ownerId since we're already filtering by email in the query
  const userForms = forms;
  
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
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
      )}
    </Layout>
  );
};

export default DashboardAdmin;
