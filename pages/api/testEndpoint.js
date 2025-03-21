import axios from 'axios'; // Import Axios

// this just serves as a test endpoint I can see so I can see the logs in vercel
export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('testEndpoint',JSON.stringify(req.body));
    
    res.status(200).json({ success: true });

  } else {
    // Return an error for other HTTP methods
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
