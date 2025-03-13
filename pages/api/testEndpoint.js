import axios from 'axios'; // Import Axios

export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('testEndpoint',JSON.stringify(req.body))

  } else {
    // Return an error for other HTTP methods
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
