/**
 * @jest-environment jsdom
 */

var FOOD_DB = require('../food-db');

describe('FOOD_DB structure', () => {
  test('has food entries', () => {
    var entries = Object.keys(FOOD_DB);
    expect(entries.length).toBeGreaterThan(50);
  });

  test('each entry has required fields', () => {
    Object.keys(FOOD_DB).forEach(function(name) {
      var entry = FOOD_DB[name];
      expect(entry).toHaveProperty('cat');
      expect(entry).toHaveProperty('icon');
      expect(entry).toHaveProperty('ele');
      expect(Array.isArray(entry.ele)).toBe(true);
    });
  });

  test('each element has valid sentiment', () => {
    Object.keys(FOOD_DB).forEach(function(name) {
      var entry = FOOD_DB[name];
      entry.ele.forEach(function(e) {
        expect(e).toHaveLength(3);
        expect(['healthy', 'unhealthy', 'neutral']).toContain(e[1]);
      });
    });
  });

  test('has common foods', () => {
    expect(FOOD_DB['米饭']).toBeDefined();
    expect(FOOD_DB['鸡蛋']).toBeDefined();
    expect(FOOD_DB['牛奶']).toBeDefined();
    expect(FOOD_DB['苹果']).toBeDefined();
    expect(FOOD_DB['咖啡']).toBeDefined();
  });

  test('has food categories', () => {
    var categories = {};
    Object.keys(FOOD_DB).forEach(function(name) {
      categories[FOOD_DB[name].cat] = true;
    });
    expect(Object.keys(categories).length).toBeGreaterThanOrEqual(8);
  });
});
