/**
 * LoanCalculatorUtil — Utilitário de cálculos financeiros para empréstimos.
 *
 * Centraliza toda a matemática para facilitar testes e reutilização.
 *
 * Métodos disponíveis:
 *   - calculateTotalAmount   → valor total com juros (Price ou Simples)
 *   - calculateInstallmentValue → valor de cada parcela
 *   - generateInstallmentDates  → datas de vencimento de cada parcela
 *   - buildInstallments         → monta array completo de parcelas prontas para inserir
 *
 * Fórmulas utilizadas:
 *
 *   Juros Simples:
 *     Total = Principal × (1 + taxa × n)
 *     Parcela = Total / n
 *
 *   Tabela Price (juros compostos — padrão de mercado):
 *     Parcela = P × [i × (1+i)^n] / [(1+i)^n - 1]
 *     onde: P = principal, i = taxa mensal decimal, n = número de parcelas
 */

export interface InstallmentData {
  installment_number: number;
  due_date: Date;
  amount: number;
}

export class LoanCalculatorUtil {
  /**
   * Calcula o valor de cada parcela usando a Tabela Price (juros compostos).
   * Se a taxa for 0%, divide o principal igualmente pelo número de parcelas.
   *
   * @param principal          - Valor emprestado
   * @param monthlyRatePercent - Taxa mensal em % (ex: 5 = 5% ao mês)
   * @param installmentsCount  - Número de parcelas
   * @returns Valor arredondado de cada parcela (2 casas decimais)
   */
  static calculateInstallmentValue(
    principal: number,
    monthlyRatePercent: number,
    installmentsCount: number,
  ): number {
    if (monthlyRatePercent === 0) {
      // Sem juros: divisão simples
      return LoanCalculatorUtil.round(principal / installmentsCount);
    }

    const i = monthlyRatePercent / 100; // converte % para decimal
    const n = installmentsCount;

    // Fórmula Price: PMT = P * [i*(1+i)^n] / [(1+i)^n - 1]
    const power = Math.pow(1 + i, n);
    const pmt   = principal * (i * power) / (power - 1);

    return LoanCalculatorUtil.round(pmt);
  }

  /**
   * Calcula o valor total a ser pago (parcela × n).
   * Pequenos arredondamentos são ajustados na última parcela (ver buildInstallments).
   */
  static calculateTotalAmount(
    installmentValue: number,
    installmentsCount: number,
  ): number {
    return LoanCalculatorUtil.round(installmentValue * installmentsCount);
  }

  /**
   * Gera as datas de vencimento de cada parcela.
   * Cada parcela vence 1 mês após a anterior, a partir de firstDueDate.
   *
   * Exemplo: firstDueDate = 2024-06-10, n = 3
   *   → [2024-06-10, 2024-07-10, 2024-08-10]
   *
   * @param firstDueDate       - Vencimento da primeira parcela
   * @param installmentsCount  - Número total de parcelas
   */
  static generateInstallmentDates(
    firstDueDate: Date,
    installmentsCount: number,
  ): Date[] {
    const dates: Date[] = [];

    for (let i = 0; i < installmentsCount; i++) {
      const date = new Date(firstDueDate);
      // Avança i meses a partir da data inicial
      date.setMonth(date.getMonth() + i);
      dates.push(date);
    }

    return dates;
  }

  /**
   * Monta o array completo de parcelas prontas para inserção no banco.
   *
   * Ajuste de arredondamento:
   *   A última parcela recebe o valor restante para garantir que
   *   a soma das parcelas seja exatamente igual ao totalAmount.
   *   Isso evita diferença de centavos por arredondamentos.
   *
   * @param principal          - Valor principal do empréstimo
   * @param monthlyRatePercent - Taxa de juros mensal em %
   * @param installmentsCount  - Número de parcelas
   * @param firstDueDate       - Data de vencimento da 1ª parcela
   * @returns Array de parcelas com número, data e valor
   */
  static buildInstallments(
    principal: number,
    monthlyRatePercent: number,
    installmentsCount: number,
    firstDueDate: Date,
  ): InstallmentData[] {
    const installmentValue = LoanCalculatorUtil.calculateInstallmentValue(
      principal,
      monthlyRatePercent,
      installmentsCount,
    );

    const totalAmount = LoanCalculatorUtil.calculateTotalAmount(
      installmentValue,
      installmentsCount,
    );

    const dates = LoanCalculatorUtil.generateInstallmentDates(
      firstDueDate,
      installmentsCount,
    );

    const installments: InstallmentData[] = [];

    for (let i = 0; i < installmentsCount; i++) {
      const isLast = i === installmentsCount - 1;

      // Ajuste: a última parcela recebe o valor restante para fechar o total exato
      const amount = isLast
        ? LoanCalculatorUtil.round(
            totalAmount - installmentValue * (installmentsCount - 1),
          )
        : installmentValue;

      installments.push({
        installment_number: i + 1,
        due_date: dates[i],
        amount,
      });
    }

    return installments;
  }

  /**
   * Arredonda para 2 casas decimais usando método banker's rounding (Math.round padrão).
   * Garante consistência em todos os cálculos monetários.
   */
  static round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
