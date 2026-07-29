export type EventCategory = 'ent' | 'pol' | 'trend' | 'don';

export type EventItem = {
  id: string;
  name: string;
  city: string;
  date: string;
  category: EventCategory;
  tag: string;
  blurb: string;
  url?: string;
  minPrice?: number;
  maxPrice?: number;
  score?: number;
  reason?: string;
};

export type Opportunity = { title: string; desc: string };
export type ScamWarning = { title: string; desc: string };
