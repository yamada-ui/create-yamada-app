// q: what is the following code doing?
// a: This code is a helper function that aligns text in a table. It takes in a string, a direction, and a length, and returns the string with padding added to the left, right, or both sides to align it in the specified direction. The `align` function is used to align text in a table, such as the output of a command-line tool or a text-based interface. The `strip` function is used to remove ANSI escape codes from the input string, which are used for formatting text in the terminal. This ensures that the length of the string is calculated correctly when adding padding.
export function align(
  text: string,
  dir: 'start' | 'end' | 'center',
  len: number,
) {
  let pad = Math.max(len - strip(text).length, 0);
  switch (dir) {
    case 'start':
      return text + ' '.repeat(pad);
    case 'end':
      return ' '.repeat(pad) + text;
    case 'center':
      return (
        ' '.repeat(Math.floor(pad / 2)) + text + ' '.repeat(Math.floor(pad / 2))
      );
    default:
      return text;
  }
}

export function strip(str: string) {
  let pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))',
  ].join('|');
  let RGX = new RegExp(pattern, 'g');
  return typeof str === 'string' ? str.replace(RGX, '') : str;
}
