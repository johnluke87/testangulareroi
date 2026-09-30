export type PanelId = 'today' | 'weather' | 'agenda' | 'reminders' | 'games';

export interface PanelConfig {
    id: PanelId;
    title: string;
    icon: string;
    subtitle?: string;
    //occupa due colonne della griglia (su schermi abbastanza larghi)
    wide?: boolean;
}