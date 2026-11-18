import { processUniversalApiRequest } from "../../api/index.js";

export const handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const result = await processUniversalApiRequest({
      method: event.httpMethod,
      pathName: event.path || "/api",
      query: event.queryStringParameters || {},
      headers: event.headers || {},
      body: event.body,
    });

    return {
      statusCode: result.statusCode || 200,
      headers: {
        ...corsHeaders,
        ...(result.headers || {}),
      },
      body: result.body,
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, error: err?.message }),
    };
  }
};
