# HawkerHub — Hawker Centre Management API

HawkerHub is an Express and SQL Server backend for browsing hawker stalls, managing menus, placing orders, and supporting vendor and operator workflows. The API uses JWT bearer authentication for protected routes and role-based access for Customer, Vendor, Operator, and NEA Officer actions.

## Run the project

1. Copy `.env.example` to `.env` and provide the SQL Server and JWT settings.
2. Create and seed the database using the SQL files in `database/`.
3. Install dependencies and start the server:

   ```bash
   npm install
   npm start
   ```

The default server address is `http://localhost:3000`.

- Interactive API documentation: `GET /api/docs`
- OpenAPI document: `GET /api/openapi.json`
- Health/home page: `GET /`

For protected routes, send `Authorization: Bearer <token>`. Guest cart routes use an `x-session-id` header (or `sessionId` in the request body where accepted).

## Feature coverage

Status is deliberately implementation-specific: **Available** means the API currently supports the capability; **Partial** means only part of the requested experience is implemented; **Not implemented** means there is no endpoint or backend workflow yet.

### User Account Management

| Requirement | Status | Current implementation |
|---|---|---|
| Vendors create accounts to manage stalls, menus, and orders | Available | Registration supports the `Vendor` role. Vendors can manage their own profile, menu items, stalls, promotions, view stall orders, and view rental agreements. |
| Patrons register for personalised features | Available | Customers can register, log in, manage a customer profile, keep account-linked orders, feedback, likes, queues, and complaints. |
| Patrons order as guests | Partial | Guest, session-scoped carts and guest names are supported in the data/controller logic. However, `/api/cart/checkout` currently requires a JWT, so a full unauthenticated guest checkout is not yet exposed. |
| Google sign-in and password recovery | Available | Google OAuth sign-in/completion and password-reset request/confirmation endpoints are provided. |

### Ordering & Checkout

| Requirement | Status | Current implementation |
|---|---|---|
| Add menu items to a cart | Available | Carts are one-per-stall and cart items support quantities, add-ons, and add-on charges. |
| Separate orders for different vendors | Available | Checkout accepts multiple cart IDs and creates one order per stall/vendor cart. |
| Optional add-ons and extra charges | Available | Cart and order items store `addOns` and `addOnCharge`; checkout includes the additional charge in the total. |
| Complete payment | Partial | Checkout creates orders with `paymentStatus: Paid`; there is no payment-gateway integration, payment request, or payment transaction record. |
| Display payment success/failure | Not implemented | The API returns checkout success/error responses, but it does not process payments or expose payment-failure states. |

### Order History

| Requirement | Status | Current implementation |
|---|---|---|
| Registered-user order history | Available | Customers can retrieve their own orders with `/api/orders` or `/api/orders/my-orders`. Individual orders include their items. |
| Guest order history in browser storage | Not implemented | Browser/local storage is a front-end concern and is not implemented by this backend. Guest carts are session-scoped, but no guest order-history lookup endpoint exists. |
| Real-time order tracking | Partial | Vendors/operators can update order states and status logs can be read per order. Updates are request/polling based; no WebSocket or server-sent-event stream is implemented. |

### Customer Engagement

| Requirement | Status | Current implementation |
|---|---|---|
| Loyalty programme or discounts | Partial | Customer profiles contain server-managed loyalty points, and vendors can create time-limited promotions. Point earning/redemption and applying promotions at checkout are not implemented. |
| Vendor ratings and reviews | Available | Customers can submit ratings (1–5) and comments against a stall; feedback is publicly readable. |
| Likes for individual menu items | Available | Customers can create/delete likes, check whether they liked an item, and read each item’s like count. |
| Multi-language support | Partial | A customer profile can store a preferred language: `en`, `zh`, `ms`, or `ta`. Localised API content and UI translations are not provided. |
| Notifications for promotions | Partial | Notifications can be created and read, and checkout creates a vendor new-order notification. Promotions themselves do not automatically notify customers. |
| Complaint submission linked to stalls | Available | Customers can submit and view their own stall-linked complaints; operators/NEA officers can update their status. |

### Vendor Management

| Requirement | Status | Current implementation |
|---|---|---|
| Menu management | Available | Vendors can create, update, and delete menu items for their own stalls. Menu-item/cuisine mappings allow multiple cuisines per item. |
| Rental agreement tracking | Available | Vendors can view their stall agreements; operators create, update, and delete agreements, including dates, terms, rent, and status. |
| Stall performance dashboard | Available | Vendors and operators can retrieve performance metrics for a stall. |

