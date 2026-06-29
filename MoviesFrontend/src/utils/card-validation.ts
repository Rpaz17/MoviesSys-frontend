export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string) {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function isValidCardNumber(value: string) {
  const digits = digitsOnly(value);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

export function isValidExpiry(value: string, now = new Date()) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const expiry = new Date(year, month, 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return expiry > currentMonth;
}

export function isValidCvc(value: string) {
  return /^\d{3,4}$/.test(value);
}

export function validateCard(number: string, expiry: string, cvc: string) {
  if (!isValidCardNumber(number)) return "El número de tarjeta no es válido.";
  if (!isValidExpiry(expiry)) return "La fecha debe tener formato MM/AA y no estar vencida.";
  if (!isValidCvc(cvc)) return "El CVC debe contener 3 o 4 dígitos.";
  return "";
}
