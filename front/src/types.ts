export interface Product
// campurile care apas in ProductResponseDTO in backend
{
    id: number
    name: string
    description: string
    price: number //pretul de baza
    stockQuantity: number
    unitOfMeasure: string;

    nearExpiryQuantity?: number;
    
    expirationDate?: string //datele vin ca string json
    brandName: string
    categoryName: string

    // pret dinamic
    currentPrice: number;       // Pretul final
    freshPrice: number;
    discountValue?: number;     // Cat s-a redus
    discountType?: string;      // "PERCENT", "FIXED", "DYNAMIC_AUTO"
    hasActiveDiscount: boolean;

    imageUrls: string[]; 
    attributes: Record<string, string>;  // Map-ul din Java devine Record<string, string> in TypeScript
}