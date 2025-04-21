import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/FormContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssignedFormCard from "@/components/AssignedFormCard";
import { ClipboardList, FileText } from "lucide-react";

const AssignedForms = () => {
  const { currentUser } = useAuth();
  const { forms, isUserAllowed, getFormResponses } = useForm();

  const [hiddenForms, setHiddenForms] = useState<string[]>([]);

  useEffect(() => {
    if(currentUser?.id) {
      const stored = localStorage.getItem(`hiddenForms:${currentUser.id}`);
      setHiddenForms(stored ? JSON.parse(stored) : []);
    }
  }, [currentUser?.id]);

  const hideForm = (formId: string) => {
    const updated = [...hiddenForms, formId];
    setHiddenForms(updated);
    if(currentUser?.id) {
      localStorage.setItem(`hiddenForms:${currentUser.id}`, JSON.stringify(updated));
    }
  };

  const assignedForms = forms.filter(form => 
    form.isPrivate && 
    currentUser?.email &&
    isUserAllowed(form.id, currentUser.email) &&
    form.ownerId !== currentUser.id &&
    !hiddenForms.includes(form.id)
  );

  const pendingForms = assignedForms.filter(form => getFormResponses(form.id).length === 0);
  const completedForms = assignedForms.filter(form => getFormResponses(form.id).length > 0);

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
                <AssignedFormCard key={form.id} form={form} onRemove={hideForm} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No pending forms</h3>
              <p className="text-gray-500">
                You don't have any forms pending completion
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="animate-fadeIn">
          {completedForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedForms.map(form => (
                <AssignedFormCard key={form.id} form={form} onRemove={hideForm} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No completed forms</h3>
              <p className="text-gray-500">
                You haven't completed any assigned forms yet
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default AssignedForms;
