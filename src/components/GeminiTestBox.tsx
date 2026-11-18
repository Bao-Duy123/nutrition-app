import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Model chính ở đầu, thêm model dự phòng phía sau nếu muốn
const MODELS = [
   "gemini-3.5-flash-lite",
  "gemini-3.8-flash", //3.8 flash mạnh như hay bị nghẽn
  "gemini-3.1-flash-lite",
];

const TIMEOUT_MS = 20000; // quá 20s không phản hồi thì báo lỗi
const MAX_ATTEMPTS = 2; // số lần thử mỗi model khi gặp 503/429

const urlOf = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGemini(model: string, text: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(urlOf(model), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY!,
      },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
      signal: controller.signal,
    });

    const raw = await res.text();
    console.log("[Gemini]", model, res.status, raw.slice(0, 300));

    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      // phản hồi không phải JSON
    }
    return { res, data };
  } finally {
    clearTimeout(timer);
  }
}

export default function GeminiTestBox() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [ms, setMs] = useState<number | null>(null);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;
    if (!API_KEY) {
      setError("Chưa có EXPO_PUBLIC_GEMINI_API_KEY trong .env");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");
    setStatus("");
    setMs(null);
    const start = Date.now();
    let lastError = "";

    try {
      for (const model of MODELS) {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          setStatus(`Đang gọi ${model} (lần ${attempt + 1}/${MAX_ATTEMPTS})...`);

          try {
            const { res, data } = await callGemini(model, prompt.trim());

            if (res.ok) {
              const text = data?.candidates?.[0]?.content?.parts
                ?.map((p: { text?: string }) => p.text ?? "")
                .join("");

              setAnswer(
                `${text || "(Gemini không trả về nội dung)"}\n\n[model: ${model}]`
              );
              setMs(Date.now() - start);
              return;
            }

            lastError = `[${model}] ${data?.error?.message || `HTTP ${res.status}`}`;

            // Lỗi tạm thời (quá tải / hết hạn mức): chờ rồi thử lại
            if (res.status === 503 || res.status === 429) {
              await sleep(1500);
              continue;
            }

            // Lỗi khác (401, 404, 400...): không thử lại, chuyển model tiếp theo
            break;
          } catch (e: any) {
            lastError =
              e?.name === "AbortError"
                ? `[${model}] Quá ${TIMEOUT_MS / 1000} giây không phản hồi`
                : `[${model}] ${e?.message ?? "Lỗi mạng"}`;
          }
        }
      }

      setError(lastError || "Không nhận được phản hồi từ Gemini");
    } finally {
      setStatus("");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Test Gemini API</Text>

      <TextInput
        style={styles.input}
        placeholder="Nhập câu hỏi..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Gửi</Text>
        )}
      </TouchableOpacity>

      {!!status && <Text style={styles.status}>{status}</Text>}

      {!!error && <Text style={styles.error}>❌ {error}</Text>}

      {!!answer && (
        <ScrollView style={styles.answerBox}>
          <Text style={styles.answer}>{answer}</Text>
          {ms !== null && <Text style={styles.meta}>⏱ {ms} ms</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 10,
  },
  title: { fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 44,
    maxHeight: 100,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#4285F4",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  status: { marginTop: 6, color: "#888", fontSize: 12 },
  error: { marginTop: 8, color: "#d32f2f" },
  answerBox: {
    marginTop: 8,
    maxHeight: 200,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
  },
  answer: { fontSize: 14 },
  meta: { marginTop: 6, fontSize: 11, color: "#888" },
});