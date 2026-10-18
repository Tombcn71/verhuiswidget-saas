/**
 * Telefoonnummer-controle, gedeeld door de widget (client) en de submit-routes.
 * - Nederlands (0…, +31…, 0031…): precies de NL-opbouw, zodat typfouten opvallen.
 * - Buitenlands (+ of 00 met andere landcode): 8–15 cijfers (internationale norm).
 * Spaties, streepjes, punten en haakjes mogen.
 */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[\s\-().]/g, "");
  if (/^(?:\+31|0031)/.test(digits) || /^0[1-9]/.test(digits)) {
    return /^(?:0|\+31|0031)[1-9]\d{8}$/.test(digits);
  }
  return /^(?:\+|00)[1-9]\d{7,14}$/.test(digits);
}
