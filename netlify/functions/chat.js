// Netlify serverless function to securely handle Hugging Face API calls
// The API token is stored as an environment variable and never exposed to the client

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { message } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Get the token from environment variables (set in Netlify dashboard)
    const apiToken = process.env.HUGGING_FACE_TOKEN;

    if (!apiToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API token not configured' })
      };
    }

    // Call Hugging Face API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        headers: { Authorization: `Bearer ${apiToken}` },
        method: 'POST',
        body: JSON.stringify({ inputs: message })
      }
    );

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Error calling Hugging Face API' })
      };
    }

    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: result[0]?.generated_text || 'No response generated'
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
