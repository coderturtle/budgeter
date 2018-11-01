# [Budgeter](https://github.com/coderturtle/budgeter)

## Wireframe
![Wireframe](diagrams/png/wireframe.png "Wireframe")

This is a simple monthly budget app which takes in expenses and income and displays them in a ledger type view. The balance of the month is displayed at the top. A user can select from a dropdown between adding an expense or an income.

## Modules
![Modules](diagrams/png/modules.png "Modules")

The code is split up into 3 modules to start.
### 1. UI Module
* Gets the expenses/income inputted by the user
* Updates the balance display
* Updates the ledger display

### 2. Data Module
* Calculates the total expenses and total incomes
* Calculates the balance
* Takes the expenses and incomes
* Returns the balance

### 3. Controller module
* Controls interaction between other 2 modules