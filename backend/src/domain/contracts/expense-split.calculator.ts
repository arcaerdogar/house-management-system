export interface SplitInput {
  houseId: string;
  amount: number;
  expenseDate: Date;
  respectsAbsence: boolean;
  excludedMemberIds: string[];
  payerMemberId: string;
}

export interface SplitLine {
  debtorMemberId: string;
  amountOwed: number;
}

/**
 * PRD 5.2 split calculation. Implemented by expense agent.
 * ROTATIONAL must not use this interface.
 */
export interface IExpenseSplitCalculator {
  calculateSplits(input: SplitInput): Promise<SplitLine[]>;
}
