const { handler } = require("./netlify/functions/ai-chat");
(async () => {
  try {
    const res = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ message: "Plumbing" })
    }, {});
    console.log("RESPONSE:", res);
  } catch (err) {
    console.error("ERROR:", err);
  }
})();
