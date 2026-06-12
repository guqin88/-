// 语音解析测试 - 测试 parseVoiceText
// 此函数需要 Date mock 来稳定测试日期结果

var utils = require('../utils');

// Mock Date 以确保测试结果稳定
var RealDate = global.Date;
var mockToday = new Date('2026-06-12T10:00:00+08:00');

beforeEach(function() {
  global.Date = function(date) {
    if (date) return new RealDate(date);
    return new RealDate(mockToday);
  };
  global.Date.now = function() { return mockToday.getTime(); };
  // 保留静态方法
  global.Date.UTC = RealDate.UTC;
  global.Date.parse = RealDate.parse;
});

afterEach(function() {
  global.Date = RealDate;
});

describe('parseVoiceText - income', () => {
  test('parses 工资发了8000', () => {
    var result = utils.parseVoiceText('工资发了8000');
    expect(result).not.toBeNull();
    expect(result.type).toBe('income');
    expect(result.incomeSub).toBe('salary');
    expect(result.amount).toBe(8000);
  });

  test('parses 报销500', () => {
    var result = utils.parseVoiceText('报销500');
    expect(result).not.toBeNull();
    expect(result.type).toBe('income');
    expect(result.incomeSub).toBe('reimbursement');
    expect(result.amount).toBe(500);
  });

  test('parses 副业收入2000', () => {
    var result = utils.parseVoiceText('副业收入2000');
    expect(result).not.toBeNull();
    expect(result.type).toBe('income');
    expect(result.incomeSub).toBe('side_income');
  });
});

describe('parseVoiceText - expense and meal', () => {
  test('parses 中午吃饭花了35', () => {
    var result = utils.parseVoiceText('中午吃饭花了35');
    expect(result).not.toBeNull();
    expect(result.type).toBe('meal');
    expect(result.amount).toBe(35);
    expect(result.category).toBe('餐饮');
  });

  test('parses 打车花了20', () => {
    var result = utils.parseVoiceText('打车花了20');
    expect(result).not.toBeNull();
    expect(result.type).toBe('expense');
    expect(result.amount).toBe(20);
    expect(result.category).toBe('交通');
  });

  test('parses 买了件衣服花了300', () => {
    var result = utils.parseVoiceText('买了件衣服花了300');
    expect(result).not.toBeNull();
    expect(result.type).toBe('expense');
    expect(result.amount).toBe(300);
    expect(result.category).toBe('购物');
  });
});

describe('parseVoiceText - savings, redpacket, loan', () => {
  test('parses 存了5000', () => {
    var result = utils.parseVoiceText('存了5000');
    expect(result).not.toBeNull();
    expect(result.type).toBe('savings');
    expect(result.amount).toBe(5000);
  });

  test('parses 还花呗1000', () => {
    var result = utils.parseVoiceText('还花呗1000');
    expect(result).not.toBeNull();
    expect(result.type).toBe('loan');
    expect(result.loanSub).toBe('huabei');
    expect(result.amount).toBe(1000);
  });
});

describe('parseVoiceText - edge cases', () => {
  test('returns null for text without amount', () => {
    expect(utils.parseVoiceText('你好')).toBeNull();
  });

  test('strips punctuation', () => {
    var result = utils.parseVoiceText('我花了100块吃了顿好的！');
    expect(result).not.toBeNull();
    expect(result.amount).toBe(100);
  });

  test('handles 千 unit', () => {
    var result = utils.parseVoiceText('工资发了5千');
    expect(result).not.toBeNull();
    expect(result.amount).toBe(5000);
  });

  test('handles zero or negative', () => {
    expect(utils.parseVoiceText('花了0块')).toBeNull();
  });
});
