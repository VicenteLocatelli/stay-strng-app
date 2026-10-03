// Gera o código PIX "Copia e Cola" (BR Code estático, padrão EMV do Banco Central).
function field(id: string, value: string) {
  return id + value.length.toString().padStart(2, "0") + value;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const clean = (s: string, max: number) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase().slice(0, max);

export function buildPixPayload(opts: { key: string; name: string; city: string; amount?: number; txid?: string }) {
  const account = field("00", "br.gov.bcb.pix") + field("01", opts.key);
  let payload =
    field("00", "01") +
    field("26", account) +
    field("52", "0000") +
    field("53", "986") +
    (opts.amount ? field("54", opts.amount.toFixed(2)) : "") +
    field("58", "BR") +
    field("59", clean(opts.name, 25)) +
    field("60", clean(opts.city, 15)) +
    field("62", field("05", opts.txid ?? "***"));
  payload += "6304";
  return payload + crc16(payload);
}
