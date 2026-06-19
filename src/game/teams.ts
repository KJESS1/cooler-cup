export interface Team {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
}

export const TEAMS: Team[] = [
  { id: 'brazil', name: 'Brazil', primaryColor: '#FFD700', secondaryColor: '#009739' },
  { id: 'argentina', name: 'Argentina', primaryColor: '#75AADB', secondaryColor: '#FFFFFF' },
  { id: 'france', name: 'France', primaryColor: '#0055A4', secondaryColor: '#EF4135' },
  { id: 'germany', name: 'Germany', primaryColor: '#1a1a1a', secondaryColor: '#DD0000' },
  { id: 'england', name: 'England', primaryColor: '#FFFFFF', secondaryColor: '#CE1124' },
  { id: 'spain', name: 'Spain', primaryColor: '#C60B1E', secondaryColor: '#FFC400' },
  { id: 'portugal', name: 'Portugal', primaryColor: '#006600', secondaryColor: '#FF0000' },
  { id: 'netherlands', name: 'Netherlands', primaryColor: '#FF6600', secondaryColor: '#FFFFFF' },
];