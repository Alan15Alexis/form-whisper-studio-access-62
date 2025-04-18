
import { useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/FormContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormCard from "@/components/FormCard";
import { Link } from "react-router-dom";
import { ClipboardList, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const AssignedForms = () => {
  const { currentUser } = useAuth();
  const { forms, isUserAllowed } = useForm();
  
  // Filter forms that are assigned to the current user
  const assignedForms = forms.filter(form => 
    form.isPrivate && 
    currentUser?.email && 
    isUserAllowed(form.id, currentUser.email) &&
    form.ownerId !== currentUser.id // Don't include forms the user created
  );
  
  // Filter forms by completion status (placeholder for future implementation)
  // In a real app, you'd track which forms the user has responded to
  const pendingForms = assignedForms;
  const completedForms = []; // This would be populated from actual responses

  return (
    <Layout title="Assigned Forms">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">
          Welcome, {currentUser?.name || currentUser?.email}
        </h2>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            <ClipboardList className="mr-2 h-4 w-4" />
            Pending Forms ({pendingForms.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            <FileText className="mr-2 h-4 w-4" />
            Completed Forms ({completedForms.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="animate-fadeIn">
          {pendingForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingForms.map(form => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No pending forms</h3>
              <p className="text-gray-500 mb-6">
                You don't have any forms pending completion
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="animate-fadeIn">
          {completedForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedForms.map(form => (
                <FormCard key={form.id} form={form} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No completed forms</h3>
              <p className="text-gray-500 mb-6">
                You haven't completed any assigned forms yet
              </p>
              {pendingForms.length > 0 && (
                <Button asChild>
                  <Link to="#pending">View Pending Forms</Link>
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default AssignedForms;