### Regulatory & Compliance

| Requirement | Status | Current implementation |
|---|---|---|
| Inspection scheduling and logging by NEA officers | Partial | NEA officers can create, update, delete, and filter inspection records with an `inspectionDate`. This supports dated inspection records, but there is no dedicated scheduling workflow, appointment status, or reminder system. |
| Record inspection scores, remarks, and hygiene grades | Available | Inspections record the stall, officer, date, 0–100 score, remarks, and issued grade. NEA officers can also create hygiene-grade records and link them to an inspection. |
| Display historical hygiene grades for transparency | Partial | Authenticated users can retrieve all grades or a stall’s grade history. The history is not publicly accessible, though public stall responses include the current valid hygiene grade. |

### Analytics & Reporting

| Requirement | Status | Current implementation |
|---|---|---|
| Sales analytics (popular items, peak hours) | Partial | The stall-performance endpoint provides total orders, order-status counts, completed-order revenue, feedback totals, average rating, likes, and current hygiene grade. Popular-item and peak-hour breakdowns are not implemented. |
| Customer satisfaction dashboard (feedback, complaints) | Partial | Feedback and complaint records can be listed and filtered, and stall performance includes feedback count and average rating. There is no combined satisfaction dashboard or complaint analytics endpoint. |
| Inspection trends and hygiene-grade history | Partial | Inspection records can be listed and filtered by stall or officer, while hygiene-grade history is available per stall. The API does not calculate or expose aggregated inspection trends. |

### Operational Enhancements

| Requirement | Status | Current implementation |
|---|---|---|
| Digital queue management | Available | Customers can join/check a stall queue and their position. Customers/vendors can update or remove queue entries. |
| Vendor notifications for new orders and complaints | Partial | New-order notifications are automatically created during cart checkout. The generic notification API exists, but complaint notifications are not automatically generated. |
| Sustainability / eco-friendly packaging | Not implemented | There is no packaging preference or sustainability field in carts, orders, or menu items. |
| Hygiene inspections and grades | Available | NEA officers manage inspections and hygiene grades; authenticated users can read them. |

## API reference

Paths below are relative to `http://localhost:3000`. `Public` routes require no token; `Optional` routes accept both signed-in and guest callers; all other routes require a JWT. Role restrictions shown are enforced by the route middleware.

### Authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a Customer, Vendor, Operator, or NEA Officer account. |
| POST | `/api/auth/login` | Public | Sign in and receive a JWT. |
| GET | `/api/auth/google` | Public | Begin Google OAuth sign-in. |
| GET | `/api/auth/google/callback` | Public | Handle the Google OAuth callback. |
| POST | `/api/auth/google/complete` | Public | Complete account registration after Google sign-in. |
| POST | `/api/auth/password-reset/request` | Public | Request a password-reset token. |
| POST | `/api/auth/password-reset/confirm` | Public | Set a new password using the reset token. |
| GET | `/api/auth/me` | Authenticated | Read the signed-in account. |
| PUT | `/api/auth/password` | Authenticated | Change the signed-in user’s password. |

