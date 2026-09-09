export type TicketType = "General" | "VIP" | "Member";
export type VisitorStatus = "Checked-in" | "Pending" | "VIP";

export type Exhibition = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  capacity: number;
};

export type Tour = {
  id: string;
  exhibition_id: string;
  title: string;
  tour_guide: string;
  start_time: string;
  max_capacity: number;
  exhibitions?: Exhibition;
};

export type Visitor = {
  id: string;
  ticket_code: string;
  full_name: string;
  email: string;
  ticket_type: TicketType;
  tour_id: string;
  checked_in: boolean;
  checked_in_at: string | null;
  tour?: Tour;
};

export type DashboardStats = {
  totalAttendees: number;
  checkedIn: number;
  activeTours: number;
  peakTime: string;
};
