# Daily Rupee

# Build a Personal Daily Expense Tracking Web Application

Create a modern, elegant, fully responsive **Personal Expense Tracker** web application using HTML, CSS, and JavaScript.

## 1. Project Overview

I recently moved to a new place and want to keep track of my everyday expenses. The main purpose of this application is to record every expense I make, monitor my daily spending habits, and understand approximately how much money I spend per month.

This is a personal expense management system, not a business accounting application.

The application should be simple, practical, visually appealing, and extremely easy to use, especially on mobile devices.

Use **LKR (Sri Lankan Rupees)** as the default currency.

## 2. Dashboard

Create a professional dashboard as the main landing page.

The dashboard should display the following summary cards:

- **Today's Expenses:** Total amount spent today.
- **This Week:** Total expenses for the current week.
- **This Month:** Total amount spent during the current month.
- **Average Daily Spending:** Average amount spent per day.
- **Total Transactions:** Number of expenses recorded this month.

Include a monthly spending overview with a clear chart showing expenses throughout the month.

Also include:
- A daily spending chart.
- A category-wise expense breakdown.
- A comparison between this month and last month.
- A recent transactions section showing the latest expenses.

All dashboard figures and charts must update automatically whenever an expense is added, edited, or deleted.

## 3. Add Expense

Create a simple and user-friendly form to record expenses.

Each expense should contain:

- Expense title (e.g., Lunch, Bus Fare, Groceries, Electricity).
- Amount (in LKR).
- Date.
- Category.
- Payment method.
- Optional notes.

### Expense Categories

Provide predefined categories:

- Food & Dining
- Groceries
- Transportation
- Rent
- Electricity & Water
- Internet & Mobile
- Shopping
- Healthcare
- Personal Care
- Entertainment
- Education
- Household Items
- Other

Allow users to select a category easily.

Include an option to add custom categories if possible.

The date should default to today's date but should be editable to record previous expenses.

## 4. Expense History

Create a dedicated expense history page.

Display all recorded expenses in a clean table on desktop and a mobile-friendly card layout on smaller screens.

Each transaction should display:
- Expense name
- Category
- Date
- Amount
- Payment method

Provide the following functionality:

- Edit an existing expense.
- Delete an expense.
- Search expenses by name.
- Filter by category.
- Filter by payment method.
- Filter by date range.
- Sort by newest or oldest.
- Filter by a particular month.

Display the total amount for the currently filtered expenses.

## 5. Daily Expense Breakdown

This is one of the most important features.

Create a dedicated daily spending view.

Display expenses grouped by date, for example:

**November 14, 2026**
- Breakfast – LKR 450
- Lunch – LKR 850
- Transportation – LKR 300
- Groceries – LKR 1,200

**Total: LKR 2,800**

Show the total amount spent for each day.

Allow users to select any date and view all expenses recorded on that day.

Also show:
- Highest spending day.
- Lowest spending day.
- Average daily spending.
- Days with no recorded expenses.

## 6. Monthly Analytics

Create a dedicated analytics section to understand spending patterns.

Include:

1. Total monthly expenditure.
2. Average daily expenditure.
3. Highest spending day of the month.
4. Most expensive expense category.
5. Monthly category breakdown.
6. Daily spending trends.
7. Comparison with previous months.
8. Monthly spending history.

Use interactive charts and graphs.

Allow users to select different months and years to view historical spending data.

## 7. Budget Management

Include an optional monthly budget feature.

Allow users to set a monthly spending limit.

Display:
- Monthly budget.
- Amount spent.
- Remaining balance.
- Percentage of budget used.

Show a visual progress bar.

Display a warning when spending reaches 80% of the monthly budget and another warning when the budget is exceeded.

Budget tracking should be optional.

## 8. Navigation

Create a clean navigation system with these sections:

- Dashboard
- Add Expense
- Expense History
- Daily Breakdown
- Analytics
- Budget
- Settings

On desktop, use a modern sidebar.

On mobile, use a compact bottom navigation bar or a mobile-friendly collapsible menu.

## 9. Settings

Include basic settings:

- Currency (default: LKR).
- Monthly budget.
- Manage expense categories.
- Export expenses to CSV.
- Clear all expense data with a confirmation dialog.

## 10. Design and User Interface

I want a modern, minimal, premium-looking interface.

Design preferences:

- Clean and uncluttered layout.
- Soft neutral background.
- White or lightly tinted cards.
- Dark green or muted sage green as the primary accent color.
- Rounded cards and subtle shadows.
- Modern typography.
- Clear icons.
- Beautiful charts and visual indicators.
- Consistent spacing and alignment.

Avoid an overly colourful or complicated design.

The dashboard should feel like a polished personal finance application.

Make the application fully responsive across:
- Desktop computers.
- Laptops.
- Tablets.
- Android mobile phones.
- iPhones.

On mobile, forms, charts, cards, navigation, and transaction lists must adapt properly to smaller screens.

## 11. Technical Requirements

Use HTML, CSS, and JavaScript for the application functionality.

Use a suitable charting library such as Chart.js for analytics.

For the initial version:
- Use browser localStorage to save expense records.
- Data must remain available after refreshing or closing the browser.
- Adding, editing, and deleting expenses must immediately update the dashboard.
- Use reusable and well-organized code.
- Include input validation.
- Prevent invalid or negative expense amounts.
- Display appropriate success and error messages.
- Include confirmation dialogs before deleting records.

Do not use hardcoded dashboard figures. All totals, charts, and analytics must be calculated dynamically from actual recorded expenses.

Keep the application structure organized so that a database and user authentication can be added in a future version.

## 12. Important User Experience Requirements

The most important goal is to make recording expenses quick and effortless.

I should be able to:
1. Open the application.
2. Click Add Expense.
3. Enter the expense name and amount.
4. Select the category.
5. Save it.

The expense should immediately appear in my expense history, daily breakdown, and dashboard analytics.

Provide a few clearly labelled sample transactions for the initial preview, but make it possible to remove them.

**Final Goal:** Build a complete, functional, mobile-responsive personal expense tracking application that helps me understand my daily spending habits and calculate approximately how much money I need to spend each month while living in Colombo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bee12b59-d55c-4a5c-af73-53ac905d034f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
