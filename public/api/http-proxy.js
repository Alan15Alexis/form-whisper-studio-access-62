
// Simulated server proxy to handle HTTP requests and avoid CORS issues
// This would need to be implemented on a real server in production

export default async function handler(req, res) {
  // Only allow POST method for this proxy
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { targetUrl, method, headers, body } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    console.log(`Proxy request to: ${targetUrl}`);
    console.log(`Method: ${method}`);
    console.log(`Headers:`, headers);
    if (body) console.log(`Body: ${JSON.stringify(body)}`);

    // Configure the fetch options
    const fetchOptions = {
      method: method || 'GET',
      headers: headers || {},
    };
    
    // Only add body for non-GET requests
    if (method !== 'GET' && body) {
      fetchOptions.body = JSON.stringify(body);
    }
    
    // Make the actual HTTP request from the server
    const response = await fetch(targetUrl, fetchOptions);
    
    // Read the response data based on content type
    const contentType = response.headers.get('content-type');
    let responseData;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (error) {
      // If parsing fails, just get the text
      responseData = await response.text();
    }
    
    // Send back the response to the client
    return res.status(response.status).json({
      status: response.status,
      data: responseData,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error('Error in HTTP proxy:', error);
    return res.status(500).json({ 
      error: 'Error processing HTTP request',
      details: error.message
    });
  }
}
