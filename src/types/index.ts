export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  expiredStudents: number;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  monthlyCollection: number;
  pendingFees: number;
  upcomingExpiries: number;
  dueFeeStudents: number;
}

export interface StudentWithAssignments {
  id: string;
  name: string;
  mobile: string;
  address: string | null;
  fatherName: string | null;
  motherName: string | null;
  photoUrl: string | null;
  joinDate: Date;
  expiryDate: Date;
  activeStatus: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignments: {
    id: string;
    seat: { id: string; seatNumber: number };
    timeSlot: { id: string; name: string; fee: number; startTime: string; endTime: string };
    assignmentDate: Date;
  }[];
  payments: {
    id: string;
    amount: number;
    paymentDate: Date;
    notes: string | null;
  }[];
}

export interface SeatWithAssignments {
  id: string;
  seatNumber: number;
  assignments: {
    id: string;
    student: { id: string; name: string };
    timeSlot: { id: string; name: string; startTime: string; endTime: string };
  }[];
}

export interface SlotWithAssignments {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  fee: number;
  assignments: {
    id: string;
    student: { id: string; name: string };
    seat: { id: string; seatNumber: number };
  }[];
}
