import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, Briefcase, DollarSign, MapPin, Clock, Code, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Internship {
  id: string;
  company_name: string;
  position_title: string;
  description: string;
  salary: string;
  duration: string;
  required_skills: string[];
  location: string;
}

interface Application {
  id: string;
  internship_id: string;
  status: string;
  feedback: string | null;
  applied_at: string;
  internships: Internship;
}

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch internships
    const { data: internshipsData } = await supabase
      .from("internships")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // Fetch applications
    const { data: applicationsData } = await supabase
      .from("applications")
      .select(`
        *,
        internships (*)
      `)
      .eq("student_id", user.id)
      .order("applied_at", { ascending: false });

    setInternships(internshipsData || []);
    setApplications(applicationsData || []);
    setLoading(false);
  };

  const handleApply = async (internshipId: string) => {
    if (!user) return;

    setApplying(internshipId);
    
    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          internship_id: internshipId,
          student_id: user.id,
          status: "pending",
        });

      if (error) throw error;

      toast.success("Application submitted successfully!");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error submitting application");
    } finally {
      setApplying(null);
    }
  };

  const hasApplied = (internshipId: string) => {
    return applications.some(app => app.internship_id === internshipId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-secondary"><CheckCircle2 className="mr-1 h-3 w-3" />Accepted</Badge>;
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
            <h1 className="text-2xl font-display font-bold text-primary">Student Portal</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Applications Section */}
        {applications.length > 0 && (
          <section className="mb-12 animate-slide-up">
            <h2 className="text-2xl font-display font-bold mb-6">My Applications</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {applications.map((application) => (
                <Card key={application.id} className="hover:shadow-hover transition-all">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{application.internships.company_name}</CardTitle>
                      {getStatusBadge(application.status)}
                    </div>
                    <CardDescription>{application.internships.position_title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        Applied: {new Date(application.applied_at).toLocaleDateString()}
                      </p>
                      {application.feedback && (
                        <div className="mt-3 p-3 rounded-lg bg-muted">
                          <p className="font-semibold text-xs mb-1">Feedback:</p>
                          <p className="text-xs">{application.feedback}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Available Internships */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-display font-bold mb-6">Available Internships</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {internships.map((internship) => (
              <Card key={internship.id} className="hover:shadow-hover transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{internship.company_name}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        {internship.position_title}
                      </CardDescription>
                    </div>
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{internship.description}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-secondary" />
                      <span>{internship.salary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent" />
                      <span>{internship.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{internship.location}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-4 w-4" />
                      <span className="text-sm font-semibold">Required Skills:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {internship.required_skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        disabled={hasApplied(internship.id) || applying === internship.id}
                      >
                        {applying === internship.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying...
                          </>
                        ) : hasApplied(internship.id) ? (
                          "Already Applied"
                        ) : (
                          "Apply Now"
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Application</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to apply for {internship.position_title} at {internship.company_name}?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline">Cancel</Button>
                        <Button onClick={() => handleApply(internship.id)}>
                          Confirm Application
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
