
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, User, Mail, Calendar, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/toast";

interface AdminUser {
  id: number;
  nombre: string;
  correo: string;
  estatus_aprobacion: 'pendiente' | 'aprobado' | 'rechazado';
}

const SuperAdminDashboard = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Check if current user is super admin
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/loginAdmin');
      return;
    }
    
    try {
      const user = JSON.parse(currentUser);
      if (user.role !== 'super_admin') {
        navigate('/loginAdmin');
        return;
      }
    } catch (error) {
      navigate('/loginAdmin');
      return;
    }
  }, [navigate]);

  // Fetch admin users
  useEffect(() => {
    const fetchAdminUsers = async () => {
      setLoading(true);
      try {
        console.log("Fetching admin users...");
        
        const { data, error } = await supabase
          .from('usuario_administrador')
          .select('*')
          .order('id', { ascending: false });
        
        if (error) {
          console.error('Error fetching admin users:', error);
          toast({
            title: "Error al cargar administradores",
            description: "No se pudieron cargar los administradores",
            variant: "destructive",
          });
          return;
        }
        
        console.log("Admin users fetched successfully:", data);
        setAdminUsers(data || []);
      } catch (error) {
        console.error('Error in fetchAdminUsers:', error);
        toast({
          title: "Error al cargar administradores",
          description: "Ocurrió un error inesperado",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userEmail');
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate('/loginAdmin');
  };

  const handleApproveUser = async (userId: number) => {
    try {
      const { error } = await supabase
        .from('usuario_administrador')
        .update({ estatus_aprobacion: 'aprobado' })
        .eq('id', userId);
      
      if (error) {
        console.error('Error approving user:', error);
        toast({
          title: "Error",
          description: "No se pudo aprobar el administrador",
          variant: "destructive",
        });
        return;
      }
      
      // Update local state
      setAdminUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, estatus_aprobacion: 'aprobado' }
            : user
        )
      );
      
      toast({
        title: "Usuario aprobado",
        description: "El administrador ha sido aprobado exitosamente",
      });
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al aprobar el usuario",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (userId: number) => {
    try {
      const { error } = await supabase
        .from('usuario_administrador')
        .update({ estatus_aprobacion: 'rechazado' })
        .eq('id', userId);
      
      if (error) {
        console.error('Error rejecting user:', error);
        toast({
          title: "Error",
          description: "No se pudo rechazar el administrador",
          variant: "destructive",
        });
        return;
      }
      
      // Update local state
      setAdminUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, estatus_aprobacion: 'rechazado' }
            : user
        )
      );
      
      toast({
        title: "Usuario rechazado",
        description: "El administrador ha sido rechazado",
      });
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al rechazar el usuario",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'aprobado':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'rechazado':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const pendingUsers = adminUsers.filter(user => user.estatus_aprobacion === 'pendiente');
  const approvedUsers = adminUsers.filter(user => user.estatus_aprobacion === 'aprobado');
  const rejectedUsers = adminUsers.filter(user => user.estatus_aprobacion === 'rechazado');

  const UserCard = ({ user }: { user: AdminUser }) => (
    <Card key={user.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">{user.nombre}</CardTitle>
          </div>
          {getStatusBadge(user.estatus_aprobacion)}
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span>{user.correo}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>ID: {user.id}</span>
        </div>
      </CardHeader>
      {user.estatus_aprobacion === 'pendiente' && (
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <Button 
              onClick={() => handleApproveUser(user.id)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Aprobar
            </Button>
            <Button 
              onClick={() => handleRejectUser(user.id)}
              variant="destructive"
              size="sm"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Rechazar
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header with logout */}
        <header className="border-b shadow-sm bg-white">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-red-600">Super Administrador</span>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>

        <footer className="bg-white border-t py-6">
          <div className="container mx-auto px-4 text-center text-gray-500">
            <p>© 2025. All rights reserved. | Proudly ⭐️ Powered by <a href="https://beed.studio" className="text-[#686df3] hover:underline">beedStudio</a></p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logout */}
      <header className="border-b shadow-sm bg-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold text-red-600">Super Administrador</span>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="flex items-center">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Panel de Super Administrador</h2>
          <p className="text-gray-600">Gestiona las solicitudes de registro de administradores</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pendientes</CardTitle>
              <div className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aprobados</CardTitle>
              <div className="text-2xl font-bold text-green-600">{approvedUsers.length}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rechazados</CardTitle>
              <div className="text-2xl font-bold text-red-600">{rejectedUsers.length}</div>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pendientes ({pendingUsers.length})</TabsTrigger>
            <TabsTrigger value="approved">Aprobados ({approvedUsers.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados ({rejectedUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingUsers.length > 0 ? (
              <div>
                {pendingUsers.map(user => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay solicitudes pendientes</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedUsers.length > 0 ? (
              <div>
                {approvedUsers.map(user => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay administradores aprobados</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected">
            {rejectedUsers.length > 0 ? (
              <div>
                {rejectedUsers.map(user => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay administradores rechazados</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white border-t py-6">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2025. All rights reserved. | Proudly ⭐️ Powered by <a href="https://beed.studio" className="text-[#686df3] hover:underline">beedStudio</a></p>
        </div>
      </footer>
    </div>
  );
};

export default SuperAdminDashboard;
