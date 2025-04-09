
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, CheckCircle, Lock, ArrowRight, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const features = [
  {
    icon: <FileText className="h-10 w-10 text-primary" />,
    title: "Dynamic Form Builder",
    description: "Create beautiful forms with a wide range of field types and customization options."
  },
  {
    icon: <Lock className="h-10 w-10 text-primary" />,
    title: "Private Forms",
    description: "Control who can access and submit your forms with user-specific permissions."
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-primary" />,
    title: "Response Management",
    description: "View, manage, and export all form submissions in one centralized dashboard."
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "User Access Control",
    description: "Grant or revoke access to specific users and create shareable private links."
  }
];

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Layout hideNav>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-blue-200 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <div className="container mx-auto px-4 pt-16 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Build Beautiful Forms<br />
              <span className="text-primary">Simplified</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              Create dynamic forms with controlled access, collect responses,
              and manage it all with a minimalist interface.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isAuthenticated ? (
                <Button asChild size="lg" className="px-8 py-6 text-lg">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="px-8 py-6 text-lg">
                    <Link to="/register">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
          
          <div className="mt-20">
            <motion.div
              className="rounded-xl bg-white shadow-xl p-4 border border-gray-100"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <img
                src="https://images.unsplash.com/photo-1555421689-3f034debb7a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                alt="Form Builder Dashboard"
                className="rounded-lg border border-gray-200 shadow-sm"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Powerful Features</h2>
            <p className="text-gray-600 mt-2">Everything you need to create and manage forms</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="mb-8 text-lg opacity-90 max-w-xl mx-auto">
            Join hundreds of users who are creating beautiful, accessible forms with FormWhisper.
          </p>
          <Button asChild size="lg" variant="secondary" className="group">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Go to Dashboard" : "Create Your First Form"} 
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Footer content is handled by the Layout component */}
    </Layout>
  );
};

export default Index;
