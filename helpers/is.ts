export const isString = (value: any): value is string =>
  Object.prototype.toString.call(value) === '[object String]';
