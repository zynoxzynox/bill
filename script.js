let people = [];
let expenses = [];

// DOM Elements
const nameInput = document.getElementById('name');
const addPersonBtn = document.getElementById('addPerson');
const peopleList = document.getElementById('peopleList');
const payerSelect = document.getElementById('payer');
const recipientSelect = document.getElementById('recipient');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const addExpenseBtn = document.getElementById('addExpense');
const expensesList = document.getElementById('expensesList');
const calculateBtn = document.getElementById('calculate');
const summaryDiv = document.getElementById('summary');
const settlementsDiv = document.getElementById('settlements');

// Event Listeners
addPersonBtn.addEventListener('click', addPerson);
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPerson();
});
addExpenseBtn.addEventListener('click', addExpense);
calculateBtn.addEventListener('click', calculateSettlements);

function addPerson() {
    const name = nameInput.value.trim();
    if (name && !people.includes(name)) {
        people.push(name);
        updatePeopleList();
        updateSelects();
        nameInput.value = '';
    }
}

function removePerson(name) {
    people = people.filter(p => p !== name);
    expenses = expenses.filter(e => e.payer !== name && e.recipient !== name);
    updatePeopleList();
    updateSelects();
    updateExpensesList();
}

function updatePeopleList() {
    peopleList.innerHTML = people.map(name => `
        <div class="participant-tag">
            ${name}
            <button class="btn btn-danger" onclick="removePerson('${name}')">×</button>
        </div>
    `).join('');
}

function updateSelects() {
    const options = people.map(name => `<option value="${name}">${name}</option>`).join('');
    payerSelect.innerHTML = '<option value="">選擇付款人</option>' + options;
    recipientSelect.innerHTML = '<option value="">選擇受益人</option>' + options + '<option value="Everyone">所有人</option>';
}

function addExpense() {
    const payer = payerSelect.value;
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim();
    const recipient = recipientSelect.value;

    if (!payer || isNaN(amount) || amount <= 0 || !description || !recipient) {
        alert('請正確填寫所有欄位');
        return;
    }

    expenses.push({ payer, amount, description, recipient });
    updateExpensesList();

    // Clear inputs
    payerSelect.value = '';
    amountInput.value = '';
    descriptionInput.value = '';
    recipientSelect.value = '';
}

function removeExpense(index) {
    expenses.splice(index, 1);
    updateExpensesList();
}

function updateExpensesList() {
    if (expenses.length === 0) {
        expensesList.innerHTML = '<tr><td colspan="5" style="text-align: center">尚無支出記錄</td></tr>';
        return;
    }

    expensesList.innerHTML = expenses.map((expense, index) => `
        <tr>
            <td>${expense.payer}</td>
            <td>¥${expense.amount.toFixed(2)}</td>
            <td>${expense.description}</td>
            <td>${expense.recipient}</td>
            <td><button class="btn btn-danger" onclick="removeExpense(${index})">×</button></td>
        </tr>
    `).join('');
}

function calculateSettlements() {
    if (people.length === 0 || expenses.length === 0) {
        alert('請先新增人員和支出');
        return;
    }

    // Calculate total spent by each person
    const totalSpent = {};
    people.forEach(person => totalSpent[person] = 0);

    expenses.forEach(expense => {
        totalSpent[expense.payer] += expense.amount;
    });

    // Calculate how much each person should pay
    const shouldPay = {};
    people.forEach(person => shouldPay[person] = 0);

    expenses.forEach(expense => {
        if (expense.recipient === 'Everyone') {
            const share = expense.amount / people.length;
            people.forEach(person => shouldPay[person] += share);
        } else {
            shouldPay[expense.recipient] += expense.amount;
        }
    });

    // Calculate final balances
    const balances = {};
    people.forEach(person => {
        balances[person] = totalSpent[person] - shouldPay[person];
    });

    // Display summary
    summaryDiv.innerHTML = `
        <div class="summary-grid">
            ${people.map(person => `
                <div class="summary-card">
                    <div>${person}</div>
                    <div class="summary-amount ${balances[person] > 0 ? 'positive' : balances[person] < 0 ? 'negative' : ''}">
                        ${balances[person] > 0 ? '+' : ''}¥${balances[person].toFixed(2)}
                    </div>
                    <div>${balances[person] > 0 ? '應收回' : balances[person] < 0 ? '應支付' : '已結清'}</div>
                </div>
            `).join('')}
        </div>
    `;

    // Calculate settlements
    const debtors = people.filter(p => balances[p] < -0.01).map(p => ({
        name: p,
        amount: -balances[p]
    })).sort((a, b) => b.amount - a.amount);

    const creditors = people.filter(p => balances[p] > 0.01).map(p => ({
        name: p,
        amount: balances[p]
    })).sort((a, b) => b.amount - a.amount);

    const settlements = [];
    for (const debtor of debtors) {
        let remainingDebt = debtor.amount;
        for (const creditor of creditors) {
            if (remainingDebt > 0 && creditor.amount > 0) {
                const amount = Math.min(remainingDebt, creditor.amount);
                settlements.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount
                });
                remainingDebt -= amount;
                creditor.amount -= amount;
            }
        }
    }

    // Display settlements
    settlementsDiv.innerHTML = settlements.length === 0 ? 
        '<div class="settlement-item">所有帳目已結清</div>' :
        settlements.map(s => `
            <div class="settlement-item">
                <div>
                    <span class="negative">${s.from}</span> 支付給 
                    <span class="positive">${s.to}</span>
                </div>
                <div>¥${s.amount.toFixed(2)}</div>
            </div>
        `).join('');
} 