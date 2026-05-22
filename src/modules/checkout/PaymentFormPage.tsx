import React from "react";

const PaymentFormPage = () => {
  return (
    <div className="payment-form">
      <h1>Payment</h1>
      <form>
        <label>
          Card Number:
          <input type="text" placeholder="1234 5678 9012 3456" />
        </label>
        <label>
          Expiry Date:
          <input type="text" placeholder="MM/YY" />
        </label>
        <label>
          CVV:
          <input type="text" placeholder="123" />
        </label>
        <button type="submit">Pay Now</button>
      </form>
    </div>
  );
};

export default PaymentFormPage;