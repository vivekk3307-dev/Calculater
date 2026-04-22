let expression = '';
let justCalculated = false;

function appendValue(value) {
  const display = document.getElementById('result');
  const exprDisplay = document.getElementById('expression');

  // If last action was "=", start fresh for operators, or new number
  if (justCalculated) {
    if (['+', '-', '*', '/', '%'].includes(value)) {
      expression = display.textContent;
    } else {
      expression = '';
    }
    justCalculated = false;
  }

  expression += value;
  exprDisplay.textContent = expression
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
  display.textContent = expression;
}

function calculate() {
  const display = document.getElementById('result');
  const exprDisplay = document.getElementById('expression');

  try {
    let result = eval(expression);

    // Avoid floating-point mess like 0.1+0.2 = 0.30000000004
    result = parseFloat(result.toFixed(10));

    exprDisplay.textContent = expression
      .replace(/\*/g, '×')
      .replace(/\//g, '÷') + ' =';
    display.textContent = result;
    justCalculated = true;
  } catch (e) {
    display.textContent = 'Error';
    expression = '';
  }
}

function clearAll() {
  expression = '';
  document.getElementById('result').textContent = '0';
  document.getElementById('expression').textContent = '';
  justCalculated = false;
}

function deleteLast() {
  if (justCalculated) return;
  expression = expression.slice(0, -1);
  document.getElementById('result').textContent = expression || '0';
  document.getElementById('expression').textContent = expression
    .replace(/\*/g, '×')
    .replace(/\//g, '÷');
}

// Keyboard Support
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') appendValue(e.key);
  else if (['+', '-', '*', '/'].includes(e.key)) appendValue(e.key);
  else if (e.key === '.') appendValue('.');
  else if (e.key === '%') appendValue('%');
  else if (e.key === 'Enter' || e.key === '=') calculate();
  else if (e.key === 'Backspace') deleteLast();
  else if (e.key === 'Escape') clearAll();
});
