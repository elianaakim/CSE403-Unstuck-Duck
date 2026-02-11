import ollama from "ollama";

export const ollamaClient = ollama;

async function main() {
  const response = await ollama.chat({
    model: "gpt-oss",
    messages: [{ role: "user", content: "Hello!" }],
  });
  console.log(response.message.content);
}

main().catch(console.error);
