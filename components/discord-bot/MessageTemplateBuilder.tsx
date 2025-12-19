"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, Save, X, ChevronRight, ChevronLeft, Settings } from "lucide-react";
import { ButtonActionMapper, ButtonAction } from "./ButtonActionMapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MessagePage {
  name: string;
  embed: {
    title?: string;
    description?: string;
    color?: string;
    thumbnail?: string;
    image?: string;
    footer?: string;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
  };
  components: {
    buttons?: Array<{
      id: string;
      label: string;
      style: "primary" | "secondary" | "success" | "danger" | "link";
      emoji?: string;
      url?: string;
      action?: string;
    }>;
    selectMenus?: Array<{
      id: string;
      placeholder: string;
      minValues?: number;
      maxValues?: number;
      options: Array<{
        label: string;
        value: string;
        description?: string;
        emoji?: string;
      }>;
    }>;
    poll?: {
      question: string;
      options: Array<string>;
      allowMultiple?: boolean;
      showResults?: boolean;
    };
  };
}

export interface MessageTemplate {
  id?: string;
  name: string;
  guild_id: string;
  pages: MessagePage[];
  current_page_index: number;
}

interface MessageTemplateBuilderProps {
  template?: MessageTemplate;
  guildId?: string;
  onSave: (template: MessageTemplate) => Promise<void>;
  onCancel: () => void;
}

