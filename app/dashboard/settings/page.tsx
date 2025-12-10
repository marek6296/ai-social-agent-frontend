"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { AnimatedPage } from "@/components/AnimatedPage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Key, User, Lock, Copy, Check } from "lucide-react";
import Link from "next/link";

type UserProfile = {
  id: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError(null);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        router.push("/login");
        return;
      }

      const { id, email, user_metadata } = userData.user;

      setUser({
        id,
        email: email ?? null,
        firstName: user_metadata?.firstName,
        lastName: user_metadata?.lastName,
      });

      setFirstName(user_metadata?.firstName || "");
      setLastName(user_metadata?.lastName || "");
      setEmail(email || "");

      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      });

      if (updateError) {
        setError("Nepodarilo sa aktualizovať profil: " + updateError.message);
      } else {
        setSuccess("Profil bol úspešne aktualizovaný.");
        setUser({
          ...user,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Nastala neočakávaná chyba.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 8) {
      setError("Nové heslo musí mať aspoň 8 znakov.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Nové heslá sa nezhodujú.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        setError("Aktuálne heslo je nesprávne.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError("Nepodarilo sa zmeniť heslo: " + updateError.message);
      } else {
        setSuccess("Heslo bolo úspešne zmenené.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Password change error:", err);
      setError("Nastala neočakávaná chyba.");
    } finally {
      setSaving(false);
    }
  };

  const generateApiKey = async () => {
    if (!user) return;

    setApiKeyLoading(true);
    setError(null);

    try {
      const newApiKey = `ai_${user.id.slice(0, 8)}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setApiKey(newApiKey);
      setSuccess("API kľúč bol vygenerovaný. Skopíruj si ho, lebo sa už nezobrazí!");
    } catch (err) {
      console.error("API key generation error:", err);
      setError("Nepodarilo sa vygenerovať API kľúč.");
    } finally {
      setApiKeyLoading(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Načítavam nastavenia…</p>
          </motion.div>
        </div>
      </AnimatedPage>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <motion.header
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <Badge variant="secondary" className="mb-2 gap-1.5">
                <User className="h-3 w-3" />
                Nastavenia účtu
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Nastavenia účtu
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Spravuj svoj profil, heslo a API kľúče.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Späť
              </Link>
            </Button>
          </motion.header>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border border-primary bg-primary/10 text-primary text-sm backdrop-blur-sm"
            >
              {success}
            </motion.div>
          )}

          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  Profil
                </CardTitle>
                <CardDescription>
                  Aktualizuj svoje osobné informácie.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Meno</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Priezvisko</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email sa nedá zmeniť. Kontaktuj podporu, ak potrebuješ zmeniť email.
                    </p>
                  </div>
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Ukladám…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Uložiť zmeny
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  Zmena hesla
                </CardTitle>
                <CardDescription>
                  Zmeň svoje heslo pre lepšiu bezpečnosť.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Aktuálne heslo</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nové heslo</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Heslo musí mať aspoň 8 znakov.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Potvrď nové heslo</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Mením heslo…
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Zmeniť heslo
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Key */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  API kľúč
                </CardTitle>
                <CardDescription>
                  API kľúč ti umožňuje prístup k tvojim dátam cez API. Používaj ho pre integrácie a automatizáciu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {apiKey ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        value={apiKey}
                        readOnly
                        className="pr-10 font-mono text-sm bg-background"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={copyApiKey}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10">
                      <p className="text-xs text-destructive font-semibold flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                        Tento kľúč sa už nezobrazí. Ulož si ho na bezpečné miesto!
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button onClick={generateApiKey} disabled={apiKeyLoading} className="gap-2">
                    {apiKeyLoading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Generujem…
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Vygenerovať API kľúč
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatedPage>
  );
}
