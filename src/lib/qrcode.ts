import QRCode from "qrcode";

export async function generateQrCode(text: string): Promise<string> {
  if (!text) return "";
  return QRCode.toDataURL(text, {
    width: 280,
    margin: 2,
    color: {
      dark: "#000000", //"#243e80", // ITS Cover Blue
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}