export function MessageTemplateBuilder({
  template,
  guildId = "",
  onSave,
  onCancel,
}: MessageTemplateBuilderProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editingButtonAction, setEditingButtonAction] = useState<{
    buttonId: string;
    buttonLabel: string;
    index: number;
  } | null>(null);
  const [buttonActions, setButtonActions] = useState<Record<string, ButtonAction>>({});
  const [templateData, setTemplateData] = useState<MessageTemplate>(
    template || {
      name: "",
      guild_id: guildId,
      pages: [
        {
          name: "Main",
          embed: {},
          components: {},
        },
      ],
      current_page_index: 0,
    }
  );

  const currentPage = templateData.pages[currentPageIndex] || templateData.pages[0];

  const updatePage = (updates: Partial<MessagePage>) => {
    const newPages = [...templateData.pages];
    newPages[currentPageIndex] = { ...currentPage, ...updates };
    setTemplateData({ ...templateData, pages: newPages });
  };

  const updateEmbed = (updates: Partial<MessagePage["embed"]>) => {
    updatePage({ embed: { ...currentPage.embed, ...updates } });
  };

  const updateComponents = (updates: Partial<MessagePage["components"]>) => {
    updatePage({ components: { ...currentPage.components, ...updates } });
  };

  const addField = () => {
    const fields = currentPage.embed.fields || [];
    updateEmbed({ fields: [...fields, { name: "", value: "", inline: false }] });
  };

  const updateField = (index: number, updates: Partial<{ name: string; value: string; inline?: boolean }>) => {
    const fields = [...(currentPage.embed.fields || [])];
    fields[index] = { ...fields[index], ...updates };
    updateEmbed({ fields });
  };

  const removeField = (index: number) => {
    const fields = currentPage.embed.fields?.filter((_, i) => i !== index) || [];
    updateEmbed({ fields });
  };

  const addButton = () => {
    const buttons = currentPage.components.buttons || [];
    const buttonId = `btn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    updateComponents({
      buttons: [
        ...buttons,
        {
          id: buttonId,
          label: "New Button",
          style: "primary",
        },
      ],
    });
  };

  const updateButton = (
    index: number,
    updates: Partial<MessagePage["components"]["buttons"][0]>
  ) => {
    const buttons = [...(currentPage.components.buttons || [])];
    buttons[index] = { ...buttons[index], ...updates };
    updateComponents({ buttons });
  };

  const removeButton = (index: number) => {
    const buttons = currentPage.components.buttons?.filter((_, i) => i !== index) || [];
    updateComponents({ buttons });
  };

  const addPage = () => {
    const newPage: MessagePage = {
      name: `Page ${templateData.pages.length + 1}`,
      embed: {},
      components: {},
    };
    setTemplateData({
      ...templateData,
      pages: [...templateData.pages, newPage],
    });
    setCurrentPageIndex(templateData.pages.length);
  };

  const removePage = (index: number) => {
    if (templateData.pages.length <= 1) {
      alert("Musíš mať aspoň jednu stránku");
      return;
    }
    const newPages = templateData.pages.filter((_, i) => i !== index);
    setTemplateData({ ...templateData, pages: newPages });
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
  };

  const handleSaveButtonAction = async (buttonId: string, action: ButtonAction) => {
    setButtonActions({ ...buttonActions, [buttonId]: action });
    setEditingButtonAction(null);
    
    // Save action to database if template has ID
    if (templateData.id) {
      try {
        const { supabase: supabaseClient } = await import("@/lib/supabaseClient");
        await supabaseClient.from("discord_template_actions").upsert({
          template_id: templateData.id,
          custom_id: buttonId,
          page_index: currentPageIndex,
          action_type: action.action_type,
          action_payload_json: action.action_payload,
        });
      } catch (error) {
        console.error("Error saving button action:", error);
      }
    }
  };

  const handleSave = async () => {
    if (!templateData.name.trim()) {
      alert("Zadaj názov template");
      return;
    }
    
    // Save button actions to template
    // Actions will be saved separately to discord_template_actions table
    await onSave(templateData);
    
    // Also save actions if template has ID (edit mode)
    if (templateData.id && Object.keys(buttonActions).length > 0) {
      // Save actions to database
      const { supabase: supabaseClient } = await import("@/lib/supabaseClient");
      for (const [buttonId, action] of Object.entries(buttonActions)) {
        await supabaseClient.from("discord_template_actions").upsert({
          template_id: templateData.id,
          custom_id: buttonId,
          page_index: currentPageIndex,
          action_type: action.action_type,
          action_payload_json: action.action_payload,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Input
            value={templateData.name}
            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
            placeholder="Názov template"
            className="text-2xl font-bold border-none p-0 h-auto"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Guild ID: {guildId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Zrušiť
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Uložiť
          </Button>
        </div>
      </div>

      {/* Pages tabs */}
      <div className="flex items-center gap-2 border-b pb-2">
        {templateData.pages.map((page, index) => (
          <div key={index} className="flex items-center gap-1">
            <Button
              variant={currentPageIndex === index ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPageIndex(index)}
            >
              {page.name}
            </Button>
            {templateData.pages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removePage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addPage}>
          <Plus className="h-4 w-4 mr-1" />
          Pridať page
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Názov page</Label>
                <Input
                  value={currentPage.name}
                  onChange={(e) => updatePage({ name: e.target.value })}
                  placeholder="Main"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={currentPage.embed.title || ""}
                  onChange={(e) => updateEmbed({ title: e.target.value })}
                  placeholder="Embed title"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={currentPage.embed.description || ""}
                  onChange={(e) => updateEmbed({ description: e.target.value })}
                  placeholder="Embed description"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Color (hex)</Label>
                  <Input
                    type="color"
                    value={currentPage.embed.color || "#5865F2"}
                    onChange={(e) => updateEmbed({ color: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Color hex code</Label>
                  <Input
                    value={currentPage.embed.color || "#5865F2"}
                    onChange={(e) => updateEmbed({ color: e.target.value })}
                    placeholder="#5865F2"
                    className="font-mono"
                  />
                </div>
              </div>

              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  value={currentPage.embed.thumbnail || ""}
                  onChange={(e) => updateEmbed({ thumbnail: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Image URL</Label>
                <Input
                  value={currentPage.embed.image || ""}
                  onChange={(e) => updateEmbed({ image: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Footer</Label>
                <Input
                  value={currentPage.embed.footer || ""}
                  onChange={(e) => updateEmbed({ footer: e.target.value })}
                  placeholder="Footer text"
                />
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Fields</Label>
                  <Button variant="outline" size="sm" onClick={addField}>
                    <Plus className="h-4 w-4 mr-1" />
                    Pridať field
                  </Button>
                </div>
                <div className="space-y-2">
                  {currentPage.embed.fields?.map((field, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                            placeholder="Field name"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.inline || false}
                              onChange={(e) => updateField(index, { inline: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <Label className="text-xs">Inline</Label>
                          </div>
                        </div>
                        <Textarea
                          value={field.value}
                          onChange={(e) => updateField(index, { value: e.target.value })}
                          placeholder="Field value"
                          rows={2}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Odstrániť
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Components */}
          <Card>
            <CardHeader>
              <CardTitle>Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Component Type Selection - Tabs */}
              <Tabs defaultValue="buttons" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="buttons">Buttons</TabsTrigger>
                  <TabsTrigger value="select">Select Menu</TabsTrigger>
                  <TabsTrigger value="poll">Anketa</TabsTrigger>
                </TabsList>

                {/* Buttons Tab */}
                <TabsContent value="buttons" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Buttons (max 5)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addButton}
                      disabled={(currentPage.components.buttons?.length || 0) >= 5}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Pridať button
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {currentPage.components.buttons?.map((button, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-2">
                          <Input
                            value={button.label}
                            onChange={(e) => updateButton(index, { label: e.target.value })}
                            placeholder="Button label"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Style</Label>
                              <Select
                                value={button.style}
                                onValueChange={(value: any) =>
                                  updateButton(index, { style: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="primary">Primary (Blue)</SelectItem>
                                  <SelectItem value="secondary">Secondary (Grey)</SelectItem>
                                  <SelectItem value="success">Success (Green)</SelectItem>
                                  <SelectItem value="danger">Danger (Red)</SelectItem>
                                  <SelectItem value="link">Link</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Emoji (voliteľné)</Label>
                              <Input
                                value={button.emoji || ""}
                                onChange={(e) => updateButton(index, { emoji: e.target.value })}
                                placeholder="✅"
                              />
                            </div>
                          </div>
                          <Input
                            value={button.url || ""}
                            onChange={(e) => updateButton(index, { url: e.target.value })}
                            placeholder="URL (ak je style=link)"
                          />
                          <div className="text-xs text-muted-foreground font-mono">
                            ID: {button.id}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingButtonAction({
                                  buttonId: button.id,
                                  buttonLabel: button.label,
                                  index,
                                })
                              }
                              className="flex-1"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Akcia
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeButton(index)}
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Odstrániť
                            </Button>
                          </div>
                          {buttonActions[button.id] && (
                            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                              Akcia: <strong>{buttonActions[button.id].action_type}</strong>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Poll Tab */}
                <TabsContent value="poll" className="space-y-4 mt-4">
                  {!currentPage.components.poll ? (
                    <div className="text-center py-8 text-muted-foreground space-y-4">
                      <p>Zatiaľ nemáš vytvorenú anketu.</p>
                      <p className="text-sm">Anketa umožňuje používateľom hlasovať pomocou buttons.</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          updateComponents({
                            poll: {
                              question: "",
                              options: ["Áno", "Nie"],
                              allowMultiple: false,
                              showResults: true,
                            },
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Vytvoriť anketu
                      </Button>
                    </div>
                  ) : (
                    <Card className="p-3">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Otázka ankety</Label>
                          <Input
                            value={currentPage.components.poll.question}
                            onChange={(e) =>
                              updateComponents({
                                poll: {
                                  ...currentPage.components.poll!,
                                  question: e.target.value,
                                },
                              })
                            }
                            placeholder="Napríklad: Ktorý dátum ti vyhovuje?"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Možnosti (jedna na riadok, max 5)</Label>
                          <div className="space-y-2">
                            {currentPage.components.poll.options.map((option, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...currentPage.components.poll!.options];
                                    newOptions[index] = e.target.value;
                                    updateComponents({
                                      poll: {
                                        ...currentPage.components.poll!,
                                        options: newOptions,
                                      },
                                    });
                                  }}
                                  placeholder={`Možnosť ${index + 1}`}
                                />
                                {currentPage.components.poll!.options.length > 2 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10"
                                    onClick={() => {
                                      const newOptions = currentPage.components.poll!.options.filter(
                                        (_, i) => i !== index
                                      );
                                      updateComponents({
                                        poll: {
                                          ...currentPage.components.poll!,
                                          options: newOptions,
                                        },
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          {currentPage.components.poll.options.length < 5 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2"
                              onClick={() => {
                                const newOptions = [
                                  ...currentPage.components.poll!.options,
                                  `Možnosť ${currentPage.components.poll!.options.length + 1}`,
                                ];
                                updateComponents({
                                  poll: {
                                    ...currentPage.components.poll!,
                                    options: newOptions,
                                  },
                                });
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Pridať možnosť
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={currentPage.components.poll.allowMultiple || false}
                              onChange={(e) =>
                                updateComponents({
                                  poll: {
                                    ...currentPage.components.poll!,
                                    allowMultiple: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4"
                            />
                            <Label className="text-xs">Povoliť viacnásobné hlasovanie</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={currentPage.components.poll.showResults !== false}
                              onChange={(e) =>
                                updateComponents({
                                  poll: {
                                    ...currentPage.components.poll!,
                                    showResults: e.target.checked,
                                  },
                                })
                              }
                              className="h-4 w-4"
                            />
                            <Label className="text-xs">Zobraziť výsledky</Label>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateComponents({ poll: undefined });
                        }}
                        className="w-full mt-4"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Odstrániť anketu
                      </Button>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#2f3136] rounded-lg p-4 space-y-4">
                {/* Embed Preview */}
                {currentPage.embed.title || currentPage.embed.description ? (
                  <div
                    className="rounded border-l-4 p-3"
                    style={{
                      borderLeftColor: currentPage.embed.color || "#5865F2",
                      backgroundColor: "#2b2d31",
                    }}
                  >
                    {currentPage.embed.thumbnail && (
                      <img
                        src={currentPage.embed.thumbnail}
                        alt="Thumbnail"
                        className="float-right ml-4 mb-2 rounded w-20 h-20 object-cover"
                      />
                    )}
                    {currentPage.embed.title && (
                      <div className="text-white font-semibold text-lg mb-1">
                        {currentPage.embed.title}
                      </div>
                    )}
                    {currentPage.embed.description && (
                      <div className="text-[#dcddde] text-sm mb-2 whitespace-pre-wrap">
                        {currentPage.embed.description}
                      </div>
                    )}
                    {currentPage.embed.fields && currentPage.embed.fields.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {currentPage.embed.fields.map((field, index) => (
                          <div
                            key={index}
                            className={field.inline ? "inline-block mr-4" : "block"}
                          >
                            <div className="text-[#dcddde] font-semibold text-sm">
                              {field.name}
                            </div>
                            <div className="text-[#72767d] text-sm">{field.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {currentPage.embed.image && (
                      <img
                        src={currentPage.embed.image}
                        alt="Embed image"
                        className="mt-2 rounded max-w-full"
                      />
                    )}
                    {currentPage.embed.footer && (
                      <div className="text-[#72767d] text-xs mt-2">{currentPage.embed.footer}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-[#72767d] text-sm italic">
                    Embed preview sa zobrazí po pridaní title alebo description
                  </div>
                )}

                {/* Select Menus Preview */}
                {currentPage.components.selectMenus && currentPage.components.selectMenus.length > 0 && (
                  <div className="mt-4">
                    {currentPage.components.selectMenus.map((selectMenu, index) => (
                      <div key={index} className="mb-3">
                        <select
                          className="w-full bg-[#2b2d31] border border-[#40444b] rounded px-3 py-2 text-white text-sm"
                          disabled
                        >
                          <option>{selectMenu.placeholder}</option>
                          {selectMenu.options.map((opt, optIndex) => (
                            <option key={optIndex} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {/* Poll Preview */}
                {currentPage.components.poll && currentPage.components.poll.question && (
                  <div className="mt-4">
                    <div
                      className="rounded border-l-4 p-3 mb-3"
                      style={{
                        borderLeftColor: currentPage.embed.color || "#5865F2",
                        backgroundColor: "#2b2d31",
                      }}
                    >
                      <div className="text-white font-semibold text-lg mb-2">
                        📊 {currentPage.components.poll.question}
                      </div>
                      <div className="text-[#72767d] text-xs">Hlasovanie</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentPage.components.poll.options.map((option, index) => (
                        <button
                          key={index}
                          className="px-4 py-2 rounded text-sm font-medium bg-[#5865F2] text-white hover:bg-[#4752C4]"
                          disabled
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons Preview */}
                {currentPage.components.buttons && currentPage.components.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {currentPage.components.buttons.map((button, index) => (
                      <button
                        key={index}
                        className={`px-4 py-2 rounded text-sm font-medium ${
                          button.style === "primary"
                            ? "bg-[#5865F2] text-white hover:bg-[#4752C4]"
                            : button.style === "secondary"
                            ? "bg-[#4f545c] text-white hover:bg-[#5d6269]"
                            : button.style === "success"
                            ? "bg-[#23a55a] text-white hover:bg-[#1e8f4d]"
                            : button.style === "danger"
                            ? "bg-[#f23f42] text-white hover:bg-[#d73538]"
                            : "text-[#00aff4] hover:underline"
                        }`}
                        disabled
                      >
                        {button.emoji && <span className="mr-1">{button.emoji}</span>}
                        {button.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Button Action Mapper Modal */}
      {editingButtonAction && (
        <ButtonActionMapper
          buttonId={editingButtonAction.buttonId}
          buttonLabel={editingButtonAction.buttonLabel}
          templateId={templateData.id}
          pageIndex={currentPageIndex}
          pages={templateData.pages}
          initialAction={buttonActions[editingButtonAction.buttonId]}
          onSave={handleSaveButtonAction}
          onCancel={() => setEditingButtonAction(null)}
        />
      )}
    </div>
  );
}

