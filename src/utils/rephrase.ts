export async function rephraseText(text: string): Promise<string> {
    const apiKey = import.meta.env.VITE_DEDALUS_API_KEY;
  
    if (!apiKey) {
      console.error("❌ Missing VITE_DEDALUS_API_KEY in .env");
      showBubble("Missing Dedalus API key — check your .env file", "error");
      return text;
    }
  
    // A list of model names to try in order
    const modelsToTry = [
      "openai/gpt-3.5-turbo",
      "openai/gpt-4"  // fallback to OpenAI provider via Dedalus
    ];
  
    for (const model of modelsToTry) {
      try {
        const response = await fetch("https://api.dedaluslabs.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are a skilled academic editor. Rephrase text for clarity, tone, and smoothness while preserving meaning.",
              },
              { role: "user", content: text },
            ],
          }),
        });
  
        if (!response.ok) {
          const errText = await response.text();
          console.warn(`Model ${model} failed:`, errText);
          // continue to next model
          continue;
        }
  
        const data = await response.json();
        const rephrased = data.choices?.[0]?.message?.content?.trim();
        if (rephrased) {
          showBubble("✨ Text rephrased successfully!", "success");
          return rephrased;
        }
        // If empty result, continue to next model
      } catch (err) {
        console.warn("Model attempt error:", model, err);
        // try next model
      }
    }
  
    // If all models fail
    showBubble("Failed to rephrase via any model", "error");
    return text;
  }
  
  /* ---------------- Floating Bubble Notification ---------------- */
  function showBubble(message: string, type: "success" | "error" = "success") {
    const bubble = document.createElement("div");
    bubble.textContent = message;
    bubble.style.position = "fixed";
    bubble.style.bottom = "30px";
    bubble.style.right = "30px";
    bubble.style.padding = "12px 18px";
    bubble.style.borderRadius = "10px";
    bubble.style.color = "white";
    bubble.style.fontSize = "14px";
    bubble.style.zIndex = "9999";
    bubble.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
    bubble.style.background =
      type === "success" ? "rgba(0, 150, 136, 0.9)" : "rgba(244, 67, 54, 0.9)";
    bubble.style.transition = "opacity 0.5s ease";
    document.body.appendChild(bubble);
  
    setTimeout(() => {
      bubble.style.opacity = "0";
      setTimeout(() => bubble.remove(), 500);
    }, 2500);
  }
  