### Public catalogue and vendor resources

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/stalls` | Public | List stalls. |
| POST | `/api/stalls` | Operator | Create a stall. |
| GET | `/api/stalls/:id` | Public | Get stall details. |
| PUT | `/api/stalls/:id` | Vendor owner / Operator | Update a stall. |
| DELETE | `/api/stalls/:id` | Operator | Delete a stall. |
| GET | `/api/stalls/:id/menu` | Public | List a stall’s menu items. |
| GET | `/api/stalls/:id/performance` | Vendor owner / Operator | Get stall performance metrics. |
| GET | `/api/menu-items` | Public | List menu items. |
| POST | `/api/menu-items` | Vendor | Create a menu item. |
| GET | `/api/menu-items/:id` | Public | Get a menu item. |
| PUT | `/api/menu-items/:id` | Vendor | Update a menu item. |
| DELETE | `/api/menu-items/:id` | Vendor | Delete a menu item. |
| GET | `/api/menu-item-cuisines` | Public | List menu-item/cuisine mappings. |
| POST | `/api/menu-item-cuisines` | Vendor | Create a cuisine mapping. |
| GET | `/api/menu-item-cuisines/:id` | Public | Get a cuisine mapping. |
| PUT | `/api/menu-item-cuisines/:id` | Vendor | Update a cuisine mapping. |
| DELETE | `/api/menu-item-cuisines/:id` | Vendor | Delete a cuisine mapping. |
| GET | `/api/vendor-profile` | Vendor | Get own vendor profile. |
| POST | `/api/vendor-profile` | Vendor | Create own vendor profile. |
| PUT | `/api/vendor-profile` | Vendor | Update own vendor profile. |
| GET | `/api/vendor-profile/:id` | Vendor / Operator | Get a vendor profile. |
| DELETE | `/api/vendor-profile/:id` | Operator | Delete a vendor profile. |
| GET | `/api/rental-agreements` | Vendor / Operator | List rental agreements; supports `?stallId=`. |
| POST | `/api/rental-agreements` | Operator | Create a rental agreement. |
| GET | `/api/rental-agreements/:id` | Vendor / Operator | Get an agreement. |
| PUT | `/api/rental-agreements/:id` | Operator | Update an agreement. |
| DELETE | `/api/rental-agreements/:id` | Operator | Delete an agreement. |

### Cart, checkout, and orders

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/cart` | Optional | List carts for the signed-in customer or `x-session-id`. |
| GET | `/api/cart/active` | Optional | List active carts for the signed-in customer or session. |
| POST | `/api/cart` | Optional | Create or retrieve the cart for a stall. |
| POST | `/api/cart/checkout` | Authenticated | Create one paid, pending order for each selected cart and notify vendors. |
| GET | `/api/cart/:id` | Optional owner | Get a cart. |
| DELETE | `/api/cart/:id` | Optional owner | Delete a cart. |
| GET | `/api/cart-items` | Authenticated | List cart items. |
| POST | `/api/cart-items` | Authenticated | Add a cart item, including add-ons/charges. |
| GET | `/api/cart-items/:id` | Authenticated | Get a cart item. |
| PUT | `/api/cart-items/:id` | Authenticated | Update a cart item. |
| DELETE | `/api/cart-items/:id` | Authenticated | Delete a cart item. |
| GET | `/api/orders` | Authenticated | List orders scoped to the caller’s role. |
| POST | `/api/orders` | Authenticated | Create an order directly; supports optional order items. |
| GET | `/api/orders/my-orders` | Customer | List the customer’s orders. |
| GET | `/api/orders/stall/:stallId` | Vendor owner / Operator | List a stall’s orders. |
| GET | `/api/orders/:id` | Authenticated, scoped | Get an order. |
| PUT | `/api/orders/:id` | Authenticated, scoped | Update instructions or an allowed order-status transition. |
| DELETE | `/api/orders/:id` | Authenticated, scoped | Delete an order. |
| GET | `/api/order-items` | Authenticated | List order items. |
| POST | `/api/order-items` | Authenticated | Create an order item. |
| GET | `/api/order-items/:id` | Authenticated | Get an order item. |
| PUT | `/api/order-items/:id` | Authenticated | Update an order item. |
| DELETE | `/api/order-items/:id` | Authenticated | Delete an order item. |
| GET | `/api/order-status-logs` | Authenticated | List order-status logs. |
| POST | `/api/order-status-logs` | Vendor / Operator / NEA Officer | Create a status log. |
| GET | `/api/order-status-logs/order/:orderId` | Authenticated | Read one order’s status history. |
| GET | `/api/order-status-logs/:id` | Authenticated | Get a status log. |
| PUT | `/api/order-status-logs/:id` | Vendor / Operator | Update a status log. |
| DELETE | `/api/order-status-logs/:id` | Operator | Delete a status log. |

