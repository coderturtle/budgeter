// Module to handle all the data logic for the budget
var budgetController = (function() {
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    }

    // takes in either income or expenses and calculates their total
    var calculateTotals = function(type) {
        var sum = 0;

        // add up all the incomes or expenses
        data.allItems[type].forEach(function(curr) {
            sum += curr.value;
        });

        // update the total value
        data.totals[type] = sum;
    };

    return {
        addNewItem: function (type, des, val) {
            var newItem, id;

            // Check that the array isn't empty
            if (data.allItems[type].length > 0) {
                // create a new id by incrememnting the last id in the array
                id = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                // set the initial id to 1
                id = 1;
            }
            

            // based in the type create either a new expense or a new income
            if (type === 'exp') {
                newItem = new Expense(id, des, val);
            } else if (type === 'inc') {
                newItem = new Income(id, des, val);
            }

            data.allItems[type].push(newItem);
            return newItem;
        },

        calculateBudget: function () {
            // calculate the total incomes and expenses
            calculateTotals('inc');
            calculateTotals('exp');

            // calculate the budget
            data.budget = data.totals['inc'] - data.totals['exp'];

            // Only calculate the percentage if we have some income
            if (data.totals['inc'] > 0) {
                // calculate the percentage of expenses to total income
                data.percentage = Math.round((data.totals['exp'] / data.totals['inc']) * 100);
            } else {
                data.percentage = -1;
            }
            
        },

        getBudget: function () {
            return {
                budget: data.budget,
                income: data.totals['inc'],
                expenses: data.totals['exp'],
                percentage: data.percentage
            }
        },

        // method to inspect data for debugging during development
        testing: function() {
            console.log(data);
        }
    }

})();

// Module to handle all the UI interaction
var uiController = (function() {

    // Element ID constants
    var DOMconsts = {
        addBtn: 'addBtn',
        addType: 'addType',
        addDescription: 'addDescription',
        addValue: 'addVal',
        incomeList: 'incomeList',
        expensesList: 'expensesList',
        budgetExpensesPercentage: 'budgetExpensesPercentage',
        budgetExpensesValue: 'budgetExpensesValue',
        budgetIncomeValue: 'budgetIncomeValue',
        budgetValue: 'budgetValue'
    }

    return {
        // return all the DOM element id constants
        getDOMconsts: function() {
            return DOMconsts;
        },

        // Get the values currently specified for the new budget item
        getNewItem: function() {
            return {
                budgetItemType: document.getElementById(DOMconsts.addType).value,
                budgetItemDescription: document.getElementById(DOMconsts.addDescription).value,
                budgetItemValue: parseFloat(document.getElementById(DOMconsts.addValue).value)
            }
        },

        // add a new item to the ledger
        addNewItem: function(newItem, type) {
            var html, element;

            // define different html string based on whether it's a new income or expense
            if (type === 'inc') {
                // set the side of the ledger we want to inject the new item into
                element = DOMconsts.incomeList;

                html = '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">+ %value%</div><div class="item__delete"><button class="item__delete--btn"><iclass="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                // set the side of the ledger we want to inject the new item into
                element = DOMconsts.expensesList;

                html = '<div class="item clearfix" id="expense-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">- %value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // Inject the new item into the static HTML
            html = html.replace('%id', newItem.id);
            html = html.replace('%description%', newItem.description);
            html = html.replace('%value%', newItem.value);

            // Inject the new HTML into the DOM
            document.getElementById(element).insertAdjacentHTML('beforeend', html);
        },

        // clear the input fields
        resetInputs: function() {
            // clear the inputs and return the type to input default
            document.getElementById(DOMconsts.addDescription).value = '';
            document.getElementById(DOMconsts.addValue).value = '';
            document.getElementById(DOMconsts.addType).value = 'inc';

            // return the focus to the description element
            document.getElementById(DOMconsts.addDescription).focus(); 
        },

        updateBudget: function(budgetObj) {
            // update the budget elements
            document.getElementById(DOMconsts.budgetValue).textContent = budgetObj.budget;
            document.getElementById(DOMconsts.budgetIncomeValue).textContent = budgetObj.income;
            document.getElementById(DOMconsts.budgetExpensesValue).textContent = budgetObj.expenses;

            if (budgetObj.percentage > 0) {
                document.getElementById(DOMconsts.budgetExpensesPercentage).textContent = budgetObj.percentage + '%';
            } else {
                document.getElementById(DOMconsts.budgetExpensesPercentage).textContent = '---';
            }
            
        }
    }

})();

// Module to coordinate interaction between the data and UI layers
var appController = (function(budgetCtrl, uiCtrl) {

    var setupEventListeners = function() {
        var DOM = uiController.getDOMconsts();

        document.getElementById(DOM.addBtn).addEventListener('click', appAddItem);

        document.addEventListener('keypress', function(e) {
            // Only fire when the return/enter key is pressed
            // which is used to support older browsers which don't understand keycode
            if (e.keyCode === 13 || e.which === 13) {
                appAddItem();
            }
        });
    }
    
    var updateBudget = function () {
        // Calculate the budget
        budgetController.calculateBudget();

        // Return the budget
        var budget = budgetController.getBudget();

        // Update the UI display with the budget value
        uiController.updateBudget(budget);
    }

    var appAddItem = function () {
        // Get the newly added item from the UI inputs
        var budgetInputs = uiController.getNewItem();

        // Check that we have valid inputs before doing any logic
        if (budgetInputs.budgetItemDescription !== '' && 
            !isNaN(budgetInputs.budgetItemValue) &&
            budgetInputs.budgetItemValue > 0) {
                // Send the data to the budget controller
                var newBudgetItem = budgetController.addNewItem(budgetInputs.budgetItemType, budgetInputs.budgetItemDescription, budgetInputs.budgetItemValue);

                // Update the UI ledger with the new item
                uiController.addNewItem(newBudgetItem, budgetInputs.budgetItemType);

                // Reset the fields for another item
                uiController.resetInputs();

                // Calculate, update & display the budget
                updateBudget();
            }
    };

    return {
        init: function() {
            uiController.updateBudget({
                budget: 0,
                income: 0,
                expenses: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    }

})(budgetController, uiController);

appController.init();