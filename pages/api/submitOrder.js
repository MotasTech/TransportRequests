import axios from 'axios'; // Import Axios

// pages/api/submitOrder.js
const GOOGLE_ENDPOINT = 'https://script.google.com/macros/s/AKfycby6h7JvK09kph_-NOdrca6AFrMfr2hJRxdC3-Tt8C87k5UK4vRqCqvX3Mt7GbiVzlbn/exec?email=Yes';



export default function handler(req, res) {
  console.log('here')
  if (req.method === 'POST') {
    console.log('body',JSON.stringify(req.body))
    const { passcode, company, notes, orders } = req.body;

    axios.post(GOOGLE_ENDPOINT, { passcode, company, notes, orders })
    .then((response) => {
      console.log('Google Response',response.data);
      res.status(response.status).json(response.data);
    })
    .catch((error) => {
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // For this example, we're just sending a success response
    //res.status(200).json({ success: true });
  } else {
    // Return an error for other HTTP methods
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
