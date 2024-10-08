import axios from 'axios'; // Import Axios

// pages/api/logRFID.js point
const GOOGLE_RFID_ENDPOINT = process.env.NEXT_PUBLIC_GOOGLE_RFID_ENDPOINT;

export default function handler(req, res) {
  if (req.method === 'POST') {

    // Get the query parameter `?reader=` from the URL
    const { reader } = req.query;

    // If the reader parameter exists, add it to the payload
    if (reader) {
      if (Array.isArray(req.body)) {
        // If req.body is an array, add 'Reader' to each element
        req.body = req.body.map(item => {
          if (typeof item === 'object' && item !== null) {
            return { ...item, Reader: reader };
          }
          return item;
        });
      } else if (typeof req.body === 'object' && req.body !== null) {
        // If req.body is an object, just add 'Reader' as a key-value pair
        req.body.Reader = reader;
      }
    }

    axios.post(GOOGLE_RFID_ENDPOINT, req.body)
    .then((response) => {
      console.log('Google Response',response.data,'body',JSON.stringify(req.body));
      res.status(response.status).json(response.data);
    })
    .catch((error) => {
      res.status(500).json({ error: 'Internal Server Error','body': JSON.stringify(req.body) });
    });

  } else {
    // Return an error for other HTTP methods
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
