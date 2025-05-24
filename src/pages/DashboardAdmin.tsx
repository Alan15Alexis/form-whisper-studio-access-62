import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "@/contexts/form/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Form } from "@/types/form";
import FormCard from "@/components/FormCard";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

const DashboardAdmin = () => {
  const { forms, deleteForm, setForms } = useForm();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/login");
    } else {
      setLoading(false);
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const { data, error } = await supabase
          .from('formularios')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching forms:", error);
          toast({
            title: "Error",
            description: "Failed to fetch forms from database",
            variant: "destructive",
          });
        }

        if (data) {
          // Ensure each form has the correct structure
          const validatedForms = data.map(form => ({
            ...form,
            fields: form.fields || [],
            isPrivate: form.isPrivate !== undefined ? form.isPrivate : false,
            allowViewOwnResponses: form.allowViewOwnResponses !== undefined ? form.allowViewOwnResponses : false,
            allowEditOwnResponses: form.allowEditOwnResponses !== undefined ? form.allowEditOwnResponses : false,
            enableScoring: form.enableScoring !== undefined ? form.enableScoring : false,
            showTotalScore: form.showTotalScore !== undefined ? form.showTotalScore : false,
            scoreConfig: form.scoreConfig || { passMark: 70 },
            scoreRanges: form.scoreRanges || [],
            httpConfig: form.httpConfig || { enabled: false, url: '', method: 'POST', headers: [], body: '' }
          }));
          setForms(validatedForms);
        }
      } catch (error) {
        console.error("Error fetching forms:", error);
        toast({
          title: "Error",
          description: "Failed to fetch forms",
          variant: "destructive",
        });
      }
    };

    fetchForms();
  }, [setForms]);

  const handleDeleteForm = async (id: string) => {
    try {
      const confirmed = window.confirm("Are you sure you want to delete this form?");
      if (!confirmed) return;

      const success = await deleteForm(id);
      if (success) {
        toast({
          title: "Form deleted",
          description: "The form has been successfully deleted.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the form.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting form:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the form.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard Admin">
      <div className="container py-8">
        <div className="mb-6 flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">
            Welcome Admin!
          </CardTitle>
          <Button onClick={() => navigate("/forms/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onDelete={handleDeleteForm}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardAdmin;
