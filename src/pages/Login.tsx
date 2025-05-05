
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import LoginForm from "@/components/auth/LoginForm";
import RegisterAdminForm from "@/components/auth/RegisterAdminForm";
import RegisterUserForm from "@/components/auth/RegisterUserForm";
import LoginHeader from "@/components/auth/LoginHeader";
import LoginLayout, { LoginFooter } from "@/components/auth/LoginLayout";

const Login = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "register-user">("login");
  
  const handleSuccessfulUserRegistration = () => {
    setActiveTab("login");
  };

  return (
    <LoginLayout activeTab={activeTab}>
      <Card className="w-full max-w-md shadow-lg border-gray-200">
        <Tabs 
          defaultValue="login" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "login" | "register" | "register-user")}
          className="w-full"
        >
          <LoginHeader activeTab={activeTab} />

          <CardContent>
            <TabsContent value="login" className="mt-0">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <RegisterAdminForm />
            </TabsContent>
            
            <TabsContent value="register-user" className="mt-0">
              <RegisterUserForm onSuccessRegister={handleSuccessfulUserRegistration} />
            </TabsContent>
          </CardContent>
          
          <LoginFooter activeTab={activeTab} />
        </Tabs>
      </Card>
    </LoginLayout>
  );
};

export default Login;
