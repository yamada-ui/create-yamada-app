import picocolors from 'picocolors';

export const logger = {
  error(arg: string) {
    return picocolors.red(arg);
  },
  warn(arg: string) {
    return picocolors.yellow(arg);
  },
  info(arg: string) {
    return picocolors.cyan(arg);
  },
  success(arg: string) {
    return picocolors.green(arg);
  },
  base(arg: string) {
    return picocolors.white(arg);
  },
  break() {
    console.log('');
  },
};
