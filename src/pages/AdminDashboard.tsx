import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { LogOut, Users, Briefcase, CheckCircle, XCircle, Clock, Loader2, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Application {
  id: string;
  internship_id: string;
  student_id: string;
  status: string;
  feedback: string | null;
  applied_at: string;
  profiles: {
    full_name: string;
    email: string;
    student_id: string | null;
    department: string | null;
  };
  internships: {
    company_name: string;
    position_title: string;
  };
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        profiles (full_name, email, student_id, department),
        internships (company_name, position_title)
      `)
      .order("applied_at", { ascending: false });

    if (error) {
      toast.error("Error fetching applications");
      return;
    }

    setApplications(data || []);
    
    // Calculate stats
    const total = data?.length || 0;
    const pending = data?.filter(a => a.status === 'pending').length || 0;
    const accepted = data?.filter(a => a.status === 'accepted').length || 0;
    const rejected = data?.filter(a => a.status === 'rejected').length || 0;
    
    setStats({ total, pending, accepted, rejected });
    setLoading(false);
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: 'accepted' | 'rejected', studentEmail: string) => {
    setProcessingId(applicationId);

    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ 
          status: newStatus,
          feedback: feedback[applicationId] || null 
        })
        .eq("id", applicationId);

      if (updateError) throw updateError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-application-email', {
        body: {
          to: studentEmail,
          status: newStatus,
          feedback: feedback[applicationId] || '',
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        toast.error("Status updated but email notification failed");
      } else {
        toast.success(`Application ${newStatus} and email sent!`);
      }

      fetchApplications();
      setFeedback(prev => ({ ...prev, [applicationId]: '' }));
    } catch (error: any) {
      toast.error(error.message || "Error updating application");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-secondary"><CheckCircle className="mr-1 h-3 w-3" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-primary">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8 animate-slide-up">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-display font-bold mb-6">Applications</h2>
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.id} className="hover:shadow-hover transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{application.profiles.full_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Users className="h-4 w-4" />
                        {application.profiles.student_id} • {application.profiles.department}
                      </CardDescription>
                    </div>
                    {getStatusBadge(application.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Position</p>
                      <p className="text-muted-foreground">
                        {application.internships.position_title} at {application.internships.company_name}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Applied On</p>
                      <p className="text-muted-foreground">
                        {new Date(application.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Student Email</p>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {application.profiles.email}
                      </p>
                    </div>
                  </div>

                  {application.status === 'pending' && (
                    <Dialog>
                      <div className="space-y-3">
                        <Label htmlFor={`feedback-${application.id}`}>Feedback (Optional)</Label>
                        <Textarea
                          id={`feedback-${application.id}`}
                          placeholder="Provide feedback to the student..."
                          value={feedback[application.id] || ''}
                          onChange={(e) => setFeedback(prev => ({ 
                            ...prev, 
                            [application.id]: e.target.value 
                          }))}
                          rows={3}
                        />
                        <div className="flex gap-3">
                          <DialogTrigger asChild>
                            <Button 
                              className="flex-1 bg-secondary hover:bg-secondary-light"
                              disabled={processingId === application.id}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                          </DialogTrigger>
                          <Button 
                            variant="destructive" 
                            className="flex-1"
                            disabled={processingId === application.id}
                            onClick={() => handleStatusUpdate(application.id, 'rejected', application.profiles.email)}
                          >
                            {processingId === application.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Reject
                          </Button>
                        </div>
                      </div>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Acceptance</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to accept this application? An email will be sent to the student.
                          </DialogDescription>
                        </DialogHeader>
                        <Button 
                          onClick={() => handleStatusUpdate(application.id, 'accepted', application.profiles.email)}
                          disabled={processingId === application.id}
                        >
                          {processingId === application.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            "Confirm Accept"
                          )}
                        </Button>
                      </DialogContent>
                    </Dialog>
                  )}

                  {application.feedback && (
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="font-semibold text-xs mb-1">Admin Feedback:</p>
                      <p className="text-xs">{application.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
