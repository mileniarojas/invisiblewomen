// Example conversations from the invisiblewomen mockup (based on real posts), always labeled "Example".
// They are shown in the forum list only and never counted in member statistics.
export type ExampleConversation = {
  title: string; author: string; votes: number; comments: number;
  meds: string[]; status: string; effects: string[];
};

export const EXAMPLE_CONVERSATIONS: ExampleConversation[] = [
  { title: "Anyone on a GLP-1 and Zoloft at the same time?", author: "river_and_sage", votes: 63, comments: 7, meds: ["Sertraline", "GLP-1s"], status: "Not pregnant", effects: ["Appetite change"] },
  { title: "Anxiety or depression and a hormonal IUD: did it make things worse?", author: "violet_hours", votes: 58, comments: 8, meds: ["Mirena IUD"], status: "Not pregnant", effects: ["Anxiety"] },
  { title: "Zofran stopped the vomiting but the constipation is rough", author: "maple_and_rain", votes: 52, comments: 1, meds: ["Ondansetron", "Prenatal vitamins"], status: "Pregnant, 1st trimester", effects: ["Constipation", "Headache"] },
  { title: "Rheumatoid arthritis flare at 20 weeks. Who stayed on Plaquenil?", author: "amara_t", votes: 41, comments: 1, meds: ["Hydroxychloroquine", "Prenatal vitamins"], status: "Pregnant, 2nd trimester", effects: ["None"] },
  { title: "Ambien in my second trimester: is that okay?", author: "juniper_w", votes: 38, comments: 1, meds: ["Zolpidem", "Prenatal vitamins"], status: "Pregnant, 2nd trimester", effects: ["Sleepiness"] },
  { title: "Nausea on a GLP-1 that never really settled", author: "ofelia_r", votes: 31, comments: 0, meds: ["GLP-1s", "Levothyroxine"], status: "Not pregnant", effects: ["Nausea", "Appetite change"] },
  { title: "Diclegis makes me so sleepy I can barely work", author: "north_fork", votes: 29, comments: 0, meds: ["Doxylamine-pyridoxine"], status: "Pregnant, 1st trimester", effects: ["Sleepiness", "Dizziness"] },
];
