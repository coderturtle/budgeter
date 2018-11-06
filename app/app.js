// Module to handle all the data logic for the budget
var budgetController = (function() {
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calculatePercent = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercent = function() {
        return this.percentage;
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

        deleteItem: function (type, id) {
            var ids, index

            // Get an array of all the ids and their positions
            ids = data.allItems[type].map(function(curr) {
                return curr.id;
            });

            // get the position of the id to be deleted
            index = ids.indexOf(id);

            // go to the index specified and remove one item
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
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

        calculatePercentages: function () {
            data.allItems.exp.forEach(function(curr) {
                curr.calculatePercent(data.totals.inc);
            })
        },
        
        getBudget: function () {
            return {
                budget: data.budget,
                income: data.totals['inc'],
                expenses: data.totals['exp'],
                percentage: data.percentage
            }
        },

        getPercentages: function () {
            var itemPercentages = data.allItems.exp.map(function(curr) {
                return curr.getPercent();
            });
            return itemPercentages;
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
        budgetValue: 'budgetValue',
        containerClass: '.container',
        itemPercentageLabel: '.item__percentage',
        budgetDateLabel: '.budget__title--month'
    };

    var formatNums = function(num, type) {
        // Get the absolute of the num and format to 2 decimal spaces
        num = Math.abs(num);
        num = num.toFixed(2);

        // split the num into integer and decimals
        var splitNum = num.split('.');
        var int = splitNum[0];
        var dec = splitNum[1];

        // if the integer part is greater than a thousand we want to inject a comma at before the third last number
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
        }

        return (type === 'exp' ? '- ' : '+ ') + int + '.' + dec;
    };

    // helper function to perform forEach loop on a nodelist
    var nodelistForEach = function(list, callback) {
        for (i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

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

                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                // set the side of the ledger we want to inject the new item into
                element = DOMconsts.expensesList;

                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // Inject the new item into the static HTML
            html = html.replace('%id%', newItem.id);
            html = html.replace('%description%', newItem.description);
            html = html.replace('%value%', formatNums(newItem.value, type));

            // Inject the new HTML into the DOM
            document.getElementById(element).insertAdjacentHTML('beforeend', html);
        },

        deleteItem: function (elementId) {
            var el = document.getElementById(elementId);
            el.parentNode.removeChild(el);
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
            // check whether to display + or - on the overall balance
            var type;
            budgetObj.income > budgetObj.expenses ? type = 'inc' : type = 'exp';
            
            // update the balanace and totals
            document.getElementById(DOMconsts.budgetValue).textContent = formatNums(budgetObj.budget, type);
            document.getElementById(DOMconsts.budgetIncomeValue).textContent = formatNums(budgetObj.income, 'inc');
            document.getElementById(DOMconsts.budgetExpensesValue).textContent = formatNums(budgetObj.expenses, 'exp');

            if (budgetObj.percentage > 0) {
                document.getElementById(DOMconsts.budgetExpensesPercentage).textContent = budgetObj.percentage + '%';
            } else {
                document.getElementById(DOMconsts.budgetExpensesPercentage).textContent = '---';
            }
            
        },

        displayPercentages: function(itemPercentages) {
            var percentageFields = document.querySelectorAll(DOMconsts.itemPercentageLabel);

            nodelistForEach(percentageFields, function(curr, index) {
                if (itemPercentages[index] > 0) {
                    curr.textContent = itemPercentages[index] + '%';
                } else {
                    curr.textContent = '---';
                }
                
            })
        },

        updateDate: function() {
            var now, year, months, month;

            now = new Date();
            year = now.getFullYear();
            month = now.getMonth();

            // as getMonth only returns a number we create an array of months to convert it into the string version
            months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

            document.querySelector(DOMconsts.budgetDateLabel).textContent = months[month] + ', ' + year;
        },

        changeType: function() {
            // get an array of the fields whose colors will change
            var fields = [document.getElementById(DOMconsts.addType),
                document.getElementById(DOMconsts.addDescription),
                document.getElementById(DOMconsts.addValue)];
            
            fields.forEach(function(curr) {
                curr.classList.toggle('red-focus');
            });

            document.getElementById(DOMconsts.addBtn).classList.toggle('red');
        }
    }

})();

// Module to coordinate interaction between the data and UI layers
var appController = (function(budgetCtrl, uiCtrl) {

    var setupEventListeners = function() {
        document.addEventListener('DOMContentLoaded',function() {
            var DOM = uiController.getDOMconsts();

            document.getElementById(DOM.addBtn).addEventListener('click', appAddItem);

            document.addEventListener('keypress', function(e) {
                // Only fire when the return/enter key is pressed
                // which is used to support older browsers which don't understand keycode
                if (e.keyCode === 13 || e.which === 13) {
                    appAddItem();
                }
            });

            document.querySelector(DOM.containerClass).addEventListener('click', appDeleteItem);
            
            document.getElementById(DOM.addType).addEventListener('change', uiController.changeType);
        });
    };
    
    var updateBudget = function () {
        // Calculate the budget
        budgetController.calculateBudget();

        // Return the budget
        var budget = budgetController.getBudget();

        // Update the UI display with the budget value
        uiController.updateBudget(budget);
    };

    var updatePercentages = function() {
        // calculate percentages
        budgetController.calculatePercentages();

        // return the percentages
        var itemPercentages = budgetController.getPercentages();

        // update the ledger item percentages in the UI
        uiController.displayPercentages(itemPercentages);

    };

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

                // update the ledger percentages
                updatePercentages();
            }
    };

    var appDeleteItem = function (event) {
        var itemId, splitId, type, id;

        itemId = event.target.parentNode.parentNode.parentNode.parentNode.id;

        // check that we have a valid item id before doing any logic
        if (itemId) {
            // get the type and id
            splitId = itemId.split('-');
            type = splitId[0];
            id = parseInt(splitId[1]);

            // delete the item from the data structure in the budget controller
            budgetController.deleteItem(type, id);

            // delete the item from the UI
            uiController.deleteItem(itemId);

            // Calculate, update & display the budget
            updateBudget();

            // update the ledger percentages
            updatePercentages();
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
            uiController.updateDate();
            setupEventListeners();
        }
    }

})(budgetController, uiController);

appController.init();