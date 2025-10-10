export const handler = async () => {
  const timestamp = new Date().toISOString();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
    body: JSON.stringify({
      ok: true,
      timestamp,
      environment: process.env.NODE_ENV || "development",
    }),
  };
};
