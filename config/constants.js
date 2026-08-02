// config/constants.js — App-wide enums and constants.
module.exports = {
  ROLES: {
    CUSTOMER: 'Customer',
    VENDOR: 'Vendor',
    NEA_OFFICER: 'NEAOfficer',
    OPERATOR: 'Operator',
  },
  ORDER_STATUS: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
  COMPLAINT_STATUS: ['Open', 'Investigating', 'Resolved'],
  QUEUE_STATUS: ['Waiting', 'Served', 'Cancelled'],
  HYGIENE_GRADES: ['A', 'B', 'C', 'D'],
  MENU_CATEGORIES: ['Main', 'Drink', 'Dessert', 'Snack', 'Side'],
  PROMOTION_TYPES: ['Percentage', 'Fixed', 'Points', 'Delivery'],
  RENTAL_STATUS: ['Active', 'Expired', 'Terminated', 'Renewed'],
  STALL_STATUS: ['Active', 'Closed', 'Suspended'],
  POLLING_INTERVAL: 5000, // 5 seconds
};
