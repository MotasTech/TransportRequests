import axios from 'axios'; // Import Axios

// pages/api/submitOrder.js
const GOOGLE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxlkj0yVujdqfj88oYa_4tHnJRvtGP-HxiuRYxvFNQjhZ8W_fFYbluJba9zUhPLJ35i/exec?email=yes';


export default function handler(req, res) {
  console.log('here')
  if (req.method === 'POST') {
    const { passcode, company, notes, orders } = req.body;


    axios.post(GOOGLE_ENDPOINT, { passcode, company, notes, orders })
    .then((response) => {
      res.status(response.status).json(response.data);
    })
    .catch((error) => {
      res.status(500).json({ error: 'Internal Server Error' });
    });

    // For this example, we're just sending a success response
    res.status(200).json({ success: true });
  } else {
    // Return an error for other HTTP methods
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
