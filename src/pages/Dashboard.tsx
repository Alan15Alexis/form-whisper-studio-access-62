import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@/contexts/FormContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormCard from "@/components/FormCard";
import AssignedFormCard from "@/components/AssignedFormCard";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const { forms, isUserAllowed } = useForm();
  
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

  const userForms = forms.filter(form => form.ownerId === currentUser?.id);
  
  const assignedForms = forms.filter(form => 
    form.isPrivate && 
    currentUser?.email && 
    isUserAllowed(form.id, currentUser.email) &&
    form.ownerId !== currentUser.id &&
    !hiddenForms.includes(form.id)
  );
  
  const sortedForms = [...userForms].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const publicForms = sortedForms.filter(form => !form.isPrivate);
  const privateForms = sortedForms.filter(form => form.isPrivate);

  return (
    <Layout title="Your Forms">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">
          Bienvenido, {currentUser?.name || currentUser?.email}
        </h2>
        {isAdmin && (
          <Button asChild>
            <Link to="/forms/new">
              <Plus className="mr-2 h-4 w-4" /> New Form
            </Link>
          </Button>
        )}
      </div>

      {!isAdmin ? (
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Forms Assigned to You</h3>
            {assignedForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedForms.map(form => (
                  <AssignedFormCard key={form.id} form={form} onRemove={hideForm} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No forms have been assigned to you yet.
              </p>
            )}
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Forms ({sortedForms.length})</TabsTrigger>
            <TabsTrigger value="public">Public ({publicForms.length})</TabsTrigger>
            <TabsTrigger value="private">Private ({privateForms.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="animate-fadeIn">
            {sortedForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedForms.map(form => (
                  <FormCard key={form.id} form={form} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No forms yet</h3>
                <p className="text-gray-500 mb-6">Create your first form to get started</p>
                <Button asChild>
                  <Link to="/forms/new">
                    <Plus className="mr-2 h-4 w-4" /> Create New Form
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="public" className="animate-fadeIn">
            {publicForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicForms.map(form => (
                  <FormCard key={form.id} form={form} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No public forms</h3>
                <p className="text-gray-500 mb-6">Public forms can be accessed by anyone</p>
                <Button asChild>
                  <Link to="/forms/new">Create a Public Form</Link>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="private" className="animate-fadeIn">
            {privateForms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {privateForms.map(form => (
                  <FormCard key={form.id} form={form} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No private forms</h3>
                <p className="text-gray-500 mb-6">Private forms can only be accessed by specified users</p>
                <Button asChild>
                  <Link to="/forms/new">Create a Private Form</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  );
};

export default Dashboard;
