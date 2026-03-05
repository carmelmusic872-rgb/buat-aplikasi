export interface BiologicalDetection {
  commonName: string;
  scientificName: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  description: string;
  habitat: string;
  conservationStatus: string;
  funFact: string;
}

export interface DetectionHistoryItem {
  id: string;
  timestamp: number;
  image: string;
  result: BiologicalDetection;
}
