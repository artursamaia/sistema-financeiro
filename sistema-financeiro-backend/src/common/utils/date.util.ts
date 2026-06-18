/**
 * DateUtil — Utilitário de parsing de datas.
 *
 * Problema que resolve:
 *   `new Date("2026-06-01")` interpreta a string como UTC midnight.
 *   Em Brasil (UTC-3), isso vira 31/mai às 21h → MySQL salva como 31/mai.
 *
 * Solução:
 *   Appenda "T00:00:00" sem "Z" (sem indicador UTC) antes de parsear.
 *   Assim Node.js interpreta como horário LOCAL, mantendo o dia correto.
 *
 *   "2026-06-01" + "T00:00:00" → 01/jun 00:00 local (-03:00) → 01/jun 03:00 UTC
 *   MySQL guarda DATE "2026-06-01" ✓
 */
export class DateUtil {
  /**
   * Converte uma string "YYYY-MM-DD" em Date no horário LOCAL (meia-noite).
   * Retorna null se a string não for fornecida.
   */
  static parseLocalDate(dateString: string): Date;
  static parseLocalDate(dateString: string | undefined | null): Date | null;
  static parseLocalDate(dateString: string | undefined | null): Date | null {
    if (!dateString) return null;
    // Ao adicionar T00:00:00 sem Z, o JS usa o timezone local do processo
    return new Date(dateString + 'T00:00:00');
  }

  /**
   * Monta um intervalo [início, fim] para um mês inteiro em horário local.
   * Ideal para queries de filtro por período.
   *
   * Exemplo: monthRange(2026, 6) →
   *   start = 2026-06-01 00:00:00 local
   *   end   = 2026-07-01 00:00:00 local (exclusivo — use lt, não lte)
   */
  static monthRange(year: number, month: number): { start: Date; end: Date } {
    return {
      start: new Date(year, month - 1, 1, 0, 0, 0),
      end:   new Date(year, month,     1, 0, 0, 0),
    };
  }
}
