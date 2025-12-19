"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Link2,
  ExternalLink,
} from "lucide-react";
import type { TelegramBotIntegration } from "@/lib/types/telegram";

export default function TelegramBotIntegrationsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [integrations, setIntegrations] = useState<TelegramBotIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<TelegramBotIntegration | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [integrationType, setIntegrationType] = useState("webhook");
  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, [botId]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("telegram_bot_integrations")
        .select("*")
        .eq("bot_id", botId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading integrations:", error);
        setIntegrations([]);
      } else {
        setIntegrations((data || []) as TelegramBotIntegration[]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewIntegration = () => {
    setEditingIntegration(null);
    setIntegrationType("webhook");
    setName("");
    setWebhookUrl("");
    setWebhookSecret("");
    setEnabled(true);
    setShowEditor(true);
    setError(null);
    setSuccess(null);
  };

  const handleEditIntegration = (integration: TelegramBotIntegration) => {
    setEditingIntegration(integration);
    setIntegrationType(integration.integration_type);
    setName(integration.name);
    setWebhookUrl(integration.config.url || "");
    setWebhookSecret(integration.config.secret || "");
    setEnabled(integration.enabled);
    setShowEditor(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingIntegration(null);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Názov integrácie je povinný");
      return;
    }

    if (integrationType === "webhook" && !webhookUrl.trim()) {
      setError("Webhook URL je povinný");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const config: any = {};
      if (integrationType === "webhook") {
        config.url = webhookUrl.trim();
        if (webhookSecret.trim()) {
          config.secret = webhookSecret.trim();
        }
        config.events = ["new_message", "command_used", "button_clicked"];
      }

      const integrationData: any = {
        bot_id: botId,
        integration_type: integrationType,
        name: name.trim(),
        config: config,
        enabled: enabled,
        updated_at: new Date().toISOString(),
      };

      if (editingIntegration) {
        const { error: updateError } = await supabase
          .from("telegram_bot_integrations")
          .update(integrationData)
          .eq("id", editingIntegration.id);

        if (updateError) {
          console.error("Error updating integration:", updateError);
          setError(updateError.message || "Chyba pri ukladaní integrácie");
          setSaving(false);
          return;
        }
        setSuccess("Integrácia bola úspešne aktualizovaná!");
      } else {
        const { error: insertError } = await supabase
          .from("telegram_bot_integrations")
          .insert(integrationData);

        if (insertError) {
          console.error("Error creating integration:", insertError);
          setError(insertError.message || "Chyba pri vytváraní integrácie");
          setSaving(false);
          return;
        }
        setSuccess("Integrácia bola úspešne vytvorená!");
      }

      setTimeout(() => {
        setSuccess(null);
        setShowEditor(false);
        setEditingIntegration(null);
        loadIntegrations();
      }, 1500);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm("Naozaj chceš zmazať túto integráciu?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("telegram_bot_integrations")
        .delete()
        .eq("id", integrationId);

      if (error) {
        console.error("Error deleting integration:", error);
        setError("Chyba pri mazaní integrácie");
      } else {
        setSuccess("Integrácia bola úspešne zmazaná!");
        setTimeout(() => setSuccess(null), 2000);
        loadIntegrations();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba pri mazaní");
    }
  };

  const toggleEnabled = async (integration: TelegramBotIntegration) => {
    try {
      const { error } = await supabase
        .from("telegram_bot_integrations")
        .update({ enabled: !integration.enabled })
        .eq("id", integration.id);

      if (error) {
        console.error("Error toggling integration:", error);
        setError("Chyba pri prepínaní integrácie");
      } else {
        loadIntegrations();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/telegram-bots/${botId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Späť na prehľad
          </Button>
          <h1 className="text-3xl font-bold">Integrácie</h1>
          <p className="text-muted-foreground">
            Webhooks a externé integrácie pre Telegram bota
          </p>
        </div>
        {!showEditor && (
          <Button onClick={handleNewIntegration}>
            <Plus className="h-4 w-4 mr-2" />
            Pridať integráciu
          </Button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm">
          {success}
        </div>
      )}

      {/* Editor */}
      {showEditor && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingIntegration ? "Upraviť integráciu" : "Pridať novú integráciu"}
            </CardTitle>
            <CardDescription>
              Nastav webhook alebo externú integráciu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="integrationType">Typ integrácie</Label>
              <select
                id="integrationType"
                value={integrationType}
                onChange={(e) => setIntegrationType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                disabled
              >
                <option value="webhook">Webhook (odchádzajúci)</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Ostatné typy integrácií (CRM, Sheets, atď.) budú dostupné neskôr
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Názov integrácie <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Napríklad: Môj webhook"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookUrl">
                Webhook URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="webhookUrl"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://tvoj-server.com/webhook"
              />
              <p className="text-xs text-muted-foreground">
                URL endpoint, kam sa budú posielať udalosti z Telegram bota
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">Secret (voliteľné)</Label>
              <Input
                id="webhookSecret"
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Tajný kľúč pre overenie požiadaviek"
              />
              <p className="text-xs text-muted-foreground">
                Používa sa na overenie, že požiadavka pochádza od tvojho bota
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Aktivovaná</Label>
                <p className="text-xs text-muted-foreground">
                  Zapnúť alebo vypnúť túto integráciu
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm font-medium mb-2">📡 Udalosti, ktoré sa pošlú:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li><code className="bg-muted px-1 rounded">new_message</code> - Nová správa</li>
                <li><code className="bg-muted px-1 rounded">command_used</code> - Použitý príkaz</li>
                <li><code className="bg-muted px-1 rounded">button_clicked</code> - Kliknutie na tlačidlo</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Webhook bude posielať POST requesty na tvoj endpoint s dátami o udalosti
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Zrušiť
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim() || !webhookUrl.trim()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Ukladám..." : "Uložiť integráciu"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integrations List */}
      {!showEditor && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : integrations.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Žiadne integrácie</CardTitle>
                <CardDescription>
                  Zatiaľ nemáš vytvorené žiadne integrácie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleNewIntegration}>
                  <Plus className="h-4 w-4 mr-2" />
                  Pridať prvú integráciu
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Link2 className="h-5 w-5" />
                          {integration.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <div className="space-y-1">
                            <p className="text-sm">
                              <strong>Typ:</strong> {integration.integration_type}
                            </p>
                            {integration.config.url && (
                              <p className="text-sm">
                                <strong>URL:</strong>{" "}
                                <a
                                  href={integration.config.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline inline-flex items-center gap-1"
                                >
                                  {integration.config.url}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </p>
                            )}
                            {integration.config.events && (
                              <p className="text-sm">
                                <strong>Udalosti:</strong> {integration.config.events.join(", ")}
                              </p>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Switch
                          checked={integration.enabled}
                          onCheckedChange={() => toggleEnabled(integration)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditIntegration(integration)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={integration.enabled ? "default" : "outline"}>
                        {integration.enabled ? "Aktivovaná" : "Deaktivovaná"}
                      </Badge>
                      <Badge variant="outline">{integration.integration_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="text-lg">💡 O integráciách</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Webhook</strong> - Posiela udalosti z bota na tvoj server</p>
          <p>• Webhook musí mať verejný HTTPS URL</p>
          <p>• Tvoj endpoint bude dostávať POST requesty s dátami o udalostiach</p>
          <p>• Secret môžeš použiť na overenie, že požiadavka pochádza od tvojho bota</p>
        </CardContent>
      </Card>
    </div>
  );
}