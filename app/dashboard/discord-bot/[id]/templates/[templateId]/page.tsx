"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { MessageTemplateBuilder, MessageTemplate } from "@/components/discord-bot/MessageTemplateBuilder";
import { Card, CardContent } from "@/components/ui/card";

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;
  const templateId = params.templateId as string;
  const [template, setTemplate] = useState<MessageTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("discord_message_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) throw error;

      // Convert from database format
      const pages = data.pages_json || [
        {
          name: "Main",
          embed: data.embed_json || {},
          components: data.components_json || {},
        },
      ];

      // Load existing button actions
      const { data: actions } = await supabase
        .from("discord_template_actions")
        .select("*")
        .eq("template_id", templateId);

      setTemplate({
        id: data.id,
        name: data.name,
        guild_id: data.guild_id,
        pages,
        current_page_index: data.current_page_index || 0,
      });
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Chyba pri načítaní template");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (templateData: MessageTemplate) => {
    try {
      // Convert to database format
      const currentPage = templateData.pages[templateData.current_page_index];
      const embedJson = currentPage?.embed || {};
      const componentsJson = currentPage?.components || {};

      // Get current version first
      const { data: currentTemplate } = await supabase
        .from("discord_message_templates")
        .select("version")
        .eq("id", templateId)
        .single();

      const { error } = await supabase
        .from("discord_message_templates")
        .update({
          name: templateData.name,
          embed_json: embedJson,
          components_json: componentsJson,
          pages_json: templateData.pages,
          current_page_index: templateData.current_page_index,
          version: (currentTemplate?.version || 1) + 1,
        })
        .eq("id", templateId);

      if (error) throw error;

      router.push(`/dashboard/discord-bot/${botId}/templates`);
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Chyba pri ukladaní template");
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/discord-bot/${botId}/templates`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Načítavam template...</p>
        </CardContent>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Template sa nenašiel</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <MessageTemplateBuilder
      template={template}
      guildId={template.guild_id}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}

