# 🍜 HawkerHub – Order History & Vendor Management

## 👤 My Features (Individual Contribution)

### Order History (Patron)
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/orders/my-orders` | GET | List my orders (paginated, filterable by status, sortable) | ✅ Login |
| `/api/orders/stats` | GET | Order statistics (total orders, total spent, status breakdown) | ✅ Login |
| `/api/orders/:orderId` | GET | Single order details | ✅ Login |
| `/api/orders/:orderId` | DELETE | Cancel an order (only if pending/preparing) | ✅ Login |
| `/api/orders/:orderId/feedback` | POST | Submit or update feedback (1-5 rating + comment) | ✅ Login |
| `/api/orders/guest` | GET | Guest order lookup by `x-guest-session-id` header | ❌ Public |

### Vendor Management
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/vendor/menu-items` | GET | List menu items (filters: stall_id, category, search, cuisine) | ❌ Public |
| `/api/vendor/menu-items/popular` | GET | Popular items by like count | ❌ Public |
| `/api/vendor/menu-items/:itemId` | GET | Single menu item with cuisines & likes | ❌ Public |
| `/api/vendor/menu-items` | POST | Create a new menu item | ✅ Vendor/Officer |
| `/api/vendor/menu-items/:itemId` | PUT | Update menu item | ✅ Vendor/Officer |
| `/api/vendor/menu-items/:itemId` | DELETE | Delete or soft-delete menu item | ✅ Vendor/Officer |
| `/api/vendor/menu-items/:itemId/like` | POST | Toggle like on menu item | ✅ Login |
| `/api/vendor/stalls` | GET | Get my stalls | ✅ Vendor/Officer |
| `/api/vendor/stalls/:stallId` | GET | Stall details | ❌ Public |
| `/api/vendor/stalls/:stallId` | PUT | Update stall | ✅ Vendor/Officer |
| `/api/vendor/stalls/:stallId/dashboard` | GET | Stall performance dashboard | ✅ Vendor/Officer |
| `/api/vendor/rental-agreements` | GET | List my rental agreements | ✅ Vendor/Officer |
| `/api/vendor/rental-agreements` | POST | Create rental agreement | ✅ Vendor/Officer |
| `/api/vendor/rental-agreements/:id` | GET | Single agreement | ✅ Vendor/Officer |
| `/api/vendor/rental-agreements/:id` | PUT | Update agreement | ✅ Vendor/Officer |
| `/api/vendor/rental-agreements/:id` | DELETE | Delete agreement | ✅ Vendor/Officer |
| `/api/vendor/rental-agreements/upcoming-expiries` | GET | Upcoming expiry alerts | ✅ Vendor/Officer |

**Checkpoint 1 deliverables** (≥1 GET + 1 POST/PUT/DELETE per feature):
- Order History: `GET /api/orders/my-orders` + `DELETE /api/orders/:orderId`
- Vendor Management: `GET /api/vendor/menu-items` + `POST /api/vendor/menu-items`

---

## 🚀 How to Integrate

### 1. Database Setup
```bash
# Run the main database script first (teammate's file)
# Then run my migration in SSMS:
# Open db/features_schema.sql and execute in SSMS against HawkerCentreMS
```

### 2. Install Dependencies
```bash
npm install mssql dotenv express
# For testing:
npm install --save-dev jest supertest
# For Swagger docs (optional):
npm install swagger-jsdoc swagger-ui-express
```

### 3. Add Routes to Server
Run the application with the standard start command. It registers the patron, order-history, and vendor routes:
```bash
npm start
```

**Option B** – Add to existing `app.js` (2 lines before `app.use(notFound)`):
```js
app.use('/api/orders', require('./routes/orderHistoryRoutes'));
app.use('/api/vendor', require('./routes/vendorManagementRoutes'));
```

### 4. Front-end Pages
| Page | Path | Description |
|------|------|-------------|
| Order History | `Patron/Order-History.html` | Patrons view/cancel/review orders |
| Vendor Dashboard | `Vendor/Dashboard.html` | Stall performance overview |
| Menu Management | `Vendor/Menu-Management.html` | CRUD menu items with cuisines |
| Rental Agreements | `Vendor/Rental-Agreements.html` | Track stall rental agreements |

---

## 📁 Files Created (Do Not Modify Existing Files)

```
Pages/
├── db/
│   └── features_schema.sql          # New tables + sample data
├── models/
│   ├── orderHistoryModel.js         # Order queries, feedback, stats
│   ├── vendorStallModel.js          # Stall queries + dashboard
│   ├── vendorMenuModel.js           # Menu item CRUD + likes
│   └── rentalAgreementModel.js      # Rental agreement CRUD
├── controllers/
│   ├── orderHistoryController.js
│   └── vendorManagementController.js
├── routes/
│   ├── orderHistoryRoutes.js
│   └── vendorManagementRoutes.js
├── Patron/
│   └── Order-History.html           # Enhanced order history page
├── Vendor/
│   ├── Dashboard.html               # Vendor stall dashboard
│   ├── Menu-Management.html         # Menu CRUD interface
│   └── Rental-Agreements.html       # Rental agreement management
├── Js/
│   ├── order-history.js             # Order history front-end logic
│   └── vendor.js                    # Vendor front-end logic
├── Css/
│   └── vendor.css                   # Vendor management styles
├── tests/
│   ├── orderHistory.test.js
│   └── vendorManagement.test.js
├── swagger.js                       # Swagger/OpenAPI configuration
└── start.js                         # Combined entry point
```

---

## ✅ A-Grade Coverage Checklist

| Requirement | Status |
|-------------|--------|
| Full CRUD (Vendor Menu Items) | ✅ Create, Read, Update, Delete |
| Full CRUD (Rental Agreements) | ✅ Create, Read, Update, Delete |
| Additional feature (Order History) | ✅ List, filter, paginate, cancel |
| Additional feature (Feedback) | ✅ Submit/update ratings + comments |
| Additional feature (Menu Likes) | ✅ Toggle like/unlike |
| Additional feature (Stall Dashboard) | ✅ Sales metrics |
| Third-party API (QR Code) | ⚠️ Optional – see notes |
| JWT/Session Auth | ✅ Uses existing `requireLogin` middleware |
| Role-based authorization | ✅ Vendor-only for write operations |
| Input validation | ✅ Server-side AppError checks |
| Error handling | ✅ AppError + centralized errorHandler |
| Front-end integration | ✅ Dark theme matching patron.css |
| Unit tests | ✅ Jest + Supertest |
| Swagger documentation | ✅ OpenAPI 3.0 spec |
| Database schema + sample data | ✅ MSSQL migration script |

---

## 📝 Notes for Demo

1. **Checkpoint 1 Demo (Postman)**: Use the `start.js` entry point. Test auth-free endpoints first, then login to get a token for protected routes.
2. **Final Demo (Front-end)**: Open the vendor pages at `/Vendor/Dashboard.html` or patron pages at `/Patron/Order-History.html`.
3. **Run the schema**: Execute `db/features_schema.sql` in SSMS against `HawkerCentreMS` after the main `database_setup.sql`.
4. **Sample login**: Email `jamie.sim@email.com` / password `Password123!` (patron), or `aisha@stall.com` / `Password123!` (vendor).
