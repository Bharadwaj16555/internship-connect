import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, GraduationCap, ShieldCheck } from "lucide-react";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  fullName: z.string().trim().min(1, { message: "Full name is required" }),
  studentId: z.string().trim().optional(),
  department: z.string().trim().optional(),
});

const signinSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'student' | 'admin'>('student');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check user role and redirect
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single()
          .then(({ data }) => {
            navigate(data?.role === 'admin' ? '/admin' : '/student');
          });
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      fullName: formData.get("fullName") as string,
      studentId: userType === 'student' ? formData.get("studentId") as string : undefined,
      department: userType === 'student' ? formData.get("department") as string : undefined,
    };

    try {
      signupSchema.parse(data);

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.fullName,
            student_id: data.studentId,
            department: data.department,
            role: userType,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created successfully!");
      navigate(userType === 'admin' ? '/admin' : '/student');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error creating account");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      signinSchema.parse(data);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Get user role and redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        toast.success("Signed in successfully!");
        navigate(roleData?.role === 'admin' ? '/admin' : '/student');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error signing in");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-hover animate-slide-up">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            {userType === 'student' ? (
              <GraduationCap className="h-12 w-12 text-primary" />
            ) : (
              <ShieldCheck className="h-12 w-12 text-secondary" />
            )}
          </div>
          <CardTitle className="text-3xl font-display">
            Internship Portal
          </CardTitle>
          <CardDescription>
            Remote Internship Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={userType === 'student' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setUserType('student')}
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Student
            </Button>
            <Button
              variant={userType === 'admin' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setUserType('admin')}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder={userType === 'student' ? "student@klu.edu" : "admin@klu.edu"}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder={userType === 'student' ? "student@klu.edu" : "admin@klu.edu"}
                    required
                    disabled={loading}
                  />
                </div>
                {userType === 'student' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-studentId">Student ID</Label>
                      <Input
                        id="signup-studentId"
                        name="studentId"
                        type="text"
                        placeholder="2400030001"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-department">Department</Label>
                      <Input
                        id="signup-department"
                        name="department"
                        type="text"
                        placeholder="Computer Science"
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a password (min 6 characters)"
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {userType === 'student' ? (
              <p>Demo credentials: 2400030001 / klu@123</p>
            ) : (
              <p>Demo credentials: 001 / klu@123</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
