import axios from 'axios'; // Import Axios

// pages/api/logRFID.js point
const GOOGLE_RFID_ENDPOINT = process.env.NEXT_PUBLIC_GOOGLE_RFID_ENDPOINT;

export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('logRFID body',JSON.stringify(req.body))

    axios.post(GOOGLE_RFID_ENDPOINT, req.body)
    .then((response) => {
      console.log('Google Response',response.data);
      res.status(response.status).json(response.data);
    })
    .catch((error) => {
      res.status(500).json({ error: 'Internal Server Error' });
    });

  } else {
    // Return an error for other HTTP methods
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
