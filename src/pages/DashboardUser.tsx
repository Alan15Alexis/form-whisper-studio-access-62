import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "@/contexts/form/FormContext";
import { useAuth } from "@/contexts/AuthContext";
import { Form } from "@/types/form";
import AssignedFormCard from "@/components/AssignedFormCard";

interface DashboardUserProps { }

const DashboardUser: React.FC<DashboardUserProps> = () => {
  const { forms } = useForm();
  const { currentUser } = useAuth();
  const [assignedForms, setAssignedForms] = useState<Form[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Filter forms where the current user's email is in the allowedUsers array
      const filteredForms = forms.filter(form =>
        form.allowedUsers && form.allowedUsers.includes(currentUser.email)
      );
      setAssignedForms(filteredForms);
    }
  }, [currentUser, forms]);

  return (
    <Layout title="Assigned Forms">
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Assigned Forms</CardTitle>
            <CardDescription>
              These are the forms assigned to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignedForms.length > 0 ? (
              assignedForms.map((form) => (
                <AssignedFormCard key={form.id} form={form} />
              ))
            ) : (
              <p>No forms have been assigned to you yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DashboardUser;
