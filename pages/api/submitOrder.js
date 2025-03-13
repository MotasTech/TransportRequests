import axios from 'axios'; // Import Axios

// pages/api/submitOrder.js
const GOOGLE_ORDERS_AND_PASSCODE_ENDPOINT = process.env.NEXT_PUBLIC_GOOGLE_ORDERS_AND_PASSCODE_ENDPOINT;
const SEND_EMAIL = process.env.NEXT_PUBLIC_SEND_EMAIL;


export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('body',JSON.stringify(req.body))

    axios.post(GOOGLE_ORDERS_AND_PASSCODE_ENDPOINT + '?email=' + SEND_EMAIL, req.body)
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