### Customer profiles and engagement

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/customer-profile` | Customer | Get own profile, including preferred language and loyalty points. |
| POST | `/api/customer-profile` | Customer | Create own profile. |
| PUT | `/api/customer-profile` | Customer | Update own profile. |
| GET | `/api/customer-profile/:id` | Customer / Operator | Get a customer profile. |
| DELETE | `/api/customer-profile/:id` | Customer / Operator | Delete a customer profile. |
| GET | `/api/feedback` | Optional | List stall feedback. |
| POST | `/api/feedback` | Customer | Submit feedback with a rating and optional comment. |
| GET | `/api/feedback/:id` | Optional | Get feedback. |
| PUT | `/api/feedback/:id` | Customer / Operator | Update feedback. |
| DELETE | `/api/feedback/:id` | Customer / Operator | Delete feedback. |
| GET | `/api/likes` | Optional | List menu-item likes. |
| POST | `/api/likes` | Customer | Like a menu item. |
| GET | `/api/likes/count/:menuItemId` | Optional | Get a menu item’s like count. |
| GET | `/api/likes/check/:menuItemId` | Customer | Check whether the caller likes an item. |
| GET | `/api/likes/:id` | Optional | Get a like. |
| DELETE | `/api/likes/:id` | Customer | Remove a like. |
| GET | `/api/promotions` | Public | List active promotions; supports `?stallId=`. |
| POST | `/api/promotions` | Vendor | Create a promotion for an owned stall. |
| GET | `/api/promotions/:id` | Public | Get a promotion. |
| PUT | `/api/promotions/:id` | Vendor | Update an owned promotion. |
| DELETE | `/api/promotions/:id` | Vendor | Delete an owned promotion. |
| GET | `/api/complaints` | Authenticated | List complaints (access is controller-scoped). |
| POST | `/api/complaints` | Customer | Submit a complaint linked to a stall. |
| GET | `/api/complaints/mine` | Customer | List own complaints. |
| GET | `/api/complaints/:id` | Authenticated | Get a complaint. |
| PUT | `/api/complaints/:id` | Operator / NEA Officer | Update complaint status. |
| DELETE | `/api/complaints/:id` | Operator | Delete a complaint. |

### Queues, notifications, and compliance

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/queue` | Authenticated | List queue entries. |
| POST | `/api/queue` | Customer | Join a stall’s queue. |
| GET | `/api/queue/stall/:stallId/position` | Customer | Get the customer’s queue position. |
| GET | `/api/queue/stall/:stallId/status` | Authenticated | Get a stall queue’s status. |
| GET | `/api/queue/:id` | Authenticated | Get a queue entry. |
| PUT | `/api/queue/:id` | Customer / Vendor | Update a queue entry’s status. |
| DELETE | `/api/queue/:id` | Customer / Vendor | Delete a queue entry. |
| GET | `/api/notifications` | Authenticated | List the caller’s notifications. |
| POST | `/api/notifications` | Authenticated | Create a notification. |
| GET | `/api/notifications/unread-count` | Authenticated | Get unread notification count. |
| PUT | `/api/notifications/mark-all-read` | Authenticated | Mark all caller notifications as read. |
| GET | `/api/notifications/:id` | Authenticated | Get a notification. |
| PUT | `/api/notifications/:id` | Authenticated | Update a notification. |
| DELETE | `/api/notifications/:id` | Authenticated | Delete a notification. |
| GET | `/api/inspections` | Authenticated | List inspections. |
| POST | `/api/inspections` | NEA Officer | Create an inspection. |
| GET | `/api/inspections/:id` | Authenticated | Get an inspection. |
| PUT | `/api/inspections/:id` | NEA Officer | Update an inspection. |
| DELETE | `/api/inspections/:id` | NEA Officer | Delete an inspection. |
| GET | `/api/hygiene-grades` | Authenticated | List hygiene grades. |
| POST | `/api/hygiene-grades` | NEA Officer | Create a grade. |
| GET | `/api/hygiene-grades/stall/:stallId` | Authenticated | Get a stall’s hygiene-grade history. |
| GET | `/api/hygiene-grades/:id` | Authenticated | Get a hygiene grade. |
| PUT | `/api/hygiene-grades/:id` | NEA Officer | Update a hygiene grade. |
| DELETE | `/api/hygiene-grades/:id` | NEA Officer | Delete a hygiene grade. |

## Notes for API consumers

- Order statuses are `Pending`, `Preparing`, `Ready`, `Completed`, and `Cancelled`. The order endpoint enforces valid status transitions.
- Cart checkout calculates totals using item prices, quantities, and `addOnCharge`. It then empties the checked-out carts.
- The API’s current checkout model marks newly created orders as paid. Treat this as a prototype order workflow until a payment provider and payment-state transitions are added.
- Request fields and interactive examples are available at `/api/docs`; this is the authoritative generated documentation for route shape and validation.
