export type PanelId = 'today' | 'weather' | 'agenda' | 'tasks' | 'games' | 'links' | 'notes' | 'quote' | 'search' | 'news' | 'onthisday' | 'home';

export interface PanelConfig {
    id: PanelId;
    title: string;
    icon: string;
    subtitle?: string;
    //occupa due colonne della griglia (su schermi abbastanza larghi)
    wide?: boolean;
}