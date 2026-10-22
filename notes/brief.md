# Developer brief (verbatim, 2026-10-22)

This is the full brief from the developer. It is the source of truth for scope. Product list: `notes/assets/products.csv`. Design reference: `notes/design/reference-evora-style-home.jpg`.

Build a full-stack e-commerce website called "Oxford Vale", an English heritage menswear brand selling suits, outerwear, waistcoats, shirts, caps and shoes to customers in Bangladesh. This is a portfolio project, so every flow must work end to end. Use sandbox or mock services where a live integration needs real credentials, and make those swaps easy with environment variables.

## Stack
Choose the stack that fits the project and the skills in this environment. Use the frontend-design skill for all UI work. Still include a .env.example listing every variable and a README with setup steps.

## Design direction
- Palette: off-white background (#F7F5F0), near-black text and buttons (#111111), charcoal panels, warm grey secondary text, one muted accent for sale badges
- Typography: a high-contrast serif for headings (for example Playfair Display) and a clean sans-serif for body and UI (for example Inter)
- Hero: large brand wordmark "OXFORD VALE" over a full-width model image, tagline "English heritage for a modern generation", primary "Shop Now" button and secondary "Explore Collection"
- Category strip on a black band with 4 to 5 cards (Suits, Outerwear, Accessories, Caps, Shoes), each with an image and a "Shop" link
- Feature bar with icons: Fast delivery, Easy returns (14 days), Premium fabrics, Secure payment
- Product cards with hover image swap, wishlist heart and price in BDT
- Fully responsive, mobile first, with a sticky header and a slide-in mobile menu

## Storefront pages
- Home (hero, categories, new season banner, best sellers, feature bar)
- Category listing with filters for size, colour, price range and sort order, plus pagination
- Product detail with image gallery, size selector, quantity, stock status, description, care notes, related products
- Search with live suggestions
- Cart (persisted, with quantity editing and subtotal)
- Checkout (see below)
- Order confirmation and order tracking by order number
- Customer account: login, register, forgot password, order history, saved addresses, wishlist
- Static pages: About, Contact (form saves to the database and emails the admin), Size Guide, Shipping Policy, Returns Policy, Privacy Policy, Terms

## Bangladesh specifics
- All prices in BDT with ৳ symbol and standard formatting
- Address form with Division, District and Upazila fields, plus a Bangladesh mobile number validator (01XXXXXXXXX)
- Delivery zones: Dhaka city, Dhaka outside, Chattogram, and rest of Bangladesh, each with its own rate and estimated days, configurable from admin
- Free delivery above a configurable order amount
- Payment methods at checkout: Cash on Delivery (default), SSLCommerz sandbox, and bKash and Nagad as manual payment options (customer enters the transaction ID, admin verifies)
- Optional Bangla and English language toggle for UI labels (use an i18n dictionary, English as the default)

## Lead capture (important)
- Capture the customer's full name, phone number and email at the moment they add a product to the cart or start checkout, even before they place an order. Store this as a lead with status "cart" or "abandoned".
- If the cart is still unfinished after a set time, mark it as abandoned and send the admin a notification.
- When an order is placed, send the customer an order confirmation email and an SMS (use a mock SMS adapter that logs the message, with a clear interface for a real provider such as SSL Wireless or BulkSMS BD).
- Admin gets an email notification for every new order and every new contact message.
- The admin dashboard has a Customers and Leads page showing name, phone, email, cart contents, last activity and status, with CSV export.

## Checkout and orders
- Guest checkout allowed, with optional account creation
- Server-side price calculation from the database (never trust client prices)
- Stock is reserved on order and restored on cancellation
- Order statuses: Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, Returned, Refunded
- Payment statuses: Unpaid, Paid, Failed, Refunded
- Customers can cancel an order while it is still Pending
- Coupon codes with percentage or fixed amount, expiry, usage limit and minimum order value

## Admin panel (protected by role-based access)
- Dashboard: today's and monthly sales, order count, new leads, low stock alerts, a simple chart
- Products: create, edit, duplicate, archive; multiple images with reorder; variants by size and colour with separate stock counts; SKU; slug; SEO title and description
- Categories and collections (for example New Season, Best Sellers)
- Orders: list with filters, detail view, status updates, mark payment as verified, print invoice (PDF), add internal notes
- Customers and Leads (see above)
- Coupons
- Delivery zones and rates
- Site settings: store name, contact details, announcement bar, hero content, social links
- Admin users with roles: Owner, Manager, Staff
- Audit log of admin actions

## Quality requirements
- Validate all inputs on server and client with zod
- Rate-limit login, register, checkout and contact endpoints
- Sanitise user-generated text
- Consistent error responses and loading and empty states everywhere
- Seed script that creates an admin user, sample categories, about 20 products with images and variants, and delivery zones
- Basic tests for price calculation, cart logic, coupon validation and checkout API
- Clean folder structure with clear separation between UI, server actions, models and services

## Working method
1. Start by proposing the folder structure and data models (User, Product, Variant, Category, Order, OrderItem, Cart, Lead, Coupon, DeliveryZone, Setting, AuditLog). Wait for my approval before writing code.
2. Build in this order: setup and seed, storefront browsing, cart and lead capture, checkout and orders, admin panel, notifications, then polish.
3. After each step, run the app and tell me what works and what is mocked.
4. Keep a PROGRESS.md file updated with completed items and open items.

## Images (developer's note)
- Model / lifestyle / design pictures: the developer will provide them in the project's `public` folder; Claude describes which pictures are needed (see `notes/plan.md` → Images).
- Product photos: Claude sources them from the internet.

## Product list notes (from developer)
- 150 products in 11 categories, CSV in `notes/assets/products.csv`. Columns: SKU, Name, Category, Price_BDT, Sale_BDT (blank if not on sale), Colours, Sizes (range, expanded into variants by the seed), Tag (Best Seller, New Season, Heritage, Winter, Summer, Limited, or blank), Fabric, Stock_per_size.
- Suits and blazers use chest sizes 38 to 46, shirts use S to XXL, trousers use waist sizes 28 to 40, and shoes use EU sizes 40 to 45.
- Products with a colour in the name can use that colour as their only variant. Add a colour selector where a product has more than one colour.
- Image folders are named by SKU (for example `OV-SUT-001/`), so the seed script can attach photos automatically.
- Generate a short description for each product from the name, fabric and tag.
