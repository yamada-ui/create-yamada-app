export const isString = (value: any): value is string =>
  Object.prototype.toString.call(value) === "[object String]"

export const isBoolean = (value: any): value is boolean =>
  typeof value === "boolean"
