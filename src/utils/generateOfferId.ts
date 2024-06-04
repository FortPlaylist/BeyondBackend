export default function generateOfferId(): string {
  let result: string = "";
  result += Math.floor(Math.random() * 10).toString();

  for (let _ = 0; _ < 3; _++) {
    result += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  }

  for (let _ = 0; _ < 3; _++) {
    result += Math.floor(Math.random() * 10).toString();
    result += String.fromCharCode(Math.floor(Math.random() * 26) + 65);
  }

  for (let _ = 0; _ < 8; _++) {
    const hexDigits: string = "0123456789ABCDEF";
    result += hexDigits.charAt(Math.floor(Math.random() * hexDigits.length));
  }

  return result;
}
