"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Code,
} from "lucide-react";
import type { TelegramBotCommand } from "@/lib/types/telegram";

export default function TelegramBotCommandsPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;

  const [commands, setCommands] = useState<TelegramBotCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCommand, setEditingCommand] = useState<TelegramBotCommand | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [commandTrigger, setCommandTrigger] = useState("");
  const [commandType, setCommandType] = useState<"text" | "action" | "menu">("text");
  const [responseText, setResponseText] = useState("");
  const [adminOnly, setAdminOnly] = useState(false);
  const [privateChatOnly, setPrivateChatOnly] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [displayOrder, setDisplayOrder] = useState(0);

  useEffect(() => {
    loadCommands();
  }, [botId]);

  const loadCommands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("telegram_bot_commands")
        .select("*")
        .eq("bot_id", botId)
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error loading commands:", error);
        setCommands([]);
      } else {
        setCommands((data || []) as TelegramBotCommand[]);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setCommands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCommand = () => {
    setEditingCommand(null);
    setCommandTrigger("");
    setCommandType("text");
    setResponseText("");
    setAdminOnly(false);
    setPrivateChatOnly(false);
    setCooldownSeconds(0);
    setDisplayOrder(commands.length);
    setShowEditor(true);
    setError(null);
    setSuccess(null);
  };

  const handleEditCommand = (command: TelegramBotCommand) => {
    setEditingCommand(command);
    setCommandTrigger(command.command_trigger);
    setCommandType(command.command_type);
    setResponseText(command.response_text || "");
    setAdminOnly(command.admin_only);
    setPrivateChatOnly(command.private_chat_only);
    setCooldownSeconds(command.cooldown_seconds);
    setDisplayOrder(command.display_order);
    setShowEditor(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setShowEditor(false);
    setEditingCommand(null);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!commandTrigger.trim()) {
      setError("Názov príkazu je povinný");
      return;
    }

    // Ensure command starts with /
    const trigger = commandTrigger.trim().startsWith("/") 
      ? commandTrigger.trim() 
      : `/${commandTrigger.trim()}`;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const commandData: any = {
        bot_id: botId,
        command_trigger: trigger,
        command_type: commandType,
        response_text: commandType === "text" ? responseText.trim() : null,
        action_type: commandType === "action" ? "send_message" : null,
        action_config: commandType === "action" ? { text: responseText.trim() } : null,
        admin_only: adminOnly,
        private_chat_only: privateChatOnly,
        cooldown_seconds: cooldownSeconds,
        display_order: displayOrder,
        updated_at: new Date().toISOString(),
      };

      if (editingCommand) {
        // Update existing command
        const { error: updateError } = await supabase
          .from("telegram_bot_commands")
          .update(commandData)
          .eq("id", editingCommand.id);

        if (updateError) {
          console.error("Error updating command:", updateError);
          setError(updateError.message || "Chyba pri ukladaní príkazu");
          setSaving(false);
          return;
        }
        setSuccess("Príkaz bol úspešne aktualizovaný!");
      } else {
        // Create new command
        const { error: insertError } = await supabase
          .from("telegram_bot_commands")
          .insert(commandData);

        if (insertError) {
          console.error("Error creating command:", insertError);
          setError(insertError.message || "Chyba pri vytváraní príkazu");
          setSaving(false);
          return;
        }
        setSuccess("Príkaz bol úspešne vytvorený!");
      }

      setTimeout(() => {
        setSuccess(null);
        setShowEditor(false);
        setEditingCommand(null);
        loadCommands();
      }, 1500);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (commandId: string) => {
    if (!confirm("Naozaj chceš zmazať tento príkaz?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("telegram_bot_commands")
        .delete()
        .eq("id", commandId);

      if (error) {
        console.error("Error deleting command:", error);
        setError("Chyba pri mazaní príkazu");
      } else {
        setSuccess("Príkaz bol úspešne zmazaný!");
        setTimeout(() => setSuccess(null), 2000);
        loadCommands();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Neočakávaná chyba pri mazaní");
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
          <h1 className="text-3xl font-bold">Príkazy & Flow</h1>
          <p className="text-muted-foreground">Spravuj príkazy pre svojho Telegram bota</p>
        </div>
        {!showEditor && (
          <Button onClick={handleNewCommand}>
            <Plus className="h-4 w-4 mr-2" />
            Vytvoriť príkaz
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
              {editingCommand ? "Upraviť príkaz" : "Vytvoriť nový príkaz"}
            </CardTitle>
            <CardDescription>
              Nastav príkaz, ktorý bude bot rozpoznávať a odpovedať naň
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="commandTrigger">
                Názov príkazu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="commandTrigger"
                value={commandTrigger}
                onChange={(e) => setCommandTrigger(e.target.value)}
                placeholder="/start, /help, /menu"
              />
              <p className="text-xs text-muted-foreground">
                Príkaz musí začínať s /. Napríklad: /start, /help, /menu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commandType">Typ príkazu</Label>
              <Select value={commandType} onValueChange={(value: any) => setCommandType(value)}>
                <SelectTrigger id="commandType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Textová odpoveď</SelectItem>
                  <SelectItem value="action">Akcia (zatiaľ nie je implementované)</SelectItem>
                  <SelectItem value="menu">Menu (zatiaľ nie je implementované)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Textová odpoveď - bot pošle text. Akcia/Menu zatiaľ nie je dostupné.
              </p>
            </div>

            {commandType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="responseText">Odpoveď</Label>
                <Textarea
                  id="responseText"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Text, ktorý bot pošle ako odpoveď na tento príkaz..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Tento text sa pošle, keď používateľ použije tento príkaz
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="adminOnly">Iba pre adminov</Label>
                  <p className="text-xs text-muted-foreground">
                    Len administrátori môžu použiť tento príkaz
                  </p>
                </div>
                <Switch
                  id="adminOnly"
                  checked={adminOnly}
                  onCheckedChange={setAdminOnly}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="privateChatOnly">Iba v súkromných chatoch</Label>
                  <p className="text-xs text-muted-foreground">
                    Príkaz funguje len v súkromných správach, nie v skupinách
                  </p>
                </div>
                <Switch
                  id="privateChatOnly"
                  checked={privateChatOnly}
                  onCheckedChange={setPrivateChatOnly}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cooldownSeconds">Cooldown (sekundy)</Label>
                <Input
                  id="cooldownSeconds"
                  type="number"
                  value={cooldownSeconds}
                  onChange={(e) => setCooldownSeconds(parseInt(e.target.value) || 0)}
                  min={0}
                  max={3600}
                />
                <p className="text-xs text-muted-foreground">
                  Ako dlho musí používateľ počkať medzi použitiami príkazu
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Poradie</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">
                  Poradie zobrazenia príkazu (nižšie = vyššie v zozname)
                </p>
              </div>
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
                disabled={saving || !commandTrigger.trim()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Ukladám..." : "Uložiť príkaz"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commands List */}
      {!showEditor && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : commands.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Žiadne príkazy</CardTitle>
                <CardDescription>
                  Zatiaľ nemáš vytvorené žiadne príkazy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleNewCommand}>
                  <Plus className="h-4 w-4 mr-2" />
                  Vytvoriť prvý príkaz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {commands.map((command) => (
                <Card key={command.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Code className="h-5 w-5" />
                          {command.command_trigger}
                        </CardTitle>
                        {command.command_type === "text" && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Odpoveď:</p>
                            <div className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">
                              {command.response_text || "—"}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCommand(command)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(command.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{command.command_type}</Badge>
                      {command.admin_only && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500">
                          Iba admin
                        </Badge>
                      )}
                      {command.private_chat_only && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                          Iba súkromné chaty
                        </Badge>
                      )}
                      {command.cooldown_seconds > 0 && (
                        <Badge variant="outline">
                          Cooldown: {command.cooldown_seconds}s
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Poradie: {command.display_order}
                      </Badge>
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
          <CardTitle className="text-lg">💡 Tipy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Štandardné príkazy: <code className="bg-muted px-1 rounded">/start</code>, <code className="bg-muted px-1 rounded">/help</code> sú automaticky spracované ak sú zapnuté moduly v nastaveniach</p>
          <p>• Vlastné príkazy môžeš vytvoriť pre akúkoľvek funkcionalitu</p>
          <p>• Príkazy musia začínať s <code className="bg-muted px-1 rounded">/</code></p>
          <p>• Cooldown zabráni spamovaniu príkazov</p>
        </CardContent>
      </Card>
    </div>
  );
}