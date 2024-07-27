import chalk from 'chalk';

export const c = {
  white(...args: unknown[]) {
    return chalk.white(...args);
  },
  primary(...args: unknown[]) {
    return chalk.blue(...args);
  },
  error(...args: unknown[]) {
    return chalk.red(...args);
  },
  warn(...args: unknown[]) {
    return chalk.yellow(...args);
  },
  info(...args: unknown[]) {
    return chalk.cyan(...args);
  },
  success(...args: unknown[]) {
    return chalk.green(...args);
  },
};
