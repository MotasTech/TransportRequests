import { useState } from 'react';

function FormComponent() {
  const [inputText, setInputText] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Perform server-side action here, for example, sending a POST request.
    try {
      const response = await fetch('/api/your-server-endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText }),
      });

      if (response.ok) {
        // Handle success response here
        console.log('Server response:', await response.json());
      } else {
        // Handle error response here
        console.error('Server error:', await response.text());
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="container">
          <div className="row mb-3">
            <div className="col">
            <label className="form-label form-label-sm ps-0 fw-bolder text-muted" for="flexRadioDefault1">
                PASSCODE
              </label>
              <input className="form-control" type="text" placeholder="Company Passcode" aria-label="default input example" disabled />
            </div>
            <div className="col">
              <label className="form-label form-label-sm ps-0 fw-bolder text-muted" for="flexRadioDefault1">
                YOUR COMPANY
              </label>
              <input className="form-control" type="text" placeholder="Default input" aria-label="default input example" />
            </div>
          </div>
          <div className="row mb-4">
            <label className="form-label form-label-sm ps-0 fw-bolder text-muted" for="flexRadioDefault1">
              DESTINATION
            </label>
            <input
              className="form-control form-control-lg"
              list="datalistOptions"
              id="exampleDataList"
              placeholder="Type to search..."
            />
            <datalist id="datalistOptions">
              <optgroup label="Option Group 1">
                <option value="2 Grow It">AU-G-B-000221</option>
                <option value="Fluresh Grow - Adrian">GR-C-000440</option>
                <option value="Endo Grow">AU-G-C-000590</option>
                <option value="KAI Cannabis Grow">AU-G-C-000299</option>
              </optgroup>
            </datalist>
            <div id="buyerSearchHelp" className="form-text">
              Search buyer by name or license number
            </div>
          </div>
          <div className="row mb-3">
            <select className="form-select form-select-sm" aria-label="Default select example">
              <option selected>Payment Terms</option>
              <option value="1">COD</option>
              <option value="2">NO COD</option>
              <option value="3">UP TO CUSTOMER</option>
            </select>
          </div>
          <div className="row mb-3">
            <select className="form-select form-select-sm" aria-label="Default select example">
              <option selected>Order Size</option>
              <option value="1">Bins</option>
              <option value="2">Boxes</option>
              <option value="3">Other</option>
            </select>
          </div>
          <div className="row mb-3">
            <label className="form-label form-label-sm ps-0 fw-bolder text-muted" for="flexRadioDefault1">
              BUYER ADDRESS
            </label>
            <input
              className="form-control"
              type="text"
              placeholder="Default input"
              aria-label="default input example"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Submit Order
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormComponent;
