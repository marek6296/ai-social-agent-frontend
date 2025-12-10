"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedPage } from "@/components/AnimatedPage";
import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Vytvorenie users_profile záznamu s default plánom "starter"
        const { error: profileError } = await supabase
          .from("users_profile")
          .insert({
            id: data.user.id,
            plan: "starter",
            is_active: true,
            is_admin: false,
            credits_used_this_month: 0,
            last_credit_reset: new Date().toISOString(),
          });

        if (profileError) {
          console.error("Failed to create user profile:", profileError);
          // Pokračujeme aj keď sa nepodarilo vytvoriť profil (možno tabuľka neexistuje)
        }

        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Nastala chyba pri registrácii. Skús to znova.");
      setLoading(false);
    }
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  AI
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Vytvoriť účet</CardTitle>
              <CardDescription>
                Zaregistruj sa a začni používať AI Social Agent pre svoj web.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Meno</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Ján"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Priezvisko</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Novák"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ty@firma.sk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Heslo</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Vytváram účet..." : "Vytvoriť účet"}
                  {!loading && <UserPlus className="ml-2 h-4 w-4" />}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">Už máš účet? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Prihlásiť sa
                  <ArrowRight className="inline ml-1 h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatedPage>
  );
}
