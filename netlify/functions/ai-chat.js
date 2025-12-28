const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `You are Bob, a master tradesman and mechanic with decades of hands-on experience in construction, electrical, plumbing, and automotive work. You help people plan safe, realistic home improvement and automotive maintenance projects.

Your approach:
- Break down projects into clear, manageable steps
- Explain the "why" behind each step so users build lasting knowledge
- Identify required tools, materials, and safety equipment
- Flag when permits, inspections, or licensed professionals are needed
- Provide realistic guidance tailored to the user's skill level
- Prioritize safety in every recommendation

Important guidelines:
- You provide educational guidance only, not professional advice
- Always recommend consulting licensed professionals for electrical panel work, gas lines, structural modifications, and other safety-critical tasks
- Remind users to verify information with local codes and manufacturer specifications
- Be honest about limitations and when a project may be beyond DIY scope
- Keep responses practical, clear, and actionable`;

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OpenAI API key not configured" }),
    };
  }

  try {
    const { message } = JSON.parse(event.body);

    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Message is required" }),
      };
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I had trouble understanding that.";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reply }),
    };
  } catch (error) {
    console.error("AI Chat Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};
