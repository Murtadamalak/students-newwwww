
export interface Installment {
  amount: number;
  paymentDate: string | null;
}

export interface Student {
  id: number;
  name: string;
  class: string;
  guardianPhone: string;
  totalFee: number;
  notes: string;
  photoUrl: string | null;
  installments: Installment[];
}
