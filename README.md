# Tablly Restaurant Mobile App (React Native + Expo SDK 58)

> **Single Multi-Role Restaurant Operations Mobile Application**  
> Dynamic RBAC station for **Restaurant Admins**, **Floor Waiters**, **Kitchen Chefs (KDS)**, and **Counter Cashiers**.

---

## 📱 Quickstart (Run on Phone in 60 Seconds)

### 1. Requirements
* Install the free **Expo Go** app on your physical phone:
  * [Expo Go on Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
  * [Expo Go on Apple App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)

### 2. Start the Development Server
Navigate into the `restaurant-mobile` directory and run:

```bash
cd restaurant-mobile
npx expo start
```

### 3. Open on Phone
* Ensure your phone and PC are connected to the **same local Wi-Fi network**.
* Scan the QR code displayed in your terminal using:
  * **Android**: Open **Expo Go** $\to$ tap **Scan QR Code**.
  * **iPhone**: Open default **Camera** app $\to$ tap the Expo notification.

---

## 👑 Role-Based Access Control (RBAC) Walkthrough

The app features a **Single Unified Login** where bottom navigation tabs and accessible actions adapt dynamically to the logged-in user:

| Station Role | Bottom Tabs Visible | Primary Capabilities |
|---|---|---|
| **Restaurant Admin** | Insights, Floor, Orders, Service, Billing, Staff, Station | Complete access to live revenue, floor layout, staff management, and bill settlement. |
| **Kitchen Chef (KDS)**| Orders/KOT, Station | Real-time KDS tickets with overdue cook timers, dark glare mode, and 86 Sold-out toggle. |
| **Floor Waiter** | Floor, Service Calls, Station | Color-coded floor tables map, table-side order entry builder, and water/bill service pings. |
| **Counter Cashier** | Billing, Station | Settle unpaid tables via UPI QR, Cash (with change calculator), or Card, plus print tax receipts. |

> **Pro Tip**: Use the **1-tap Demo Switcher** on the Login screen or inside the **Station** tab to switch between any of the 4 roles instantly during testing!

---

## ⚡ Real-Time Testing & Simulation Features

The app includes built-in live simulation buttons on every screen so you can test real-time operational workflows without needing live customers:

* **Kitchen KDS**: Tap `⚡ Simulate New Customer Order` to trigger an urgent tactile haptic chime and inject an active order ticket.
* **Service Calls**: Tap `⚡ Simulate Diner Service Call` to test incoming table calls for drinking water or captain assistance.
* **Floor Tables**: Tap any green table to seat guests and immediately launch table-side menu ordering.
* **Cashier POS**: Tap any billed table to test the tender calculator, apply discounts, and generate a printable tax invoice.

---

## 🔌 Connecting to Local Backend (`api-backend`)

When testing with your local Express server running on port `5000`:

1. Find your computer's local IP address (e.g. `192.168.1.15`).
2. Open `src/services/api/client.ts` and update `DEFAULT_API_URL`:
   ```typescript
   export const DEFAULT_API_URL = 'http://192.168.1.15:5000/api';
   ```

---

## 📦 Building a Standalone Android APK (No Android Studio Needed)

You can compile a standalone `.apk` directly in the cloud using Expo Application Services (EAS):

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to your free Expo account
eas login

# 3. Build standalone APK
eas build -p android --profile preview
```
Once complete, EAS provides a direct download link and QR code to install the `.apk` on any Android device.
