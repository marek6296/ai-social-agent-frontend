(function () {
  function init() {
    // nájdeme aktuálny <script> tag
    var currentScript =
      document.currentScript ||
      (function () {
        var scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1];
      })();

    if (!currentScript) return;

    var botId = currentScript.getAttribute("data-bot-id");
    if (!botId) {
      console.warn("[AI Social Agent] Chýba data-bot-id v <script> tagu.");
    }

    // backend origin = doména, z ktorej sa načítal embed.js
    var backendOrigin;
    try {
      backendOrigin = new URL(currentScript.src).origin;
    } catch (e) {
      backendOrigin = window.location.origin;
    }

    // vytvoríme kontajner pre widget
    var container = document.createElement("div");
    container.style.position = "fixed";
    container.style.right = "20px";
    container.style.bottom = "20px";
    container.style.zIndex = "999999";
    container.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, system-ui, sans-serif";
    container.style.color = "#e5e7eb";

    // bublina / panel
    var panel = document.createElement("div");
    panel.style.width = "320px";
    panel.style.maxHeight = "460px";
    panel.style.background = "linear-gradient(135deg, #020617, #020617)";
    panel.style.borderRadius = "16px";
    panel.style.border = "1px solid rgba(148, 163, 184, 0.4)";
    panel.style.boxShadow = "0 18px 45px rgba(0, 0, 0, 0.7)";
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.overflow = "hidden";

    // hlavička
    var header = document.createElement("div");
    header.style.padding = "8px 12px";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.background =
      "radial-gradient(circle at top left, rgba(16,185,129,0.25), transparent 55%)";

    var title = document.createElement("div");
    title.style.display = "flex";
    title.style.flexDirection = "column";

    var titleLine = document.createElement("span");
    titleLine.textContent = "AI chat asistent";
    titleLine.style.fontSize = "13px";
    titleLine.style.fontWeight = "600";
    titleLine.style.color = "#e5e7eb";

    var subtitle = document.createElement("span");
    subtitle.textContent = "Odpovie na otázky o tejto službe.";
    subtitle.style.fontSize = "11px";
    subtitle.style.color = "#9ca3af";

    title.appendChild(titleLine);
    title.appendChild(subtitle);

    var dot = document.createElement("span");
    dot.style.width = "8px";
    dot.style.height = "8px";
    dot.style.borderRadius = "999px";
    dot.style.background = "#22c55e";
    dot.style.boxShadow = "0 0 0 4px rgba(34,197,94,0.35)";

    header.appendChild(title);
    header.appendChild(dot);

    // obsah – správy
    var messagesWrapper = document.createElement("div");
    messagesWrapper.style.flex = "1";
    messagesWrapper.style.padding = "8px 10px";
    messagesWrapper.style.display = "flex";
    messagesWrapper.style.flexDirection = "column";
    messagesWrapper.style.gap = "6px";
    messagesWrapper.style.overflowY = "auto";
    messagesWrapper.style.fontSize = "12px";

    function addMessage(role, text) {
      var row = document.createElement("div");
      row.style.display = "flex";
      row.style.marginBottom = "3px";
      row.style.justifyContent = role === "user" ? "flex-end" : "flex-start";

      var bubble = document.createElement("div");
      bubble.textContent = text;
      bubble.style.padding = "6px 9px";
      bubble.style.borderRadius = "999px";
      bubble.style.maxWidth = "80%";
      bubble.style.lineHeight = "1.35";

      if (role === "user") {
        bubble.style.background = "#22c55e";
        bubble.style.color = "#020617";
        bubble.style.borderRadius = "999px 999px 0 999px";
      } else {
        bubble.style.background = "rgba(15,23,42,0.95)";
        bubble.style.color = "#e5e7eb";
        bubble.style.border = "1px solid rgba(148,163,184,0.4)";
        bubble.style.borderRadius = "999px 999px 999px 0";
      }

      row.appendChild(bubble);
      messagesWrapper.appendChild(row);
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    }

    // uvítacia správa
    addMessage(
      "assistant",
      "Ahoj 👋 Som AI asistent. Spýtaj sa na ceny, funkcie alebo čokoľvek o tejto službe."
    );

    // input + button
    var inputRow = document.createElement("div");
    inputRow.style.display = "flex";
    inputRow.style.alignItems = "center";
    inputRow.style.padding = "8px 10px";
    inputRow.style.borderTop = "1px solid rgba(30, 41, 59, 1)";
    inputRow.style.background = "rgba(2,6,23,0.95)";
    inputRow.style.gap = "6px";

    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Napíš otázku…";
    input.style.flex = "1";
    input.style.fontSize = "12px";
    input.style.padding = "6px 8px";
    input.style.borderRadius = "999px";
    input.style.border = "1px solid rgba(51,65,85,1)";
    input.style.background = "#020617";
    input.style.color = "#e5e7eb";
    input.style.outline = "none";

    var button = document.createElement("button");
    button.textContent = "Odoslať";
    button.style.fontSize = "11px";
    button.style.fontWeight = "600";
    button.style.padding = "6px 10px";
    button.style.borderRadius = "999px";
    button.style.border = "none";
    button.style.cursor = "pointer";
    button.style.background = "#22c55e";
    button.style.color = "#020617";

    var isSending = false;

    function sendMessage() {
      if (isSending) return;
      var text = input.value.trim();
      if (!text) return;

      addMessage("user", text);
      input.value = "";
      isSending = true;

      fetch(backendOrigin + "/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          ownerUserId: botId || null,
        }),
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error("API error: " + res.status);
          }
          return res.json();
        })
        .then(function (json) {
          var reply =
            (json && json.reply) ||
            "Ospravedlňujem sa, momentálne viem odpovedať len obmedzene.";
          addMessage("assistant", reply);
        })
        .catch(function () {
          addMessage(
            "assistant",
            "Ospravedlňujem sa, niečo sa pokazilo pri komunikácii so serverom."
          );
        })
        .finally(function () {
          isSending = false;
        });
    }

    button.addEventListener("click", sendMessage);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });

    inputRow.appendChild(input);
    inputRow.appendChild(button);

    panel.appendChild(header);
    panel.appendChild(messagesWrapper);
    panel.appendChild(inputRow);

    container.appendChild(panel);
    document.body.appendChild(container);
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();