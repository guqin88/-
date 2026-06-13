const utils = require('../utils');

describe('formatMoney', () => {
  test('formats zero', () => {
    expect(utils.formatMoney(0)).toBe('¥0.00');
  });
  test('formats integer', () => {
    expect(utils.formatMoney(1000)).toBe('¥1,000.00');
  });
  test('formats decimal', () => {
    expect(utils.formatMoney(1234.5)).toBe('¥1,234.50');
  });
  test('formats small amount', () => {
    expect(utils.formatMoney(0.5)).toBe('¥0.50');
  });
});

describe('getMonthKey', () => {
  test('returns YYYY-MM format', () => {
    expect(utils.getMonthKey('2024-06-15')).toBe('2024-06');
  });
  test('pads single digit month', () => {
    expect(utils.getMonthKey('2024-01-01')).toBe('2024-01');
  });
});

describe('formatDate', () => {
  test('formats date string', () => {
    expect(utils.formatDate('2024-06-15')).toBe('2024-06-15');
  });
  test('returns consistent format', () => {
    var result = utils.formatDate('2024-06-15');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('friendlyDate', () => {
  test('returns 今天 for today', () => {
    var today = new Date();
    var dateStr = today.getFullYear() + '-' +
      String(today.getMonth()+1).padStart(2,'0') + '-' +
      String(today.getDate()).padStart(2,'0');
    expect(utils.friendlyDate(dateStr)).toBe('今天');
  });
  test('returns 昨天 for yesterday', () => {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var dateStr = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth()+1).padStart(2,'0') + '-' +
      String(yesterday.getDate()).padStart(2,'0');
    expect(utils.friendlyDate(dateStr)).toBe('昨天');
  });
});

describe('getDefaultData', () => {
  test('returns valid default structure', () => {
    var data = utils.getDefaultData();
    expect(data).toHaveProperty('records');
    expect(data).toHaveProperty('healthRecords');
    expect(data).toHaveProperty('exerciseRecords');
    expect(data).toHaveProperty('mealDays');
    expect(data).toHaveProperty('monthlyBudget');
    expect(Array.isArray(data.records)).toBe(true);
    expect(Array.isArray(data.healthRecords)).toBe(true);
    expect(data.monthlyBudget.food).toBe(1195.2);
  });
});
