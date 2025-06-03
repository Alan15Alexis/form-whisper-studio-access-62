
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "@/contexts/form";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Download, Share, FileIcon, ExternalLink, Image } from "lucide-react";
import { format } from "date-fns";
import { FormResponse, Form as FormType, FormField } from "@/types/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { getFileInfoFromUrl, isFormResponseFile } from "@/utils/fileUploadUtils";

const FormResponses = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getForm, getFormResponses, generateAccessLink } = useForm();
  const { currentUser, isAdmin } = useAuth();

  const [form, setForm] = useState<FormType | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [accessLink, setAccessLink] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/dashboard");
      return;
    }
    const formData = getForm(id);
    if (!formData) {
      navigate("/dashboard");
      return;
    }
    setForm(formData);
    // Now generateAccessLink returns string directly, not a Promise
    setAccessLink(generateAccessLink(id));
    setLoading(false);

    const allResponses = getFormResponses(id);

    if (!isAdmin && currentUser && formData.allowViewOwnResponses) {
      const filtered = allResponses.filter(
        (resp) => resp.submittedBy && resp.submittedBy.toLowerCase() === currentUser.email.toLowerCase()
      );
      setResponses(filtered);
    } else if (isAdmin) {
      setResponses(allResponses);
    } else if (!isAdmin && !formData.allowViewOwnResponses) {
      setResponses([]);
    }
  }, [id, getForm, getFormResponses, generateAccessLink, navigate, isAdmin, currentUser]);

  const copyAccessLink = () => {
    navigator.clipboard.writeText(accessLink);
    toast({
      title: "Link copied",
      description: "Access link copied to clipboard",
    });
  };

  // Helper function to check if value is a file URL (enhanced)
  const isFileUrl = (value: any): boolean => {
    return typeof value === 'string' && 
           (value.startsWith('http://') || 
            value.startsWith('https://') || 
            isFormResponseFile(value));
  };

  // Enhanced function to render file preview
  const renderFilePreview = (fileUrl: string, fieldLabel: string) => {
    const fileInfo = getFileInfoFromUrl(fileUrl);
    
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border">
        {fileInfo.isImage ? (
          <div className="relative">
            <img 
              src={fileUrl} 
              alt={fieldLabel || "Imagen"} 
              className="h-10 w-10 object-cover rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder');
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="image-placeholder hidden h-10 w-10 bg-gray-200 rounded items-center justify-center">
              <Image className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        ) : (
          <div className="h-10 w-10 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
            <FileIcon className="h-4 w-4 text-blue-600" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{fileInfo.fileName}</p>
          {fileInfo.isFromBucket && (
            <Badge variant="outline" className="text-xs mt-1 bg-green-50 text-green-600 border-green-200">
              📁 Bucket
            </Badge>
          )}
        </div>
        
        <a 
          href={fileUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-xs flex items-center"
        >
          <ExternalLink className="h-3 w-3 mr-1" /> Ver
        </a>
      </div>
    );
  };

  const downloadCSV = () => {
    if (!form || responses.length === 0) return;
    
    const allKeys = new Set<string>();
    responses.forEach(response => {
      Object.keys(response.data).forEach(key => {
        allKeys.add(key);
      });
    });
    
    const fieldMap: Record<string, string> = {};
    form.fields.forEach(field => {
      fieldMap[field.id] = field.label;
    });
    
    const headers = ["Submission Date", "Submitted By", ...Array.from(allKeys).map(key => fieldMap[key] || key)];
    
    const rows = responses.map(response => {
      const row: string[] = [
        format(new Date(response.submittedAt), 'yyyy-MM-dd HH:mm:ss'),
        response.submittedBy || 'Anonymous',
      ];
      
      allKeys.forEach(key => {
        const value = response.data[key];
        if (Array.isArray(value)) {
          row.push(value.join(', '));
        } else {
          row.push(value || '');
        }
      });
      
      return row;
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${form.title.replace(/\s+/g, '_')}_responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    );
  }

  const sortedResponses = [...responses].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  return (
    <Layout title={form ? `Responses: ${form.title}` : "Form Responses"}>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Form Details</CardTitle>
          <CardDescription>
            {form?.description || "No description provided"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Responses</p>
              <p className="text-2xl font-bold">{responses.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Privacy</p>
              <p className="text-lg">{form?.isPrivate ? "Private" : "Public"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-lg">{form?.createdAt && format(new Date(form.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
          
          {form?.isPrivate && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap justify-between items-center">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-sm font-medium text-gray-500">Private Access Link</h3>
                  <p className="text-sm truncate max-w-xs">{accessLink}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={copyAccessLink}>
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Share className="h-4 w-4 mr-1" /> Share
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Share Access Link</h4>
                        <p className="text-sm text-gray-500">
                          This link provides direct access to your private form.
                        </p>
                        <div className="pt-2">
                          <Button 
                            className="w-full" 
                            onClick={copyAccessLink}
                          >
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="table" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="details">Detailed View</TabsTrigger>
          </TabsList>
          
          <Button 
            variant="outline"
            onClick={downloadCSV}
            disabled={responses.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        
        {responses.length === 0 ? (
          <Alert className="mb-6 bg-gray-50">
            <AlertDescription>
              No responses have been submitted yet.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <TabsContent value="table" className="animate-fadeIn">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead>Submitted By</TableHead>
                          {form?.fields.map((field) => (
                            <TableHead key={field.id}>{field.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedResponses.map((response) => (
                          <TableRow key={response.id}>
                            <TableCell className="font-medium">
                              {format(new Date(response.submittedAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>{response.submittedBy || 'Anonymous'}</TableCell>
                            {form?.fields.map((field) => (
                              <TableCell key={field.id}>
                                {formatResponseValue(response.data[field.id], field)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="details" className="animate-fadeIn">
              <div className="space-y-6">
                {sortedResponses.map((response) => (
                  <Card key={response.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">
                          Response from {response.submittedBy || 'Anonymous'}
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          {format(new Date(response.submittedAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="divide-y">
                        {form?.fields.map((field) => (
                          <div key={field.id} className="py-3 flex flex-col sm:flex-row">
                            <div className="font-medium w-full sm:w-1/3 mb-1 sm:mb-0">
                              {field.label}
                            </div>
                            <div className="w-full sm:w-2/3">
                              {formatResponseValue(response.data[field.id], field)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </Layout>
  );
};

const formatResponseValue = (value: any, field: FormField) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-gray-400">No response</span>;
  }
  
  // Check if the value is a file URL (enhanced check)
  if (typeof value === 'string' && 
     (value.startsWith('http://') || 
      value.startsWith('https://') || 
      isFormResponseFile(value))) {
    
    const fileInfo = getFileInfoFromUrl(value);
    
    if (fileInfo.isImage) {
      return (
        <div className="flex items-center gap-2">
          <img 
            src={value} 
            alt={field.label} 
            className="h-6 w-6 object-cover rounded border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget.parentElement?.querySelector('.image-placeholder');
              if (placeholder) {
                (placeholder as HTMLElement).style.display = 'flex';
              }
            }}
          />
          <div className="image-placeholder hidden h-6 w-6 bg-gray-200 rounded border items-center justify-center">
            <Image className="h-3 w-3 text-gray-400" />
          </div>
          <div className="flex flex-col">
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline text-sm"
            >
              Ver imagen
            </a>
            {fileInfo.isFromBucket && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200 w-fit">
                📁 Bucket
              </Badge>
            )}
          </div>
        </div>
      );
    } else {
      // For non-image files - show just the file name, not the full URL
      return (
        <div className="flex items-center gap-2">
          <FileIcon className="h-4 w-4 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-sm text-gray-700">{fileInfo.fileName}</span>
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline text-xs"
            >
              Ver archivo
            </a>
            {fileInfo.isFromBucket && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200 w-fit">
                📁 Bucket
              </Badge>
            )}
          </div>
        </div>
      );
    }
  }
  
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (field.type === 'checkbox' && typeof value === 'boolean') {
    return value ? "Yes" : "No";
  }
  return String(value);
};

export default FormResponses;
