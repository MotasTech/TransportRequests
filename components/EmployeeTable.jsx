import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Tooltip from '@mui/material/Tooltip';

const GOOGLE_DESTINATIONS_ENDPOINT = process.env.NEXT_PUBLIC_GOOGLE_DESTINATIONS_ENDPOINT;
const GOOGLE_ORDERS_AND_PASSCODE_ENDPOINT = process.env.NEXT_PUBLIC_GOOGLE_ORDERS_AND_PASSCODE_ENDPOINT;

const OrderTable = () => {
  const router = useRouter(); // Initialize the router

  const [Orders, setOrders] = useState([
    //{ deliveryDate: '2023-11-06', newDestination: false, destination: 'Motas', licensesNeeded: 'AU', medDestinationLicense: 'AB-100-24', auDestinationLicense: 'AB-100-24', destinationAddress: '123 Market Street', payment_terms: 'COD', orderSize:'bin', deliveryNotes: 'Please get us this quickly', isEditing: false },
    //{ deliveryDate: '2023-11-06', newDestination: false, destination: 'Motas', licensesNeeded: 'Med', medDestinationLicense: 'AB-100-24', auDestinationLicense: 'AB-100-24', destinationAddress: '123 Market Street', payment_terms: 'COD', orderSize:'bin', deliveryNotes: '', isEditing: false },
    //{ deliveryDate: '2023-11-06', newDestination: false, destination: 'Motas', licensesNeeded: 'MED + AU', medDestinationLicense: 'AB-100-24', auDestinationLicense: 'AB-100-24', destinationAddress: '123 Market Street', payment_terms: 'COD', orderSize:'bin', deliveryNotes: '', isEditing: false }
  ]);

  // State variable to track whether there are records with isEditing still true
  const hasUnfinishedEdits = Orders.some((Order) => Order.isEditing);
  const [showModal, setShowModal] = useState(false);  // State variable to control the visibility of the modal
  const [DatalistOptions, setDatalistOptions] = useState([]); // State variable to store datalist options
  const [passcode, setPasscode] = useState('');
  const [company, setCompany] = useState('');
  const [showAlert, setShowAlert] = useState(false); // alert for submission
  const [alertType, setAlertType] = useState('success'); // 'success' or 'error'
  const [alertMessage, setAlertMessage] = useState(''); // alert for submission
  const [pickupDateInputValue, setPickupDateInputValue] = useState('');


  // Function to show the alert for a specified duration
  const showAlertWithTimeout = (type, message, duration = 10000) => {
    setAlertType(type);
    setAlertMessage(message);
    setShowAlert(true);

    // Hide the alert after the specified duration
    setTimeout(() => {
      setShowAlert(false);
    }, duration);
  };

  
  const toggleLookupDestination = (index) => {
    setOrders(Orders.map((order, idx) => {
      if (idx === index) {
        return {
          ...order,
          isLookupDestination: !order.isLookupDestination,
          isDestinationAddressDisabled: !order.isLookupDestination,
          isMedDisabled: !order.isLookupDestination,
          isAuDisabled: !order.isLookupDestination
        };
      }
      return order;
    }));
  };


  const fetchCompanyByPasscode = async (passcode) => {
    try {
      const response = await fetch(`${GOOGLE_ORDERS_AND_PASSCODE_ENDPOINT}?type=passcodes&code=chris`);
      if (response.ok) {
        const data = await response.json();
        const companyData = data.slice(1); // Exclude the header row
        
        // Find the row with the matching passcode in column 1
        const matchingRow = companyData.find((row) => row[1] === passcode);
  
        if (matchingRow) {
          // If a valid company is found, update the 'company' state with the corresponding value in column 2
          setCompany(matchingRow[0]);
        } else {
          // If no company is found, clear the 'company' state
          setCompany('');
        }
      } else {
        console.error('Failed to fetch company');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  
  function getNextBusinessDay(date) {
    const nextDay = new Date(date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1); // Move to the next day in UTC
    while (nextDay.getUTCDay() === 0 || nextDay.getUTCDay() === 6) nextDay.setUTCDate(nextDay.getUTCDate() + 1); // Move to the next day if it's a weekend in UTC  
    return nextDay;
  }
  

  // Function to handle selecting an option from the datalist and populating the destinationAddress
  const handleSelectOption = (index, selectedValue) => {
    const updatedOrders = [...Orders];
    updatedOrders[index].destination = selectedValue;
  
    // Find the corresponding destinationAddress from the DatalistOptions
    const matchingOption = DatalistOptions.find((option) => option[0] === selectedValue);
  
    // Extract values from the matchingOption array, providing default values ('' for empty ones)
    const medDestinationLicense = (matchingOption && matchingOption[1]) || '';
    const auDestinationLicense = (matchingOption && matchingOption[2]) || '';
    const destinationAddress = (matchingOption && matchingOption[3]) || '';
  
    updatedOrders[index].medDestinationLicense = medDestinationLicense;
    updatedOrders[index].auDestinationLicense = auDestinationLicense;
    updatedOrders[index].destinationAddress = destinationAddress;

    updatedOrders[index].isDestinationAddressDisabled = true;
    updatedOrders[index].isMedDisabled = true;
    updatedOrders[index].isAuDisabled = true;
  
    setOrders(updatedOrders);
    console.log(Orders)
  };

  const handleOrderChange = (e, index, propertyName) => {
    const updatedOrders = [...Orders];
    const order = updatedOrders[index];
  
    if (propertyName === 'licensesNeeded') {
      // Update the selected value in the "Licenses Needed" dropdown
      order[propertyName] = e.target.value;
  
      // Determine which licenses are required based on the selected value
      const isMedLicenseRequired = e.target.value === 'MED' || e.target.value === 'MED + AU';
      const isAuLicenseRequired = e.target.value === 'AU' || e.target.value === 'MED + AU';
  
      // Update the 'required' attribute for the "MED License" and "AU License" inputs
      order.isMedLicenseRequired = isMedLicenseRequired;
      order.isAuLicenseRequired = isAuLicenseRequired;

      // clear values if not needed
      //if(!order.isMedLicenseRequired) order.medDestinationLicense = ''
      //if(!order.isAuLicenseRequired) order.auDestinationLicense = ''

    } else {
      // Handle other property changes
      order[propertyName] = e.target.value;
    }
  
    setOrders(updatedOrders);
  };
  

  const handleAddOrder = () => {    

    // Check if pickupDate is a valid date, otherwise use today's date
    const newDeliveryDate = pickupDateInputValue!=='' ? getNextBusinessDay(new Date(pickupDateInputValue)) : new Date();
    console.log('newDeliveryDate',newDeliveryDate)
    // Logic to add a new order to the state
    
    const newOrder = {
      deliveryDate: newDeliveryDate.toISOString().substr(0, 10),
      newDestination: false,
      destination: '', // Set initial values for new order properties
      licensesNeeded: 'AU',
      medDestinationLicense: '',
      auDestinationLicense: '',
      destinationAddress: '',
      payment_terms: 'COD',
      orderSize: '',
      deliveryNotes: '',
      isLookupDestination: true,
      isMedLicenseRequired: false,
      isAuLicenseRequired: true,
      isMedDisabled: true,
      isAuDisabled: true,
      isDestinationAddressDisabled: true,
      isEditing: true
    };

    setOrders((prevOrders) => [...prevOrders, newOrder]);

    console.log('Orders',Orders);
  };

  const handleEditOrder = (index) => {
    const updatedOrders = [...Orders];
    const order = updatedOrders[index];

    // Perform validation for required fields
    var invalidFields = [];
    const tableRow = document.getElementById(`orderRow-${index}`);
    tableRow.querySelectorAll('[required]').forEach((input) => {
        console.log(typeof(input.value),'val',input.value + '>',input.name)
        if (input.value === '' || !input.checkValidity()) {
          // Add the field's name attribute to the list of invalid fields
          invalidFields.push(input.name);
        }
    });
    if (invalidFields.length > 0) {
      // Display an error message and prevent toggling the edit mode
      alert(`Please fill in all required fields before submitting. Invalid fields: \n${invalidFields}.\n If a license field is required and grayed out, you will need to click the Destination Missing link`);
    } else {
      order.isEditing = !order.isEditing;
      setOrders(updatedOrders);
    }
  };

  const handleDeleteOrder = (index) => {
    const updatedOrders = [...Orders];
    updatedOrders.splice(index, 1); // Remove the order at the specified index
    setOrders(updatedOrders);
  };

  const handleSubmitOrder = async () => {
    // Get values from input fields
    const passcode = document.getElementById('passcode').value;
    const company = document.getElementById('company').value;
    const notes = document.getElementById('notes').value;
    const pickupDate = pickupDateInputValue;

    // Check if company exists
    if(company == '') {
        alert(`You did not access this portal from your personal link. Please revisit the page from the link provided to your company.`);
        return;
    }

    // Check if at least one order in table
    if(Orders.length == 0) {
        alert(`You need to add at least one request`);
        return;
    }

    // Check if required fields are empty
    const form = document.querySelector('form');
    const invalidFields = [];
    form.querySelectorAll('[required]').forEach((input) => {
        if (!input.checkValidity()) {
          // Add the field's name attribute to the list of invalid fields
          invalidFields.push(input.name);
        }
    });
    if (invalidFields.length > 0) {
        // There are invalid fields, display a message with the field names
        const fieldNames = invalidFields.join('\n');
        alert(`Please fill in all required fields before submitting. Invalid fields: \n${fieldNames}.`);
        return; // Prevent submission
    }

    // Show the Bootstrap 5 modal immediately upon submission
    setShowModal(true);

    // create order id using current datetime and passcode
    const now = new Date();
    const formattedDate = now.getFullYear() + (now.getMonth() + 1) + now.getDate() + now.getHours() + now.getMinutes() + now.getSeconds();
    const orderId = 'x' + formattedDate + '-' + passcode
  
    // Create an array to store order data
    const orders = Orders.map((order) => ({
      deliveryDate: order.deliveryDate,
      newDestination: order.newDestination,
      destination: order.destination,
      licensesNeeded: order.licensesNeeded,
      medDestinationLicense: (order.licensesNeeded == 'MED' || order.licensesNeeded == 'MED + AU') ? order.medDestinationLicense : '',
      auDestinationLicense: (order.licensesNeeded == 'AU' || order.licensesNeeded == 'MED + AU') ? order.auDestinationLicense : '',
      destinationAddress: order.destinationAddress,
      paymentTerms: order.payment_terms,
      orderSize: order.orderSize,
      deliveryNotes: order.deliveryNotes,
    }));
  
    // Create a payload object
    const payload = {
      orderId: orderId.toString(),
      passcode: passcode,
      company: company,
      notes: notes,
      pickupDate: pickupDate.toString(),
      orders
    };
    console.log(JSON.stringify(payload))
  
    try {
      // Send the payload to the API route on the server
      const response = await fetch('/api/submitOrder', { // Use '/api/submitOrder' as the URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('response',response)
  
      if (response.ok) {
        // Request was successful, you can handle success here
        console.log('Order submitted successfully');

        // Show the success alert for 10 seconds
        showAlertWithTimeout('success', 'Success');

        // Hide the Bootstrap 5 modal after receiving the response
        setShowModal(false);
        
        // Clear the table rows and reset input values
        setOrders([]);
        document.getElementById('pickupDate').value = '';
        document.getElementById('notes').value = '';

      } else {
        // Request failed, handle the error
        console.error('Failed to submit order');

        // Hide the Bootstrap 5 modal after receiving the response
        setShowModal(false);

        // Show the error alert for 10 seconds
        showAlertWithTimeout('error', 'Error');

      }
    } catch (error) {
      console.error('Error:', error);

      // Hide the Bootstrap 5 modal after receiving the response
      setShowModal(false);

      // Show the error alert for 10 seconds
      showAlertWithTimeout('error', 'Error');
    }
  };

  // Function to get the value of the 'passcode' URL parameter
  useEffect(() => {
    const getPasscodeFromURL = () => {
      const { passcode } = router.query; // Get the 'passcode' parameter from the URL
      return passcode || ''; // If 'passcode' exists, return its value; otherwise, return an empty string
    };

    // Set the value of the 'passcode' state from the URL parameter
    const passcodeValue = getPasscodeFromURL();
    setPasscode(passcodeValue);
    fetchCompanyByPasscode(passcodeValue);
  }, [router.query]); // Re-run this effect whenever the URL query parameters change


  // Load datalist options from an endpoint when the component mounts
  useEffect(() => {
    let retries = 0;               // how many times we've retried
    const maxRetries = 5;          // the maximum number of retry attempts
    const retryDelay = 2000;       // delay (ms) before the next retry attempt
    
    const fetchDestinationsData = async () => {
      try {
        const response = await fetch(GOOGLE_DESTINATIONS_ENDPOINT);

        // If the response fails or not OK, throw an error so we go to the catch block
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Attempt to parse JSON
        const data = await response.json();

        // Sort the data by the first column (destination)
        const sortedData = data.sort((a, b) => a[0].localeCompare(b[0]));

        // Update the datalist options
        setDatalistOptions(sortedData);
      } catch (error) {
        console.error('Error fetching datalist options:', error);

        // If we haven't reached max retries, schedule another attempt
        if (retries < maxRetries) {
          retries += 1;
          console.log(`Retrying fetch... Attempt #${retries}`);
          setTimeout(fetchDestinationsData, retryDelay);
        } else {
          // If we've reached max retries, handle it (show error UI, etc.)
          console.error(`Failed after ${maxRetries} retry attempts.`);
        }
      }
    };

    fetchDestinationsData();

  }, []);



  return (
    <div className="container mt-2">
        <form>
        <div className="row w-50 mx-auto mb-4">
            <div className="col col-auto">
                <label className="form-label form-label-sm ps-0 fw-bolder text-muted">
                    PASSCODE
                </label>
                <input id="passcode" name="Passcode" className="form-control" type="text" aria-label="default input example" value={passcode} required readOnly disabled />
            </div>
            <div className="col">
                <label className="form-label form-label-sm ps-0 fw-bolder text-muted">
                    YOUR COMPANY
                </label>
                <input id="company" name="Company" className="form-control" type="text" aria-label="default input example" value={company} required readOnly disabled />
            </div>
        </div>
        <div className="row w-50 mx-auto mb-2 d-flex align-items-center">
            <div className="mb-3 row">
              <label className="col-sm-4 col-form-label small fw-bolder">
                Pickup date<span className="text-danger">*</span>
              </label>
              <div className="col-sm-8">
                <input
                  id="pickupDate"
                  name="Pickup Date"
                  className="form-control"
                  type="date"
                  value={pickupDateInputValue}
                  onChange={(e) => setPickupDateInputValue(e.target.value)}
                  required
                />
              </div>
            </div>
        </div>
        <div className="row w-50 mx-auto mb-2 d-flex align-items-center">
            <div className="mb-3 row">
              <label className="col-sm-4 col-form-label small fw-bolder">General pickup notes</label>
              <div className="col-sm-8">
                <input id="notes" className="form-control" type="text" placeholder="Notes about pickup" aria-label="default input example" />
              </div>
            </div>
        </div>
        <div className="row w-50 mx-auto mb-5 text-center text-muted">
            <small>Need assistance? Email <a href="mailto:orders@motasmi.com">orders@motasmi.com</a> or call <a href="tel:2488508502">248.850.8502</a></small>
        </div>
        <div className="row table-responsive">
            <div className="table-wrapper">
                <div className="table-title">
                    <div className="row">
                        <div className="col-auto">
                            <h4>REQUESTS</h4>
                        </div>
                        <div className="col-sm-4">
                          <Tooltip 
                            title="** Please enter a Pickup Date to add new orders **"
                            placement="top-start"
                          >
                            <span> {/* Tooltip does not work directly on disabled elements, so we use a span wrapper */}
                            <button
                              type="button"
                              className={`btn btn-sm ${pickupDateInputValue === '' ? 'btn-light' : 'btn-primary'} add-new`}
                              onClick={handleAddOrder}
                              disabled={pickupDateInputValue === ''}
                            >
                              <i className="bi bi-plus"></i> Add New Order
                            </button>
                            </span>
                            </Tooltip>
                        </div>
                    </div>
                </div>
                <table className="table table-bordered table-responsive">
                    <thead className="small table-light text-center">
                        <tr>
                        <th className="col-1 small">Delivery date<span className="text-danger">*</span></th>
                        <th className="col-2 small">Destination<span className="text-danger">*</span></th>
                        <th className="col-1 small">MED / AU<span className="text-danger">*</span></th>
                        <th className="col-1 small">MED License</th>
                        <th className="col-1 small">AU License</th>
                        <th className="col-2 small">Destination address</th>
                        <th className="col-1 small">Payment terms<span className="text-danger">*</span></th>
                        <th className="col-1 small">Order size<span className="text-danger">*</span></th>
                        <th className="col-2 small" colSpan="2">Notes <br /> <small className="non-bold">(Fresh Frozen, Brand identifier, Fragile, etc.)</small></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Orders.map((Order, index) => (
                        <tr id={`orderRow-${index}`} key={index}>
                            <td>
                                {Order.isEditing ? (
                                    <input
                                        name={`Delivery Date ${index}`}
                                        className="form-control form-control-sm"    
                                        type="date"
                                        value={new Date(Order.deliveryDate).toISOString().substr(0, 10)}
                                        onChange={(e) => handleOrderChange(e, index, 'deliveryDate')}
                                        required
                                    />
                                ) : (
                                    Order.deliveryDate.split('-')[1] + '/' + Order.deliveryDate.split('-')[2] + '/' + Order.deliveryDate.split('-')[0]
                                )}
                            </td>
                            <td>
                                {Order.isEditing ? (
                                    <div>  
                                        {Order.isLookupDestination ? (
                                          <>
                                            <input
                                                name={`Destination ${index}`}
                                                className="form-control form-control-sm"
                                                list="datalistOptions"
                                                value={Order.destination}
                                                onChange={(e) => handleSelectOption(index, e.target.value)}
                                                placeholder="Enter Destination Name"
                                            />
                                            {Order.newDestination = false}
                                            </>
                                            ) : (
                                            <>
                                            <input
                                                name={`Destination ${index}`}
                                                className="form-control form-control-sm"
                                                value={Order.destination}
                                                onChange={(e) => handleOrderChange(e, index, 'destination')}
                                                placeholder="Search by name or license number"
                                                required
                                            />
                                            {Order.newDestination = true}
                                            </>
                                        )}                                      
                                        <small className="text-muted text-very-small">
                                            {Order.isLookupDestination ? "Destination missing?" : "To lookup destination,"}{' '}
                                            <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleLookupDestination(index);
                                            }}
                                            >
                                            Click here
                                            </a>
                                        </small>   
                                        <datalist id="datalistOptions">
                                            {DatalistOptions.map((option, idx) => (
                                                <option key={idx} value={option[0]}>
                                                    {`${option[1]} | ${option[2]}`}
                                                </option>
                                            ))}
                                        </datalist>
                                    </div>
                                ) : (
                                    Order.destination
                                )}
                            </td>
                            <td>
                                {Order.isEditing ? (
                                    <select
                                        name={`MED / AU ${index}`}
                                        className="form-select form-select-sm"
                                        value={Order.licensesNeeded}
                                        onChange={(e) => handleOrderChange(e, index, 'licensesNeeded')}
                                        aria-label="Licenses Needed"
                                        required
                                    >
                                        <option value="AU">AU ONLY</option>
                                        <option value="MED">MED ONLY</option>
                                        <option value="MED + AU">MED + AU</option>
                                    </select>
                                ) : (
                                    Order.licensesNeeded
                                )}
                            </td>
                            <td>
                                {Order.isMedLicenseRequired ? (
                                    Order.isEditing ? (
                                    <input
                                        name={`MED License ${index}`}
                                        type="text"
                                        value={Order.medDestinationLicense}
                                        onChange={(e) => handleOrderChange(e, index, 'medDestinationLicense')}
                                        className="form-control form-control-sm"
                                        required={Order.isMedLicenseRequired}
                                        readOnly={Order.isMedDisabled}
                                        disabled={Order.isMedDisabled}
                                    />
                                    ) : (
                                    Order.medDestinationLicense
                                    )
                                ) : (
                                    null
                                )}
                            </td>
                            <td>
                                {Order.isAuLicenseRequired ? (
                                    Order.isEditing ? (
                                    <input
                                        name={`AU License ${index}`}
                                        type="text"
                                        value={Order.auDestinationLicense}
                                        onChange={(e) => handleOrderChange(e, index, 'auDestinationLicense')}
                                        className="form-control form-control-sm"
                                        required={Order.isAuLicenseRequired}
                                        readOnly={Order.isAuDisabled}
                                        disabled={Order.isAuDisabled}
                                    />
                                    ) : (
                                    Order.auDestinationLicense
                                    )
                                ) : (
                                    null
                                )}
                            </td>
                            <td>
                                {Order.isEditing ? (
                                    <input
                                        name={`Destination Address ${index}`}
                                        type="text"
                                        value={Order.destinationAddress}
                                        onChange={(e) => handleOrderChange(e, index, 'destinationAddress')}
                                        className="form-control form-control-sm required"
                                        required
                                        readOnly={Order.isDestinationAddressDisabled}
                                        disabled={Order.isDestinationAddressDisabled}
                                    />
                                ) : (
                                    Order.destinationAddress
                                )}
                            </td>
                            <td>
                                {Order.isEditing ? (
                                    <select
                                        name={`Payment Terms ${index}`}
                                        className="form-select form-select-sm required"
                                        value={Order.payment_terms}
                                        onChange={(e) => handleOrderChange(e, index, 'payment_terms')}
                                        aria-label="Order Size"
                                        required
                                    >
                                        <option value="COD">COD</option>
                                        <option value="NO COD">NO COD</option>
                                        <option value="UP TO CUSTOMER">UP TO CUSTOMER</option>
                                    </select>
                                ) : (
                                    Order.payment_terms
                                )}
                            </td>
                            <td>
                                {Order.isEditing ? (
                                    <input
                                        name={`Order Size ${index}`}
                                        className="form-control form-control-sm required"
                                        type="text"
                                        value={Order.orderSize}
                                        onChange={(e) => handleOrderChange(e, index, 'orderSize')}
                                        required
                                    />
                                ) : (
                                    Order.orderSize
                                )}
                            </td>
                            <td>
                                {Order.isEditing ? (
                                    <input
                                        name={`Delivery Notes ${index}`}
                                        type="text"
                                        value={Order.deliveryNotes}
                                        onChange={(e) => handleOrderChange(e, index, 'deliveryNotes')}
                                        className="form-control form-control-sm"
                                    />
                                ) : (
                                    Order.deliveryNotes
                                )}
                            </td>
                            <td className="px-1 d-flex">
                                <a className="edit px-0" title="Edit" onClick={() => handleEditOrder(index)}>
                                    <i className={`btn py-0 ps-0 pe-1 bi ${Order.isEditing ? 'text-success bi-check-circle' : 'text-warning bi-pencil'}`}></i>
                                </a>
                                <a className="delete px-0" title="Delete">
                                    <i className="btn py-0 ps-1 pe-0 text-danger bi bi-trash" onClick={() => handleDeleteOrder(index)}></i>
                                </a>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        <div className="row mt-3">
            <div className="col text-center">
                <button
                    type="button"
                    className={`btn btn-lg ${hasUnfinishedEdits ? 'btn-danger' : 'btn-success'}`} // Apply btn-danger class if there are unfinished edits
                    onClick={handleSubmitOrder}
                    >
                    Submit Request(s)
                </button>
            </div>
        </div>
        </form>

        {/* Bootstrap 5 modal */}
        <div className={`modal ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'block' : 'none' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
            <div className="modal-content">
                <div className="modal-header">
                <h5 className="modal-title">Processing...</h5>
                {/* Add a close button if needed */}
                {/* <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button> */}
                </div>
                <div className="modal-body">
                <p>Please wait while your request is being processed...</p>
                </div>
            </div>
            </div>
        </div>
        {/* Modal backdrop */}
        {showModal && <div className="modal-backdrop fade show"></div>}


        {/* Successful submission begin */}
        <div id="submissionAlert" className={`text-center fixed-top ${showAlert ? 'd-block' : 'd-none'}`}>
            <div className="alert alert-success" role="alert">
                <h4 className="alert-heading">REQUEST SUBMITTED</h4>
                <p>Our team has received your request and will follow up shortly!</p>
            </div>
        </div>
        {/* Successful submission end */}

    </div>
  );
};
<style jsx>{`
    .text-very-small{
        font-size: 8px !important;
    }
`}</style>

export default OrderTable;
