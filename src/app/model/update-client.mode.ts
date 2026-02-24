export interface UpdateClientReq {
    uuid: string;
    fullName: string;
    phoneNumber?: string;
    companyName?: string;
    companyWebsiteUrl?: string;
    promptText?: string;
    languageCode?: string;
    humanWhatsapp?: string;
};