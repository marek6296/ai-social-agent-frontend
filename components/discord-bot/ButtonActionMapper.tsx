"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export interface ButtonAction {
  action_type: "reply" | "edit_message" | "assign_role" | "remove_role" | "save_to_db" | "open_modal" | "open_url" | "create_ticket" | "event_join" | "event_leave" | "event_maybe" | "event_decline";
  action_payload: any;
}

interface ButtonActionMapperProps {
  buttonId: string;
  buttonLabel: string;
  templateId?: string;
  pageIndex: number;
  pages?: Array<{ name: string }>;
  initialAction?: ButtonAction;
  onSave: (buttonId: string, action: ButtonAction) => void;
  onCancel: () => void;
}

export function ButtonActionMapper({
  buttonId,
  buttonLabel,
  templateId,
  pageIndex,
  pages = [],
  initialAction,
  onSave,
  onCancel,
}: ButtonActionMapperProps) {
  const [actionType, setActionType] = useState<ButtonAction["action_type"]>(
    initialAction?.action_type || "reply"
  );
  const [payload, setPayload] = useState<any>(initialAction?.action_payload || {});

  const handleSave = () => {
    onSave(buttonId, {
      action_type: actionType,
      action_payload: payload,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Konfigurovať akciu pre: {buttonLabel}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Typ akcie</Label>
            <Select value={actionType} onValueChange={(value: any) => setActionType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reply">Odpoveď (reply)</SelectItem>
                <SelectItem value="edit_message">Zmeniť stránku (edit message)</SelectItem>
                <SelectItem value="assign_role">Pridať rolu</SelectItem>
                <SelectItem value="remove_role">Odobrať rolu</SelectItem>
                <SelectItem value="save_to_db">Uložiť do DB (RSVP)</SelectItem>
                <SelectItem value="event_join">Event: Pridať sa (Join)</SelectItem>
                <SelectItem value="event_leave">Event: Odhlásiť sa (Leave)</SelectItem>
                <SelectItem value="event_maybe">Event: Možno (Maybe)</SelectItem>
                <SelectItem value="event_decline">Event: Nezúčastním sa (Decline)</SelectItem>
                <SelectItem value="open_modal">Otvoriť modal (form)</SelectItem>
                <SelectItem value="open_url">Otvoriť URL</SelectItem>
                <SelectItem value="create_ticket">Vytvoriť ticket (channel)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reply action */}
          {actionType === "reply" && (
            <div className="space-y-4">
              <div>
                <Label>Text odpovede</Label>
                <Textarea
                  value={payload.content || ""}
                  onChange={(e) => setPayload({ ...payload, content: e.target.value })}
                  placeholder="✅ Spracované!"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ephemeral"
                  checked={payload.ephemeral !== false}
                  onChange={(e) => setPayload({ ...payload, ephemeral: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="ephemeral">Ephemeral (len pre toho, kto klikol)</Label>
              </div>
            </div>
          )}

          {/* Edit message action */}
          {actionType === "edit_message" && (
            <div className="space-y-4">
              <div>
                <Label>Vyber stránku</Label>
                {pages.length > 0 ? (
                  <Select
                    value={payload.page_index?.toString() || "0"}
                    onValueChange={(value) =>
                      setPayload({ ...payload, page_index: parseInt(value) || 0 })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyber stránku..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map((page, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {page.name || `Stránka ${index + 1}`} {index === pageIndex && "(aktuálna)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    value={payload.page_index || 0}
                    onChange={(e) =>
                      setPayload({ ...payload, page_index: parseInt(e.target.value) || 0 })
                    }
                    placeholder="Index stránky (0 = prvá stránka)"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Ktorá stránka sa má zobraziť po kliknutí na button
                </p>
              </div>
            </div>
          )}

          {/* Assign/Remove role action */}
          {(actionType === "assign_role" || actionType === "remove_role") && (
            <div>
              <Label>Role ID</Label>
              <Input
                value={payload.role_id || ""}
                onChange={(e) => setPayload({ ...payload, role_id: e.target.value.trim() })}
                placeholder="123456789012345678"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ID roly, ktorá sa má pridať/odobrať
              </p>
            </div>
          )}

          {/* Save to DB action */}
          {actionType === "save_to_db" && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={payload.status || "going"}
                  onValueChange={(value) => setPayload({ ...payload, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="going">Going</SelectItem>
                    <SelectItem value="maybe">Maybe</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dodatočné dáta (JSON, voliteľné)</Label>
                <Textarea
                  value={JSON.stringify(payload.data || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const data = JSON.parse(e.target.value);
                      setPayload({ ...payload, data });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"custom": "value"}'
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Open modal action */}
          {actionType === "open_modal" && (
            <div className="space-y-4">
              <div>
                <Label>Modal ID</Label>
                <Input
                  value={payload.modal_id || ""}
                  onChange={(e) => setPayload({ ...payload, modal_id: e.target.value })}
                  placeholder="join_event_modal"
                />
              </div>
              <div>
                <Label>Modal title</Label>
                <Input
                  value={payload.title || ""}
                  onChange={(e) => setPayload({ ...payload, title: e.target.value })}
                  placeholder="Join Event"
                />
              </div>
              <div>
                <Label>Form fields (JSON)</Label>
                <Textarea
                  value={JSON.stringify(payload.fields || [], null, 2)}
                  onChange={(e) => {
                    try {
                      const fields = JSON.parse(e.target.value);
                      setPayload({ ...payload, fields });
                    } catch {
                      // Invalid JSON
                    }
                  }}
                  placeholder='[{"id": "name", "label": "Name", "style": "short", "required": true}]'
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Array objektov: id, label, style (short/paragraph), required, placeholder
                </p>
              </div>
            </div>
          )}

          {/* Open URL action */}
          {actionType === "open_url" && (
            <div>
              <Label>URL</Label>
              <Input
                value={payload.url || ""}
                onChange={(e) => setPayload({ ...payload, url: e.target.value })}
                placeholder="https://example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL, ktorá sa otvorí po kliknutí (vyžaduje button style = "link")
              </p>
            </div>
          )}

          {/* Event RSVP actions */}
          {(actionType === "event_join" || actionType === "event_leave" || actionType === "event_maybe" || actionType === "event_decline") && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Event RSVP akcia:</strong> {
                    actionType === "event_join" ? "Pridať sa na event" : 
                    actionType === "event_leave" ? "Odhlásiť sa z eventu" : 
                    actionType === "event_maybe" ? "Možno prísť na event" :
                    "Nezúčastním sa na evente"
                  }
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Užívateľ bude pridaný/odobraný z eventu s príslušným statusom. Status sa uloží do databázy a môže sa použiť na zobrazenie počtu účastníkov.
                </p>
              </div>
              <div>
                <Label>Role ID (voliteľné)</Label>
                <Input
                  value={payload.role_id || ""}
                  onChange={(e) => setPayload({ ...payload, role_id: e.target.value.trim() })}
                  placeholder="123456789012345678"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID roly, ktorá sa automaticky pridá/odoberie pri join/leave (voliteľné)
                </p>
              </div>
              <div>
                <Label>Odpoveď po kliknutí (voliteľné)</Label>
                <Textarea
                  value={payload.response_message || ""}
                  onChange={(e) => setPayload({ ...payload, response_message: e.target.value })}
                  placeholder={
                    actionType === "event_join" ? "✅ Príhlásil si sa na event!" : 
                    actionType === "event_leave" ? "❌ Odhlásil si sa z eventu." : 
                    actionType === "event_maybe" ? "❓ Zaznamenali sme, že možno prídeš." :
                    "❌ Zaznamenali sme, že sa nezúčastníš."
                  }
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Správa, ktorá sa zobrazí užívateľovi po kliknutí (ephemeral)
                </p>
              </div>
            </div>
          )}

          {/* Create ticket action */}
          {actionType === "create_ticket" && (
            <div className="space-y-4">
              <div>
                <Label>Názov kanála (voliteľné)</Label>
                <Input
                  value={payload.channel_name || ""}
                  onChange={(e) => setPayload({ ...payload, channel_name: e.target.value })}
                  placeholder="ticket-username (automaticky ak prázdne)"
                />
              </div>
              <div>
                <Label>Category ID (voliteľné)</Label>
                <Input
                  value={payload.category_id || ""}
                  onChange={(e) => setPayload({ ...payload, category_id: e.target.value.trim() })}
                  placeholder="123456789012345678"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID kategórie, kde sa vytvorí ticket kanál
                </p>
              </div>
              <div>
                <Label>Support Role IDs (voliteľné, JSON array)</Label>
                <Input
                  value={Array.isArray(payload.support_roles) ? payload.support_roles.join(', ') : (payload.support_roles || '')}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value) {
                      const roles = value.split(',').map(r => r.trim()).filter(Boolean);
                      setPayload({ ...payload, support_roles: roles });
                    } else {
                      setPayload({ ...payload, support_roles: [] });
                    }
                  }}
                  placeholder="123456789012345678, 987654321098765432"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Role IDs, ktoré budú mať prístup k ticketu (oddelené čiarkou)
                </p>
              </div>
              <div>
                <Label>Welcome message (voliteľné)</Label>
                <Textarea
                  value={payload.welcome_message || ""}
                  onChange={(e) => setPayload({ ...payload, welcome_message: e.target.value })}
                  placeholder="Vitaj v tickete! Ako ti môžem pomôcť?"
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onCancel}>
              Zrušiť
            </Button>
            <Button onClick={handleSave}>Uložiť akciu</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

