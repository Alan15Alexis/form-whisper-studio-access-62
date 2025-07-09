
import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { processCollaborators } from './collaboratorOperations';
import { cleanScoreRanges } from './scoreOperations';
import { getInitialForms } from './initialState';

export const useFormLoader = (setForms: any, safeLocalStorageSet: any) => {
  const [formsLoaded, setFormsLoaded] = useState(false);

  // Enhanced form loading function with better collaborator handling and creator tracking
  const loadFormsFromSupabase = useCallback(async (forceReload = false) => {
    if (formsLoaded && !forceReload) {
      console.log("FormContext - Forms already loaded, skipping reload");
      return;
    }

    try {
      console.log("FormContext - Loading forms from Supabase...");
      
      const { data: formsData, error } = await supabase
        .from('formulario_construccion')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("FormContext - Error loading forms:", error);
        throw error;
      }
      
      if (formsData && formsData.length > 0) {
        console.log("FormContext - Processing", formsData.length, "forms from database");
        
        const loadedForms = formsData.map(formData => {
          const config = formData.configuracion || {};
          
          // Enhanced showTotalScore processing with detailed logging
          const showTotalScore = Boolean(config.showTotalScore || formData.showTotalScore);
          
          // Enhanced score ranges processing with extensive validation and logging
          const scoreRanges = cleanScoreRanges(formData.rangos_mensajes);
          
          // Enhanced collaborators processing with better error handling
          const collaborators = processCollaborators(formData.colaboradores);
          
          // Enhanced owner ID processing using the new administrador_creador field
          const ownerId = formData.administrador_creador || formData.administrador || 'unknown';
          
          console.log(`FormContext - Processing form "${formData.titulo}" (ID: ${formData.id}):`, {
            hasRangosMensajes: !!formData.rangos_mensajes,
            scoreRangesCount: scoreRanges.length,
            showTotalScore: showTotalScore,
            rawCollaborators: formData.colaboradores,
            processedCollaborators: collaborators,
            collaboratorsCount: collaborators.length,
            administrador: formData.administrador,
            administrador_creador: formData.administrador_creador,
            ownerId: ownerId
          });
          
          const finalForm = {
            id: formData.id.toString(),
            title: formData.titulo || 'Untitled Form',
            description: formData.descripcion || '',
            fields: formData.preguntas || [],
            isPrivate: Boolean(config.isPrivate),
            allowedUsers: formData.acceso || [],
            collaborators: collaborators,
            createdAt: formData.created_at,
            updatedAt: formData.created_at,
            accessLink: uuidv4(),
            ownerId: ownerId,
            formColor: config.formColor || '#3b82f6',
            allowViewOwnResponses: Boolean(config.allowViewOwnResponses),
            allowEditOwnResponses: Boolean(config.allowEditOwnResponses),
            httpConfig: config.httpConfig,
            showTotalScore: showTotalScore,
            scoreRanges: scoreRanges
          };
          
          console.log(`FormContext - Final processed form "${formData.titulo}":`, {
            id: finalForm.id,
            showTotalScore: finalForm.showTotalScore,
            scoreRangesCount: finalForm.scoreRanges.length,
            collaborators: finalForm.collaborators,
            collaboratorsCount: finalForm.collaborators.length,
            ownerId: finalForm.ownerId
          });
          
          return finalForm;
        });
        
        console.log("FormContext - Successfully loaded forms:", loadedForms.length);
        
        setForms(loadedForms);
        safeLocalStorageSet('forms', loadedForms);
        setFormsLoaded(true);
        
        return loadedForms;
      } else {
        console.log("FormContext - No forms found in database");
        setForms([]);
        safeLocalStorageSet('forms', []);
        setFormsLoaded(true);
        return [];
      }
    } catch (error) {
      console.error("FormContext - Error loading forms:", error);
      
      // Fallback to local storage only if we haven't loaded anything yet
      if (!formsLoaded) {
        const localForms = getInitialForms();
        if (localForms && localForms.length > 0) {
          console.log("FormContext - Using local storage fallback");
          setForms(localForms);
          setFormsLoaded(true);
          return localForms;
        }
      }
      
      throw error;
    }
  }, [formsLoaded, setForms, safeLocalStorageSet]);

  // Load forms from Supabase on mount
  useEffect(() => {
    loadFormsFromSupabase();
  }, [loadFormsFromSupabase]);

  return {
    formsLoaded,
    loadFormsFromSupabase
  };
};
