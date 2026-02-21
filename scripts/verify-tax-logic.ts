
function calculateTax(amount: number) {
    const taxRate = amount >= 7500 ? 0.18 : 0.12;
    const taxable = amount / (1 + taxRate);
    const tax = amount - taxable;
    return {
        amount,
        rate: taxRate * 100 + '%',
        taxable: taxable.toFixed(2),
        tax: tax.toFixed(2),
        check: (Number(taxable.toFixed(2)) + Number(tax.toFixed(2))).toFixed(2)
    };
}

console.log('Testing 15000 (Should be 18%)', calculateTax(15000));
console.log('Testing 7500 (Should be 18%)', calculateTax(7500));
console.log('Testing 7499 (Should be 12%)', calculateTax(7499));
console.log('Testing 5000 (Should be 12%)', calculateTax(5000));
