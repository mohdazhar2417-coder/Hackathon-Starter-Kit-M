import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useSignup } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Code2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "admin"]).default("student"),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { login } = useAuth();
  useEffect(() => { document.title = "Create Account · LogicLens"; }, []);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const signupMutation = useSignup();

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", role: "student" },
  });

  const onSubmit = (data: SignupForm) => {
    signupMutation.mutate(
      { data },
      {
        onSuccess: (response) => {
          login(response.token, response.user);
          toast({ title: "Account created!", description: `Welcome to LogicLens, ${response.user.name}!` });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            title: "Signup failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-card border-r border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">LogicLens</p>
            <p className="text-xs text-muted-foreground">TraceWise AI</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Start understanding your code today</h2>
          <div className="space-y-4">
            {[
              "Step through Java programs one statement at a time",
              "See every variable change at each execution step",
              "Understand if/else branches and loop iterations visually",
              "Save traces and revisit your learning progress",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Built for CS101 students, bootcamp learners, and self-taught programmers who want to truly understand Java.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start tracing Java programs for free</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="signup-form">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Alex Johnson" data-testid="input-name" className="bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="you@example.com" data-testid="input-email" className="bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          data-testid="input-password"
                          className="bg-card pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card" data-testid="select-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student / Learner</SelectItem>
                        <SelectItem value="admin">Admin / Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={signupMutation.isPending} data-testid="button-submit">
                {signupMutation.isPending ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary font-medium hover:underline cursor-pointer" data-testid="link-login">Sign in</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
