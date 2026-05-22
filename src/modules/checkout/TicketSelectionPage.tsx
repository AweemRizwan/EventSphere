import React from "react";

const TicketSelectionPage = () => {
  return (
    <div className="ticket-selection">
      <h1>Select Your Tickets</h1>
      <form>
        <label>
          Ticket Type:
          <select>
            <option value="general">General Admission</option>
            <option value="vip">VIP</option>
          </select>
        </label>
        <label>
          Quantity:
          <input type="number" min="1" max="10" />
        </label>
        <button type="submit">Proceed to Payment</button>
      </form>
    </div>
  );
};

export default TicketSelectionPage;